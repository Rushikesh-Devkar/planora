import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api, type Goal } from "../api/api";

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    const result = await api.goals.list();
    setGoals(result.goals);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function createGoal() {
    if (!title.trim()) return;

    await api.goals.create({
      title,
      description,
      progress: 0,
    });

    setTitle("");
    setDescription("");
    await load();
  }

  async function deleteGoal(id: string) {
    if (!confirm("Delete this goal?")) return;

    await api.goals.delete(id);
    await load();
  }

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">LONG TERM</span>
          <h1>Goals</h1>
          <p>Track outcomes, not just tasks.</p>
        </div>
      </div>

      <div className="panel goal-create">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Goal title"
        />

        <input
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="Description"
        />

        <button
          className="primary-button"
          onClick={createGoal}
        >
          <Plus size={17} />
          Add Goal
        </button>
      </div>

      <div className="goal-grid">
        {goals.map((goal) => (
          <div className="goal-card" key={goal.id}>
            <div className="goal-card-header">
              <h3>{goal.title}</h3>

              <button
                className="icon-action danger"
                onClick={() => deleteGoal(goal.id)}
              >
                <Trash2 size={17} />
              </button>
            </div>

            {goal.description && (
              <p>{goal.description}</p>
            )}

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${goal.progress}%`,
                }}
              />
            </div>

            <span>{goal.progress}% complete</span>
          </div>
        ))}
      </div>
    </section>
  );
}
