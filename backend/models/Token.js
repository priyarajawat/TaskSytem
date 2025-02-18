const mongoose = require("mongoose");

const TokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "1h" } // Auto-delete token after 1 hour
});

module.exports = mongoose.model("Token", TokenSchema);
