// backend/src/models/FeedNotification.js
const mongoose = require("mongoose");

const FeedNotificationSchema = new mongoose.Schema(
  {
    // ai nhận thông báo
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ai thực hiện hành động (like/comment)
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // like | comment
    type: {
      type: String,
      enum: ["like", "comment"],
      required: true,
    },
    // bài post liên quan
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeedPost",
      required: true,
    },
    // đã đọc chưa
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeedNotification", FeedNotificationSchema);
