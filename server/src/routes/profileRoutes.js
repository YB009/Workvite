import { Router } from "express";
import { verifyAuth } from "../middleware/authMiddleware.js";
import { getMyProfile, updateMyProfile } from "../controllers/profileController.js";

const router = Router();

router.get("/me", verifyAuth, getMyProfile);
router.put("/me", verifyAuth, updateMyProfile);

export default router;
