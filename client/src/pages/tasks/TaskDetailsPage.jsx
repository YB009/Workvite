import "../../App.css";
import TaskItem from "../../components/TaskItem.jsx";

const task = {
  id: "td1",
  title: "Design feedback on wireframe",
  description: "Collect reviewer notes and iterate on onboarding screens.",
  priority: "Medium",
  dueDate: "7 Oct",
  assignees: ["JP", "YA"],
  attachments: 3,
};

export default function TaskDetailsPage() {
  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Task Details</h1>
        <div className="actions">
          <button className="btn-ghost">Share</button>
          <button className="btn-primary">Edit Task</button>
        </div>
      </div>
      <div className="content-surface" style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 320px" }}>
        <div>
          <TaskItem task={task} />
          <div style={{ marginTop: 12 }}>
            <p className="muted">
              Description<br />
              Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis enim velit mollit.
            </p>
          </div>
        </div>
        <div className="content-surface" style={{ border: "1px dashed #e5e7eb" }}>
          <p className="muted" style={{ margin: 0 }}>Attachment panel & comments placeholder.</p>
        </div>
      </div>
    </div>
  );
}
