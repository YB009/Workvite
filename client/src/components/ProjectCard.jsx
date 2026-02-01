import "./ProjectCard.css";

const statusColor = {
  Active: "#22c55e",
  Delayed: "#ef4444",
  Completed: "#6366f1",
};

const normalizeStatus = (status = "") => {
  const s = status.toLowerCase();
  if (["completed", "done", "complete"].includes(s)) return "Completed";
  if (["delayed", "at risk", "atrisk"].includes(s)) return "Delayed";
  return "Active";
};

export default function ProjectCard({ project, onSelect }) {
  const {
    name,
    description,
    status = "Active",
    progress = 0,
    stats = {},
    tags = [],
    coverImage,
  } = project;

  const statusLabel = normalizeStatus(status);

  return (
    <div className="project-card" onClick={onSelect} role="button" tabIndex={0}>
      <div
        className="project-card__thumb"
        style={{
          background: coverImage
            ? `center/cover no-repeat url(${coverImage})`
            : "linear-gradient(135deg, #fef3c7, #e0f2fe)",
        }}
      />
      <div className="project-card__body">
        <div className="project-card__header">
          <div>
            <p className="project-card__eyebrow">
              {project.dueLabel || "Updated"} • {project.date || "Today"}
            </p>
            <h3 className="project-card__title">{name}</h3>
          </div>
          <span
            className="project-card__status"
            style={{ color: statusColor[statusLabel] || "#10b981" }}
          >
            ● {statusLabel}
          </span>
        </div>
        <p className="project-card__desc">
          {description || "Soft card UI with light neutral background and muted copy."}
        </p>
        <div className="project-card__meta">
          <div className="project-card__tags">
            {tags.map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>
          <div className="project-card__stats">
            <div className="stat">
              <span className="stat__label">Tasks</span>
              <span className="stat__value">{stats.tasks ?? 0}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Team</span>
              <span className="stat__value">{stats.team ?? 0}</span>
            </div>
            <div className="stat">
              <span className="stat__label">Files</span>
              <span className="stat__value">{stats.files ?? 0}</span>
            </div>
          </div>
        </div>
        <div className="project-card__progress">
          <div className="project-card__progress-bar">
            <span style={{ width: `${progress}%` }} />
          </div>
          <span className="project-card__progress-label">{progress}%</span>
        </div>
      </div>
    </div>
  );
}
