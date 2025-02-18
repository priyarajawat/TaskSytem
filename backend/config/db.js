const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connection Done...");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
