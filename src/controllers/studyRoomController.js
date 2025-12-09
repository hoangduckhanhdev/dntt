const mongoose = require("mongoose");
const StudyRoom = require("../models/StudyRoom");
const StudyRoomMessage = require("../models/StudyRoomMessage");
const Course = require("../models/Course");
function getUserIdFromReq(req) {
  if (!req.user) return null;
  return req.user._id || req.user.id || req.user.userId || null;
}
function isAdminOrTeacher(req) {
  const role = req.user?.role;
  if (!role) return false;
  if (role === "admin") return true;
  const lower = String(role).toLowerCase();
  return ["teacher", "giangvien", "instructor"].includes(lower);
}
async function canManageRoom(req, room) {
  const userId = getUserIdFromReq(req);
  const role = req.user?.role;
  if (!userId || !room) return false;
  if (role === "admin") return true;
  if (
    role === "teacher" ||
    role === "giangvien" ||
    role === "instructor"
  ) {
    const isCreator =
      room.createdBy && room.createdBy.toString() === userId.toString();
    if (isCreator) return true;
    if (room.course) {
      const count = await Course.countDocuments({
        _id: room.course,
        teacher: userId,
      });
      if (count > 0) return true;
    }
    return false;
  }
  return false;
}
exports.getMyRooms = async (req, res, next) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const role = req.user?.role;
    const orConditions = [
      { "members.user": userId },
      { isPublic: true },
    ];
    if (
      role === "teacher" ||
      role === "giangvien" ||
      role === "instructor"
    ) {
      orConditions.push({ createdBy: userId });
      const teacherCourses = await Course.find({ teacher: userId }).select(
        "_id"
      );
      const courseIds = teacherCourses.map((c) => c._id);
      if (courseIds.length > 0) {
        orConditions.push({ course: { $in: courseIds } });
      }
    }
    if (role === "admin") {
      orConditions.push({});
    }
    const rooms = await StudyRoom.find({
      $or: orConditions,
      isArchived: false,
    })
      .populate("course", "title")
      .populate("createdBy", "name")
      .sort({ updatedAt: -1 });
    res.json({ rooms });
  } catch (err) {
    next(err);
  }
};
exports.createRoom = async (req, res, next) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const { name, courseId, lessonId, isPublic } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Tên phòng là bắt buộc." });
    }
    const safeCourseId =
      courseId && mongoose.Types.ObjectId.isValid(courseId)
        ? courseId
        : null;
    const safeLessonId =
      lessonId && mongoose.Types.ObjectId.isValid(lessonId)
        ? lessonId
        : null;
    const room = await StudyRoom.create({
      name: name.trim(),
      course: safeCourseId,
      lessonId: safeLessonId,
      createdBy: userId,
      isPublic: !!isPublic,
      members: [
        {
          user: userId,
          role: req.user?.role || "student",
        },
      ],
    });
    res.status(201).json({ room });
  } catch (err) {
    console.error(" CREATE ROOM ERROR:", err);
    next(err);
  }
};
exports.updateRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "roomId không hợp lệ." });
    }
    const room = await StudyRoom.findById(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy phòng học nhóm." });
    }
    const allowed = await canManageRoom(req, room);
    if (!allowed) {
      return res.status(403).json({
        message: "Chỉ giáo viên hoặc admin mới được chỉnh sửa phòng này.",
      });
    }
    const { name, isPublic, isArchived } = req.body;
    if (name && name.trim()) {
      room.name = name.trim();
    }
    if (typeof isPublic === "boolean") {
      room.isPublic = isPublic;
    }
    if (typeof isArchived === "boolean") {
      room.isArchived = isArchived;
    }
    await room.save();
    res.json({ room });
  } catch (err) {
    console.error(" UPDATE ROOM ERROR:", err);
    next(err);
  }
};
exports.deleteRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "roomId không hợp lệ." });
    }
    const room = await StudyRoom.findById(roomId);
    if (!room) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy phòng học nhóm." });
    }
    const allowed = await canManageRoom(req, room);
    if (!allowed) {
      return res.status(403).json({
        message: "Chỉ giáo viên hoặc admin mới được xoá phòng này.",
      });
    }
    await StudyRoomMessage.deleteMany({ room: room._id });
    await room.deleteOne();
    res.json({ message: "Đã xóa phòng học nhóm." });
  } catch (err) {
    console.error(" DELETE ROOM ERROR:", err);
    next(err);
  }
};
exports.getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "roomId không hợp lệ." });
    }
    const messages = await StudyRoomMessage.find({ room: roomId })
      .populate("sender", "name avatar role")
      .sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    next(err);
  }
};
exports.adminGetRooms = async (req, res, next) => {
  try {
    if (!isAdminOrTeacher(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const rooms = await StudyRoom.find({})
      .populate("course", "title")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json({ rooms });
  } catch (err) {
    next(err);
  }
};
exports.adminGetRoomDetail = async (req, res, next) => {
  try {
    if (!isAdminOrTeacher(req)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    const { roomId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "roomId không hợp lệ." });
    }
    const room = await StudyRoom.findById(roomId)
      .populate("course", "title")
      .populate("createdBy", "name")
      .populate("members.user", "name role");
    if (!room) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy phòng học nhóm." });
    }
    res.json({ room });
  } catch (err) {
    next(err);
  }
};
exports.adminListRooms = exports.adminGetRooms;
exports.adminUpdateRoom = exports.updateRoom;
exports.adminDeleteRoom = exports.deleteRoom;
