const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const router = express.Router();

// Create Task
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, dueDate, status, userId } = req.body;

    const userDetails = await User.findById(userId);

    // Validate status
    const allowedStatuses = ["pending", "in progress", "completed"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = new Task({
      title,
      description,
      dueDate,
      status,
      user: userId,
    });

    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Get All Tasks (Only User's Tasks)

router.get("/", authMiddleware, async (req, res) => {
  const { id } = req.query;

  try {
    const tasks = await Task.find({ user: id }); // Fetch only the user's tasks
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

router.get("/:taskId", authMiddleware, async (req, res) => {
  const { taskId } = req.params; // Extract task ID from URL params

  try {
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Update Task
router.put("/:userId/:TaskId", authMiddleware, async (req, res) => {
  try {
    const { TaskId, userId } = req.params;
    const { title, description, dueDate, status } = req.body;

    const allowedStatuses = ["pending", "in progress", "completed"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = await Task.findById({ _id: TaskId });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Unauthorized to update this task" });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.dueDate = dueDate || task.dueDate;
    task.status = status || task.status;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Delete Task
router.delete("/", authMiddleware, async (req, res) => {
  const { id } = req.query;
  try {
    const task = await Task.findById({ _id: id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    // if (task.user.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Unauthorized to delete this task" });
    // }

    await task.deleteOne();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

//generate PDF





module.exports = router;
