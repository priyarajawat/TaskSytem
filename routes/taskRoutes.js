const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const router = express.Router();

// Create Task (Only Logged-in Users)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, dueDate, status ,userId} = req.body;

    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(400).json({
        statusCode: 400,
        status: req.t("failure_message_"),
      });
    }

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
      user: userId, // Assign task to logged-in user
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
  const userDetails = await User.findById(id);
  if (!userDetails) {
    return res.status(400).json({
      statusCode: 400,
      status: req.t("failure_message_"),
    });
  }
  try {
    const tasks = await Task.find({ user: id }); // Fetch only the user's tasks
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Update Task (Only if User Owns the Task)
router.put("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, dueDate, status ,TaskId,userId} = req.body;

    // Validate status
    const allowedStatuses = ["pending", "in progress", "completed"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const task = await Task.findById({_id:TaskId});
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check if the task belongs to the logged-in user
    if (task.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to update this task" });
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

// Delete Task (Only if User Owns the Task)
router.delete("/", authMiddleware, async (req, res) => {
  const    {id} = req.query
  try {
    const task = await Task.findById({_id:id});
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Check if the task belongs to the logged-in user
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


router.get("/generate-pdf", authMiddleware, async (req, res) => {mm
  const { userId} = req.body;
  try {
     // Get user ID from token

    const userDetails = await User.findById(userId);
    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch user's tasks
    const tasks = await Task.find({ user: userId });

    if (tasks.length === 0) {
      return res.status(404).json({ message: "No tasks found" });
    }

    // Create PDF Document
    const doc = new PDFDocument();
    
    // Set response headers for file download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="tasks.pdf"');

    doc.pipe(res); // Stream PDF to response

    // Add title
    doc.fontSize(20).text("Task List", { align: "center" }).moveDown(1.5);

    // Add tasks to PDF
    tasks.forEach((task, index) => {
      doc
        .fontSize(14)
        .text(`Task ${index + 1}: ${task.title}`, { underline: true });

      doc.fontSize(12).text(`Description: ${task.description}`);
      doc.text(`Due Date: ${task.dueDate}`);
      doc.text(`Status: ${task.status}`);
      doc.moveDown();
    });

    doc.end(); // Finalize the document
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


module.exports = router;
