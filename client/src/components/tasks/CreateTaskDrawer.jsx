import { useEffect, useState } from "react";

export default function CreateTaskDrawer({ open, onClose, onCreate, projects = [] }) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
    projectId: "",
  });

  useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, projectId: projects?.[0]?.id || "" }));
    }
  }, [open, projects]);

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
