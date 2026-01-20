import { Router } from "express";
import { verifyAuth } from "../middleware/authMiddleware.js";
import { requireOrgAccess } from "../middleware/orgMiddleware.js";
import {
  createTask,
  getOrgTasks,
  updateTaskStatus
} from "../controllers/taskController.js";

const router = Router();

router.use(verifyAuth);

router.get("/org/:orgId", requireOrgAccess, getOrgTasks);
router.post("/org/:orgId", requireOrgAccess, createTask);
router.patch("/org/:orgId/:taskId", requireOrgAccess, updateTaskStatus);

export default router;
