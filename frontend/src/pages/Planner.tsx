import { useEffect, useState } from "react";
import { Clock, Trash2 } from "lucide-react";
import { api, type Schedule, type Task } from "../api/api";

export default function Planner() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskId, setTaskId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  async function load() {
    const [scheduleResult, taskResult] = await Promise.all([
      api.schedules.list(),
      api.tasks.list(),
    ]);

    setSchedules(scheduleResult.schedules);
    setTasks(taskResult.tasks);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  async function addSchedule() {
    if (!startTime || !endTime) return;

    await api.schedules.create({
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      taskId: taskId || undefined,
    });

    setStartTime("");
    setEndTime("");
    setTaskId("");
    await load();
  }

  async function remove(id: string) {
    await api.schedules.delete(id);
    await load();
  }

  return (
    <section className="page-container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLAN</span>
          <h1>Planner</h1>
          <p>Reserve time for your work.</p>
        </div>
      </div>

      <div className="planner-form panel">
        <h3>Create Time Block</h3>

        <select
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
        >
          <option value="">No task</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />

        <input
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />

        <button
          className="primary-button"
          onClick={addSchedule}
        >
          <Clock size={17} />
          Add Time Block
        </button>
      </div>

      <div className="schedule-list">
        {schedules.map((schedule) => (
          <div className="schedule-card" key={schedule.id}>
            <div>
              <strong>
                {schedule.task?.title || "Free Time"}
              </strong>

              <p>
                {new Date(
                  schedule.startTime
                ).toLocaleString()}{" "}
                →{" "}
                {new Date(
                  schedule.endTime
                ).toLocaleString()}
              </p>
            </div>

            <button
              className="icon-action danger"
              onClick={() => remove(schedule.id)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
