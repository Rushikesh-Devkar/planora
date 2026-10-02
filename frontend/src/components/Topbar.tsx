import { Search, Bell, ChevronDown, Plus } from "lucide-react";

export default function Topbar({
  onCreateTask,
}: {
  onCreateTask: () => void;
}) {
  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={18} />
        <input
          type="text"
          placeholder="Search tasks, goals, schedules..."
        />
        <kbd>Ctrl K</kbd>
      </div>

      <div className="topbar-actions">
        <button
          className="topbar-add"
          onClick={onCreateTask}
        >
          <Plus size={17} />
          Add Task
        </button>

        <button className="icon-button notification-button">
          <Bell size={20} />
          <span className="notification-dot" />
        </button>

        <button className="user-button">
          <div className="user-avatar">RD</div>
          <ChevronDown size={16} />
        </button>
      </div>
    </header>
  );
}
