import "./EmptyState.css";

export default function EmptyState({ title = "No data", description = "Nothing to show yet.", compact = false }) {
  return (
    <div className={`empty-state ${compact ? "empty-state--compact" : ""}`}>
      <div className="empty-state__icon">◎</div>
      <div>
        <p className="empty-state__title">{title}</p>
        <p className="empty-state__desc">{description}</p>
      </div>
    </div>
  );
}
