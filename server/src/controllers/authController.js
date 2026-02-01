// server/src/controllers/authController.js
import admin from "../config/firebaseAdmin.js";
import prisma from "../../prisma/client.js";
import { generateToken } from "../utils/generateToken.js";
import { clearAuthCookies } from "../utils/sessionHelpers.js";

const extractIdToken = (req) => {
  // Body token
  if (req.body && req.body.idToken) return req.body.idToken;
  // Authorization: Bearer <token>
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.split(" ")[1];
  // x-id-token header fallback
  if (req.headers["x-id-token"]) return req.headers["x-id-token"];
  return null;
};




/**
 * POST /auth/firebase
 * Body: { idToken: string }
 *
 * 1. Verify Firebase ID token
 * 2. Map provider/email/uid
 * 3. Find or create user in Postgres
 * 4. Return our own JWT + user
 */
export const firebaseAuth = async (req, res) => {
  try {
    const idToken = extractIdToken(req);

    if (!idToken) {
      return res.status(400).json({ message: "idToken is required" });
    }

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(idToken);

    const email = decoded.email;
    const firebaseUid = decoded.uid;
    const providerId = decoded.firebase?.sign_in_provider || "unknown";
    const name = decoded.name || null;

    if (!email) {
      return res
        .status(400)
        .json({ message: "No email found in Firebase token" });
    }

    let provider = "unknown";
    let providerField = null;

    switch (providerId) {
      case "google.com":
        provider = "google";
        providerField = "googleId";
        break;
      case "facebook.com":
        provider = "facebook";
        providerField = "facebookId";
        break;
      case "github.com":
        provider = "github";
        providerField = "githubId";
        break;
      case "twitter.com":
        provider = "twitter";
        providerField = "twitterId";
        break;
      default:
        provider = "firebase";
        break;
    }

    // Try to find by provider UID first
    let user = null;
    if (providerField) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { [providerField]: firebaseUid },
            { firebaseUid },
          ],
        },
      });
    } else {
      user = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { firebaseUid }]
        }
      });
    }

    // Create new user if none
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          provider,
          firebaseUid,
          googleId: provider === "google" ? firebaseUid : null,
          facebookId: provider === "facebook" ? firebaseUid : null,
          githubId: provider === "github" ? firebaseUid : null,
          twitterId: provider === "twitter" ? firebaseUid : null,
        },
      });
    } else {
      // Ensure we store provider UID if missing
      const updateData = {};
      if (!user.firebaseUid) updateData.firebaseUid = firebaseUid;

      if (provider === "google" && !user.googleId)
        updateData.googleId = firebaseUid;
      if (provider === "facebook" && !user.facebookId)
        updateData.facebookId = firebaseUid;
      if (provider === "github" && !user.githubId)
        updateData.githubId = firebaseUid;
      if (provider === "twitter" && !user.twitterId)
        updateData.twitterId = firebaseUid;

      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      select: {
        role: true,
        organization: { select: { id: true, name: true } }
      }
    });

    const token = generateToken(user);

    return res.json({
      message: "Authentication successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        provider: user.provider,
      },
      hasOrganization: memberships.length > 0,
      organizations: memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role
      }))
    });
  } catch (err) {
    console.error("Firebase auth error:", err);
    return res
      .status(401)
      .json({ message: "Invalid Firebase token", error: err.message });
  }
};

/**
 * POST /auth/logout
 * Stateless logout (front-end should drop tokens). If a session exists, destroy it.
 */
export const logout = async (req, res) => {
  try {
    if (req.session) {
      req.session.destroy(() => {});
    }
    clearAuthCookies(res);
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Logout failed" });
  }
};
