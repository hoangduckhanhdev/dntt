const mongoose = require("mongoose");

const chatLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userSnapshot: { type: Object },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant", "system"] },
        content: String,
      },
    ],
    reply: String,
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatLog", chatLogSchema);
