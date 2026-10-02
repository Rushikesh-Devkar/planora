import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { api, type Schedule, type Task } from "../api/api";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAYS_LONG = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dayKey(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = Array(first.getDay()).fill(null);

  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState<"year" | "month">("year");
  const [selected, setSelected] = useState(dayKey(today));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([api.schedules.list(), api.tasks.list()])
      .then(([s, t]) => {
        setSchedules(s.schedules);
        setTasks(t.tasks);
      })
      .catch(console.error);
  }, []);

  // har din ke liye: deadlines + time blocks
  const byDay = useMemo(() => {
    const map: Record<string, { tasks: Task[]; blocks: Schedule[] }> = {};
    const get = (k: string) => (map[k] ||= { tasks: [], blocks: [] });

    tasks.forEach((t) => {
      if (t.deadline) get(dayKey(new Date(t.deadline))).tasks.push(t);
    });
    schedules.forEach((s) => get(dayKey(new Date(s.startTime))).blocks.push(s));

    return map;
  }, [tasks, schedules]);

  const todayKey = dayKey(today);
  const selectedData = byDay[selected] || { tasks: [], blocks: [] };
  const selectedDate = new Date(selected + "T00:00:00");

  function shift(delta: number) {
    if (view === "year") {
      setYear((y) => y + delta);
      return;
    }
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelected(todayKey);
  }

  function renderMonth(m: number, large: boolean) {
    const cells = buildMonth(year, m);

    return (
      <div className={`cal-month ${large ? "large" : ""}`} key={m}>
        {!large && (
          <button
            className="cal-month-title"
            onClick={() => {
              setMonth(m);
              setView("month");
            }}
          >
            {MONTHS[m]}
          </button>
        )}

        <div className="cal-weekdays">
          {(large ? WEEKDAYS_LONG : WEEKDAYS).map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>

        <div className="cal-days">
          {cells.map((date, i) => {
            if (!date) return <span className="cal-cell empty" key={i} />;

            const key = dayKey(date);
            const data = byDay[key];
            const classes = ["cal-cell"];
            if (key === todayKey) classes.push("today");
            if (key === selected) classes.push("selected");
            if (data?.tasks.length) classes.push("has-task");
            if (data?.blocks.length) classes.push("has-block");

            return (
              <button
                key={i}
                className={classes.join(" ")}
                onClick={() => setSelected(key)}
              >
                <span>{date.getDate()}</span>
                {large && data && (
                  <small>
                    {data.tasks.length + data.blocks.length} item
                    {data.tasks.length + data.blocks.length > 1 ? "s" : ""}
                  </small>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">TIME</span>
          <h1>Calendar</h1>
          <p>Poore saal ka calendar, deadlines aur time blocks ke saath.</p>
        </div>
      </div>

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="icon-action" onClick={() => shift(-1)} aria-label="Previous">
            <ChevronLeft size={20} />
          </button>

          <h2>{view === "year" ? year : `${MONTHS[month]} ${year}`}</h2>

          <button className="icon-action" onClick={() => shift(1)} aria-label="Next">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="cal-controls">
          <button className="secondary-button" onClick={goToday}>
            Today
          </button>

          <div className="segmented">
            <button
              className={view === "year" ? "active" : ""}
              onClick={() => setView("year")}
            >
              Year
            </button>
            <button
              className={view === "month" ? "active" : ""}
              onClick={() => setView("month")}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="cal-legend">
        <span><i className="dot task" /> Task deadline</span>
        <span><i className="dot block" /> Time block</span>
        <span><i className="dot today" /> Aaj</span>
      </div>

      {view === "year" ? (
        <div className="cal-year-grid">
          {MONTHS.map((_, m) => renderMonth(m, false))}
        </div>
      ) : (
        renderMonth(month, true)
      )}

      <div className="panel cal-day-panel">
        <div className="panel-header">
          <div>
            <span className="eyebrow">SELECTED DAY</span>
            <h2>
              {selectedDate.toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>
        </div>

        {selectedData.tasks.length === 0 && selectedData.blocks.length === 0 ? (
          <div className="empty-state">
            <CalendarDays size={28} />
            <p>Is din koi deadline ya time block nahi hai.</p>
          </div>
        ) : (
          <div className="cal-day-list">
            {selectedData.tasks.map((t) => (
              <div className="cal-item" key={t.id}>
                <i className="dot task" />
                <div>
                  <strong
                    className={t.status === "COMPLETED" ? "task-completed" : ""}
                  >
                    {t.title}
                  </strong>
                  <span>
                    Deadline{" "}
                    {new Date(t.deadline as string).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {t.priority}
                    {t.status === "COMPLETED" ? " · Completed" : ""}
                  </span>
                </div>
              </div>
            ))}

            {selectedData.blocks.map((s) => (
              <div className="cal-item" key={s.id}>
                <i className="dot block" />
                <div>
                  <strong>{s.task?.title || "Free Time"}</strong>
                  <span>
                    {new Date(s.startTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {new Date(s.endTime).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
