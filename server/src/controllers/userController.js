import prisma from "../../prisma/client.js";

const isTaskComplete = (status = "") => {
  const normalized = status.toLowerCase();
  return ["done", "completed", "complete", "closed"].includes(normalized);
};

const uniqueIds = (ids) => Array.from(new Set(ids.filter(Boolean)));

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Missing user id." });

    const targetUser = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        memberships: {
          include: { organization: true }
        }
      }
    });

    if (!targetUser) return res.status(404).json({ message: "User not found." });

    const isSelf = targetUser.id === req.user.id;
    const requesterMemberships = await prisma.membership.findMany({
      where: { userId: req.user.id },
      select: { organizationId: true }
    });

    const requesterOrgIds = new Set(requesterMemberships.map((m) => m.organizationId));
    const targetOrgIds = targetUser.memberships.map((m) => m.organizationId);
    const sharedOrgIds = targetOrgIds.filter((orgId) => requesterOrgIds.has(orgId));
    const allowedOrgIds = isSelf ? targetOrgIds : sharedOrgIds;

    if (!isSelf && allowedOrgIds.length === 0) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const orgMemberships = targetUser.memberships.filter((m) =>
      allowedOrgIds.includes(m.organizationId)
    );

    const memberProjectIds = await prisma.projectMember.findMany({
      where: {
        userId: targetUser.id,
        project: { organizationId: { in: allowedOrgIds } }
      },
      select: { projectId: true }
    });

    const accessProjectIds = await prisma.projectAccess.findMany({
      where: {
        userId: targetUser.id,
        project: { organizationId: { in: allowedOrgIds } }
      },
      select: { projectId: true }
    });

    const ownedProjects = await prisma.project.findMany({
      where: {
        userId: targetUser.id,
        organizationId: { in: allowedOrgIds }
      },
      include: { tasks: true }
    });

    const projectIds = uniqueIds([
      ...ownedProjects.map((p) => p.id),
      ...memberProjectIds.map((p) => p.projectId),
      ...accessProjectIds.map((p) => p.projectId)
    ]);

    const sharedProjects = projectIds.length
      ? await prisma.project.findMany({
          where: { id: { in: projectIds } },
          include: { tasks: true, organization: true }
        })
      : [];

    const tasks = await prisma.task.findMany({
      where: {
        project: { organizationId: { in: allowedOrgIds } },
        OR: [
          { userId: targetUser.id },
          { assignees: { some: { userId: targetUser.id } } }
        ]
      },
      select: { id: true, status: true }
    });

    const tasksCompleted = tasks.filter((t) => isTaskComplete(t.status)).length;
    const tasksInProgress = tasks.length - tasksCompleted;

    const completedProjects = sharedProjects.filter((project) => {
      if (!project.tasks.length) return false;
      return project.tasks.every((t) => isTaskComplete(t.status));
    });

    const projectPayload = sharedProjects.map((project) => {
      const rawStatus = project.status || "";
      const normalized = (() => {
        const s = rawStatus.toLowerCase();
        if (["completed", "done", "complete"].includes(s)) return "Completed";
        if (["delayed", "at risk", "atrisk"].includes(s)) return "Delayed";
        return "Active";
      })();
      const fallbackStatus = completedProjects.find((p) => p.id === project.id) ? "Completed" : "Active";
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        role: project.userId === targetUser.id ? "Owner" : "Member",
        status: rawStatus ? normalized : fallbackStatus,
        organization: project.organization ? {
          id: project.organization.id,
          name: project.organization.name
        } : null
      };
    });

    res.json({
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        provider: targetUser.provider,
        createdAt: targetUser.createdAt
      },
      profile: targetUser.profile || {
        title: "",
        bio: "",
        avatarUrl: "",
        createdAt: targetUser.createdAt
      },
      organizations: orgMemberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role,
        joinedAt: m.organization.createdAt
      })),
      projects: projectPayload,
      stats: {
        projectsCompleted: completedProjects.length,
        activeProjects: sharedProjects.length - completedProjects.length,
        tasksCompleted,
        tasksInProgress,
        roles: orgMemberships.map((m) => m.role)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
};
