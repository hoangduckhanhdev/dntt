const mongoose = require("mongoose");

const userSkillProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
      index: true,
    },

    // Mức độ hiện tại của học viên với skill này (do AI suy luận)
    // bạn có thể đổi label, nhưng nên đồng nhất với Skill Map
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    // entry_test: từ bài test đầu vào
    // exam       : từ bài kiểm tra giữa kỳ/cuối kỳ
    // manual     : giáo viên chỉnh tay (nếu sau này cần)
    source: {
      type: String,
      enum: ["entry_test", "exam", "manual"],
      default: "entry_test",
    },

    lastExam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
    },
    lastAttempt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamAttempt",
    },

    // tỉ lệ điểm tổng trên thang 1.0 (0–1)
    lastScoreRatio: { type: Number, default: 0 },

    // tóm tắt của AI về skill này (optional)
    aiSummary: { type: String },
  },
  { timestamps: true }
);

// 1 học viên - 1 course - 1 skill chỉ có 1 profile
userSkillProfileSchema.index(
  { user: 1, course: 1, skill: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.UserSkillProfile ||
  mongoose.model("UserSkillProfile", userSkillProfileSchema);
