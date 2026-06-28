import express from "express";
import session from "express-session";
import authRoutes from "./src/routes/authRoutes.js";
import projectRoutes from "./src/routes/projectRoutes.js";
import taskRoutes from "./src/routes/taskRoutes.js";
import orgRoutes from "./src/routes/orgRoutes.js";
import billingRoutes from "./src/routes/billingRoutes.js";
import profileRoutes from "./src/routes/profileRoutes.js";
import activityRoutes from "./src/routes/activityRoutes.js";
import teamRoutes from "./src/routes/teamRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import prisma from "./prisma/client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 3001;

const allowedOrigins = [
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim().replace(/\/$/, ""))
    : []),
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalizedOrigin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Serve built client (if exists)
const clientDist = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
}

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

// Public auth routes
app.use("/api/auth", authRoutes);

// Protected routes (route-level middleware enforces auth)
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/team", teamRoutes);

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "ok", message: "Server is running" });
  } catch (error) {
    console.error("[health] database ping failed:", error?.message || error);
    res.status(500).json({ status: "error", database: "unavailable" });
  }
});

app.listen(port, () => {
  console.log("API server running on port " + port);
});
