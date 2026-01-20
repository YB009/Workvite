import { Router } from "express";
import { verifyAuth } from "../middleware/authMiddleware.js";
import { requireOrgAccess } from "../middleware/orgMiddleware.js";
import {
  acceptInvite,
  cancelInvite,
  deactivateMember,
  getTeamMembers,
  inviteMember,
  resendInvite,
  updateMemberProjects,
  updateMemberRole
} from "../controllers/teamController.js";

const router = Router();

router.get("/members", verifyAuth, requireOrgAccess, getTeamMembers);
router.post("/invite", verifyAuth, requireOrgAccess, inviteMember);
router.post("/accept-invite", verifyAuth, acceptInvite);
router.post("/invites/:id/resend", verifyAuth, resendInvite);
router.patch("/invites/:id/cancel", verifyAuth, cancelInvite);
router.patch("/:id/projects", verifyAuth, updateMemberProjects);
router.patch("/:id/deactivate", verifyAuth, deactivateMember);
router.patch("/:id/role", verifyAuth, updateMemberRole);

export default router;
