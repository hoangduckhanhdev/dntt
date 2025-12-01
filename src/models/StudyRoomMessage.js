// src/models/StudyRoomMessage.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * StudyRoomMessage:
 * - Tin nhắn trong phòng học nhóm
 * - Lưu để load lại lịch sử chat
 */
const studyRoomMessageSchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "StudyRoom",
      required: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },

    // text: tin nhắn thường
    // image: link ảnh
    // note: ghi chú/bài tập/note học tập
    type: {
      type: String,
      enum: ["text", "image", "note"],
      default: "text",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("StudyRoomMessage", studyRoomMessageSchema);
