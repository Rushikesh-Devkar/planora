import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Planner from "./pages/Planner";
import Calendar from "./pages/Calendar";
import Goals from "./pages/Goals";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import CreateTaskModal from "./components/CreateTaskModal";
import { useToast } from "./components/Toast";
import { tasksChanged } from "./lib/events";

export type Page =
  | "Dashboard"
  | "Planner"
  | "Tasks"
  | "Calendar"
  | "Goals"
  | "Insights"
  | "Settings";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("Dashboard");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toast = useToast();

  const navigate = (page: Page) => {
    setActivePage(page);
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  };

  const renderPage = () => {
    switch (activePage) {
      case "Tasks":
        return <Tasks />;
      case "Planner":
        return <Planner />;
      case "Calendar":
        return <Calendar />;
      case "Goals":
        return <Goals />;
      case "Insights":
        return <Insights />;
      case "Settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        onNavigate={navigate}
        onCreateTask={() => {
          setMenuOpen(false);
          setShowCreateTask(true);
        }}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <main className="main-content">
        <Topbar
          onCreateTask={() => setShowCreateTask(true)}
          onNavigate={navigate}
          onMenu={() => setMenuOpen(true)}
        />
        {renderPage()}
      </main>

      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onCreated={() => {
            setShowCreateTask(false);
            setActivePage("Tasks");
            tasksChanged();
            toast("Task save ho gaya ✅", {
              text: "Naya task Tasks list me add ho gaya.",
            });
          }}
        />
      )}
    </div>
  );
}
