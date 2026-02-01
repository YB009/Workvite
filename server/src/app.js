// server/src/app.js
import express from "express";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "./config/firebase.js"; // Initialize Firebase Admin SDK
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import orgRoutes from "./routes/orgRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import billingRoutes from "./routes/billingRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust the proxy (Render load balancer) to ensure secure cookies/sessions work
app.set("trust proxy", 1);

// Debug: Check if Service Account is loaded (do not log the actual key)
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT environment variable is missing!");
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(morgan("dev"));

// Fix for Cross-Origin-Opener-Policy error with Firebase Popups
// Changed to 'unsafe-none' to resolve window.closed blocking issues
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "unsafe-none");
  next();
});

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim().replace(/\/$/, ""))
  : [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://localhost:5173",
      "http://localhost:4173",
      "https://team-task-manager-p15t.onrender.com",
    ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: "lax", // CSRF protection
    },
  })
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../../client/dist")));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/(.*)/, (req, res) => {
  const indexPath = path.join(__dirname, "../../client/dist/index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Client build not found. Please check your Render Build Command.");
  }
});

export default app;
