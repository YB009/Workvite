import admin from "../config/firebaseAdmin.js";
import prisma from "../../prisma/client.js";

export const verifyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const idToken = authHeader.split(" ")[1];

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Load user from DB (findFirst because firebaseUid may not be marked unique in older clients)
    const user = await prisma.user.findFirst({
      where: { firebaseUid: decoded.uid }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("AUTH ERROR:", error);
    res.status(401).json({ message: "Unauthorized" });
  }
};
