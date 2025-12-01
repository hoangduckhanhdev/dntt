const Course = require("../models/Course");
const Teacher = require("../models/Teacher");
const RegisterCourse = require("../models/registerCourse"); // hoặc Student nếu bạn có model riêng

// 🟢 API thống kê số lượng
exports.getStats = async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalStudents = await RegisterCourse.countDocuments();

    res.json({
      courses: totalCourses,
      teachers: totalTeachers,
      students: totalStudents,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy thống kê", error: err.message });
  }
};
