import "./App.css";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import OAuthSuccessPage from "./pages/auth/OAuthSuccessPage.jsx";
import AcceptInvitePage from "./pages/invite/AcceptInvitePage.jsx";
import { useAuthContext } from "./context/AuthContext.jsx";
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import AppLayout from "./components/Layout/AppLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DashboardAnimated from "./pages/Dashboard-animated.jsx";
import ProjectListPage from "./pages/projects/ProjectListPage.jsx";
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage.jsx";
import CreateProjectPage from "./pages/projects/CreateProjectPage.jsx";
import EditProjectPage from "./pages/projects/EditProjectPage.jsx";
import TaskBoardPage from "./pages/tasks/TaskBoardPage.jsx";
import TaskDetailsPage from "./pages/tasks/TaskDetailsPage.jsx";
import CreateTaskPage from "./pages/tasks/CreateTaskPage.jsx";
import MyTask from "./pages/MyTask.jsx";
import ActivityPage from "./pages/activity/ActivityPage.jsx";
import TeamPage from "./pages/team/TeamPage.jsx";
import SettingsPage from "./pages/settings/SettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import OrganizationOnboardingPage from "./pages/onboarding/OrganizationOnboardingPage.jsx";

function App() {
  const { firebaseUser, loading, hasOrganization, bootstrapped } = useAuthContext();
  const location = useLocation();

  const ProtectedRoute = () => {
    if (loading || !bootstrapped) {
      return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#6b7280" }}>Loading auth...</div>;
    }
    if (!firebaseUser) return <Navigate to="/login" replace />;
    return <Outlet />;
  };

  const OrgGuard = () => {
    if (loading || !bootstrapped) {
      return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#6b7280" }}>Loading workspace...</div>;
    }
    if (!hasOrganization) return <Navigate to="/onboarding/organization" replace />;
    return <AppLayout />;
  };

  const OnboardingGuard = () => {
    if (loading || !bootstrapped) {
      return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "#6b7280" }}>Loading...</div>;
    }
    if (!firebaseUser) return <Navigate to="/login" replace />;
    if (hasOrganization) return <Navigate to="/dashboard" replace />;
    return <OrganizationOnboardingPage />;
  };

  const AcceptInviteGuard = ({ children }) => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token") || localStorage.getItem("ttm_invite_token");
    if (!token) {
      return <Navigate to={firebaseUser ? "/dashboard" : "/login"} replace />;
    }
    return children;
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/oauth/success" element={<OAuthSuccessPage />} />
      <Route
        path="/invite/accept"
        element={
          <AcceptInviteGuard>
            <AcceptInvitePage />
          </AcceptInviteGuard>
        }
      />

      <Route
        element={<ProtectedRoute />}
      >
        <Route path="/onboarding/organization" element={<OnboardingGuard />} />

        <Route path="/" element={<OrgGuard />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dashboard-animated" element={<DashboardAnimated />} />
          <Route path="projects" element={<ProjectListPage />} />
          <Route path="projects/list" element={<ProjectListPage />} />
          <Route path="projects/details" element={<ProjectDetailsPage />} />
          <Route path="projects/create" element={<CreateProjectPage />} />
          <Route path="projects/edit" element={<EditProjectPage />} />
          <Route path="tasks" element={<TaskBoardPage />} />
          <Route path="tasks/list" element={<MyTask />} />
          <Route path="tasks/details" element={<TaskDetailsPage />} />
          <Route path="tasks/create" element={<CreateTaskPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile/:userId" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
