import { useMemo, useState } from "react";
import TaskColumn from "./TaskColumn.jsx";
import TaskCard from "./tasks/TaskCard.jsx";

const normalizeStatus = (status = "") => {
  const s = status.toLowerCase();
  if (["done", "completed", "complete", "closed"].includes(s)) return "Completed";
  if (["in progress", "ongoing", "progress"].includes(s)) return "In Progress";
  return "Not Started";
};

export default function ProjectKanbanView({ tasks = [], onStatusChange, onTaskClick }) {
  const buckets = useMemo(() => {
    const grouped = { "Not Started": [], "In Progress": [], Completed: [] };
    tasks.forEach((t) => {
      grouped[normalizeStatus(t.status)].push(t);
    });
    return grouped;
  }, [tasks]);

  const [dragging, setDragging] = useState(null);

  const onDragStart = (task, from) => {
    setDragging({ task, from });
  };

  const onDrop = (to) => {
    if (!dragging) return;
    if (to === dragging.from) {
      setDragging(null);
      return;
    }
    onStatusChange?.(dragging.task.id, to);
    setDragging(null);
  };

  return (
    <div className="board">
      {Object.entries(buckets).map(([title, list]) => (
        <TaskColumn
          key={title}
          title={title}
          tasks={list}
          onDragStart={onDragStart}
          onDrop={() => onDrop(title)}
        >
          {list.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={() => onDragStart(task, title)}
            >
              <TaskCard task={task} onClick={() => onTaskClick && onTaskClick(task)} />
            </div>
          ))}
        </TaskColumn>
      ))}
    </div>
  );
}
