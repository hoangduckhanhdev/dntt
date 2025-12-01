// models/Notification.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // có thể null nếu gửi chung (all / students / teachers...)
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    link: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    target: {
      type: String,
      enum: ["all", "students", "teachers", "admins"],
      default: "all",
    },
    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
    },
    image: {
      type: String,
      default: "",
    },
    scheduleAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ⚠️ Quan trọng: export đúng model
module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
