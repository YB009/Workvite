import "../MyTask.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";
import axios from "../../api/axiosInstance";
import TaskDetailDrawer from "../../components/tasks/TaskDetailDrawer.jsx";
import CreateTaskDrawer from "../../components/tasks/CreateTaskDrawer.jsx";
import { fetchTeamMembers } from "../../api/teamApi.js";
import { useOverdueTasks } from "../../hooks/useOverdueTasks.js";
import { isTaskOverdue } from "../../utils/taskUtils.js";

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

export default function OverdueTasksPage() {
  const { firebaseUser, activeOrganization } = useAuthContext();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!firebaseUser) return;
      setLoading(true);
      setError("");
      try {
        if (!activeOrganization) {
          setTasks([]);
          setProjects([]);
          setMembers([]);
          return;
        }
        const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
        const [taskRes, projectRes] = await Promise.all([
          axios.get(`/api/tasks/org/${activeOrganization.id}`, { headers }),
          axios.get(`/api/projects/org/${activeOrganization.id}`, { headers }),
        ]);
        setTasks(taskRes.data || []);
        setProjects(projectRes.data || []);
        const token = await firebaseUser.getIdToken();
        const team = await fetchTeamMembers({ token, orgId: activeOrganization.id });
        const list = (team?.items || []).filter((m) => !m.isInvite);
        setMembers(list);
      } catch (err) {
        console.error(err);
        setError("Failed to load overdue tasks.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firebaseUser, activeOrganization]);

  const overdueTasks = useOverdueTasks(tasks);

  const rows = useMemo(() => {
    return overdueTasks.map((t) => ({
      ...t,
      statusLabel: toStatus(t.status),
    }));
  }, [overdueTasks]);

  return (
    <div className="page-stack">
      <div className="toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="btn-ghost" type="button" onClick={() => navigate(-1)}>
            Back
          </button>
          <h1>Overdue Tasks</h1>
        </div>
        <div className="actions">
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Create task</button>
        </div>
      </div>

      <div className="content-surface">
        {loading && <div className="muted">Loading tasks...</div>}
        {error && <div className="error-banner">{error}</div>}
        {!loading && !error && (
          <div className="task-table task-table--all">
            <div className="task-table__head">
              <span>Task</span>
              <span>Due Date</span>
              <span>Priority</span>
              <span>Status</span>
              <span>Assigned to</span>
              <span>Project</span>
            </div>
            <div className="task-table__body">
              {rows.length === 0 && <div className="muted" style={{ padding: 12 }}>No overdue tasks.</div>}
              {rows.map((t) => (
                <div
                  key={t.id}
                  className={`task-row task-row--all ${isTaskOverdue(t) ? "task-row--overdue" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => setActiveTask(t)}
                >
                  <span className="task-title">{t.title}</span>
                  <span className="cell-center">{formatDate(t.dueDate || t.updatedAt)}</span>
                  <span className="cell-center">
                    <span className={`pill priority-${(t.priority || "").toLowerCase()}`}>{t.priority || "-"}</span>
                  </span>
                  <span className="cell-center">
                    <span className={`pill status-${statusColor[t.statusLabel.toLowerCase()] || "neutral"}`}>
                      {t.statusLabel}
                    </span>
                  </span>
                  <span className="cell-center">
                    <span className="assignee-stack">
                      {(t.assignees || []).length === 0 && <span className="muted">Unassigned</span>}
                      {(t.assignees || []).map((a, idx) => (
                        <span key={a.userId || idx} className="assignee-pill" title={a.user?.name || a.user?.email}>
                          {(a.user?.name || a.user?.email || "?").slice(0, 1).toUpperCase()}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="cell-center">{t.project?.name || "-"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TaskDetailDrawer
        task={activeTask}
        onClose={() => setActiveTask(null)}
        showBack
        onBack={() => setActiveTask(null)}
        members={members}
        onDescriptionChange={(nextDescription) => {
          if (!activeTask) return;
          setTasks((prev) =>
            prev.map((t) => (t.id === activeTask.id ? { ...t, description: nextDescription } : t))
          );
          setActiveTask((t) => (t ? { ...t, description: nextDescription } : t));
        }}
        onDueDateChange={async (newDate) => {
          if (!activeTask || !activeOrganization || !firebaseUser) return;
          const nextDate = newDate ? new Date(newDate).toISOString() : null;
          setTasks((prev) =>
            prev.map((t) => (t.id === activeTask.id ? { ...t, dueDate: nextDate } : t))
          );
          setActiveTask((t) => (t ? { ...t, dueDate: nextDate } : t));
          try {
            const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
            await axios.patch(
              `/api/tasks/org/${activeOrganization.id}/${activeTask.id}`,
              { dueDate: newDate || null },
              { headers }
            );
          } catch (err) {
            console.error(err);
            setError("Failed to update due date.");
          }
        }}
        onAssigneesChange={async (assigneeIds) => {
          if (!activeTask || !activeOrganization || !firebaseUser) return;
          try {
            const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
            const res = await axios.patch(
              `/api/tasks/org/${activeOrganization.id}/${activeTask.id}/assignees`,
              { assigneeIds },
              { headers }
            );
            setTasks((prev) => prev.map((t) => (t.id === activeTask.id ? res.data : t)));
            setActiveTask(res.data);
          } catch (err) {
            console.error(err);
            setError("Failed to update assignees.");
          }
        }}
        onAttachmentsChange={(nextAttachments) => {
          if (!activeTask) return;
          setTasks((prev) =>
            prev.map((t) => (t.id === activeTask.id ? { ...t, attachments: nextAttachments } : t))
          );
          setActiveTask((t) => (t ? { ...t, attachments: nextAttachments } : t));
        }}
      />

      <CreateTaskDrawer
        open={showCreate}
        onClose={() => setShowCreate(false)}
        projects={projects}
        members={members}
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
