import { Fragment, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isTaskOverdue } from "../utils/taskUtils.js";

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const lanes = ["Not Started", "In Progress", "Completed"];

const normalizeStatus = (status = "") => {
  const s = status.toLowerCase();
  if (["done", "completed", "complete", "closed"].includes(s)) return "Completed";
  if (["in progress", "ongoing", "progress"].includes(s)) return "In Progress";
  return "Not Started";
};

export default function ProjectCalendarView({ tasks = [], onTaskClick }) {
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const dim = daysInMonth(year, month);

  const items = useMemo(() => {
    return tasks
      .map((t) => {
        const dateStr = t.dueDate || t.updatedAt;
        const when = dateStr ? new Date(dateStr) : null;
        return {
          ...t,
          statusLabel: normalizeStatus(t.status),
          date: when
        };
      })
      .filter((t) => t.date && t.date.getMonth() === month && t.date.getFullYear() === year);
  }, [tasks, month, year]);

  const dayCells = useMemo(() => Array.from({ length: dim }, (_, i) => i + 1), [dim]);

  const changeMonth = (delta) => {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  };

  return (
    <div className="content-surface" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button className="btn-ghost" onClick={() => changeMonth(-1)}>← Prev</button>
        <div style={{ fontWeight: 700, color: "#0f172a" }}>{monthNames[month]} {year}</div>
        <button className="btn-ghost" onClick={() => changeMonth(1)}>Next →</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "80px repeat(7, 1fr)", gap: 10, alignItems: "start" }}>
        <div />
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} style={{ textAlign: "center", color: "#6b7280", fontWeight: 700 }}>{d}</div>
        ))}

        {lanes.map((lane) => (
          <Fragment key={lane}>
            <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", color: "#6b7280", fontWeight: 700, textAlign: "center" }}>
              {lane}
            </div>
            {dayCells.map((day) => {
              const list = items.filter((t) => t.statusLabel === lane && t.date.getDate() === day);
              return (
                <div
                  key={`${lane}-${day}`}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    minHeight: 70,
                    background: "#fff",
                    padding: "6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    transition: "box-shadow 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (list.length) e.currentTarget.style.boxShadow = "0 10px 30px rgba(15,23,42,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  title={list.length ? `${list.length} task(s)` : "No tasks"}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>{day}</div>
                  {list.length === 0 && (
                    <span style={{ color: "#9ca3af", fontSize: 12 }}>No task</span>
                  )}
                  {list.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => (onTaskClick ? onTaskClick(t) : navigate(`/tasks/details?id=${t.id}`))}
                      style={{
                        background: isTaskOverdue(t) ? "#fee2e2" : "#eef2ff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: "6px 8px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: isTaskOverdue(t) ? "#991b1b" : "#0f172a",
                        cursor: "pointer"
                      }}
                    >
                      {t.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
