const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // Danh sách bài đã hoàn thành
    // mỗi bài được đánh dấu bằng key: "sectionIndex-lessonIndex"
    completedLessons: {
      type: [String],
      default: [],
    },

    // Bài gần nhất
    lastLessonKey: {
      type: String, // "0-2"
    },

    // Phần trăm hoàn thành
    percent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  { timestamps: true }
);

// Một user chỉ có 1 progress cho 1 khóa
progressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Progress", progressSchema);
