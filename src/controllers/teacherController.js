const Teacher = require("../models/Teacher");
const Course = require("../models/Course");

exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res.status(404).json({ message: "Không tìm thấy giảng viên." });
    }
    res.json(teacher);
  } catch (err) {
    console.error("Lỗi lấy chi tiết giảng viên:", err);
    res.status(500).json({ message: "Lỗi server." });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const newTeacher = new Teacher(req.body);
    await newTeacher.save();
    res.status(201).json(newTeacher);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const updated = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    await Teacher.findByIdAndDelete(req.params.id);
    res.json({ message: "Đã xóa giảng viên" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.myCourses = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const teacher = await Teacher.findOne({ user: userId }).select("_id").lean();
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const courses = await Course.find({ teacher: teacher._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json(courses);
  } catch (err) {
    console.error("❌ /teacher/my-courses error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
