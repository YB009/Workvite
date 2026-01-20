import "./TaskCard.css";

const priorityColors = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

const statusColors = {
  "not started": "#e5e7eb",
  "in progress": "#fbbf24",
  completed: "#34d399",
};

const formatDate = (value) => {
  if (!value) return "No date";
  try {
    const d = new Date(value);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return value;
  }
};

export default function TaskCard({ task, onClick }) {
  const priority = (task.priority || "").toLowerCase();
  const assigneeInitial =
    task.user?.name?.[0] ||
    task.user?.email?.[0] ||
    (task.assignees?.[0]?.[0] ?? "?");

  return (
    <button className="task-card" onClick={onClick} type="button">
      <div className="task-card__top">
        <span
          className="pill"
          style={{
            backgroundColor: `${priorityColors[priority] || "#e5e7eb"}1a`,
            color: priorityColors[priority] || "#111827",
          }}
        >
          {(task.priority || "Medium").replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
        <span className="task-card__date">{formatDate(task.dueDate || task.updatedAt)}</span>
      </div>

      <div className="task-card__title">{task.title}</div>
      {task.description && <div className="task-card__desc">{task.description}</div>}

      <div className="task-card__footer">
        <div className="avatar-chip" title={task.user?.name || task.user?.email || "Assignee"}>
          {assigneeInitial}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="pill pill--muted" style={{ backgroundColor: "#eef2ff" }}>📌 {task.objectives?.length ?? 0}</span>
          <span className="pill pill--muted" style={{ backgroundColor: "#fef9c3" }}>📎 {task.attachments?.length ?? 0}</span>
        </div>
      </div>
    </button>
  );
}
