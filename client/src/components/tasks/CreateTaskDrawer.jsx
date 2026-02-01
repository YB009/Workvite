import { useEffect, useState } from "react";

export default function CreateTaskDrawer({
  open,
  onClose,
  onCreate,
  projects = [],
  members = [],
  fixedProjectId,
  fixedProjectName
}) {
  const initialsFrom = (value = "") => {
    const parts = String(value).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
    projectId: "",
    assigneeIds: []
  });

  useEffect(() => {
    if (!open) return;
    setForm((f) => ({
      ...f,
      projectId: fixedProjectId || projects?.[0]?.id || "",
      assigneeIds: f.assigneeIds.length ? f.assigneeIds : []
    }));
  }, [open, projects, fixedProjectId]);

  const toggleAssignee = (userId) => {
    setForm((prev) => {
      const exists = prev.assigneeIds.includes(userId);
      return {
        ...prev,
        assigneeIds: exists
          ? prev.assigneeIds.filter((id) => id !== userId)
          : [...prev.assigneeIds, userId]
      };
    });
  };

  if (!open) return null;

  return (
    <div className="drawer">
      <div className="drawer__header">
        <h3>Create Task</h3>
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>
      <div className="drawer__body stack">
        <label className="form-field">
          <span>Title</span>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Design feedback on wireframe"
          />
        </label>
        <label className="form-field">
          <span>Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add helpful context for the assignee"
          />
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <label className="form-field" style={{ flex: 1 }}>
            <span>Priority</span>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="form-field" style={{ flex: 1 }}>
            <span>Status</span>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="todo">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <label className="form-field" style={{ flex: 1 }}>
            <span>Due date</span>
            <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </label>
          {!fixedProjectId && (
            <label className="form-field" style={{ flex: 1 }}>
              <span>Project</span>
              <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {fixedProjectId && (
            <div className="form-field" style={{ flex: 1 }}>
              <span>Project</span>
              <div className="pill" style={{ backgroundColor: "#eef2ff", color: "#3730a3", padding: "10px 12px" }}>
                {fixedProjectName || "Selected project"}
              </div>
            </div>
          )}
        </div>
        <div className="form-field">
          <span>Assignees</span>
          <div className="assignee-grid">
            {members.length === 0 && <p className="muted">No team members yet.</p>}
            {members.map((member) => {
              const memberId = member.userId || member.id;
              const displayName = member.name || member.email || "Unnamed";
              const checked = form.assigneeIds.includes(memberId);
              return (
                <label
                  key={memberId}
                  className={`assignee-card ${checked ? "is-selected" : ""}`}
                >
                  <input
                    className="assignee-check"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAssignee(memberId)}
                  />
                  <span className="assignee-avatar">
                    {initialsFrom(displayName)}
                  </span>
                  <span className="assignee-meta">
                    <span className="assignee-name">{displayName}</span>
                    {member.email && <span className="assignee-email">{member.email}</span>}
                  </span>
                  <span className="assignee-state">{checked ? "Selected" : "Tap to add"}</span>
                </label>
              );
            })}
          </div>
        </div>
        <button
          className="btn-primary"
          onClick={() => onCreate(form)}
          disabled={!form.title || !form.projectId}
        >
          Save task
        </button>
      </div>
    </div>
  );
}
