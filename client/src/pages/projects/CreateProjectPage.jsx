import "../../App.css";

export default function CreateProjectPage() {
  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Create Project</h1>
      </div>
      <div className="content-surface">
        <form className="grid" style={{ gap: 16, maxWidth: 720 }}>
          <label className="form-field">
            <span>Project name</span>
            <input type="text" placeholder="Sunstone App" />
          </label>
          <label className="form-field">
            <span>Description</span>
            <textarea placeholder="Short summary of this project" rows={4} />
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            <label className="form-field" style={{ flex: 1 }}>
              <span>Status</span>
              <select defaultValue="OnTrack">
                <option>OnTrack</option>
                <option>AtRisk</option>
                <option>Delayed</option>
              </select>
            </label>
            <label className="form-field" style={{ flex: 1 }}>
              <span>Due date</span>
              <input type="date" />
            </label>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" className="btn-ghost">
              Cancel
            </button>
            <button type="button" className="btn-primary">
              Create project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
