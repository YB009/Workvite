import "../../App.css";

export default function CreateTaskPage() {
  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Create Task</h1>
      </div>
      <div className="content-surface">
        <form className="grid" style={{ gap: 16, maxWidth: 720 }}>
          <label className="form-field">
            <span>Title</span>
            <input type="text" placeholder="Design feedback on wireframe" />
          </label>
          <label className="form-field">
            <span>Description</span>
            <textarea placeholder="Add details for this task" rows={4} />
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label className="form-field" style={{ flex: 1 }}>
              <span>Priority</span>
              <select defaultValue="Medium">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label className="form-field" style={{ flex: 1 }}>
              <span>Due date</span>
              <input type="date" />
            </label>
          </div>
          <label className="form-field">
            <span>Project</span>
            <input type="text" placeholder="Choose project" />
          </label>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn-ghost">
              Cancel
            </button>
            <button type="button" className="btn-primary">
              Create task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
