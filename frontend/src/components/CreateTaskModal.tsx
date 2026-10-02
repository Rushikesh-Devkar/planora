import { useState } from "react";
import { X } from "lucide-react";
import { api, type Priority } from "../api/api";

export default function CreateTaskModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("");
  const [remindHourly, setRemindHourly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createTask(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await api.tasks.create({
        title,
        description,
        priority,
        deadline: deadline || undefined,
        estimatedMinutes: estimatedMinutes
          ? Number(estimatedMinutes)
          : undefined,
        remindHourly,
      });

      onCreated();
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2>Create Task</h2>
            <p>Add a task to your Planora workspace.</p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={createTask}>
          <label>Task title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Complete React practice"
          />

          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs to be done?"
          />

          <div className="form-grid">
            <div>
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as Priority)
                }
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label>Estimated minutes</label>
              <input
                type="number"
                min="1"
                value={estimatedMinutes}
                onChange={(e) =>
                  setEstimatedMinutes(e.target.value)
                }
                placeholder="60"
              />
            </div>
          </div>

          <label>Deadline</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

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
              checked={remindHourly}
              onChange={(e) => setRemindHourly(e.target.checked)}
              style={{ width: "auto" }}
            />
            Har 1 ghante me phone pe yaad dilao
          </label>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
