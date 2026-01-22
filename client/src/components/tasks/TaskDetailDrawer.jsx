import { useEffect, useMemo, useState } from "react";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { logActivity } from "../../api/activityApi.js";
import axios from "../../api/axiosInstance";

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

const normalizeList = (list = []) => {
  return list.map((item, idx) => {
    if (typeof item === "string") {
      return { id: `${Date.now()}-${idx}`, text: item };
    }
    return {
      id: item.id || `${Date.now()}-${idx}`,
      text: item.text || "",
      author: item.author || null
    };
  });
};

const normalizeMeta = (meta) => ({
  objectives: normalizeList(meta?.objectives || []),
  comments: normalizeList(meta?.comments || [])
});

const saveMeta = (meta) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(meta));
  } catch {
    // ignore
  }
};

export default function TaskDetailDrawer({
  task,
  onClose,
  showBack,
  onBack,
  onStatusChange,
  onAssigneesChange,
  onAttachmentsChange,
  members = []
}) {
  const { firebaseUser, activeOrganization } = useAuthContext();
  const [meta, setMeta] = useState({ objectives: [], comments: [] });
  const [attachments, setAttachments] = useState([]);
  const [editingObjectiveId, setEditingObjectiveId] = useState(null);
  const [editingObjectiveText, setEditingObjectiveText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const initialsFrom = (value = "") => {
    const parts = String(value).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  useEffect(() => {
    const all = loadMeta();
    if (task?.id && all[task.id]) {
      setMeta(normalizeMeta(all[task.id]));
    } else {
      setMeta({ objectives: [], comments: [] });
    }
  }, [task]);

  useEffect(() => {
    setAttachments(task?.attachments || []);
  }, [task]);

  const updateMeta = (next) => {
    setMeta(next);
    if (!task?.id) return;
    const all = loadMeta();
    all[task.id] = next;
    saveMeta(all);
  };

  const pushActivity = async (type, message) => {
    if (!firebaseUser || !task) return;
    try {
      const token = await firebaseUser.getIdToken();
      await logActivity({
        token,
        type,
        message,
        projectId: task.projectId || task.project?.id,
        taskId: task.id
      });
    } catch (err) {
      console.error("Activity log failed", err);
    }
  };

  const handleAttachment = async (file) => {
    if (!file || !firebaseUser || !activeOrganization || !task?.id) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
        const res = await axios.post(
          `/api/tasks/org/${activeOrganization.id}/${task.id}/attachments`,
          {
            name: file.name,
            size: file.size,
            mimeType: file.type,
            dataUrl: reader.result
          },
          { headers }
        );
        setAttachments((prev) => {
          const next = [res.data, ...prev];
          onAttachmentsChange && onAttachmentsChange(next);
          return next;
        });
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = async (attachmentId) => {
    if (!firebaseUser || !activeOrganization || !task?.id || !attachmentId) return;
    try {
      const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
      await axios.delete(
        `/api/tasks/org/${activeOrganization.id}/${task.id}/attachments/${attachmentId}`,
        { headers }
      );
      setAttachments((prev) => {
        const next = prev.filter((a) => a.id !== attachmentId);
        onAttachmentsChange && onAttachmentsChange(next);
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const headerAccent = useMemo(() => {
    if (!task) return "#eef2ff";
    const status = (task.status || "").toLowerCase();
    if (status.includes("progress")) return "#dbeafe";
    if (status.includes("done") || status.includes("complete")) return "#dcfce7";
    return "#fef3c7";
  }, [task]);

  if (!task) return null;

  const selectedAssignees = new Set(
    (task.assignees || []).map((a) => a.userId).filter(Boolean)
  );

  return (
    <div className="drawer drawer--panel">
      <div className="drawer__header" style={{ justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {showBack && (
            <button className="btn-ghost" onClick={onBack}>
              Back
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
              <Metric icon="OBJ" label="Objectives" value={meta.objectives.length} />
              <Metric icon="FILE" label="Files" value={attachments.length} />
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="label">Project</div>
          <div className="muted">{task.project?.name || "N/A"}</div>
        </div>
        <div className="stack">
          <div className="label">Assignee</div>
          {members.length === 0 && (
            <div className="muted">{task.user?.name || task.user?.email || "Unassigned"}</div>
          )}
          {members.length > 0 && (
            <div className="assignee-grid">
              {members.map((member) => {
                const userId = member.userId || member.id;
                const checked = selectedAssignees.has(userId);
                const displayName = member.name || member.email || "Unnamed";
                return (
                  <label
                    key={userId}
                    className={`assignee-card ${checked ? "is-selected" : ""}`}
                  >
                    <input
                      className="assignee-check"
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        const next = new Set(selectedAssignees);
                        if (checked) {
                          next.delete(userId);
                        } else {
                          next.add(userId);
                        }
                        onAssigneesChange && onAssigneesChange(Array.from(next));
                      }}
                    />
                    <span className="assignee-avatar">
                      {initialsFrom(displayName)}
                    </span>
                    <span className="assignee-meta">
                      <span className="assignee-name">{displayName}</span>
                      {member.email && <span className="assignee-email">{member.email}</span>}
                    </span>
                    <span className="assignee-state">{checked ? "Assigned" : "Tap to assign"}</span>
                  </label>
                );
              })}
            </div>
          )}
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
          <AttachmentGrid attachments={attachments} onRemove={removeAttachment} />
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
            {meta.objectives.map((o) => (
              <label key={o.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" />
                {editingObjectiveId === o.id ? (
                  <>
                    <input
                      className="form-field"
                      style={{ padding: 6, flex: 1 }}
                      value={editingObjectiveText}
                      onChange={(e) => setEditingObjectiveText(e.target.value)}
                    />
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        const next = {
                          ...meta,
                          objectives: meta.objectives.map((item) =>
                            item.id === o.id ? { ...item, text: editingObjectiveText.trim() } : item
                          )
                        };
                        updateMeta(next);
                        setEditingObjectiveId(null);
                        setEditingObjectiveText("");
                        pushActivity("OBJECTIVE_UPDATED", "updated an objective");
                      }}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1 }}>{o.text}</span>
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        setEditingObjectiveId(o.id);
                        setEditingObjectiveText(o.text);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        const next = {
                          ...meta,
                          objectives: meta.objectives.filter((item) => item.id !== o.id)
                        };
                        updateMeta(next);
                        pushActivity("OBJECTIVE_REMOVED", "removed an objective");
                      }}
                    >
                      Remove
                    </button>
                  </>
                )}
              </label>
            ))}
            <ObjectiveInput
              onAdd={(text) => {
                const nextItem = { id: `${Date.now()}-${Math.random()}`, text };
                updateMeta({ ...meta, objectives: [...meta.objectives, nextItem] });
                pushActivity("OBJECTIVE_ADDED", "added an objective");
              }}
            />
          </div>
        </div>

        <div className="stack">
          <div className="label">Comments</div>
          <div className="comment-stack">
            {meta.comments.length === 0 && <p className="muted">No comments yet.</p>}
            {meta.comments.map((c) => (
              <div key={c.id} className="comment-chip">
                {c.author && (
                  <div className="comment-author">
                    <span className="comment-avatar">
                      {initialsFrom(c.author.name || c.author.email)}
                    </span>
                    <span className="comment-author-meta">
                      <span className="comment-author-name">{c.author.name || c.author.email}</span>
                      {c.author.email && <span className="comment-author-email">{c.author.email}</span>}
                    </span>
                  </div>
                )}
                {editingCommentId === c.id ? (
                  <>
                    <input
                      className="form-field"
                      style={{ padding: 6, flex: 1 }}
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                    />
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        const next = {
                          ...meta,
                          comments: meta.comments.map((item) =>
                            item.id === c.id ? { ...item, text: editingCommentText.trim() } : item
                          )
                        };
                        updateMeta(next);
                        setEditingCommentId(null);
                        setEditingCommentText("");
                        pushActivity("COMMENT_UPDATED", "updated a comment");
                      }}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1 }}>{c.text}</span>
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        setEditingCommentId(c.id);
                        setEditingCommentText(c.text);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        const next = {
                          ...meta,
                          comments: meta.comments.filter((item) => item.id !== c.id)
                        };
                        updateMeta(next);
                        pushActivity("COMMENT_REMOVED", "removed a comment");
                      }}
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <CommentInput
            onAdd={(text) => {
              const author = {
                name: firebaseUser?.displayName || task.user?.name || task.user?.email || "User",
                email: firebaseUser?.email || task.user?.email || ""
              };
              const nextItem = { id: `${Date.now()}-${Math.random()}`, text, author };
              updateMeta({ ...meta, comments: [...meta.comments, nextItem] });
              pushActivity("COMMENT_ADDED", "added a comment");
            }}
          />
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
            key={a.id || `${a.name}-${idx}`}
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
              onClick={() => onRemove(a.id)}
            >
              A-
            </button>
            <a
              href={a.dataUrl}
              download={a.name}
              style={{ display: "inline-flex", marginTop: 6, fontSize: 12, color: "#4338ca" }}
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
