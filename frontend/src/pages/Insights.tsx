import { useEffect, useState } from "react";
import { api, type DashboardStats } from "../api/api";

export default function Insights() {
  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  useEffect(() => {
    api.dashboard()
      .then((result) => setStats(result.stats))
      .catch(console.error);
  }, []);

  if (!stats) {
    return (
      <section className="page-container">
        Loading insights...
      </section>
    );
  }

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ANALYTICS</span>
          <h1>Insights</h1>
          <p>Your current execution metrics.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Tasks</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="stat-card">
          <span>Completed</span>
          <strong>{stats.completed}</strong>
        </div>

        <div className="stat-card">
          <span>In Progress</span>
          <strong>{stats.inProgress}</strong>
        </div>

        <div className="stat-card">
          <span>Overdue</span>
          <strong>{stats.overdue}</strong>
        </div>
      </div>

      <div className="panel insight-panel">
        <h3>Completion Rate</h3>

        <div className="large-progress">
          <div
            className="large-progress-fill"
            style={{
              width: `${stats.completionRate}%`,
            }}
          />

        </div>

        <strong>{stats.completionRate}%</strong>
      </div>
    </section>
  );
}
