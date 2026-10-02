import { useEffect, useRef, useState } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  Plus,
  Menu,
  Settings as SettingsIcon,
  CircleAlert,
  Clock,
  BellOff,
} from "lucide-react";
import { api, type Task } from "../api/api";
import { humanDuration } from "../lib/events";
import { initials, useProfile } from "../lib/profile";
import type { Page } from "../App";

interface Alert {
  id: string;
  title: string;
  text: string;
  overdue: boolean;
}

function buildAlerts(tasks: Task[]): Alert[] {
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;

  return tasks
    .filter(
      (t) =>
        t.deadline &&
        t.status !== "COMPLETED" &&
        t.status !== "CANCELLED"
    )
    .map((t) => ({ task: t, diff: new Date(t.deadline as string).getTime() - now }))
    .filter((x) => x.diff < DAY)
    .sort((a, b) => a.diff - b.diff)
    .map(({ task, diff }) => ({
      id: task.id,
      title: task.title,
      overdue: diff < 0,
      text:
        diff < 0
          ? `Deadline ko ${humanDuration(diff)} ho gaye`
          : `Deadline me ${humanDuration(diff)} bache hain`,
    }));
}

export default function Topbar({
  onCreateTask,
  onNavigate,
  onMenu,
}: {
  onCreateTask: () => void;
  onNavigate: (page: Page) => void;
  onMenu: () => void;
}) {
  const profile = useProfile();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState<"" | "notif" | "user">("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;

    const load = () =>
      api.tasks
        .list()
        .then((r) => alive && setAlerts(buildAlerts(r.tasks)))
        .catch(() => {});

    load();
    const timer = window.setInterval(load, 60000);
    window.addEventListener("planora:tasks-changed", load);

    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener("planora:tasks-changed", load);
    };
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen("");
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="topbar">
      <button className="menu-button" onClick={onMenu} aria-label="Open menu">
        <Menu size={22} />
      </button>

      <div className="search-box">
        <Search size={18} />
        <input type="text" placeholder="Search tasks, goals, schedules..." />
        <kbd>Ctrl K</kbd>
      </div>

      <div className="topbar-actions" ref={wrapRef}>
        <button className="topbar-add" onClick={onCreateTask}>
          <Plus size={17} />
          <span>Add Task</span>
        </button>

        <div className="dropdown-wrap">
          <button
            className="icon-button notification-button"
            onClick={() => setOpen(open === "notif" ? "" : "notif")}
            aria-label="Notifications"
          >
            <Bell size={20} />
            {alerts.length > 0 && (
              <span className="notification-count">
                {alerts.length > 9 ? "9+" : alerts.length}
              </span>
            )}
          </button>

          {open === "notif" && (
            <div className="dropdown notif-dropdown">
              <div className="dropdown-title">Notifications</div>

              {alerts.length === 0 ? (
                <div className="dropdown-empty">
                  <BellOff size={26} />
                  <span>Sab clear hai! Koi pending alert nahi.</span>
                </div>
              ) : (
                <div className="notif-list">
                  {alerts.map((a) => (
                    <button
                      key={a.id}
                      className="notif-item"
                      onClick={() => {
                        setOpen("");
                        onNavigate("Tasks");
                      }}
                    >
                      <span className={`notif-icon ${a.overdue ? "red" : "amber"}`}>
                        {a.overdue ? <CircleAlert size={16} /> : <Clock size={16} />}
                      </span>
                      <span className="notif-text">
                        <strong>{a.title}</strong>
                        <small>{a.text}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="dropdown-wrap">
          <button
            className="user-button"
            onClick={() => setOpen(open === "user" ? "" : "user")}
            aria-label="Account"
          >
            <div className="user-avatar">{initials(profile.name)}</div>
            <ChevronDown size={16} />
          </button>

          {open === "user" && (
            <div className="dropdown user-dropdown">
              <div className="user-dropdown-head">
                <div className="user-avatar big">{initials(profile.name)}</div>
                <div>
                  <strong>{profile.name}</strong>
                  <small>{profile.email}</small>
                </div>
              </div>

              <button
                className="dropdown-item"
                onClick={() => {
                  setOpen("");
                  onNavigate("Settings");
                }}
              >
                <SettingsIcon size={17} />
                Account & Settings
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setOpen("");
                  onCreateTask();
                }}
              >
                <Plus size={17} />
                Create Task
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
