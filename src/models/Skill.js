const mongoose = require("mongoose");

/**
 * Skill Schema – đại diện cho 1 kỹ năng trong Skill Map.
 * Mỗi kỹ năng có thể có:
 * - skill cha (để tạo cây: skill → sub-skill)
 * - mô tả
 * - mức độ khó
 * - thuộc khóa học nào
 */

const skillSchema = new mongoose.Schema(
  {
    // skill thuộc khóa học nào
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    // tên kỹ năng
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // mô tả ngắn
    description: {
      type: String,
      trim: true,
    },

    // skill cha → build sơ đồ dạng cây
    parentSkill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      default: null,
      index: true,
    },

    // mức độ quan trọng
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    // thứ tự hiển thị trên sơ đồ
    order: {
      type: Number,
      default: 0,
    },

    // tag / nhóm
    tags: [{ type: String, trim: true }],

    // AI Gợi ý học → khi AI trả về
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skill",
        default: [],
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Skill || mongoose.model("Skill", skillSchema);
