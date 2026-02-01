import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`[Firebase] Admin SDK initialized successfully for project: ${serviceAccount.project_id}`);
    } else {
      console.warn("[Firebase] Warning: FIREBASE_SERVICE_ACCOUNT not found in environment.");
    }
  } catch (error) {
    console.error("[Firebase] Error initializing Admin SDK:", error);
  }
}

export const db = admin.firestore();
export const auth = admin.auth();
export default admin;