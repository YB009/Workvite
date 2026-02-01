import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./ActivityItem.css";

const formatRelativeTime = (value) => {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  const diff = Date.now() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

const initialsFrom = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

export default function ActivityItem({ item }) {
  const navigate = useNavigate();
  const actorLabel = item.actor?.name || item.actor?.email || "Someone";
  const timestamp = useMemo(
    () => formatRelativeTime(item.createdAt),
    [item.createdAt]
  );
  const initials = initialsFrom(actorLabel);

  const goToProject = () => {
    if (item.project?.id) {
      navigate(`/projects/details?id=${item.project.id}`);
    }
  };

  const goToTask = () => {
    if (item.task?.id) {
      navigate(`/tasks/details?id=${item.task.id}`);
    }
  };

  return (
    <div className="activity-item">
      <div className="activity-item__avatar">{initials}</div>
      <div className="activity-item__content">
        <div className="activity-item__row">
          <p className="activity-item__message">
            <span className="activity-item__actor">{actorLabel}</span>
            <span className="activity-item__action">{item.message}</span>
          </p>
          <span className="activity-item__time">{timestamp}</span>
        </div>
        <div className="activity-item__meta">
          {item.project?.name && (
            <button className="activity-item__link" type="button" onClick={goToProject}>
              {item.project.name}
            </button>
          )}
          {item.task?.title && (
            <button className="activity-item__link" type="button" onClick={goToTask}>
              {item.task.title}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
