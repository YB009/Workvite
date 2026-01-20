import prisma from "../../prisma/client.js";
import { listActivities } from "../services/activityService.js";

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getActivityFeed = async (req, res) => {
  try {
    const { projectId, userId, fromDate, toDate } = req.query;
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const pageSizeRaw = parseInt(req.query.pageSize || "25", 10);
    const pageSize = Math.min(Math.max(pageSizeRaw, 1), 100);

    const memberships = await prisma.membership.findMany({
      where: { userId: req.user.id },
      select: { organizationId: true }
    });

    const orgIds = memberships.map((m) => m.organizationId);
    if (!orgIds.length) {
      return res.json({ items: [], total: 0, page, pageSize, hasMore: false });
    }

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, organizationId: { in: orgIds } },
        select: { id: true }
      });
      if (!project) {
        return res.status(403).json({ message: "Access denied to this project" });
      }
    }

    const payload = await listActivities({
      orgIds,
      projectId,
      userId,
      fromDate: parseDate(fromDate),
      toDate: parseDate(toDate),
      page,
      pageSize
    });

    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load activity" });
  }
};
