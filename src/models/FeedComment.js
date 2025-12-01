const mongoose = require("mongoose");

const FeedCommentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeedPost",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },

    // 🔥 ẢNH / VIDEO TRONG COMMENT
    media: {
      url: String,
      type: { type: String, enum: ["image", "video"], default: "image" },
      publicId: String,
    },

    // Nếu không có content + media → không hợp lệ
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeedComment", FeedCommentSchema);
