import prisma from "../../prisma/client.js";
import { Roles } from "../utils/permissions.js";
import { createInviteToken, getInviteExpiry } from "../services/inviteService.js";
import { sendInviteEmail } from "../services/emailService.js";
import { deleteByPrefix, getCache, setCache } from "../utils/cache.js";

const loadRequesterMembership = async (userId, organizationId) => {
  return prisma.membership.findFirst({
    where: { userId, organizationId }
  });
};

const ensureCanManage = (membership) => {
  if (!membership) {
    const err = new Error("Membership not found");
    err.statusCode = 403;
    throw err;
  }
  const status = membership.status ?? "ACTIVE";
  if (status !== "ACTIVE") {
    const err = new Error("Inactive membership");
    err.statusCode = 403;
    throw err;
  }
  if (![Roles.OWNER, Roles.ADMIN].includes(membership.role)) {
    const err = new Error("Insufficient role");
    err.statusCode = 403;
    throw err;
  }
};

export const getTeamMembers = async (req, res) => {
  try {
    const orgId = req.orgId;
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    const cacheKey = `team:${orgId}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const [members, invites] = await Promise.all([
      prisma.membership.findMany({
        where: { organizationId: orgId },
        include: { user: true }
      }),
      prisma.invite.findMany({
        where: {
          organizationId: orgId,
          status: "INVITED",
          expiresAt: { gt: new Date() }
        }
      })
    ]);

    const access = await prisma.projectAccess.findMany({
      where: { project: { organizationId: orgId } },
      select: { userId: true, projectId: true }
    });

    const projectMap = new Map();
    access.forEach((item) => {
      if (!projectMap.has(item.userId)) projectMap.set(item.userId, new Set());
      projectMap.get(item.userId).add(item.projectId);
    });

    const items = members.map((member) => ({
      id: member.id,
      userId: member.userId,
      name: member.user?.name || "",
      email: member.user?.email || "",
      role: member.role,
      status: member.status || "ACTIVE",
      projectCount: projectMap.get(member.userId)?.size || 0,
      projectIds: Array.from(projectMap.get(member.userId) || []),
      isInvite: false
    }));

    const inviteItems = invites.map((invite) => ({
      id: invite.id,
      userId: null,
      name: "",
      email: invite.email,
      role: invite.role,
      status: "INVITED",
      projectCount: 0,
      projectIds: [],
      isInvite: true,
      inviteLink: `${clientUrl}/invite/accept?token=${invite.token}`
    }));

    const payload = { items: [...items, ...inviteItems] };
    await setCache(cacheKey, payload, 15000);
    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load team members" });
  }
};

export const inviteMember = async (req, res) => {
  try {
    const { email, role = Roles.MEMBER, orgId } = req.body;
    const organizationId = orgId || req.orgId;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (role === Roles.OWNER) {
      return res.status(400).json({ message: "Cannot invite an owner role" });
    }

    const requester = await loadRequesterMembership(req.user.id, organizationId);
    ensureCanManage(requester);

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    const existing = await prisma.membership.findFirst({
      where: { userId: user?.id, organizationId }
    });

    if (existing && user) {
      if (existing.status === "ACTIVE") {
        return res.json(existing);
      }
      if (existing.status === "DEACTIVATED") {
        return res.status(403).json({ message: "User is deactivated" });
      }
      await prisma.membership.update({
        where: { id: existing.id },
        data: { status: "INVITED", role }
      });
    }

    const token = createInviteToken();
    const expiresAt = getInviteExpiry();

    const invite = await prisma.invite.upsert({
      where: { organizationId_email: { organizationId, email: normalizedEmail } },
      update: {
        role,
        status: "INVITED",
        token,
        expiresAt,
        invitedById: req.user.id,
        acceptedAt: null
      },
      create: {
        email: normalizedEmail,
        role,
        organizationId,
        invitedById: req.user.id,
        status: "INVITED",
        token,
        expiresAt
      }
    });

    if (user && !existing) {
      await prisma.membership.create({
        data: {
          userId: user.id,
          organizationId,
          role,
          status: "INVITED"
        }
      });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const inviteLink = `${clientUrl}/invite/accept?token=${invite.token}`;
    try {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true }
      });
      await sendInviteEmail({
        to: normalizedEmail,
        inviteLink,
        orgName: org?.name,
        inviterName: req.user?.name || req.user?.email
      });
    } catch (emailError) {
      console.error("Invite email failed:", emailError);
    }
    await deleteByPrefix(`team:${organizationId}`);
    res.status(201).json({ invite, inviteLink });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to invite member" });
  }
};

export const resendInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const invite = await prisma.invite.findUnique({ where: { id } });
    if (!invite || invite.status !== "INVITED") {
      return res.status(404).json({ message: "Invite not found" });
    }

    const requester = await loadRequesterMembership(req.user.id, invite.organizationId);
    ensureCanManage(requester);

    const token = createInviteToken();
    const expiresAt = getInviteExpiry();
    const updated = await prisma.invite.update({
      where: { id },
      data: { token, expiresAt, invitedById: req.user.id }
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const inviteLink = `${clientUrl}/invite/accept?token=${updated.token}`;
    try {
      const org = await prisma.organization.findUnique({
        where: { id: invite.organizationId },
        select: { name: true }
      });
      await sendInviteEmail({
        to: updated.email,
        inviteLink,
        orgName: org?.name,
        inviterName: req.user?.name || req.user?.email
      });
    } catch (emailError) {
      console.error("Invite email failed:", emailError);
    }

    await deleteByPrefix(`team:${invite.organizationId}`);
    res.json({ invite: updated, inviteLink });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to resend invite" });
  }
};

export const cancelInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const invite = await prisma.invite.findUnique({ where: { id } });
    if (!invite || invite.status !== "INVITED") {
      return res.status(404).json({ message: "Invite not found" });
    }

    const requester = await loadRequesterMembership(req.user.id, invite.organizationId);
    ensureCanManage(requester);

    const updated = await prisma.invite.update({
      where: { id },
      data: { status: "CANCELLED" }
    });

      await deleteByPrefix(`team:${invite.organizationId}`);
      res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to cancel invite" });
  }
};

export const acceptInvite = async (req, res) => {
  try {
    const { orgId, token } = req.body;
    const inviteToken = token || req.query.token;
    const normalizedEmail = String(req.user.email || "").trim().toLowerCase();

    if (!inviteToken) {
      return res.status(400).json({ message: "Invite token required" });
    }

    const invite = await prisma.invite.findFirst({
      where: { token: inviteToken, status: "INVITED" }
    });

    if (!invite) {
      return res.status(404).json({ message: "Invite not found" });
    }
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return res.status(410).json({ message: "Invite has expired" });
    }
    if (invite.email.toLowerCase() !== normalizedEmail) {
      return res.status(403).json({ message: "Invite email does not match account" });
    }

    let membership = await prisma.membership.findFirst({
      where: { organizationId: invite.organizationId, userId: req.user.id }
    });

    if (membership) {
      if (membership.status === "DEACTIVATED") {
        return res.status(403).json({ message: "Membership is deactivated" });
      }
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { status: "ACTIVE", role: membership.role }
      });
    } else {
      membership = await prisma.membership.create({
        data: {
          userId: req.user.id,
          organizationId: invite.organizationId,
          role: invite.role,
          status: "ACTIVE"
        }
      });
    }

    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() }
    });

      await deleteByPrefix(`team:${invite.organizationId}`);
      res.json(membership);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to accept invite" });
  }
};

export const deactivateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await prisma.membership.findUnique({
      where: { id }
    });

    if (!membership) {
      return res.status(404).json({ message: "Member not found" });
    }

    const requester = await loadRequesterMembership(req.user.id, membership.organizationId);
    ensureCanManage(requester);

    if (membership.role === Roles.OWNER) {
      return res.status(400).json({ message: "Owner cannot be deactivated" });
    }
    if (membership.userId === req.user.id) {
      return res.status(400).json({ message: "You cannot deactivate yourself" });
    }
    if (requester.role === Roles.ADMIN && membership.role !== Roles.MEMBER) {
      return res.status(403).json({ message: "Admins can only deactivate members" });
    }

    const updated = await prisma.membership.update({
      where: { id },
      data: { status: "DEACTIVATED" }
    });

    await deleteByPrefix(`team:${membership.organizationId}`);
    await deleteByPrefix(`team:${membership.organizationId}`);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to deactivate member" });
  }
};

export const updateMemberRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || role === Roles.OWNER) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const membership = await prisma.membership.findUnique({
      where: { id }
    });

    if (!membership) {
      return res.status(404).json({ message: "Member not found" });
    }

    const requester = await loadRequesterMembership(req.user.id, membership.organizationId);
    const requesterStatus = requester?.status ?? "ACTIVE";
    if (!requester || requesterStatus !== "ACTIVE") {
      return res.status(403).json({ message: "Membership is inactive" });
    }
    if (![Roles.OWNER, Roles.ADMIN].includes(requester.role)) {
      return res.status(403).json({ message: "Insufficient role to change roles" });
    }
    if (membership.userId === req.user.id) {
      return res.status(400).json({ message: "You cannot change your own role" });
    }
    if (requester.role === Roles.ADMIN && membership.role === Roles.OWNER) {
      return res.status(403).json({ message: "Admins cannot change owner role" });
    }

    if (membership.role === Roles.OWNER) {
      return res.status(400).json({ message: "Owner role cannot be changed" });
    }

    const updated = await prisma.membership.update({
      where: { id },
      data: { role }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update role" });
  }
};

export const updateMemberProjects = async (req, res) => {
  try {
    const { id } = req.params;
    const { projectIds = [] } = req.body;

    const membership = await prisma.membership.findUnique({
      where: { id }
    });

    if (!membership) {
      return res.status(404).json({ message: "Member not found" });
    }

    const requester = await loadRequesterMembership(req.user.id, membership.organizationId);
    ensureCanManage(requester);

    if (membership.role === Roles.OWNER) {
      return res.status(400).json({ message: "Owner access cannot be changed here" });
    }

    const orgProjects = await prisma.project.findMany({
      where: { organizationId: membership.organizationId },
      select: { id: true }
    });
    const orgProjectIds = new Set(orgProjects.map((p) => p.id));
    const filteredIds = (projectIds || []).filter((pid) => orgProjectIds.has(pid));

    await prisma.projectAccess.deleteMany({
      where: {
        userId: membership.userId,
        project: { organizationId: membership.organizationId }
      }
    });

    if (filteredIds.length) {
      await prisma.projectAccess.createMany({
        data: filteredIds.map((projectId) => ({
          projectId,
          userId: membership.userId
        })),
        skipDuplicates: true
      });
    }

    await deleteByPrefix(`team:${membership.organizationId}`);
    res.json({ userId: membership.userId, projectIds: filteredIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update project access" });
  }
};

