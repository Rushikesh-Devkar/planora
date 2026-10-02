import { useEffect, useState } from "react";
import { api, type DashboardStats, type Task } from "../api/api";
import { useProfile } from "../lib/profile";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const profile = useProfile();
  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [dashboard, taskResult] =
        await Promise.all([
          api.dashboard(),
          api.tasks.list(),
        ]);

      setStats(dashboard.stats);
      setTasks(taskResult.tasks);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <section className="page-container">
        Loading Planora...
      </section>
    );
  }

  return (
    <section className="page-container">
      <div className="welcome-section">
        <div>
          <span className="eyebrow">PERSONAL WORKSPACE</span>
          <h1>{greeting()}, {profile.name}.</h1>
          <p>
            Plan your time. Focus on what matters.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Tasks</span>
          <strong>{stats?.total || 0}</strong>
        </div>

        <div className="stat-card">
          <span>Completed</span>
          <strong>{stats?.completed || 0}</strong>
        </div>

        <div className="stat-card">
          <span>In Progress</span>
          <strong>{stats?.inProgress || 0}</strong>
        </div>

        <div className="stat-card">
          <span>Completion</span>
          <strong>
            {stats?.completionRate || 0}%
          </strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">TODAY</span>
              <h2>Today's Tasks</h2>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state">
              No tasks yet. Create your first task.
            </div>
          ) : (
            tasks.slice(0, 6).map((task) => (
              <div
                className="dashboard-task"
                key={task.id}
              >
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.priority}</span>
                </div>

                <span
                  className={
                    task.status === "COMPLETED"
                      ? "status-complete"
                      : "status-pending"
                  }
                >
                  {task.status}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">PROGRESS</span>
              <h2>Daily Progress</h2>
            </div>
          </div>

          <div className="dashboard-progress">
            <strong>
              {stats?.completionRate || 0}%
            </strong>

            <span>
              {stats?.completed || 0} of{" "}
              {stats?.total || 0} tasks completed
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
