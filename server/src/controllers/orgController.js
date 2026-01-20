import prisma from "../../prisma/client.js";
import { getCache, setCache, deleteByPrefix } from "../utils/cache.js";

export const createOrganization = async (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  const org = await prisma.organization.create({
    data: {
      name,
      ownerId: userId,
      members: {
        create: {
          role: "OWNER",
          status: "ACTIVE",
          userId
        }
      }
    }
  });

  await deleteByPrefix(`orgs:${userId}`);
  res.json(org);
};

export const getMyOrganizations = async (req, res) => {
  const cacheKey = `orgs:${req.user.id}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json(cached);

  const orgs = await prisma.membership.findMany({
    where: { userId: req.user.id },
    select: {
      role: true,
      organization: {
        select: { id: true, name: true, createdAt: true }
      }
    }
  });

  const data = orgs.map((o) => ({
    ...o.organization,
    role: o.role
  }));
  await setCache(cacheKey, data, 15000);
  res.json(data);
};

export const inviteToOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { email, role = "MEMBER" } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existing = await prisma.membership.findFirst({
      where: { userId: user.id, organizationId: orgId }
    });

    if (existing) {
      return res.status(200).json(existing);
    }

    const membership = await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: orgId,
        role
      }
    });

    res.status(201).json(membership);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to invite user" });
  }
};
