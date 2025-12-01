// src/routes/studyRoomRoutes.js
const express = require("express");
const passport = require("passport");
const router = express.Router();

const studyRoomController = require("../controllers/studyRoomController");

// Middleware xác thực JWT
const auth = passport.authenticate("jwt", { session: false });

// 🔹 Học viên + Giáo viên + Admin: xem danh sách phòng của mình
router.get("/my", auth, studyRoomController.getMyRooms);

// 🔹 Tạo phòng học nhóm / nhóm gọi thoại
router.post("/", auth, studyRoomController.createRoom);

// 🔹 Cập nhật phòng (tên, public, archived) – teacher/admin/owner
router.patch("/:roomId", auth, studyRoomController.updateRoom);

// 🔹 Xóa phòng – teacher/admin/owner
router.delete("/:roomId", auth, studyRoomController.deleteRoom);

// 🔹 Xem lịch sử tin nhắn
router.get("/:roomId/messages", auth, studyRoomController.getRoomMessages);

module.exports = router;
