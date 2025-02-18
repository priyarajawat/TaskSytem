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

router.get("/generate-pdf", authMiddleware, async (req, res) => {
  console.log("Query Params:", req.query);  // Log entire query params
  const { userId } = req.query;
  console.log("Received userId:", userId);

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    const tasks = await Task.find({ user: new mongoose.Types.ObjectId(userId) });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found" });
    }

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="tasks_${userId}.pdf"`);
    
    doc.pipe(res); 

    doc.fontSize(20).text("Task List", { align: "center" }).moveDown(1.5);

    tasks.forEach((task, index) => {
      doc.fontSize(14).text(`Task ${index + 1}: ${task.title}`, { underline: true });
      doc.fontSize(12).text(`Description: ${task.description}`);
      doc.text(`Due Date: ${task.dueDate}`);
      doc.text(`Status: ${task.status}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});



module.exports = router;
