import "./Dashboard.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../api/axiosInstance";
import { loginWithFirebase } from "../api/authApi";
import { useAuthContext } from "../context/AuthContext.jsx";
import { useProfile } from "../context/ProfileContext.jsx";
import {
  Search,
  FolderKanban,
  ListChecks,
  CheckCircle2,
  Clock3,
  UserRound,
  Bell,
  ArrowUpRight,
  RefreshCw
} from "lucide-react";

const isTaskComplete = (status = "") => {
  const normalized = status.toLowerCase();
  return ["done", "completed", "complete", "closed"].includes(normalized);
};

const formatRelativeTime = (value) => {
  if (!value) return "just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "just now";
  const diff = Date.now() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
};

export default function Dashboard() {
  const { firebaseUser, user, activeOrganization } = useAuthContext();
  const { openProfile } = useProfile();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [teamCount, setTeamCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [hasRetriedAuth, setHasRetriedAuth] = useState(false);
  const inflightRef = useRef(false);
  const lastOrgRef = useRef("");
  const searchDebounceRef = useRef(null);

  const loadDashboard = useCallback(async () => {
    if (!firebaseUser || inflightRef.current) return;
    inflightRef.current = true;
    const nextOrgId = activeOrganization?.id || "";
    const orgChanged = lastOrgRef.current !== nextOrgId;
    if (orgChanged || (!projects.length && !tasks.length)) {
      setLoading(true);
    }
    setIsFetching(true);
    setError("");

    try {
      const authHeader = {
        Authorization: `Bearer ${await firebaseUser.getIdToken()}`
      };

      if (!activeOrganization) {
        setProjects([]);
        setTasks([]);
        setTeamCount(0);
        setLastUpdated(Date.now());
        lastOrgRef.current = "";
        return;
      }

      const [projectRes, taskRes, teamRes] = await Promise.all([
        axios.get(`/api/projects/org/${activeOrganization.id}`, { headers: authHeader }),
        axios.get(`/api/tasks/org/${activeOrganization.id}`, { headers: authHeader }),
        axios.get(`/api/team/members`, { headers: authHeader, params: { orgId: activeOrganization.id } })
      ]);

      setProjects(projectRes.data || []);
      setTasks(taskRes.data || []);
      const teamItems = teamRes.data?.items || [];
      setTeamCount(teamItems.filter((member) => !member.isInvite).length);
      setLastUpdated(Date.now());
      lastOrgRef.current = activeOrganization.id;
    } catch (err) {
      console.error("Dashboard load failed", err);

      // If auth is stale or user not synced in DB, attempt a one-time backend sync then retry
      const status = err?.response?.status;
      if (!hasRetriedAuth && firebaseUser && (status === 401 || status === 403 || status === 404)) {
        try {
          setHasRetriedAuth(true);
          const freshIdToken = await firebaseUser.getIdToken(true);
          await loginWithFirebase(freshIdToken); // ensures user exists in backend
          await loadDashboard();
          return;
        } catch (syncErr) {
          console.error("Retry after auth sync failed", syncErr);
        }
      }

      setError("Couldn't load dashboard data. Try refreshing.");
    } finally {
      setLoading(false);
      setIsFetching(false);
      inflightRef.current = false;
    }
  }, [firebaseUser, hasRetriedAuth, activeOrganization]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Keep search in sync with URL (for header search)
  const searchString = searchParams.toString();

  useEffect(() => {
    const current = searchParams.get("q") || "";
    if (current !== searchQuery) {
      setSearchQuery(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchString]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery]);

  const activeTasks = useMemo(
    () => tasks.filter((t) => !isTaskComplete(t.status)),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((t) => isTaskComplete(t.status)),
    [tasks]
  );

  const searchResults = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    const pool = [
      ...tasks.map((t) => ({
        id: `task-${t.id}`,
        type: "Task",
        title: t.title,
        subtitle: t.project?.name || "Task",
        meta: isTaskComplete(t.status) ? "Completed" : "Active",
        timestamp: t.updatedAt || t.createdAt
      })),
      ...projects.map((p) => ({
        id: `project-${p.id}`,
        type: "Project",
        title: p.name,
        subtitle: p.description || "Project",
        meta: `${p.tasks?.length || 0} tasks`,
        timestamp: p.updatedAt || p.createdAt
      }))
    ];

    if (!term) {
      return pool.slice(0, 6);
    }

    return pool
      .filter((item) =>
        [item.title, item.subtitle, item.meta]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(term))
      )
      .slice(0, 8);
  }, [projects, debouncedQuery, tasks, user]);

  const activityFeed = useMemo(() => {
    const events = [];

    tasks.forEach((t) => {
      events.push({
        id: `task-activity-${t.id}`,
        label: isTaskComplete(t.status) ? "Task completed" : "Task updated",
        title: t.title,
        meta: t.project?.name || "Task",
        timestamp: t.updatedAt || t.createdAt
      });
    });

    projects.forEach((p) => {
      events.push({
        id: `project-activity-${p.id}`,
        label: "Project activity",
        title: p.name,
        meta: p.description || "Project updated",
        timestamp: p.updatedAt || p.createdAt
      });
    });

    return events
      .sort(
        (a, b) =>
          new Date(b.timestamp || 0).getTime() -
          new Date(a.timestamp || 0).getTime()
      )
      .slice(0, 7);
  }, [projects, tasks]);

  const displayName =
    user?.name ||
    firebaseUser?.displayName ||
    user?.email ||
    firebaseUser?.email ||
    "there";

  const skeletonItems = useMemo(() => Array.from({ length: 3 }, (_, i) => i), []);
  const showSkeleton = loading && !activeOrganization && projects.length === 0 && tasks.length === 0;
  const orgLabel = activeOrganization?.name || (loading ? "Loading workspace..." : "Workspace");

  return (
    <div className="page-stack dashboard-page">
      <div className={`content-surface dashboard-hero hover-lift ${showSkeleton ? "is-loading" : ""}`}>
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1 className="hero-heading">Hi {displayName}, your work at a glance</h1>
          <p className="muted">
            Everything from your workspace pulled straight from the API - projects,
            tasks, and activity without mock data.
          </p>
          <div className={`pill slim ${activeOrganization ? "" : "muted"}`}>{orgLabel}</div>
        </div>
        <div className="hero-meta">
          <div className="meta-card">
            <Clock3 size={16} />
            <span>
              {isFetching ? "Loading..." : `Refreshed ${lastUpdated ? formatRelativeTime(lastUpdated) : "just now"}`}
            </span>
          </div>
          <button className="btn-ghost refresh-btn" onClick={loadDashboard}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      <div className={`grid stats-grid ${showSkeleton ? "is-loading" : ""}`}>
        <div className="stat-card hover-lift">
          <div className="stat-card__icon projects">
            <FolderKanban size={18} />
          </div>
          <div>
            <p className="stat-card__label">Total projects</p>
            <p className="stat-card__value">{showSkeleton ? <span className="skeleton-line" /> : projects.length}</p>
          </div>
        </div>
        <div className="stat-card hover-lift">
          <div className="stat-card__icon active">
            <ListChecks size={18} />
          </div>
          <div>
            <p className="stat-card__label">Active tasks</p>
            <p className="stat-card__value">{showSkeleton ? <span className="skeleton-line" /> : activeTasks.length}</p>
          </div>
        </div>
        <div className="stat-card hover-lift">
          <div className="stat-card__icon completed">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <p className="stat-card__label">Completed tasks</p>
            <p className="stat-card__value">{showSkeleton ? <span className="skeleton-line" /> : completedTasks.length}</p>
          </div>
        </div>
        <div className="stat-card hover-lift">
          <div className="stat-card__icon users">
            <UserRound size={18} />
          </div>
          <div>
            <p className="stat-card__label">People in view</p>
              <p className="stat-card__value">{showSkeleton ? <span className="skeleton-line" /> : teamCount}</p>
          </div>
        </div>
      </div>

      <div className="grid two-col dashboard-body">
        <div className={`content-surface search-panel ${showSkeleton ? "is-loading" : ""}`}>
          <div className="section-title">
            <div>
              <p className="eyebrow">Search</p>
              <h3>Search tasks, projects, and users</h3>
            </div>
            <div className="search-meta">
              <span className="chip">Tasks {tasks.length}</span>
              <span className="chip">Projects {projects.length}</span>
            </div>
          </div>

          <div className="search-input">
            <Search size={18} />
            <input
              id="dashboard-search"
              name="dashboard-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search by title, description, or status"
            />
            {searchQuery && (
              <button className="clear-btn" onClick={() => setSearchQuery("")}>
                Clear
              </button>
            )}
          </div>

          <div className="search-results">
            {showSkeleton && (
              <div className="skeleton-stack">
                {skeletonItems.map((i) => (
                  <div key={`search-skel-${i}`} className="skeleton-card" />
                ))}
              </div>
            )}
            {error && <div className="error-banner">{error}</div>}
            {!loading && !error && searchResults.length === 0 && (
              <div className="muted small">Nothing matched that search.</div>
            )}

            {!loading &&
              !error &&
              searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="result-card hover-lift"
                  onClick={() => {
                    if (item.type === "User" && item.userId) {
                      openProfile(item.userId, "readonly");
                    }
                  }}
                >
                  <div className="result-type">{item.type}</div>
                  <div>
                    <p className="result-title">{item.title}</p>
                    <p className="result-subtitle">{item.subtitle}</p>
                    <p className="result-meta">
                      {item.meta} - {formatRelativeTime(item.timestamp)}
                    </p>
                  </div>
                  <ArrowUpRight size={16} />
                </button>
              ))}
          </div>
        </div>

        <div className={`content-surface activity-panel ${showSkeleton ? "is-loading" : ""}`}>
          <div className="section-title">
            <div>
              <p className="eyebrow">Activity</p>
              <h3>Recent actions</h3>
            </div>
            <div className="chip tone">Live</div>
          </div>

          {showSkeleton && (
            <div className="skeleton-stack">
              {skeletonItems.map((i) => (
                <div key={`activity-skel-${i}`} className="skeleton-card" />
              ))}
            </div>
          )}
          {error && <div className="error-banner">{error}</div>}

          {!loading && !error && activityFeed.length === 0 && (
            <div className="muted small">No activity yet. Create a project or task to see updates.</div>
          )}

          <div className="activity-list">
            {!loading &&
              !error &&
              activityFeed.map((a) => (
                <div key={a.id} className="activity-card hover-lift">
                  <div className="activity-icon">
                    <Bell size={16} />
                  </div>
                  <div>
                    <p className="activity-title">{a.title}</p>
                    <p className="activity-meta">
                      {a.label} - {a.meta}
                    </p>
                    <p className="activity-desc">{formatRelativeTime(a.timestamp)}</p>
                  </div>
                  <div className="activity-more">
                    <Clock3 size={14} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}


