import express from "express";
import { verifyAuth } from "../middleware/authMiddleware.js";
import { requireOrgAccess } from "../middleware/orgMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  createProject,
  getOrgProjects,
  grantProjectAccess,
  revokeProjectAccess,
  updateProject
} from "../controllers/projectController.js";
import { deleteProject } from "../controllers/projectController.js";

const router = express.Router();

router.use(verifyAuth);

router.post(
  "/org/:orgId",
  requireOrgAccess,
  requireRole(["OWNER", "ADMIN"]),
  createProject
);

router.get(
  "/org/:orgId",
  requireOrgAccess,
  getOrgProjects
);

router.put(
  "/org/:orgId/projects/:projectId",
  requireOrgAccess,
  requireRole(["OWNER", "ADMIN"]),
  updateProject
);

router.post(
  "/org/:orgId/projects/:projectId/access",
  requireOrgAccess,
  requireRole(["OWNER", "ADMIN"]),
  grantProjectAccess
);

router.delete(
  "/org/:orgId/projects/:projectId/access/:userId",
  requireOrgAccess,
  requireRole(["OWNER", "ADMIN"]),
  revokeProjectAccess
);

router.delete(
  "/org/:orgId/projects/:projectId",
  requireOrgAccess,
  requireRole(["OWNER", "ADMIN"]),
  deleteProject
);

export default router;
