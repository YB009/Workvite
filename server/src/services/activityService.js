import prisma from "../../prisma/client.js";

export const createActivity = async ({
  type,
  message,
  actorId,
  projectId = null,
  taskId = null
}) => {
  if (!prisma.activity) {
    console.warn("Activity model not available in Prisma client. Run prisma generate/migrate.");
    return null;
  }
  return prisma.activity.create({
    data: {
      type,
      message,
      actorId,
      projectId,
      taskId
    }
  });
};

export const listActivities = async ({
  orgIds = [],
  projectId,
  userId,
  fromDate,
  toDate,
  page = 1,
  pageSize = 25
}) => {
  const where = {
    project: {
      organizationId: { in: orgIds }
    }
  };

  if (projectId) {
    where.projectId = projectId;
  }

  if (userId) {
    where.actorId = userId;
  }

  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) {
      where.createdAt.gte = fromDate;
    }
  if (toDate) {
    where.createdAt.lte = toDate;
  }
}

  if (!prisma.activity) {
    console.warn("Activity model not available in Prisma client. Run prisma generate/migrate.");
    return {
      items: [],
      total: 0,
      page,
      pageSize,
      hasMore: false
    };
  }

  const skip = (page - 1) * pageSize;

  const [total, items] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: {
        actor: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } }
      }
    })
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: skip + items.length < total
  };
};
