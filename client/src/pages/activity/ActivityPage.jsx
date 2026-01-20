import "./ActivityPage.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "../../api/axiosInstance";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { fetchActivity } from "../../api/activityApi";
import ActivityFilters from "../../components/activity/ActivityFilters.jsx";
import ActivityItem from "../../components/activity/ActivityItem.jsx";

export default function ActivityPage() {
  const { firebaseUser } = useAuthContext();
  const [projects, setProjects] = useState([]);
  const [activity, setActivity] = useState([]);
  const [filters, setFilters] = useState({ projectId: "", userId: "" });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const actors = useMemo(() => {
    const map = new Map();
    activity.forEach((item) => {
      if (item.actor?.id && !map.has(item.actor.id)) {
        map.set(item.actor.id, item.actor);
      }
    });
    return Array.from(map.values());
  }, [activity]);

  const loadProjects = useCallback(async () => {
    if (!firebaseUser) return;
    try {
      const headers = { Authorization: `Bearer ${await firebaseUser.getIdToken()}` };
      const orgRes = await axios.get("/api/orgs", { headers });
      const orgs = orgRes.data || [];
      if (!orgs.length) {
        setProjects([]);
        return;
      }
      const projectResults = await Promise.all(
        orgs.map((org) => axios.get(`/api/projects/org/${org.id}`, { headers }))
      );
      const allProjects = projectResults.flatMap((res) => res.data || []);
      setProjects(allProjects);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  }, [firebaseUser]);

  const loadActivity = useCallback(async ({
    nextPage = 1,
    append = false
  } = {}) => {
    if (!firebaseUser) return;
    try {
      append ? setLoadingMore(true) : setLoading(true);
      setError("");
      const token = await firebaseUser.getIdToken();
      const payload = await fetchActivity({
        token,
        filters,
        page: nextPage,
        pageSize: 20
      });
      const items = payload.items || [];
      setActivity((prev) => (append ? [...prev, ...items] : items));
      setHasMore(Boolean(payload.hasMore));
      setPage(nextPage);
    } catch (err) {
      console.error(err);
      setError("Couldn't load activity. Try again.");
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  }, [firebaseUser, filters]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    loadActivity({ nextPage: 1, append: false });
  }, [loadActivity]);

  const clearFilters = () => {
    setFilters({ projectId: "", userId: "" });
  };

  return (
    <div className="page-stack activity-page">
      <div className="toolbar activity-page__toolbar">
        <div>
          <h1>Activity</h1>
          <p className="muted">Read-only workspace audit trail across your team.</p>
        </div>
        <ActivityFilters
          projects={projects}
          users={actors}
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
        />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="content-surface">
        {loading && (
          <div className="activity-page__loading">
            <div className="spinner" />
            <p className="muted">Loading activity...</p>
          </div>
        )}

        {!loading && activity.length === 0 && (
          <div className="activity-page__empty">
            <h3>No activity yet</h3>
            <p className="muted">Create or update a task to see events appear here.</p>
          </div>
        )}

        {!loading && activity.length > 0 && (
          <div className="activity-page__list">
            {activity.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        )}

        {!loading && activity.length > 0 && (
          <div className="activity-page__footer">
            <button
              className="btn-ghost"
              type="button"
              onClick={() => loadActivity({ nextPage: page + 1, append: true })}
              disabled={!hasMore || loadingMore}
            >
              {loadingMore ? "Loading..." : hasMore ? "Load more" : "No more activity"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
