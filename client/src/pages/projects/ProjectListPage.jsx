import ProjectCard from "../../components/ProjectCard.jsx";
import "../../App.css";

const demoProjects = [
  {
    id: "p1",
    name: "Sunstone App",
    description: "Design feedback loop and handoff tasks.",
    status: "OnTrack",
    progress: 80,
    stats: { tasks: 12, team: 6, files: 10 },
    tags: ["Product", "Mobile"],
    date: "Oct 26, 2021",
    dueLabel: "Started",
  },
  {
    id: "p2",
    name: "Kobil Website",
    description: "Marketing site redesign sprint.",
    status: "AtRisk",
    progress: 50,
    stats: { tasks: 9, team: 4, files: 6 },
    tags: ["Web", "Brand"],
    date: "Oct 20, 2021",
    dueLabel: "Updated",
  },
  {
    id: "p3",
    name: "SWYFT Dashboard",
    description: "New reporting widgets and alerts.",
    status: "OnTrack",
    progress: 64,
    stats: { tasks: 15, team: 5, files: 8 },
    tags: ["Dashboard", "Analytics"],
    date: "Oct 18, 2021",
    dueLabel: "Updated",
  },
];

export default function ProjectListPage() {
  return (
    <div className="page-stack">
      <div className="toolbar">
        <h1>Projects</h1>
        <div className="actions">
          <button className="btn-ghost">Filter</button>
          <button className="btn-primary">New Project</button>
        </div>
      </div>
      <div className="content-surface">
        <div className="grid projects">
          {demoProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
