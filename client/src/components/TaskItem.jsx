import "./TaskItem.css";

const priorityHue = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#10b981",
};

export default function TaskItem({ task }) {
  const assignees = (task.assignees || []).map((a) => a.user || { id: a.userId });
  const avatarList = assignees.length ? assignees : [task.user].filter(Boolean);
  const initialsFrom = (p) => (p?.name || p?.email || "?").slice(0, 1).toUpperCase();
  return (
    <div className="task-item">
      <div className="task-item__top">
        <span
          className="task-item__pill"
          style={{
            background: `${priorityHue[task.priority] || "#e5e7eb"}20`,
            color: priorityHue[task.priority] || "#111827",
          }}
        >
          {task.priority}
        </span>
        <span className="task-item__meta">{task.dueDate || "No date"}</span>
      </div>
      <h4 className="task-item__title">{task.title}</h4>
      <p className="task-item__desc">{task.description || "Light description for this task goes here."}</p>
      <div className="task-item__footer">
        <div className="task-item__avatars">
          {avatarList.map((person, idx) => (
            <div key={person?.id || idx} className="avatar-circle">
              {initialsFrom(person)}
            </div>
          ))}
        </div>
        <span className="task-item__stat">{task.attachments ?? 0} files</span>
      </div>
    </div>
  );
}
