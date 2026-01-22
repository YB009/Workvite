import { Router } from "express";
import { verifyAuth } from "../middleware/authMiddleware.js";
import { requireOrgAccess } from "../middleware/orgMiddleware.js";
import {
  createTask,
  getOrgTasks,
  addTaskAttachment,
  removeTaskAttachment,
  updateTaskAssignees,
  updateTaskStatus
} from "../controllers/taskController.js";

const router = Router();

router.use(verifyAuth);

router.get("/org/:orgId", requireOrgAccess, getOrgTasks);
router.post("/org/:orgId", requireOrgAccess, createTask);
router.patch("/org/:orgId/:taskId", requireOrgAccess, updateTaskStatus);
router.patch("/org/:orgId/:taskId/assignees", requireOrgAccess, updateTaskAssignees);
router.post("/org/:orgId/:taskId/attachments", requireOrgAccess, addTaskAttachment);
router.delete("/org/:orgId/:taskId/attachments/:attachmentId", requireOrgAccess, removeTaskAttachment);

export default router;
