// server/src/app.js
import express from "express";
import morgan from "morgan";
import cors from "cors";
import session from "express-session";
import fs from "fs";
import process from 'process';
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
import { bugsense } from "./utils/bugsense.js";
import prisma from "../prisma/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust the deployment proxy so secure cookies/sessions work.
app.set("trust proxy", 1);

// Debug: Check if Service Account is loaded (do not log the actual key)
if (!process.env.FIREBASE_SERVICE_ACCOUNT && 
    (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY)) {
  console.error("CRITICAL: Firebase credentials missing from environment variables!");
}

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim().replace(/\/$/, ""))
  : [];

const defaultAllowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://localhost:4173",
  "https://workvite.vercel.app",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, "");
    if ([...allowedOrigins, ...defaultAllowedOrigins].includes(normalizedOrigin)) {
      return callback(null, true);
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalizedOrigin)) {
      return callback(null, true);
    }
    if (/^https:\/\/workvite(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// CORS must run before body parsing/routes so browser preflights never hit auth handlers.
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(morgan("dev"));

// Fix for Cross-Origin-Opener-Policy error with Firebase Popups
// Changed to 'unsafe-none' to resolve window.closed blocking issues
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret_key",
    resave: false,
    saveUninitialized: false,
    proxy: true, // Ensure proxy is trusted for secure cookies
    cookie: {
      secure: process.env.NODE_ENV === "production", // Secure in production
      sameSite: "lax",
      httpOnly: true,
      path: "/",
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

app.get("/health", async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "ok" });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  if (!err) {
    return next();
  }

  void bugsense?.captureException(err, {
    tags: {
      source: "express-error-handler",
      method: req.method,
      route: req.originalUrl || req.url,
    },
    metadata: {
      userId: req.user?.id,
      organizationId: req.organization?.id,
      statusCode: err.status || err.statusCode || 500,
    },
  });

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    message: statusCode >= 500 ? "Internal server error" : err.message,
  });
});

const clientDistPath = path.join(__dirname, "../../client/dist");
const clientIndexPath = path.join(clientDistPath, "index.html");

// Only serve the frontend bundle when it actually exists (monolithic/local deployments).
if (fs.existsSync(clientIndexPath)) {
  app.use(express.static(clientDistPath));
  app.get(/(.*)/, (req, res) => {
    res.sendFile(clientIndexPath);
  });
} else {
  // Backend-only deployments (for example Vercel API project).
  app.get("/", (req, res) => {
    res.json({ status: "ok", service: "api" });
  });
}

export default app;
