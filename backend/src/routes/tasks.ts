import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("GET TASKS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, priority, deadline, estimatedMinutes } =
      req.body;

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
        userId: "demo-user",
      },
    });

    res.status(201).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create task",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const task = await prisma.task.update({
      where: {
        id: req.params.id,
      },
      data: req.body,
    });

    res.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await prisma.task.delete({
      where: {
        id: req.params.id,
      },
    });

    res.json({
      success: true,
      message: "Task deleted",
    });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
});

export default router;
