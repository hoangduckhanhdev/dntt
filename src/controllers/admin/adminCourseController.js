// controllers/admin/adminCourseController.js
const mongoose = require("mongoose");
const fs = require("fs");
const Course = require("../../models/Course");
const Category = require("../../models/Category");
const Teacher = require("../../models/Teacher");
const Question = require("../../models/Question"); // Q&A dùng chung
const cloudinary = require("../../config/cloudinary");

// thêm model lớp học
const CourseClass = require("../../models/CourseClass");

// các model thêm cho Students + Progress
const Progress = require("../../models/Progress");
const RegisterCourse = require("../../models/registerCourse");
const User = require("../../models/User");

/* ===================== HELPER ===================== */

// tìm Teacher theo user đang đăng nhập
async function findTeacherForUser(userDoc) {
  if (!userDoc || userDoc.role !== "teacher") return null;
  return Teacher.findOne({ user: userDoc._id });
}

// đếm tổng số lesson trong 1 khóa
function countTotalLessons(courseDoc) {
  if (!courseDoc.sections || !Array.isArray(courseDoc.sections)) return 0;
  return courseDoc.sections.reduce(
    (sum, sec) => sum + (Array.isArray(sec.lessons) ? sec.lessons.length : 0),
    0
  );
}

/* ===================== CRUD COURSE ===================== */

exports.getAllCourses = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const filter = {};

    // Teacher chỉ thấy khóa của mình
    if (req.userDoc.role === "teacher") {
      const teacher = await findTeacherForUser(req.userDoc);
      if (!teacher) {
        return res.status(403).json({
          message:
            "Không tìm thấy hồ sơ giảng viên cho tài khoản này. Vui lòng liên hệ quản trị.",
        });
      }
      filter.teacher = teacher._id;
    }

    const total = await Course.countDocuments(filter);

    const courses = await Course.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // ===== Map category & teacher name =====
    const categoryIds = [
      ...new Set(
        courses
          .map((c) => c.category)
          .filter((v) => v && mongoose.isValidObjectId(v))
      ),
    ];

    const teacherIds = [
      ...new Set(
        courses
          .map((c) => c.teacher)
          .filter((v) => v && mongoose.isValidObjectId(v))
      ),
    ];

    const categories = categoryIds.length
      ? await Category.find({ _id: { $in: categoryIds } }).select("name")
      : [];
    const teachers = teacherIds.length
      ? await Teacher.find({ _id: { $in: teacherIds } }).select("name")
      : [];

    const categoryMap = categories.reduce((acc, cat) => {
      acc[cat._id.toString()] = cat.name;
      return acc;
    }, {});
    const teacherMap = teachers.reduce((acc, t) => {
      acc[t._id.toString()] = t.name;
      return acc;
    }, {});

    // ===== Thống kê Q&A cho các khoá đang hiển thị =====
    const courseIds = courses.map((c) => c._id);
    let qnaStatsMap = new Map();

    if (courseIds.length) {
      const qnaList = await Question.find({
        course: { $in: courseIds },
      })
        .select("course answer")
        .lean();

      qnaList.forEach((q) => {
        const cid = String(q.course);
        if (!qnaStatsMap.has(cid)) {
          qnaStatsMap.set(cid, { total: 0, unanswered: 0 });
        }
        const row = qnaStatsMap.get(cid);
        row.total += 1;
        if (!q.answer || !q.answer.trim()) {
          row.unanswered += 1;
        }
      });
    }

    const formatted = courses.map((course) => {
      const cat = course.category;
      const tch = course.teacher;
      const cid = String(course._id);
      const stats = qnaStatsMap.get(cid) || { total: 0, unanswered: 0 };

      const categoryName = mongoose.isValidObjectId(cat)
        ? categoryMap[cat.toString()] || "Chưa có"
        : cat || "Chưa có";

      const teacherName = mongoose.isValidObjectId(tch)
        ? teacherMap[tch.toString()] || "Đang cập nhật"
        : tch || "Đang cập nhật";

      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        price: course.price,
        image: course.image,
        rating: course.rating || 0,
        category: categoryName,
        teacher: teacherName,
        studentsCount: course.students || 0, // 🔢 tổng học viên (nếu có)
        qnaTotal: stats.total,
        qnaUnanswered: stats.unanswered, // 🔴 số câu chưa trả lời – dùng để hiện badge Q&A
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      };
    });

    res.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: formatted,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh sách khóa học:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("category", "name description image")
      .populate("teacher", "name title expertise bio image user");

    if (!course)
      return res.status(404).json({ message: "Không tìm thấy khóa học" });

    // Teacher chỉ xem khóa của mình
    if (req.userDoc.role === "teacher") {
      const teacher = await findTeacherForUser(req.userDoc);
      if (!teacher || course.teacher?._id.toString() !== teacher._id.toString()) {
        return res.status(403).json({
          message: "Bạn không có quyền xem khóa học này",
        });
      }
    }

    res.json({
      _id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      image: course.image,
      category: course.category?.name || "Chưa có danh mục",
      teacher: course.teacher?.name || "Chưa có giảng viên",
      teacherTitle: course.teacher?.title || "",
      teacherExpertise: course.teacher?.expertise || "",
      teacherImage: course.teacher?.image || "",
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy chi tiết khóa học:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { title, description, teacher: teacherInput, price, category } =
      req.body;
    let imageUrl = "";

    // 1️⃣ Upload ảnh nếu có
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "courses",
        });
        imageUrl = result.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (imgErr) {
        console.warn("⚠️ Upload image failed:", imgErr.message);
        imageUrl = "";
      }
    }

    // 2️⃣ Kiểm tra category tồn tại
    const categoryExists = await Category.findById(category);
    if (!categoryExists)
      return res.status(400).json({ message: "Danh mục không tồn tại" });

    let teacherIdToUse;

    if (req.userDoc.role === "admin") {
      // admin: dùng teacher được gửi từ form
      teacherIdToUse = teacherInput;

      const teacherExists = await Teacher.findById(teacherIdToUse);
      if (!teacherExists)
        return res.status(400).json({ message: "Giảng viên không tồn tại" });
    } else if (req.userDoc.role === "teacher") {
      // teacher: tự động gán cho chính mình, không cho chọn người khác
      const teacher = await findTeacherForUser(req.userDoc);
      if (!teacher) {
        return res.status(403).json({
          message:
            "Không tìm thấy hồ sơ giảng viên cho tài khoản này. Vui lòng liên hệ quản trị.",
        });
      }
      teacherIdToUse = teacher._id;
    } else {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền tạo khóa học" });
    }

    // 3️⃣ Tạo course
    const course = await Course.create({
      title,
      description,
      teacher: teacherIdToUse,
      price,
      category,
      image: imageUrl,
    });

    // 4️⃣ Cập nhật teacher.coursesTaught bất đồng bộ
    (async () => {
      try {
        const teacherDoc = await Teacher.findById(teacherIdToUse);
        if (!teacherDoc) return;

        teacherDoc.coursesTaught = Array.isArray(teacherDoc.coursesTaught)
          ? teacherDoc.coursesTaught
          : [];

        teacherDoc.coursesTaught = teacherDoc.coursesTaught
          .filter((c) => mongoose.isValidObjectId(c))
          .map((c) => new mongoose.Types.ObjectId(c));

        if (
          !teacherDoc.coursesTaught.some(
            (c) => c.toString() === course._id.toString()
          )
        ) {
          teacherDoc.coursesTaught.push(
            new mongoose.Types.ObjectId(course._id)
          );
        }

        await teacherDoc.save();

        if (teacherDoc.updateCourseCount) {
          try {
            await teacherDoc.updateCourseCount();
          } catch (countErr) {
            console.warn("⚠️ Lỗi updateCourseCount:", countErr.message);
          }
        }
      } catch (err) {
        console.warn(
          "⚠️ Lỗi khi cập nhật teacher.coursesTaught bất đồng bộ:",
          err.message
        );
      }
    })();

    res.status(201).json({
      message: "Tạo khóa học thành công",
      course,
    });
  } catch (err) {
    console.error("❌ Lỗi khi tạo khóa học:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course)
      return res.status(404).json({ message: "Không tìm thấy khóa học" });

    if (req.userDoc.role === "teacher") {
      const teacher = await findTeacherForUser(req.userDoc);
      if (!teacher || course.teacher.toString() !== teacher._id.toString()) {
        return res.status(403).json({
          message: "Bạn không có quyền sửa khóa học này",
        });
      }
    }

    course.title = req.body.title || course.title;
    course.description = req.body.description || course.description;
    course.price = req.body.price || course.price;

    // admin mới được đổi teacher
    if (req.userDoc.role === "admin" && req.body.teacher) {
      const teacherExists = await Teacher.findById(req.body.teacher);
      if (!teacherExists)
        return res.status(400).json({ message: "Giảng viên không tồn tại" });
      course.teacher = req.body.teacher;
    }

    // cập nhật category nếu có
    if (req.body.category && req.body.category !== "") {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists)
        return res.status(400).json({ message: "Danh mục không tồn tại" });
      course.category = req.body.category;
    }

    // ảnh mới
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "courses",
        });
        course.image = result.secure_url;
        fs.unlinkSync(req.file.path);
      } catch (imgErr) {
        console.warn("⚠️ Upload image (update) failed:", imgErr.message);
      }
    }

    await course.save();
    res.json(course);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật khóa học:", error);
    res.status(500).json({ message: "Lỗi server khi cập nhật khóa học" });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course)
      return res.status(404).json({ message: "Không tìm thấy khóa học" });

    if (req.userDoc.role === "teacher") {
      const teacher = await findTeacherForUser(req.userDoc);
      if (!teacher || course.teacher.toString() !== teacher._id.toString()) {
        return res.status(403).json({
          message: "Bạn không có quyền xóa khóa học này",
        });
      }
    }

    await course.deleteOne();

    const teacherObj = await Teacher.findById(course.teacher);
    if (teacherObj) {
      teacherObj.coursesTaught = Array.isArray(teacherObj.coursesTaught)
        ? teacherObj.coursesTaught
        : [];

      teacherObj.coursesTaught = teacherObj.coursesTaught
        .filter((c) => mongoose.isValidObjectId(c))
        .map((c) => new mongoose.Types.ObjectId(c));

      teacherObj.coursesTaught = teacherObj.coursesTaught.filter(
        (c) => c.toString() !== course._id.toString()
      );

      try {
        await teacherObj.save();
        if (teacherObj.updateCourseCount) {
          try {
            await teacherObj.updateCourseCount();
          } catch (countErr) {
            console.warn("⚠️ Lỗi updateCourseCount:", countErr.message);
          }
        }
      } catch (saveErr) {
        console.warn(
          "⚠️ Lỗi khi lưu teacher sau khi xóa course:",
          saveErr.message
        );
      }
    }

    res.json({ message: "Đã xóa khóa học" });
  } catch (err) {
    console.error("❌ Lỗi khi xóa khóa học:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.getDropdowns = async (req, res) => {
  try {
    const categories = await Category.find().select("name");
    const teachers = await Teacher.find().select("name");
    res.json({ categories, teachers });
  } catch (err) {
    console.error("❌ Lỗi khi lấy dropdowns:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ===================== STUDENTS & PROGRESS ===================== */

// Danh sách học viên của 1 khóa
exports.getCourseStudents = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ message: "Không tìm thấy khóa học" });

    // Teacher chỉ được xem khóa của mình
    if (req.userDoc.role === "teacher") {
      const teacher = await findTeacherForUser(req.userDoc);
      if (!teacher || course.teacher.toString() !== teacher._id.toString()) {
        return res.status(403).json({
          message: "Bạn không có quyền xem khóa học này",
        });
      }
    }

    const totalLessons = countTotalLessons(course);

    // Học viên đã đăng ký / thanh toán (RegisterCourse)
    const regs = await RegisterCourse.find({
      courseId: courseId,
      paymentStatus: "paid",
    }).lean();

    const userIds = regs
      .map((r) => r.userId)
      .filter((id) => id && mongoose.isValidObjectId(id));

    const progresses = await Progress.find({
      course: courseId,
      user: { $in: userIds },
    }).lean();

    const progressMap = progresses.reduce((acc, p) => {
      acc[p.user.toString()] = p;
      return acc;
    }, {});

    const students = regs.map((r) => {
      const p = r.userId ? progressMap[r.userId.toString()] : null;
      return {
        registerId: r._id,
        userId: r.userId,
        name: r.studentName,
        email: r.email,
        phone: r.phone,
        paymentStatus: r.paymentStatus,
        percent: p?.percent || 0,
        lastLessonId: p?.lastLessonId || null, // 🔁 đồng bộ với schema Progress
        updatedAt: p?.updatedAt || r.updatedAt,
      };
    });

    res.json({
      courseId,
      totalLessons,
      students,
    });
  } catch (err) {
    console.error("❌ Lỗi getCourseStudents:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Tiến độ chi tiết 1 học viên trong khóa
exports.getStudentProgress = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { userId } = req.params;

    const course = await Course.findById(courseId);
    if (!course)
      return res.status(404).json({ message: "Không tìm thấy khóa học" });

    // check quyền teacher
    if (req.userDoc.role === "teacher") {
      const teacher = await findTeacherForUser(req.userDoc);
      if (!teacher || course.teacher.toString() !== teacher._id.toString()) {
        return res.status(403).json({
          message: "Bạn không có quyền xem tiến độ khóa học này",
        });
      }
    }

    const totalLessons = countTotalLessons(course);

    const [progress, user] = await Promise.all([
      Progress.findOne({ course: courseId, user: userId }).lean(),
      User.findById(userId).select("name email avatar").lean(),
    ]);

    if (!progress) {
      return res.json({
        courseId,
        userId,
        user,
        totalLessons,
        completedLessons: [],
        percent: 0,
      });
    }

    res.json({
      courseId,
      userId,
      user,
      totalLessons,
      completedLessons: progress.completedLessons || [],
      percent: progress.percent || 0,
      lastLessonId: progress.lastLessonId || null,
      updatedAt: progress.updatedAt,
    });
  } catch (err) {
    console.error("❌ Lỗi getStudentProgress:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/* ===================== CLASSES OF COURSE ===================== */
// GET /api/admin/courses/:id/classes
exports.getCourseClasses = async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Không tìm thấy khóa học" });
    }

    // Teacher chỉ xem lớp của khóa mình dạy
    if (req.userDoc.role === "teacher") {
      const teacher = await findTeacherForUser(req.userDoc);
      if (!teacher || course.teacher.toString() !== teacher._id.toString()) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xem lớp của khoá này" });
      }
    }

    const classes = await CourseClass.find({ course: courseId })
      .select("name code semester year")
      .sort({ createdAt: 1 })
      .lean();

    return res.json(classes);
  } catch (err) {
    console.error("❌ Lỗi getCourseClasses:", err);
    return res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

/* ===================== Q&A COURSE (ADMIN / TEACHER) ===================== */
/**
 * GET /api/admin/courses/:id/questions
 * Lấy danh sách câu hỏi Q&A của 1 khoá (cho admin/teacher – nếu còn dùng route này)
 */
exports.getCourseQuestions = async (req, res) => {
  try {
    const courseId = req.params.id || req.params.courseId;

    const questions = await Question.find({ course: courseId })
      .populate("user", "name avatar email")
      .populate("answeredBy", "name")
      .sort({ createdAt: -1 });

    return res.json({ success: true, questions });
  } catch (err) {
    console.error("❌ [ADMIN] getCourseQuestions error:", err);
    return res
      .status(500)
      .json({ message: "Không tải được danh sách câu hỏi." });
  }
};

/**
 * POST /api/admin/courses/:id/questions/:questionId/answer
 * Admin / Giảng viên trả lời câu hỏi (nếu còn dùng route admin này)
 */
exports.answerCourseQuestion = async (req, res) => {
  try {
    const courseId = req.params.id || req.params.courseId;
    const { questionId } = req.params;
    const { answer } = req.body;

    if (!answer || !answer.trim()) {
      return res
        .status(400)
        .json({ message: "Nội dung trả lời không được trống." });
    }

    const q = await Question.findById(questionId);
    if (!q) {
      return res.status(404).json({ message: "Không tìm thấy câu hỏi." });
    }

    // đảm bảo câu hỏi thuộc đúng khoá học đang xem
    if (courseId && String(q.course) !== String(courseId)) {
      return res
        .status(400)
        .json({ message: "Câu hỏi không thuộc khoá học này." });
    }

    q.answer = answer.trim();
    q.answeredBy = req.user?._id || null;
    q.isResolved = true;
    await q.save();

    const populated = await q
      .populate("user", "name avatar email")
      .populate("answeredBy", "name");

    return res.json({ success: true, question: populated });
  } catch (err) {
    console.error("❌ [ADMIN] answerCourseQuestion error:", err);
    return res.status(500).json({ message: "Không thể lưu câu trả lời." });
  }
};
