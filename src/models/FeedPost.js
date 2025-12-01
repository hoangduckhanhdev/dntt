// backend/src/models/FeedPost.js
const mongoose = require("mongoose");

const FeedPostSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔥 NỚI LỎNG: bỏ enum + required, tránh lỗi role lạ
    role: {
      type: String,
      default: "student",
    },

    // Loại bài post
    type: {
      type: String,
      enum: ["lesson_suggestion", "question", "blog", "announcement", "mini_quiz"],
      required: true,
    },

    title: { type: String, trim: true },

    // Nội dung text (có thể rỗng nếu chỉ post media)
    content: {
      type: String,
      default: "",
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },

    tags: [String],

    // 🔹 ẢNH / MEDIA
    media: {
      url: String, // link Cloudinary
      publicId: String,
      type: {
        type: String,
        enum: ["image", "video"],
        default: "image",
      },
    },

    // Mini quiz 1 câu
    quiz: {
      question: String,
      options: [
        {
          text: String,
          isCorrect: { type: Boolean, default: false },
        },
      ],
      explanation: String,
    },

    isPinned: { type: Boolean, default: false },

    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeedPost", FeedPostSchema);
