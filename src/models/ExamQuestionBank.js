const mongoose = require("mongoose");

/**
 * OPTION SCHEMA — dùng cho câu hỏi trắc nghiệm
 */
const optionSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true, required: true },
    isCorrect: { type: Boolean, default: false }
  },
  { _id: true }
);

/**
 * QUESTION BANK SCHEMA
 */
const examQuestionBankSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    content: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: [
        "multiple_choice",
        "true_false",
        "short_answer",
        "essay",
        "file_upload"
      ],
      required: true
    },

    /* ===== TRẮC NGHIỆM ===== */
    options: [optionSchema],

    /* ===== TRUE/FALSE | SHORT ANSWER ===== */
    correctAnswer: { type: String, trim: true },

    /* ===== ESSAY ===== */
    expectedAnswer: { type: String, trim: true },

    /* ===== CHẤM ĐIỂM ===== */
    score: { type: Number, default: 1, min: 0 },

    /* ===== PHÂN LOẠI ===== */
    chapter: { type: String, trim: true },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium"
    },

    tags: [{ type: String, trim: true }],

    /* ===== KỸ NĂNG (SKILL MAP) — QUAN TRỌNG ===== */
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      index: true,
    },

    /* ===== AI ===== */
    aiAutoGrade: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ExamQuestionBank ||
  mongoose.model("ExamQuestionBank", examQuestionBankSchema);
