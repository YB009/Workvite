// client/src/api/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  setPersistence,
  indexedDBLocalPersistence,
} from "firebase/auth";

/**
 * IMPORTANT:
 * Put these in client/.env (Vite):
 *
 * VITE_FIREBASE_API_KEY=...
 * VITE_FIREBASE_AUTH_DOMAIN=team-task-manager-d9b04.firebaseapp.com
 * VITE_FIREBASE_PROJECT_ID=team-task-manager-d9b04
 * VITE_FIREBASE_STORAGE_BUCKET=team-task-manager-d9b04.appspot.com
 * VITE_FIREBASE_MESSAGING_SENDER_ID=...
 * VITE_FIREBASE_APP_ID=...
 */

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBAE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Ensure auth state persists across iOS redirects (Chrome/Safari use WKWebView).
setPersistence(auth, indexedDBLocalPersistence).catch((err) => {
  console.warn("Auth persistence setup failed:", err);
});

// Providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const twitterProvider = new TwitterAuthProvider();

/**
 * Helper: we’ll use this in the LoginPage
 * to sign in with any provider via popup.
 */
export const PROVIDERS = {
  google: googleProvider,
  facebook: facebookProvider,
  github: githubProvider,
  twitter: twitterProvider,
};
