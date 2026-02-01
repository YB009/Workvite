import { isTaskOverdue } from "../utils/taskUtils.js";

const badgeColor = {
  "Not Started": "#fca5a5",
  "In Progress": "#facc15",
  Completed: "#22c55e"
};

const normalizeStatus = (status = "") => {
  const s = status.toLowerCase();
  if (["done", "completed", "complete", "closed"].includes(s)) return "Completed";
  if (["in progress", "ongoing", "progress"].includes(s)) return "In Progress";
  return "Not Started";
};


export default function ProjectListView({ tasks = [], onTaskClick }) {
  const rows = tasks.map((t) => ({
    ...t,
    statusLabel: normalizeStatus(t.status),
    priority: t.priority || "medium",
    due: t.dueDate || t.updatedAt?.slice(0, 10) || "—"
  }));

  return (
    <div className="content-surface">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", color: "#6b7280" }}>
            <th style={{ padding: "10px" }}>Task</th>
            <th style={{ padding: "10px" }}>Status</th>
            <th style={{ padding: "10px" }}>Priority</th>
            <th style={{ padding: "10px" }}>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr
              key={t.id}
              style={{
                borderTop: "1px solid #e5e7eb",
                cursor: onTaskClick ? "pointer" : "default",
                background: isTaskOverdue(t) ? "#fff1f2" : "transparent"
              }}
              onClick={() => onTaskClick && onTaskClick(t)}
            >
              <td style={{ padding: "10px" }}>{t.title}</td>
              <td style={{ padding: "10px" }}>
                <span
                  style={{
                    background: `${badgeColor[t.statusLabel]}20`,
                    color: badgeColor[t.statusLabel],
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontWeight: 700
                  }}
                >
                  {t.statusLabel}
                </span>
              </td>
              <td style={{ padding: "10px", textTransform: "capitalize" }}>{t.priority}</td>
              <td style={{ padding: "10px" }}>{t.due}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} style={{ padding: "14px", color: "#6b7280" }}>No tasks yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
