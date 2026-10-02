import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { api, type Schedule } from "../api/api";

export default function Calendar() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    api.schedules
      .list()
      .then((result) => setSchedules(result.schedules))
      .catch(console.error);
  }, []);

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">TIME</span>
          <h1>Calendar</h1>
          <p>Your scheduled time blocks.</p>
        </div>
      </div>

      <div className="calendar-grid">
        {schedules.length === 0 ? (
          <div className="empty-state">
            <CalendarDays size={32} />
            <h3>No scheduled blocks</h3>
            <p>Create time blocks from Planner.</p>
          </div>
        ) : (
          schedules.map((item) => (
            <div className="calendar-event" key={item.id}>
              <strong>
                {item.task?.title || "Free Time"}
              </strong>

              <span>
                {new Date(
                  item.startTime
                ).toLocaleString()}
              </span>

              <span>
                {new Date(
                  item.endTime
                ).toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
