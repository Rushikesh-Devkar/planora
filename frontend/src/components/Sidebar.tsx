import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Target,
  BarChart3,
  Settings,
  Clock3,
  Plus,
} from "lucide-react";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Planner", icon: Clock3 },
  { label: "Tasks", icon: CheckSquare },
  { label: "Calendar", icon: CalendarDays },
  { label: "Goals", icon: Target },
  { label: "Insights", icon: BarChart3 },
];

export default function Sidebar({
  activePage,
  onNavigate,
  onCreateTask,
}: any) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">P</div>
        <div>
          <h1>Planora</h1>
          <span>Plan. Focus. Execute.</span>
        </div>
      </div>

      <button
        className="create-button"
        onClick={onCreateTask}
      >
        <Plus size={18} />
        <span>Create Task</span>
      </button>

      <nav className="sidebar-nav">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`nav-item ${
                activePage === item.label ? "active" : ""
              }`}
              onClick={() => onNavigate(item.label)}
            >
              <Icon size={19} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <button
          className={`nav-item ${
            activePage === "Settings" ? "active" : ""
          }`}
          onClick={() => onNavigate("Settings")}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <div className="profile-card">
          <div className="profile-avatar">RD</div>

          <div className="profile-info">
            <strong>Rushikesh</strong>
            <span>Personal Plan</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
