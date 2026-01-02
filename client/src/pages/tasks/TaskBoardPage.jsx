import TaskColumn from "../../components/TaskColumn.jsx";
import "../../App.css";

const boardData = {
  Assigned: [
    { id: "a1", title: "Design feedback on wireframe", priority: "High", dueDate: "7 Oct", description: "Review comments from design review.", assignees: ["JP", "YA"], attachments: 2 },
    { id: "a2", title: "UI Iteration", priority: "Medium", dueDate: "7 Oct", description: "Polish CTA states.", assignees: ["MS"], attachments: 1 },
  ],
  Ongoing: [
    { id: "o1", title: "Tab bar on card", priority: "Hard", dueDate: "7 Oct", description: "Prototype tabbed interactions.", assignees: ["JP"], attachments: 0 },
  ],
  Pending: [],
  Done: [
    { id: "d1", title: "Moodboarding", priority: "Low", dueDate: "5 Oct", description: "Moodboard finalized.", assignees: ["MS"], attachments: 3 },
  ],
};

export default function TaskBoardPage() {
  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Task Board</h1>
        <div className="actions">
          <button className="btn-ghost">All Tasks</button>
          <button className="btn-primary">New Task</button>
        </div>
      </div>
      <div className="content-surface">
        <div className="board">
          {Object.entries(boardData).map(([title, tasks]) => (
            <TaskColumn key={title} title={title} tasks={tasks} />
          ))}
        </div>
      </div>
    </div>
  );
}
