import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useLenis } from "../../context/LenisContext";
import { logActivity } from "../../api/activityApi.js";
import axios from "../../api/axiosInstance";
import DueDateEditor from "./DueDateEditor.jsx";

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
  onDescriptionChange,
  onAssigneesChange,
  onAttachmentsChange,
  onDueDateChange,
  members = []
}) {
  const { firebaseUser, activeOrganization } = useAuthContext();
  const lenis = useLenis();
  const [meta, setMeta] = useState({ objectives: [], comments: [] });
  const [attachments, setAttachments] = useState([]);
  const [descriptionText, setDescriptionText] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);
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

  // Stop Lenis smooth scroll when drawer is open
  useEffect(() => {
    if (lenis && task) {
      lenis.stop();
      // Disable scroll on body to prevent background scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      if (lenis) {
        lenis.start();
        // Re-enable scroll on body
        document.body.style.overflow = '';
      }
    };
  }, [lenis, task]);

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

  useEffect(() => {
    setDescriptionText(task?.description || "");
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

  const updateDescription = async () => {
    if (!task?.id || !firebaseUser || !activeOrganization) return;
    try {
      setSavingDescription(true);
      const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
      await axios.patch(
        `/api/tasks/org/${activeOrganization.id}/${task.id}`,
        { description: descriptionText || "" },
        { headers }
      );
      onDescriptionChange && onDescriptionChange(descriptionText || "");
      pushActivity("TASK_UPDATED", "updated task description");
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDescription(false);
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

  const content = (
    <div className="drawer drawer--panel task-drawer" data-lenis-prevent>
      <div className="drawer__header task-drawer-header" style={{ justifyContent: "space-between", gap: 12 }}>
        <div className="task-drawer-header__left">
          {showBack && (
            <button className="btn-ghost" onClick={onBack}>
              Back
            </button>
          )}
          <div>
            <p className="label task-drawer-kicker">Task</p>
            <h3 className="task-drawer-title">{task.title}</h3>
          </div>
        </div>
        <button className="btn-ghost task-drawer-close" onClick={onClose}>Close</button>
      </div>

      <div className="drawer__body task-panel">
        <div className="task-panel__section task-meta-card" style={{ background: headerAccent }}>
          <div className="task-meta-card__top">
            <span className="task-meta-pill">{task.priority || "Medium"}</span>
            <span className="task-meta-date">📅 {formatDate(task.dueDate || task.updatedAt)}</span>
          </div>
          <div className="task-meta-card__bottom">
            <AvatarStack task={task} />
            <div className="task-meta-badges">
              <MetaBadge icon="🎯" label="Objectives" value={meta.objectives.length} />
              <MetaBadge icon="📎" label="Files" value={attachments.length} />
            </div>
          </div>
        </div>

        <div className="task-panel__section task-details-card">
          <div className="task-details-grid">
            <div>
              <div className="label">Project</div>
              <div className="project-badge">{task.project?.name || "N/A"}</div>
            </div>
            <div>
              <div className="label">Description</div>
              <div className="description-editor">
                <textarea
                  className="description-box"
                  value={descriptionText}
                  onChange={(e) => setDescriptionText(e.target.value)}
                  placeholder="No description yet."
                />
                <div className="description-actions">
                  <button
                    className="btn-ghost description-save"
                    type="button"
                    onClick={updateDescription}
                    disabled={savingDescription}
                  >
                    {savingDescription ? "Saving..." : "Update"}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="task-details-assignees">
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
        </div>

        <div className="task-panel__section task-controls-card">
          <div className="task-controls-grid">
            <div className="task-control">
              <div className="label">Status</div>
              <select
                className="status-select"
                value={task.status || "Not Started"}
                onChange={(e) => onStatusChange && onStatusChange(e.target.value)}
              >
                <option>Not Started</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
            </div>
            <div className="task-control">
              <DueDateEditor
                task={task}
                onUpdate={(value) => onDueDateChange && onDueDateChange(value)}
              />
            </div>
          </div>
        </div>

        <div className="task-panel__section task-attachments-card">
          <div className="task-section-title">
            <span>Attachments</span>
          </div>
          <AttachmentGrid attachments={attachments} onRemove={removeAttachment} />
          <label className="upload-drop task-upload-drop">
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(e) => handleAttachment(e.target.files?.[0])}
            />
            <span>Drop files here or click to upload</span>
          </label>
        </div>

        <div className="task-panel__section task-objectives-card">
          <div className="task-section-title">
            <span>Objectives</span>
            <span className="task-section-count">{meta.objectives.length}</span>
          </div>
          <div className="task-list">
            {meta.objectives.length === 0 && <div className="empty-state">🎯 No objectives yet.</div>}
            {meta.objectives.map((o) => (
              <label key={o.id} className="task-list-item">
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
                    <span className="task-list-text">{o.text}</span>
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

        <div className="task-panel__section task-comments-card">
          <div className="task-section-title">
            <span>Comments</span>
            <span className="task-section-count">{meta.comments.length}</span>
          </div>
          <div className="comment-thread">
            {meta.comments.length === 0 && <div className="empty-state">💬 No comments yet.</div>}
            {meta.comments.map((c) => (
              <div key={c.id} className="comment-bubble">
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
                    <div className="comment-actions">
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
                    </div>
                  </>
                ) : (
                  <>
                    <span className="comment-text">{c.text}</span>
                    <div className="comment-actions">
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
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="task-comments-footer">
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
    </div>
  );

  if (typeof document === "undefined") return content;
  return createPortal(content, document.body);
}

const ObjectiveInput = ({ onAdd }) => {
  const [text, setText] = useState("");
  return (
    <div className="task-inline-input">
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
    <div className="task-inline-input">
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

const MetaBadge = ({ icon, label, value }) => (
  <div className="task-meta-badge">
    <span className="task-meta-icon">{icon}</span>
    <span className="task-meta-value">{value}</span>
    <span className="task-meta-label">{label}</span>
  </div>
);

const AttachmentGrid = ({ attachments, onRemove }) => {
  if (!attachments || attachments.length === 0) {
    return <div className="empty-state">📎 No files yet.</div>;
  }
  return (
    <div className="attachment-grid">
      <div className="attachment-grid__items">
        {attachments.map((a, idx) => (
          <div
            key={a.id || `${a.name}-${idx}`}
            className="attachment-card"
          >
            {a.dataUrl?.startsWith("data:image") && (
              <img
                src={a.dataUrl}
                alt={a.name}
                className="attachment-preview"
              />
            )}
            <div className="attachment-name">{a.name}</div>
            <div className="muted attachment-size">
              {Math.round(a.size / 1024)}kb
            </div>
            <button
              className="btn-ghost"
              style={{ position: "absolute", top: 6, right: 6 }}
              onClick={() => onRemove(a.id)}
            >
              ✕
            </button>
            <a
              href={a.dataUrl}
              download={a.name}
              className="attachment-download"
            >
              Download
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};
