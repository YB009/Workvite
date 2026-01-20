// server/src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import orgRoutes from "./routes/orgRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173"], // your Vite frontend
  credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/team", teamRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
