import { Router } from "express";
import { verifyAuth } from "../middleware/authMiddleware.js";
import { getUserProfile } from "../controllers/userController.js";

const router = Router();

router.get("/:id/profile", verifyAuth, getUserProfile);

export default router;
