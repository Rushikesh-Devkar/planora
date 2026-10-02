import prisma from "./prisma";

const TICK_MS = 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// Deadline se kitne minute pehle reminder jaye
const DEADLINE_STAGES = [1440, 180, 60, 15];

let warnedNoConfig = false;

function formatTime(date: Date) {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function humanLeft(mins: number) {
  if (mins >= 1440) return `${Math.round(mins / 1440)} din`;
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m ? `${h} ghanta ${m} min` : `${h} ghanta`;
  }
  return `${Math.max(1, Math.round(mins))} min`;
}

export async function sendTelegram(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    if (!warnedNoConfig) {
      console.warn(
        "NOTIFIER: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID .env me set nahi hai. Notifications band hain."
      );
      warnedNoConfig = true;
    }
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );

    if (!response.ok) {
      console.error("NOTIFIER: Telegram error", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("NOTIFIER: Telegram send failed", error);
    return false;
  }
}

async function alreadySent(key: string) {
  const found = await prisma.sentReminder.findUnique({ where: { key } });
  return Boolean(found);
}

async function markSent(keys: string[]) {
  for (const key of keys) {
    try {
      await prisma.sentReminder.create({ data: { key } });
    } catch {
      // already exists, ignore
    }
  }
}

async function checkTasks(now: Date) {
  const tasks = await prisma.task.findMany({
    where: {
      status: { notIn: ["COMPLETED", "CANCELLED"] },
      OR: [{ deadline: { not: null } }, { remindHourly: true }],
    },
  });

  for (const task of tasks) {
    let sentNow = false;

    if (task.deadline) {
      const deadlineMs = task.deadline.getTime();
      const minsLeft = (deadlineMs - now.getTime()) / 60000;

      if (minsLeft > 0) {
        const applicable = DEADLINE_STAGES.filter((s) => minsLeft <= s);

        if (applicable.length > 0) {
          const smallest = Math.min(...applicable);
          const keyFor = (s: number) => `task:${task.id}:${s}:${deadlineMs}`;

          if (!(await alreadySent(keyFor(smallest)))) {
            const ok = await sendTelegram(
              `⏰ ${task.title}\n` +
                `Deadline me ${humanLeft(minsLeft)} bache hain (${formatTime(task.deadline)}).\n` +
                `Priority: ${task.priority}`
            );

            if (ok) {
              await markSent(applicable.map(keyFor));
              sentNow = true;
            }
          }
        }
      } else {
        const key = `task:${task.id}:overdue:${deadlineMs}`;

        if (!(await alreadySent(key))) {
          const ok = await sendTelegram(
            `🚨 OVERDUE: ${task.title}\n` +
              `Deadline nikal gayi (${formatTime(task.deadline)}). Jaldi complete karo!`
          );

          if (ok) {
            await markSent([key]);
            sentNow = true;
          }
        }
      }
    }

    // Har 1 ghante wala reminder (sirf jin tasks pe toggle ON hai)
    if (task.remindHourly && !sentNow) {
      const last = task.lastReminderAt?.getTime() ?? 0;

      if (now.getTime() - last >= HOUR_MS) {
        const deadlineText = task.deadline
          ? `Deadline: ${formatTime(task.deadline)}`
          : "Deadline set nahi hai";

        const ok = await sendTelegram(
          `🔔 Yaad dilana: ${task.title}\n${deadlineText}\nPriority: ${task.priority}\nAbhi karna hai, complete hone tak har 1 ghante me yaad dilaunga.`
        );

        if (ok) sentNow = true;
      }
    }

    if (sentNow) {
      await prisma.task.update({
        where: { id: task.id },
        data: { lastReminderAt: now },
      });
    }
  }
}

async function checkSchedules(now: Date) {
  const from = new Date(now.getTime() - 15 * 60000);
  const to = new Date(now.getTime() + 16 * 60000);

  const schedules = await prisma.schedule.findMany({
    where: { startTime: { gte: from, lte: to } },
    include: { task: true },
  });

  for (const schedule of schedules) {
    if (
      schedule.task &&
      (schedule.task.status === "COMPLETED" ||
        schedule.task.status === "CANCELLED")
    ) {
      continue;
    }

    const startMs = schedule.startTime.getTime();
    const minsLeft = (startMs - now.getTime()) / 60000;
    const name = schedule.task?.title ?? "Scheduled slot";
    const range = `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`;

    const key15 = `sched:${schedule.id}:15:${startMs}`;
    const keyStart = `sched:${schedule.id}:start:${startMs}`;

    if (minsLeft <= 0) {
      if (!(await alreadySent(keyStart))) {
        const ok = await sendTelegram(`▶️ Ab shuru karo: ${name}\n${range}`);
        if (ok) await markSent([keyStart, key15]);
      }
    } else if (minsLeft <= 15) {
      if (!(await alreadySent(key15))) {
        const ok = await sendTelegram(
          `📅 ${humanLeft(minsLeft)} me shuru: ${name}\n${range}`
        );
        if (ok) await markSent([key15]);
      }
    }
  }
}

let running = false;

async function tick() {
  if (running) return;
  running = true;

  try {
    const now = new Date();
    await checkTasks(now);
    await checkSchedules(now);
  } catch (error) {
    console.error("NOTIFIER ERROR:", error);
  } finally {
    running = false;
  }
}

export function startNotifier() {
  console.log("NOTIFIER: started (har 1 minute check hota hai)");

  sendTelegram("✅ Planora notifications ON. Ab tumhe reminders milte rahenge.");

  tick();
  setInterval(tick, TICK_MS);
}
