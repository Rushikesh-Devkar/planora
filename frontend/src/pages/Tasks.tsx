import { useEffect, useState } from "react";
import {
  Check,
  Trash2,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";
import { api, type Task, type Priority } from "../api/api";

const priorityClass: Record<Priority, string> = {
  LOW: "priority-low",
  MEDIUM: "priority-medium",
  HIGH: "priority-high",
  CRITICAL: "priority-critical",
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Task | null>(null);

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const result = await api.tasks.list();
      setTasks(result.tasks);
    } catch (err: any) {
      setError(err.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function completeTask(id: string) {
    await api.tasks.complete(id);
    await loadTasks();
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;

    await api.tasks.delete(id);
    await loadTasks();
  }

  async function saveEdit() {
    if (!editing) return;

    await api.tasks.update(editing.id, {
      title: editing.title,
      description: editing.description || "",
      priority: editing.priority,
      status: editing.status,
      estimatedMinutes:
        editing.estimatedMinutes || undefined,
      deadline: editing.deadline || undefined,
      remindHourly: editing.remindHourly ?? false,
    });

    setEditing(null);
    await loadTasks();
  }

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE</span>
          <h1>Tasks</h1>
          <p>Manage everything you need to get done.</p>
        </div>

        <button
          className="secondary-button"
          onClick={loadTasks}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {loading && (
        <div className="empty-state">
          Loading tasks...
        </div>
      )}

      {error && (
        <div className="error-card">
          {error}
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="empty-state">
          <Plus size={32} />
          <h3>No tasks yet</h3>
          <p>
            Click <strong>Create Task</strong> to add your
            first task.
          </p>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="task-list-page">
          {tasks.map((task) => (
            <div className="task-card" key={task.id}>
              <div className="task-main">
                <button
                  className={`task-check ${
                    task.status === "COMPLETED"
                      ? "completed"
                      : ""
                  }`}
                  onClick={() =>
                    task.status !== "COMPLETED" &&
                    completeTask(task.id)
                  }
                >
                  <Check size={16} />
                </button>

                <div className="task-content">
                  <h3
                    className={
                      task.status === "COMPLETED"
                        ? "task-completed"
                        : ""
                    }
                  >
                    {task.title}
                  </h3>

                  {task.description && (
                    <p>{task.description}</p>
                  )}

                  <div className="task-meta">
                    <span
                      className={`priority-pill ${
                        priorityClass[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>

                    {task.estimatedMinutes && (
                      <span>
                        {task.estimatedMinutes} min
                      </span>
                    )}

                    {task.deadline && (
                      <span>
                        {new Date(
                          task.deadline
                        ).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="task-actions">
                <button
                  className="icon-action"
                  onClick={() => setEditing(task)}
                  title="Edit"
                >
                  <Pencil size={17} />
                </button>

                <button
                  className="icon-action danger"
                  onClick={() => deleteTask(task.id)}
                  title="Delete"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div
          className="modal-overlay"
          onMouseDown={() => setEditing(null)}
        >
          <div
            className="modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Edit Task</h2>
                <p>Update your task details.</p>
              </div>
            </div>

            <label>Title</label>
            <input
              value={editing.title}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  title: e.target.value,
                })
              }
            />

            <label>Description</label>
            <textarea
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  description: e.target.value,
                })
              }
            />

            <label>Priority</label>
            <select
              value={editing.priority}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  priority: e.target.value as Priority,
                })
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={editing.remindHourly ?? false}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    remindHourly: e.target.checked,
                  })
                }
                style={{ width: "auto" }}
              />
              Har 1 ghante me phone pe yaad dilao
            </label>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={saveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
