import TaskColumn from "../../components/TaskColumn.jsx";
import "../../App.css";

const sampleColumns = {
  Documentation: [
    {
      id: "t1",
      title: "Moodboard",
      description: "Collect UI moodboard samples.",
      priority: "Low",
      dueDate: "Oct 3",
      assignees: ["JP", "YA"],
      attachments: 3,
    },
  ],
  "To Do": [
    {
      id: "t2",
      title: "UI Iteration",
      description: "Revise wireframes with updated color system.",
      priority: "Medium",
      dueDate: "Oct 3",
      assignees: ["JP"],
      attachments: 1,
    },
  ],
  Ongoing: [
    {
      id: "t3",
      title: "Moodboard",
      description: "Finalize hero visuals for landing.",
      priority: "Low",
      dueDate: "Oct 6",
      assignees: ["YA", "MS"],
      attachments: 2,
    },
    {
      id: "t4",
      title: "UI Iteration",
      description: "Prototype animation for onboarding.",
      priority: "Medium",
      dueDate: "Oct 7",
      assignees: ["JP"],
      attachments: 1,
    },
  ],
  Done: [
    {
      id: "t5",
      title: "Documentation",
      description: "Add accessibility notes.",
      priority: "Low",
      dueDate: "Oct 1",
      assignees: ["JP"],
      attachments: 0,
    },
  ],
};

export default function ProjectDetailsPage() {
  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Project Details</h1>
        <div className="actions">
          <button className="btn-ghost">Kanban</button>
          <button className="btn-ghost">List</button>
          <button className="btn-ghost">Calendar</button>
          <button className="btn-primary">Add Board</button>
        </div>
      </div>
      <div className="content-surface">
        <div className="board">
          {Object.entries(sampleColumns).map(([title, tasks]) => (
            <TaskColumn key={title} title={title} tasks={tasks} />
          ))}
        </div>
      </div>
    </div>
  );
}
