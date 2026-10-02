import { useEffect, useState } from "react";
import { Check, Trash2, Pencil, Plus, RefreshCw, RotateCcw } from "lucide-react";
import {
  api,
  type Task,
  type Priority,
  type TaskStatus,
} from "../api/api";
import { useToast } from "../components/Toast";
import {
  fromLocalInput,
  humanDuration,
  tasksChanged,
  toLocalInput,
} from "../lib/events";

const priorityClass: Record<Priority, string> = {
  LOW: "priority-low",
  MEDIUM: "priority-medium",
  HIGH: "priority-high",
  CRITICAL: "priority-critical",
};

type Filter = "ALL" | "ACTIVE" | "DONE";

interface EditState {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes: string;
  deadline: string; // local datetime-local value
  remindHourly: boolean;
}

function toEditState(task: Task): EditState {
  return {
    id: task.id,
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    status: task.status,
    estimatedMinutes: task.estimatedMinutes ? String(task.estimatedMinutes) : "",
    deadline: toLocalInput(task.deadline),
    remindHourly: task.remindHourly ?? false,
  };
}

function completionMessage(task: Task) {
  if (!task.deadline) {
    return { title: "Task complete ho gaya! 🎉", text: "Shabaash, ek aur kaam khatam." };
  }

  const diff = new Date(task.deadline).getTime() - Date.now();

  if (diff > 0) {
    return {
      title: "Yes! Task complete ho gaya 🎉",
      text: `Deadline se ${humanDuration(diff)} pehle khatam kiya. Zabardast!`,
    };
  }

  return {
    title: "Task complete ho gaya ✅",
    text: `Deadline se ${humanDuration(diff)} late, par ho gaya!`,
  };
}

export default function Tasks() {
  const toast = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("ALL");

  async function loadTasks(showLoader = true) {
    try {
      if (showLoader) setLoading(true);
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

  async function reopenTask(id: string, quiet = false) {
    try {
      await api.tasks.update(id, { status: "PENDING" });
      await loadTasks(false);
      tasksChanged();
      if (!quiet) toast("Task dobara open ho gaya", { kind: "info" });
    } catch (err: any) {
      toast("Task reopen nahi hua", { kind: "error", text: err.message });
    }
  }

  async function completeTask(task: Task) {
    try {
      await api.tasks.complete(task.id);
      await loadTasks(false);
      tasksChanged();

      const msg = completionMessage(task);
      toast(msg.title, {
        text: msg.text,
        actionLabel: "Undo",
        onAction: () => reopenTask(task.id, true),
        duration: 7000,
      });
    } catch (err: any) {
      toast("Task complete nahi hua", { kind: "error", text: err.message });
    }
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;

    try {
      await api.tasks.delete(id);
      await loadTasks(false);
      tasksChanged();
      toast("Task delete ho gaya", { kind: "info" });
    } catch (err: any) {
      toast("Delete nahi hua", { kind: "error", text: err.message });
    }
  }

  async function saveEdit() {
    if (!editing) return;

    if (!editing.title.trim()) {
      toast("Title khali nahi ho sakta", { kind: "error" });
      return;
    }

    try {
      setSaving(true);

      await api.tasks.update(editing.id, {
        title: editing.title,
        description: editing.description,
        priority: editing.priority,
        status: editing.status,
        estimatedMinutes: editing.estimatedMinutes
          ? Number(editing.estimatedMinutes)
          : null,
        deadline: fromLocalInput(editing.deadline) ?? null,
        remindHourly: editing.remindHourly,
      });

      setEditing(null);
      await loadTasks(false);
      tasksChanged();
      toast("Task update ho gaya ✅");
    } catch (err: any) {
      toast("Update nahi hua", { kind: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const visible = tasks.filter((t) => {
    if (filter === "DONE") return t.status === "COMPLETED";
    if (filter === "ACTIVE") return t.status !== "COMPLETED";
    return true;
  });

  const counts = {
    ALL: tasks.length,
    ACTIVE: tasks.filter((t) => t.status !== "COMPLETED").length,
    DONE: tasks.filter((t) => t.status === "COMPLETED").length,
  };

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">WORKSPACE</span>
          <h1>Tasks</h1>
          <p>Manage everything you need to get done.</p>
        </div>

        <button className="secondary-button" onClick={() => loadTasks()}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="filter-tabs">
        {(
          [
            ["ALL", "All"],
            ["ACTIVE", "Pending"],
            ["DONE", "Completed"],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            className={`filter-tab ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key)}
          >
            {label} <span>{counts[key]}</span>
          </button>
        ))}
      </div>

      {loading && <div className="empty-state">Loading tasks...</div>}

      {error && <div className="error-card">{error}</div>}

      {!loading && !error && tasks.length === 0 && (
        <div className="empty-state">
          <Plus size={32} />
          <h3>No tasks yet</h3>
          <p>
            Click <strong>Create Task</strong> to add your first task.
          </p>
        </div>
      )}

      {!loading && tasks.length > 0 && visible.length === 0 && (
        <div className="empty-state">Is filter me koi task nahi hai.</div>
      )}

      {!loading && visible.length > 0 && (
        <div className="task-list-page">
          {visible.map((task) => {
            const done = task.status === "COMPLETED";

            return (
              <div className="task-card" key={task.id}>
                <div className="task-main">
                  <button
                    className={`task-check ${done ? "completed" : ""}`}
                    onClick={() =>
                      done ? reopenTask(task.id) : completeTask(task)
                    }
                    title={done ? "Mark as pending" : "Mark as complete"}
                  >
                    <Check size={16} />
                  </button>

                  <div className="task-content">
                    <h3 className={done ? "task-completed" : ""}>{task.title}</h3>

                    {task.description && <p>{task.description}</p>}

                    <div className="task-meta">
                      <span className={`priority-pill ${priorityClass[task.priority]}`}>
                        {task.priority}
                      </span>

                      {done && <span className="done-pill">Completed</span>}

                      {task.estimatedMinutes && (
                        <span>{task.estimatedMinutes} min</span>
                      )}

                      {task.deadline && (
                        <span>
                          Due {new Date(task.deadline).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="task-actions">
                  {done && (
                    <button
                      className="icon-action"
                      onClick={() => reopenTask(task.id)}
                      title="Reopen"
                    >
                      <RotateCcw size={17} />
                    </button>
                  )}

                  <button
                    className="icon-action"
                    onClick={() => setEditing(toEditState(task))}
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
            );
          })}
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onMouseDown={() => setEditing(null)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Edit Task</h2>
                <p>Details, deadline ya status badlo.</p>
              </div>
            </div>

            <label>Title</label>
            <input
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />

            <label>Description</label>
            <textarea
              value={editing.description}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
            />

            <div className="form-grid">
              <div>
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
              </div>

              <div>
                <label>Status</label>
                <select
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as TaskStatus,
                    })
                  }
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label>Deadline</label>
                <input
                  type="datetime-local"
                  value={editing.deadline}
                  onChange={(e) =>
                    setEditing({ ...editing, deadline: e.target.value })
                  }
                />
              </div>

              <div>
                <label>Estimated minutes</label>
                <input
                  type="number"
                  min="1"
                  value={editing.estimatedMinutes}
                  onChange={(e) =>
                    setEditing({ ...editing, estimatedMinutes: e.target.value })
                  }
                />
              </div>
            </div>

            <label className="check-row">
              <input
                type="checkbox"
                checked={editing.remindHourly}
                onChange={(e) =>
                  setEditing({ ...editing, remindHourly: e.target.checked })
                }
              />
              Har 1 ghante me phone pe yaad dilao
            </label>

            <div className="modal-actions">
              <button className="secondary-button" onClick={() => setEditing(null)}>
                Cancel
              </button>

              <button
                className="primary-button"
                onClick={saveEdit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
