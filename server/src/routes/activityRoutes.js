import { Router } from "express";
import { verifyAuth } from "../middleware/authMiddleware.js";
import { getActivityFeed } from "../controllers/activityController.js";

const router = Router();

router.get("/", verifyAuth, getActivityFeed);

export default router;
