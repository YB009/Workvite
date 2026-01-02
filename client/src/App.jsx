import { useState } from "react";
import "./App.css";
import LoginPage from "./pages/auth/LoginPage.jsx";
import { useAuthContext } from "./context/AuthContext.jsx";
import ProjectListPage from "./pages/projects/ProjectListPage.jsx";
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage.jsx";
import CreateProjectPage from "./pages/projects/CreateProjectPage.jsx";
import TaskBoardPage from "./pages/tasks/TaskBoardPage.jsx";
import TaskDetailsPage from "./pages/tasks/TaskDetailsPage.jsx";
import CreateTaskPage from "./pages/tasks/CreateTaskPage.jsx";

const views = {
  projects: <ProjectListPage />,
  projectDetails: <ProjectDetailsPage />,
  createProject: <CreateProjectPage />,
  board: <TaskBoardPage />,
  taskDetails: <TaskDetailsPage />,
  createTask: <CreateTaskPage />,
};

function App() {
  const { firebaseUser, loading, logout } = useAuthContext();
  const [currentView, setCurrentView] = useState("projects");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#6b7280" }}>
        Loading auth...
      </div>
    );
  }

  if (!firebaseUser) {
    return <LoginPage />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h2>Dashhboard</h2>
        <div className="nav-group">
          <div className={`nav-item ${currentView === "projects" ? "active" : ""}`} onClick={() => setCurrentView("projects")}>Projects</div>
          <div className={`nav-item ${currentView === "projectDetails" ? "active" : ""}`} onClick={() => setCurrentView("projectDetails")}>Project Details</div>
          <div className={`nav-item ${currentView === "board" ? "active" : ""}`} onClick={() => setCurrentView("board")}>Task Board</div>
          <div className={`nav-item ${currentView === "taskDetails" ? "active" : ""}`} onClick={() => setCurrentView("taskDetails")}>Task Details</div>
          <div className={`nav-item ${currentView === "createProject" ? "active" : ""}`} onClick={() => setCurrentView("createProject")}>Create Project</div>
          <div className={`nav-item ${currentView === "createTask" ? "active" : ""}`} onClick={() => setCurrentView("createTask")}>Create Task</div>
          <div className="nav-item" onClick={logout}>Sign out</div>
        </div>
      </aside>
      <main className="main">
        {views[currentView]}
      </main>
    </div>
  );
}

export default App;
