const Progress = require("../models/Progress");
const Course = require("../models/Course");

// GET /api/progress/:courseId  -> tiến độ của user cho 1 khoá
exports.getProgressForCourse = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { courseId } = req.params;

    if (!userId) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    const progress = await Progress.findOne({
      user: userId,
      course: courseId,
    }).lean();

    res.json({ progress });
  } catch (err) {
    console.error("getProgressForCourse error:", err);
    res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
  }
};

// POST /api/progress/:courseId  -> cập nhật tiến độ (ví dụ 0–100)
exports.updateProgressForCourse = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { courseId } = req.params;
    let { percent, lastLessonId } = req.body;

    if (!userId) return res.status(401).json({ message: "Vui lòng đăng nhập" });

    // đảm bảo course tồn tại
    const course = await Course.findById(courseId).select("_id").lean();
    if (!course) {
      return res.status(404).json({ message: "Khoá học không tồn tại" });
    }

    percent = Number(percent) || 0;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;

    const progress = await Progress.findOneAndUpdate(
      { user: userId, course: courseId },
      { percent, lastLessonId: lastLessonId || undefined },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: "Đã cập nhật tiến độ", progress });
  } catch (err) {
    console.error("updateProgressForCourse error:", err);
    res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
  }
};
