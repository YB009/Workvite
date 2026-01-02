import "./TaskColumn.css";
import TaskItem from "./TaskItem.jsx";
import EmptyState from "./EmptyState.jsx";

export default function TaskColumn({ title, tasks = [] }) {
  return (
    <div className="task-column">
      <div className="task-column__header">
        <h3>{title}</h3>
        <span className="task-column__count">{tasks.length}</span>
      </div>
      <div className="task-column__stack">
        {tasks.length === 0 && <EmptyState title="Nothing here" description="Drag tasks into this column." compact />}
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
