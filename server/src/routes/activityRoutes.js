import { Router } from "express";
import { verifyAuth } from "../middleware/authMiddleware.js";
import { createActivityEntry, getActivityFeed } from "../controllers/activityController.js";

const router = Router();

router.get("/", verifyAuth, getActivityFeed);
router.post("/", verifyAuth, createActivityEntry);

export default router;
