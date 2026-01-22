import "./TaskCard.css";

const priorityColors = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
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

const initialsFrom = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function TaskCard({ task, onClick }) {
  const priority = (task.priority || "").toLowerCase();
  const assignees = (task.assignees || []).map((a) => a.user || { id: a.userId });
  const avatarList = assignees.length ? assignees : [task.user].filter(Boolean);

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
        <div className="avatar-stack" title="Assignees">
          {avatarList.slice(0, 3).map((person, idx) => (
            <div key={person?.id || idx} className="avatar-chip" style={{ marginLeft: idx === 0 ? 0 : -8 }}>
              {initialsFrom(person?.name || person?.email || "?")}
            </div>
          ))}
          {avatarList.length > 3 && <span className="avatar-more">+{avatarList.length - 3}</span>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="pill pill--muted" style={{ backgroundColor: "#eef2ff" }}>
            Obj {task.objectives?.length ?? 0}
          </span>
          <span className="pill pill--muted" style={{ backgroundColor: "#fef9c3" }}>
            Files {task.attachments?.length ?? 0}
          </span>
        </div>
      </div>
    </button>
  );
}
