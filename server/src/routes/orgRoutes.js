import { Router } from "express";
import { verifyAuth } from "../middleware/authMiddleware.js";
import { requireOrgAccess } from "../middleware/orgMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import {
  createOrganization,
  getMyOrganizations,
  inviteToOrganization
} from "../controllers/orgController.js";

const router = Router();

router.post("/", verifyAuth, createOrganization);
router.get("/", verifyAuth, getMyOrganizations);
router.post(
  "/:orgId/invite",
  verifyAuth,
  requireOrgAccess,
  requireRole(["OWNER", "ADMIN"]),
  inviteToOrganization
);

export default router;
