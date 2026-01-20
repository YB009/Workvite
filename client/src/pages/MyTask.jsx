import "./MyTask.css";
import { useEffect, useMemo, useState } from "react";
import { FadeIn } from "../utils/animations.jsx";
import { useAuthContext } from "../context/AuthContext.jsx";
import axios from "../api/axiosInstance";
import TaskDetailDrawer from "../components/tasks/TaskDetailDrawer.jsx";
import CreateTaskDrawer from "../components/tasks/CreateTaskDrawer.jsx";

const statusColor = {
  "not started": "danger",
  "in progress": "warn",
  completed: "success",
};

const toStatus = (status = "") => {
  const s = status.toLowerCase();
  if (["done", "completed", "finish", "finished"].includes(s)) return "Completed";
  if (["in progress", "ongoing", "progress"].includes(s)) return "In Progress";
  return "Not Started";
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return value;
  }
};

export default function MyTask() {
  const { firebaseUser, user, activeOrganization } = useAuthContext();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const load = async () => {
      if (!firebaseUser) return;
      setLoading(true);
      setError("");
      try {
        const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
        if (!activeOrganization) {
          setTasks([]);
          setError("No organization found.");
          return;
        }
        const [taskRes, projectRes] = await Promise.all([
          axios.get(`/api/tasks/org/${activeOrganization.id}`, { headers }),
          axios.get(`/api/projects/org/${activeOrganization.id}`, { headers }),
        ]);
        setTasks(taskRes.data || []);
        setProjects(projectRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firebaseUser, activeOrganization]);

  const myTasks = useMemo(() => {
    if (!user) return tasks;
    return tasks.filter((t) => t.userId === user.id);
  }, [tasks, user]);

  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>My Task</h1>
        <div className="actions">
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Create task</button>
        </div>
      </div>
      <div className="content-surface">
        {loading && <div className="muted">Loading tasks...</div>}
        {error && <div className="error-banner">{error}</div>}
        {!loading && !error && (
          <div className="task-table">
            <div className="task-table__head">
              <span>Task</span>
              <span>Due Date</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Project</span>
            </div>
            <div className="task-table__body">
              {myTasks.length === 0 && <div className="muted" style={{ padding: 12 }}>No tasks assigned yet.</div>}
              {myTasks.map((t, idx) => {
                const status = toStatus(t.status);
                return (
                  <FadeIn key={t.id} delay={idx * 40}>
                    <div className="task-row" style={{ cursor: "pointer" }} onClick={() => setActiveTask(t)}>
                      <span className="task-title">{t.title}</span>
                      <span className="cell-center">{formatDate(t.dueDate || t.updatedAt)}</span>
                      <span className="cell-center"><span className={`pill priority-${(t.priority || "").toLowerCase()}`}>{t.priority || "-"}</span></span>
                      <span className="cell-center"><span className={`pill status-${statusColor[status.toLowerCase()] || "neutral"}`}>{status}</span></span>
                      <span className="cell-center">{t.project?.name || "—"}</span>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <TaskDetailDrawer task={activeTask} onClose={() => setActiveTask(null)} showBack onBack={() => setActiveTask(null)} />
      <CreateTaskDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projects={projects}
        onCreate={async (payload) => {
          if (!activeOrganization || !firebaseUser) return;
          try {
            const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
            const res = await axios.post(`/api/tasks/org/${activeOrganization.id}`, payload, { headers });
            setTasks((prev) => [res.data, ...prev]);
            setShowCreate(false);
          } catch (err) {
            console.error(err);
            setError("Failed to create task.");
          }
        }}
      />
    </div>
  );
}
