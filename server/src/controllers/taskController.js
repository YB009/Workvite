import prisma from "../../prisma/client.js";
import { assertRole, Roles } from "../utils/permissions.js";
import { createActivity } from "../services/activityService.js";
import { deleteByPrefix, getCache, setCache } from "../utils/cache.js";

const ensureProjectAccess = async (projectId, userId, orgId, isPrivileged) => {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: orgId },
    include: { access: true }
  });

  if (!project) {
    return { ok: false, status: 404, message: "Project not found in organization" };
  }

  if (isPrivileged) {
    return { ok: true, project };
  }

  const hasAccess = project.access.some((a) => a.userId === userId);
  if (!hasAccess) {
    return { ok: false, status: 403, message: "No access to this project" };
  }

  return { ok: true, project };
};

export const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, projectId, dueDate, assigneeIds } = req.body;

    assertRole(req.membership, [Roles.OWNER, Roles.ADMIN, Roles.MEMBER]);

    const isPrivileged = req.membership.role === Roles.OWNER;
    const accessCheck = await ensureProjectAccess(projectId, req.user.id, req.orgId, isPrivileged);
    if (!accessCheck.ok) {
      return res.status(accessCheck.status).json({ message: accessCheck.message });
    }

    const memberIds = await prisma.membership.findMany({
      where: { organizationId: req.orgId },
      select: { userId: true }
    });
    const allowedAssigneeIds = new Set(memberIds.map((m) => m.userId));

    const desiredAssignees = Array.isArray(assigneeIds) && assigneeIds.length
      ? assigneeIds.filter((id) => allowedAssigneeIds.has(id))
      : [];

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "todo",
        priority: priority || "medium",
        userId: req.user.id,
        projectId,
        dueDate: dueDate ? new Date(dueDate) : null,
        assignees: desiredAssignees.length
          ? { create: desiredAssignees.map((userId) => ({ userId })) }
          : undefined
      },
      include: {
        project: true,
        user: true,
        assignees: { include: { user: true } }
      }
    });

    await deleteByPrefix(`tasks:${req.orgId}`);

    try {
      await createActivity({
        type: "TASK_CREATED",
        message: "created a task",
        actorId: req.user.id,
        projectId,
        taskId: task.id
      });
    } catch (activityError) {
      console.error("Activity log failed:", activityError);
    }

    res.status(201).json(task);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create task" });
  }
};

export const getOrgTasks = async (req, res) => {
  try {
    const cacheKey = `tasks:${req.orgId}:${req.user.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json(cached);

    const isPrivileged = req.membership.role === Roles.OWNER;
    let tasks;

    if (isPrivileged) {
      tasks = await prisma.task.findMany({
        where: { project: { organizationId: req.orgId } },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          projectId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          attachments: {
            select: {
              id: true,
              name: true,
              mimeType: true,
              size: true,
              dataUrl: true,
              createdAt: true,
              uploadedBy: { select: { id: true, name: true, email: true } }
            }
          },
          project: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
          assignees: {
            select: {
              userId: true,
              user: { select: { id: true, name: true, email: true } }
            }
          }
        }
      });
    } else {
      const allowedProjectIds = await prisma.projectAccess.findMany({
        where: { userId: req.user.id, project: { organizationId: req.orgId } },
        select: { projectId: true }
      });

      tasks = await prisma.task.findMany({
        where: {
          projectId: { in: allowedProjectIds.map((p) => p.projectId) },
          project: { organizationId: req.orgId }
        },
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          dueDate: true,
          projectId: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          attachments: {
            select: {
              id: true,
              name: true,
              mimeType: true,
              size: true,
              dataUrl: true,
              createdAt: true,
              uploadedBy: { select: { id: true, name: true, email: true } }
            }
          },
          project: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
          assignees: {
            select: {
              userId: true,
              user: { select: { id: true, name: true, email: true } }
            }
          }
        }
      });
    }

    await setCache(cacheKey, tasks, 15000);
    res.json(tasks);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: "Status is required" });

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.project.organizationId !== req.orgId) {
      return res.status(403).json({ message: "Task not in this organization" });
    }

    const isPrivileged = req.membership.role === Roles.OWNER;
    if (!isPrivileged) {
      const allowed = await prisma.projectAccess.findFirst({
        where: { userId: req.user.id, projectId: task.projectId }
      });
      if (!allowed) {
        return res.status(403).json({ message: "No access to move this task" });
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: { status },
      include: {
        project: true,
        user: true,
        assignees: { include: { user: true } },
        attachments: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            dataUrl: true,
            createdAt: true,
            uploadedBy: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    await deleteByPrefix(`tasks:${req.orgId}`);

    if (task.status !== status) {
      try {
        await createActivity({
          type: "TASK_STATUS_CHANGED",
          message: `moved task from ${task.status} to ${status}`,
          actorId: req.user.id,
          projectId: task.projectId,
          taskId: task.id
        });
      } catch (activityError) {
        console.error("Activity log failed:", activityError);
      }
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update task status" });
  }
};

export const updateTaskAssignees = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { assigneeIds } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.project.organizationId !== req.orgId) {
      return res.status(403).json({ message: "Task not in this organization" });
    }

    const isPrivileged = req.membership.role === Roles.OWNER;
    if (!isPrivileged) {
      const allowed = await prisma.projectAccess.findFirst({
        where: { userId: req.user.id, projectId: task.projectId }
      });
      if (!allowed) {
        return res.status(403).json({ message: "No access to update this task" });
      }
    }

    const memberIds = await prisma.membership.findMany({
      where: { organizationId: req.orgId },
      select: { userId: true }
    });
    const allowedAssigneeIds = new Set(memberIds.map((m) => m.userId));
    const nextAssignees = Array.isArray(assigneeIds)
      ? assigneeIds.filter((id) => allowedAssigneeIds.has(id))
      : [];

    await prisma.taskAssignee.deleteMany({ where: { taskId } });
    if (nextAssignees.length) {
      await prisma.taskAssignee.createMany({
        data: nextAssignees.map((userId) => ({ taskId, userId })),
        skipDuplicates: true
      });
    }

    const updated = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
        user: true,
        assignees: { include: { user: true } },
        attachments: {
          select: {
            id: true,
            name: true,
            mimeType: true,
            size: true,
            dataUrl: true,
            createdAt: true,
            uploadedBy: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    await deleteByPrefix(`tasks:${req.orgId}`);

    try {
      await createActivity({
        type: "TASK_ASSIGNEES_UPDATED",
        message: "updated task assignees",
        actorId: req.user.id,
        projectId: task.projectId,
        taskId: task.id
      });
    } catch (activityError) {
      console.error("Activity log failed:", activityError);
    }

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update task assignees" });
  }
};

export const addTaskAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { name, size, mimeType, dataUrl } = req.body;

    if (!name || !size || !dataUrl) {
      return res.status(400).json({ message: "Attachment data is required" });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.project.organizationId !== req.orgId) {
      return res.status(403).json({ message: "Task not in this organization" });
    }

    const isPrivileged = req.membership.role === Roles.OWNER;
    if (!isPrivileged) {
      const allowed = await prisma.projectAccess.findFirst({
        where: { userId: req.user.id, projectId: task.projectId }
      });
      if (!allowed) {
        return res.status(403).json({ message: "No access to update this task" });
      }
    }

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        uploadedById: req.user.id,
        name,
        size: Number(size),
        mimeType,
        dataUrl
      },
      include: {
        uploadedBy: { select: { id: true, name: true, email: true } }
      }
    });

    await deleteByPrefix(`tasks:${req.orgId}`);

    try {
      await createActivity({
        type: "FILE_UPLOADED",
        message: "uploaded a file",
        actorId: req.user.id,
        projectId: task.projectId,
        taskId: task.id
      });
    } catch (activityError) {
      console.error("Activity log failed:", activityError);
    }

    res.status(201).json(attachment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to upload attachment" });
  }
};

export const removeTaskAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    });

    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.project.organizationId !== req.orgId) {
      return res.status(403).json({ message: "Task not in this organization" });
    }

    const isPrivileged = req.membership.role === Roles.OWNER;
    if (!isPrivileged) {
      const allowed = await prisma.projectAccess.findFirst({
        where: { userId: req.user.id, projectId: task.projectId }
      });
      if (!allowed) {
        return res.status(403).json({ message: "No access to update this task" });
      }
    }

    await prisma.taskAttachment.deleteMany({
      where: { id: attachmentId, taskId }
    });

    await deleteByPrefix(`tasks:${req.orgId}`);

    try {
      await createActivity({
        type: "FILE_REMOVED",
        message: "removed a file",
        actorId: req.user.id,
        projectId: task.projectId,
        taskId: task.id
      });
    } catch (activityError) {
      console.error("Activity log failed:", activityError);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove attachment" });
  }
};
