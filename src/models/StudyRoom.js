// models/StudyRoom.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * StudyRoom:
 * - Phòng học nhóm cho 1 khóa hoặc 1 bài học
 * - Tạo bởi giáo viên hoặc admin
 * - Học viên join để chat + học nhóm realtime
 */
const studyRoomSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Gắn với khóa học (nếu bạn có model Course)
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },

    // Nếu bạn có model Lesson/Bài học thì dùng, không có thì cứ để null
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },

    // Người tạo phòng (thường là Teacher hoặc Admin)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Thành viên trong phòng
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        role: {
          type: String,
          enum: ["student", "teacher", "admin"],
          default: "student",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Nếu true: ai thuộc khóa (enroll) cũng có thể join, không cần add trước
    isPublic: {
      type: Boolean,
      default: false,
    },

    // Lưu cho trường hợp phòng đã đóng / không còn dùng nữa
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("StudyRoom", studyRoomSchema);
