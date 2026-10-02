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
        onNavigate={setActivePage}
        onCreateTask={() => setShowCreateTask(true)}
      />

      <main className="main-content">
        <Topbar onCreateTask={() => setShowCreateTask(true)} />
        {renderPage()}
      </main>

      {showCreateTask && (
        <CreateTaskModal
          onClose={() => setShowCreateTask(false)}
          onCreated={() => {
            setShowCreateTask(false);
            setActivePage("Tasks");
          }}
        />
      )}
    </div>
  );
}
