const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const Task = require("../models/Task");
const User = require("../models/User");
const PDFDocument = require("pdfkit");
const router = express.Router();


router.get("/", authMiddleware, async (req, res) => {
    console.log("Query Params:", req.query);  // Log entire query params
    const { userId } = req.query;
    console.log("Received userId:", userId);
  
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
  
    try {
  
  
      const tasks = await Task.find({ user: userId});
  
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