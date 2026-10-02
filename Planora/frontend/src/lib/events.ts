// Tasks change hone par Topbar notifications refresh ho jayein
export function tasksChanged() {
  window.dispatchEvent(new Event("planora:tasks-changed"));
}

// <input type="datetime-local"> ke liye local "YYYY-MM-DDTHH:mm"
export function toLocalInput(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : undefined;
}

export function humanDuration(ms: number) {
  const mins = Math.round(Math.abs(ms) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} minute`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ghante`;
  const days = Math.floor(hours / 24);
  return `${days} din`;
}
