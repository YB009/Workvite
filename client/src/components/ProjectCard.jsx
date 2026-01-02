import "./ProjectCard.css";

const statusColor = {
  OnTrack: "#22c55e",
  AtRisk: "#f59e0b",
  Delayed: "#ef4444",
};

export default function ProjectCard({ project }) {
  const { name, description, status = "OnTrack", progress = 0, stats = {}, tags = [] } = project;

  return (
    <div className="project-card">
      <div className="project-card__thumb" />
      <div className="project-card__body">
        <div className="project-card__header">
          <div>
            <p className="project-card__eyebrow">{project.dueLabel || "Updated"} • {project.date || "Today"}</p>
            <h3 className="project-card__title">{name}</h3>
          </div>
          <span className="project-card__status" style={{ color: statusColor[status] || "#10b981" }}>
            ● {status === "OnTrack" ? "On track" : status}
          </span>
        </div>
        <p className="project-card__desc">{description || "Soft card UI with light neutral background and muted copy."}</p>
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
