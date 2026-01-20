import { useEffect, useMemo, useState } from "react";

const formatDate = (value) => {
  if (!value) return "No date";
  try {
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return value;
  }
};

const storageKey = "ttm_task_meta";

const loadMeta = () => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch {
    return {};
  }
};

const saveMeta = (meta) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(meta));
  } catch {
    // ignore
  }
};

export default function TaskDetailDrawer({ task, onClose, showBack, onBack, onStatusChange }) {
  const [meta, setMeta] = useState({ objectives: [], attachments: [], comments: [] });

  useEffect(() => {
    const all = loadMeta();
    if (task?.id && all[task.id]) {
      setMeta(all[task.id]);
    } else {
      setMeta({ objectives: [], attachments: [], comments: [] });
    }
  }, [task]);

  const updateMeta = (next) => {
    setMeta(next);
    if (!task?.id) return;
    const all = loadMeta();
    all[task.id] = next;
    saveMeta(all);
  };

  const handleAttachment = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const entry = { name: file.name, size: file.size, dataUrl: reader.result };
      const next = { ...meta, attachments: [...meta.attachments, entry] };
      updateMeta(next);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = (name, dataUrl) => {
    const next = {
      ...meta,
      attachments: meta.attachments.filter((a) => !(a.name === name && a.dataUrl === dataUrl)),
    };
    updateMeta(next);
  };

  const headerAccent = useMemo(() => {
    if (!task) return "#eef2ff";
    if ((task.status || "").toLowerCase().includes("progress")) return "#dbeafe";
    if ((task.status || "").toLowerCase().includes("done")) return "#dcfce7";
    return "#fef3c7";
  }, [task]);

  if (!task) return null;

  return (
    <div className="drawer drawer--panel">
      <div className="drawer__header" style={{ justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {showBack && (
            <button className="btn-ghost" onClick={onBack}>
              ← Back
            </button>
          )}
          <div>
            <p className="label" style={{ margin: 0 }}>Task</p>
            <h3 style={{ margin: 0 }}>{task.title}</h3>
          </div>
        </div>
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>

      <div className="drawer__body stack">
        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: headerAccent,
            border: "1px solid #e5e7eb",
            display: "grid",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
            <div className="pill pill--muted" style={{ background: "#fff" }}>{task.priority || "Medium"}</div>
            <div className="muted">{formatDate(task.dueDate || task.updatedAt)}</div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <AvatarStack task={task} />
            <div style={{ display: "flex", gap: 8 }}>
              <Metric icon="📌" label="Objectives" value={meta.objectives.length} />
              <Metric icon="📎" label="Files" value={meta.attachments.length} />
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="label">Project</div>
          <div className="muted">{task.project?.name || "N/A"}</div>
        </div>
        <div className="stack">
          <div className="label">Assignee</div>
          <div className="muted">{task.user?.name || task.user?.email || "Unassigned"}</div>
        </div>
        <div className="stack">
          <div className="label">Description</div>
          <div className="muted">{task.description || "No description yet."}</div>
        </div>
        <div className="stack">
          <div className="label">Status</div>
          <select
            className="form-field"
            style={{ padding: "10px 12px" }}
            value={task.status || "Not Started"}
            onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
          >
            <option>Not Started</option>
            <option>In Progress</option>
            <option>Completed</option>
          </select>
        </div>

        <div className="stack">
          <div className="label">Attachments</div>
          <AttachmentGrid attachments={meta.attachments} onRemove={removeAttachment} />
          <label className="upload-drop">
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => handleAttachment(e.target.files?.[0])}
            />
            <span>Upload file</span>
          </label>
        </div>

        <div className="stack">
          <div className="label">Objectives</div>
          <div className="stack">
            {meta.objectives.length === 0 && <p className="muted">No objectives yet.</p>}
            {meta.objectives.map((o, idx) => (
              <label key={`${o}-${idx}`} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" />
                {o}
              </label>
            ))}
            <ObjectiveInput
              onAdd={(text) => updateMeta({ ...meta, objectives: [...meta.objectives, text] })}
            />
          </div>
        </div>

        <div className="stack">
          <div className="label">Comments</div>
          <div className="comment-stack">
            {meta.comments.length === 0 && <p className="muted">No comments yet.</p>}
            {meta.comments.map((c, idx) => (
              <div key={`${c}-${idx}`} className="comment-chip">
                {c}
              </div>
            ))}
          </div>
          <CommentInput onAdd={(text) => updateMeta({ ...meta, comments: [...meta.comments, text] })} />
        </div>
      </div>
    </div>
  );
}

const ObjectiveInput = ({ onAdd }) => {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        className="form-field"
        style={{ padding: 8 }}
        placeholder="Add objective"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="btn-ghost"
        onClick={() => {
          if (!text.trim()) return;
          onAdd(text.trim());
          setText("");
        }}
      >
        Add
      </button>
    </div>
  );
};

const CommentInput = ({ onAdd }) => {
  const [text, setText] = useState("");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        className="form-field"
        style={{ padding: 8 }}
        placeholder="Leave a quick note"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        className="btn-primary"
        onClick={() => {
          if (!text.trim()) return;
          onAdd(text.trim());
          setText("");
        }}
      >
        Post
      </button>
    </div>
  );
};

const AvatarStack = ({ task }) => {
  const actors = [];
  if (task?.user) actors.push(task.user);
  if (task?.project?.team) {
    task.project.team.slice(0, 2).forEach((m) => {
      if (!actors.find((a) => a.id === m.user?.id)) actors.push(m.user || {});
    });
  }
  const initials = (p) => (p.name || p.email || "?").slice(0, 1).toUpperCase();
  if (actors.length === 0) {
    actors.push({ name: "?" });
  }
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {actors.map((a, idx) => (
        <div
          key={idx}
          className="avatar-circle"
          style={{
            width: 28,
            height: 28,
            marginLeft: idx === 0 ? 0 : -8,
            border: "2px solid #fff",
          }}
          title={a.name || a.email}
        >
          {initials(a)}
        </div>
      ))}
    </div>
  );
};

const Metric = ({ icon, label, value }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      padding: "6px 10px",
      borderRadius: 10,
      background: "#fff",
      border: "1px solid #e5e7eb",
      fontSize: 13,
    }}
  >
    <span>{icon}</span>
    <span style={{ color: "#0f172a", fontWeight: 700 }}>{value}</span>
    <span className="muted">{label}</span>
  </div>
);

const AttachmentGrid = ({ attachments, onRemove }) => {
  if (!attachments || attachments.length === 0) {
    return <p className="muted">No files yet.</p>;
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))" }}>
        {attachments.map((a, idx) => (
          <div
            key={`${a.name}-${idx}`}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 8,
              background: "#f8fafc",
              position: "relative",
            }}
          >
            {a.dataUrl?.startsWith("data:image") && (
              <img
                src={a.dataUrl}
                alt={a.name}
                style={{ width: "100%", height: 64, objectFit: "cover", borderRadius: 6, marginBottom: 6 }}
              />
            )}
            <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {Math.round(a.size / 1024)}kb
            </div>
            <button
              className="btn-ghost"
              style={{ position: "absolute", top: 6, right: 6 }}
              onClick={() => onRemove(a.name, a.dataUrl)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
