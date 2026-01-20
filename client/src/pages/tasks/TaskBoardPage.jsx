import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TaskColumn from "../../components/TaskColumn.jsx";
import TaskCard from "../../components/tasks/TaskCard.jsx";
import TaskDetailDrawer from "../../components/tasks/TaskDetailDrawer.jsx";
import CreateTaskDrawer from "../../components/tasks/CreateTaskDrawer.jsx";
import "../../App.css";
import axios from "../../api/axiosInstance";
import { useAuthContext } from "../../context/AuthContext.jsx";

const normalizeStatusKey = (status = "") => {
  const s = status.toLowerCase();
  if (["done", "completed", "complete", "finished"].includes(s)) return "completed";
  if (["in progress", "ongoing", "in_progress"].includes(s)) return "in_progress";
  return "not_started";
};

const statusLabels = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export default function TaskBoardPage() {
  const { firebaseUser, user, activeOrganization } = useAuthContext();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!firebaseUser) return;
      setLoading(true);
      setError("");
      try {
        if (!activeOrganization) {
          setTasks([]);
          setProjects([]);
          return;
        }
        const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
        const [taskRes, projectRes] = await Promise.all([
          axios.get(`/api/tasks/org/${activeOrganization.id}`, { headers }),
          axios.get(`/api/projects/org/${activeOrganization.id}`, { headers })
        ]);
        setTasks(taskRes.data || []);
        setProjects(projectRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Couldn't load tasks. Check backend or auth.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [firebaseUser, activeOrganization]);

  const grouped = useMemo(() => {
    const buckets = { not_started: [], in_progress: [], completed: [], assigned: [] };
    tasks.forEach((t) => {
      const key = normalizeStatusKey(t.status);
      buckets[key].push(t);
      if (t.userId && t.userId === user?.id) {
        buckets.assigned.push(t);
      }
    });
    return buckets;
  }, [tasks, user]);

  const onDragStart = (task, from) => {
    setDragging({ task, from });
  };

  const persistStatus = async (taskId, statusValue) => {
    if (!activeOrganization || !firebaseUser) return;
    try {
      setSaving(true);
      const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
      await axios.patch(`/api/tasks/org/${activeOrganization.id}/${taskId}`, { status: statusValue }, { headers });
    } catch (err) {
      console.error(err);
      setError("Failed to update task status.");
    } finally {
      setSaving(false);
    }
  };

  const onDrop = async (toKey) => {
    if (!dragging || toKey === "assigned") return;
    const newStatus = statusLabels[toKey] || toKey;
    const nextTasks = tasks.map((t) =>
      t.id === dragging.task.id ? { ...t, status: newStatus } : t
    );
    setTasks(nextTasks);
    setDragging(null);
    await persistStatus(dragging.task.id, newStatus);
  };

  const handleCreate = async (payload) => {
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
  };

  const columns = [
    { key: "assigned", title: "Assigned to me", locked: true, tasks: grouped.assigned },
    { key: "not_started", title: "Not Started", tasks: grouped.not_started },
    { key: "in_progress", title: "In Progress", tasks: grouped.in_progress },
    { key: "completed", title: "Completed", tasks: grouped.completed },
  ];

  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Task Board</h1>
        <div className="actions">
          <button className="btn-ghost" onClick={() => navigate("/tasks/list")}>All tasks</button>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>Create task</button>
        </div>
      </div>

      <div className="content-surface" style={{ position: "relative" }}>
        {loading && <div className="muted">Loading tasks...</div>}
        {error && <div className="error-banner">{error}</div>}
        {!loading && !error && (
          <div className="board">
            {columns.map((col) => (
              <TaskColumn
                key={col.key}
                title={col.title}
                tasks={col.tasks}
                onHeaderClick={col.key === "assigned" ? () => navigate("/tasks/list") : undefined}
                onDragStart={col.locked ? undefined : onDragStart}
                onDrop={col.locked ? undefined : () => onDrop(col.key)}
              >
                {col.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} onClick={() => setActiveTask(task)} />
                ))}
              </TaskColumn>
            ))}
          </div>
        )}
      </div>

      <TaskDetailDrawer
        task={activeTask}
        onClose={() => setActiveTask(null)}
        onStatusChange={async (newStatus) => {
          if (!activeTask) return;
          const nextTasks = tasks.map((t) =>
            t.id === activeTask.id ? { ...t, status: newStatus } : t
          );
          setTasks(nextTasks);
          setActiveTask((t) => (t ? { ...t, status: newStatus } : t));
          await persistStatus(activeTask.id, newStatus);
        }}
      />
      <CreateTaskDrawer open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} projects={projects} />
    </div>
  );
}
