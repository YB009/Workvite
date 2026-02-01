import prisma from "../../prisma/client.js";
import { createActivity, listActivities } from "../services/activityService.js";

const ALLOWED_TYPES = new Set([
  "TASK_CREATED",
  "TASK_STATUS_CHANGED",
  "FILE_UPLOADED",
  "FILE_REMOVED",
  "COMMENT_ADDED",
  "COMMENT_UPDATED",
  "COMMENT_REMOVED",
  "OBJECTIVE_ADDED",
  "OBJECTIVE_UPDATED",
  "OBJECTIVE_REMOVED",
  "PROJECT_CREATED",
  "PROJECT_UPDATED",
  "PROJECT_DELETED",
  "TASK_ASSIGNEES_UPDATED"
]);

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

export const createActivityEntry = async (req, res) => {
  try {
    const { type, message, projectId, taskId } = req.body;

    if (!type || !ALLOWED_TYPES.has(type)) {
      return res.status(400).json({ message: "Invalid activity type" });
    }

    if (!projectId && !taskId) {
      return res.status(400).json({ message: "projectId or taskId is required" });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: req.user.id },
      select: { organizationId: true }
    });
    const orgIds = memberships.map((m) => m.organizationId);

    if (!orgIds.length) {
      return res.status(403).json({ message: "No organization access" });
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

    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, project: { organizationId: { in: orgIds } } },
        select: { id: true, projectId: true }
      });
      if (!task) {
        return res.status(403).json({ message: "Access denied to this task" });
      }
    }

    const activity = await createActivity({
      type,
      message: message || "",
      actorId: req.user.id,
      projectId: projectId || undefined,
      taskId: taskId || undefined
    });

    res.status(201).json(activity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create activity" });
  }
};
