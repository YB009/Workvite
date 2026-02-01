import "./ActivityFilters.css";

export default function ActivityFilters({
  projects,
  users,
  filters,
  onChange,
  onClear
}) {
  const hasFilters = filters.projectId || filters.userId;

  return (
    <div className="activity-filters">
      <label className="activity-filters__field">
        <span>Project</span>
        <select
          value={filters.projectId}
          onChange={(event) => onChange({ ...filters, projectId: event.target.value })}
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>
      <label className="activity-filters__field">
        <span>User</span>
        <select
          value={filters.userId}
          onChange={(event) => onChange({ ...filters, userId: event.target.value })}
        >
          <option value="">All users</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name || user.email}
            </option>
          ))}
        </select>
      </label>
      <button className="btn-ghost" type="button" onClick={onClear} disabled={!hasFilters}>
        Clear filters
      </button>
    </div>
  );
}
