import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma";
import { startNotifier, sendTelegram } from "./lib/notifier";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());

const DEMO_USER_ID = "demo-user";

async function ensureDemoUser() {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      name: "Rushikesh",
      email: "demo@planora.local",
      passwordHash: "temporary",
    },
  });
}

/* TELEGRAM TEST */
app.get("/api/notify/test", async (_req, res) => {
  const ok = await sendTelegram("✅ Planora test notification. Telegram setup sahi hai!");
  res.json({ success: ok });
});

/* HEALTH */
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Planora backend is running",
      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

/* DASHBOARD */
app.get("/api/dashboard", async (_req, res) => {
  try {
    const [total, completed, pending, inProgress, overdue] =
      await Promise.all([
        prisma.task.count({
          where: { userId: DEMO_USER_ID },
        }),

        prisma.task.count({
          where: {
            userId: DEMO_USER_ID,
            status: "COMPLETED",
          },
        }),

        prisma.task.count({
          where: {
            userId: DEMO_USER_ID,
            status: "PENDING",
          },
        }),

        prisma.task.count({
          where: {
            userId: DEMO_USER_ID,
            status: "IN_PROGRESS",
          },
        }),

        prisma.task.count({
          where: {
            userId: DEMO_USER_ID,
            deadline: {
              lt: new Date(),
            },
            status: {
              not: "COMPLETED",
            },
          },
        }),
      ]);

    res.json({
      success: true,
      stats: {
        total,
        completed,
        pending,
        inProgress,
        overdue,
        completionRate: total
          ? Math.round((completed / total) * 100)
          : 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
});

/* GET TASKS */
app.get("/api/tasks", async (_req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: DEMO_USER_ID,
      },
      include: {
        schedules: true,
        goal: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
});

/* CREATE TASK */
app.post("/api/tasks", async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      deadline,
      estimatedMinutes,
      goalId,
      remindHourly,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description || null,
        priority: priority || "MEDIUM",
        deadline: deadline ? new Date(deadline) : null,
        estimatedMinutes: estimatedMinutes
          ? Number(estimatedMinutes)
          : null,
        goalId: goalId || null,
        remindHourly: Boolean(remindHourly),
        userId: DEMO_USER_ID,
      },
      include: {
        schedules: true,
        goal: true,
      },
    });

    res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
});

/* GET SINGLE TASK */
app.get("/api/tasks/:id", async (req, res) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: DEMO_USER_ID,
      },
      include: {
        schedules: true,
        reminders: true,
        goal: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch task",
    });
  }
});

/* UPDATE TASK */
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      status,
      deadline,
      estimatedMinutes,
      goalId,
      remindHourly,
    } = req.body;

    const existing = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: DEMO_USER_ID,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const task = await prisma.task.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && {
          description: description || null,
        }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && {
          status,
          completedAt:
            status === "COMPLETED" ? new Date() : null,
        }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(estimatedMinutes !== undefined && {
          estimatedMinutes: estimatedMinutes
            ? Number(estimatedMinutes)
            : null,
        }),
        ...(goalId !== undefined && {
          goalId: goalId || null,
        }),
        ...(remindHourly !== undefined && {
          remindHourly: Boolean(remindHourly),
          lastReminderAt: null,
        }),
      },
      include: {
        schedules: true,
        goal: true,
      },
    });

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
});

/* COMPLETE TASK */
app.patch("/api/tasks/:id/complete", async (req, res) => {
  try {
    const task = await prisma.task.updateMany({
      where: {
        id: req.params.id,
        userId: DEMO_USER_ID,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    if (task.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    const updatedTask = await prisma.task.findUnique({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to complete task",
    });
  }
});

/* DELETE TASK */
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const deleted = await prisma.task.deleteMany({
      where: {
        id: req.params.id,
        userId: DEMO_USER_ID,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
});

/* SCHEDULES */
app.get("/api/schedules", async (_req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        userId: DEMO_USER_ID,
      },
      include: {
        task: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    res.json({
      success: true,
      schedules,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch schedules",
    });
  }
});

app.post("/api/schedules", async (req, res) => {
  try {
    const { startTime, endTime, taskId } = req.body;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time are required",
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        taskId: taskId || null,
        userId: DEMO_USER_ID,
      },
      include: {
        task: true,
      },
    });

    res.status(201).json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create schedule",
    });
  }
});

app.delete("/api/schedules/:id", async (req, res) => {
  try {
    await prisma.schedule.deleteMany({
      where: {
        id: req.params.id,
        userId: DEMO_USER_ID,
      },
    });

    res.json({
      success: true,
      message: "Schedule deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete schedule",
    });
  }
});

/* GOALS */
app.get("/api/goals", async (_req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId: DEMO_USER_ID,
      },
      include: {
        tasks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      goals,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch goals",
    });
  }
});

app.post("/api/goals", async (req, res) => {
  try {
    const { title, description, targetDate, progress } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Goal title is required",
      });
    }

    const goal = await prisma.goal.create({
      data: {
        title: title.trim(),
        description: description || null,
        targetDate: targetDate ? new Date(targetDate) : null,
        progress: progress ? Number(progress) : 0,
        userId: DEMO_USER_ID,
      },
    });

    res.status(201).json({
      success: true,
      goal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create goal",
    });
  }
});

app.put("/api/goals/:id", async (req, res) => {
  try {
    const { title, description, targetDate, progress } = req.body;

    const goal = await prisma.goal.update({
      where: {
        id: req.params.id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(targetDate !== undefined && {
          targetDate: targetDate ? new Date(targetDate) : null,
        }),
        ...(progress !== undefined && {
          progress: Number(progress),
        }),
      },
    });

    res.json({
      success: true,
      goal,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update goal",
    });
  }
});

app.delete("/api/goals/:id", async (req, res) => {
  try {
    await prisma.goal.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      message: "Goal deleted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete goal",
    });
  }
});

/* START SERVER */
async function startServer() {
  try {
    await prisma.$connect();
    await ensureDemoUser();
    startNotifier();

    app.listen(PORT, () => {
      console.log("=================================");
      console.log("PLANORA BACKEND RUNNING");
      console.log(`http://localhost:${PORT}`);
      console.log("PostgreSQL: CONNECTED");
      console.log("Prisma: CONNECTED");
      console.log("=================================");
    });
  } catch (error) {
    console.error("SERVER START ERROR:");
    console.error(error);
    process.exit(1);
  }
}

startServer();
