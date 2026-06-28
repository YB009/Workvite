import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  try {
    let serviceAccount;

    // Option 1: Try parsing the full JSON string first
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.warn("[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON. Trying individual variables.");
      }
    }

    // Option 2: Fallback to individual environment variables.
    if (!serviceAccount && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      serviceAccount = {
        project_id: process.env.FIREBASE_PROJECT_ID,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        private_key: process.env.FIREBASE_PRIVATE_KEY,
      };
    }

    if (serviceAccount) {
      // CRITICAL FIX: Ensure private key newlines are correctly formatted
      // This fixes the "silent failure" where the key looks valid but fails auth
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`[Firebase] Admin SDK initialized successfully for project: ${serviceAccount.project_id}`);
    } else {
      console.warn("[Firebase] Warning: Valid Firebase credentials not found in environment.");
    }
  } catch (error) {
    console.error("[Firebase] Error initializing Admin SDK:", error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;
