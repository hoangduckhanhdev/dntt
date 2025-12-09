const Course = require("../models/Course");
const Order = require("../models/Order");
const cloudinary = require("../config/cloudinary");
const { hasCourseAccess } = require("../utils/hasCourseAccess");
const lessonCount = (sections = []) =>
  sections.reduce((a, s) => a + (Array.isArray(s?.lessons) ? s.lessons.length : 0), 0);
const uploadFromBuffer = (buffer, folder = "courses", resource_type = "image") =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
const toNumber = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const sanitizeSections = (sections) => {
  try {
    if (typeof sections === "string") sections = JSON.parse(sections);
  } catch {
    sections = [];
  }
  if (!Array.isArray(sections)) sections = [];
  return sections.map((s, i) => ({
    title: String(s?.title || `Chương ${i + 1}`),
    order: toNumber(s?.order, i + 1),
    lessons: Array.isArray(s?.lessons)
      ? s.lessons.map((l, j) => ({
          title: String(l?.title || `Bài ${j + 1}`),
          duration: l?.duration ? String(l.duration) : undefined,
          video: l?.video ? String(l.video) : undefined,
          order: toNumber(l?.order, j + 1),
        }))
      : [],
  }));
};
exports.getCourses = async (req, res) => {
  try {
    const { search } = req.query;
    const query = search ? { title: { $regex: search, $options: "i" } } : {};
    const courses = await Course.find(query)
      .populate("teacher", "name avatar expertise")
      .populate("category", "name image")
      .lean();
    res.json(
      courses.map((c) => ({
        ...c,
        totalSections: c.sections?.length || 0,
        totalLessons: lessonCount(c.sections),
      }))
    );
  } catch (err) {
    console.error(" getCourses:", err);
    res.status(500).json({ message: "Lỗi khi lấy khóa học", error: err.message });
  }
};
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("teacher", "name avatar expertise")
      .populate("category", "name image description")
      .populate("reviews.user", "name")
      .lean();
    if (!course) return res.status(404).json({ message: "Không tìm thấy khóa học" });
    course.totalSections = course.sections?.length || 0;
    course.totalLessons = lessonCount(course.sections);
    res.json(course);
  } catch (err) {
    console.error(" getCourseById:", err);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết khóa học", error: err.message });
  }
};
exports.getCourseOutlineSmart = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).json({ message: "Không tìm thấy khóa học" });
    const canAccess = await hasCourseAccess(req.user, course);
    const raw =
      course.sections ||
      course.chapters ||
      course.curriculum ||
      course.outline ||
      [];
    const sections = (raw || []).map((sec, sIdx) => ({
      title: sec?.title || sec?.name || `Chương ${sIdx + 1}`,
      lessons: (sec?.lessons || []).map((ls, lIdx) => {
        const video = canAccess ? (ls?.video || "") : ""; 
        return {
          title: ls?.title || ls?.name || `Bài ${lIdx + 1}`,
          duration: ls?.duration || "",
          video,
          locked: !canAccess, 
        };
      }),
    }));
    res.json({
      success: true,
      canAccess,
      demoVideo: course.demoVideo || course.videoDemo || course.introVideo || "",
      sections,
    });
  } catch (error) {
    console.error(" Lỗi khi lấy outline:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
exports.getReviews = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .select("reviews rating")
      .populate("reviews.user", "name")
      .lean();
    if (!course) return res.status(404).json({ message: "Không tìm thấy khóa học" });
    res.json(course.reviews || []);
  } catch (err) {
    console.error(" getReviews:", err);
    res.status(500).json({ message: "Lỗi khi lấy đánh giá", error: err.message });
  }
};
exports.addReview = async (req, res) => {
  try {
    const { user, userName, rating, comment } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Không tìm thấy khóa học" });
    course.reviews.push({
      user,
      userName: (userName || "Người dùng").trim(),
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      comment: comment || "",
      createdAt: new Date(),
    });
    await course.updateRating?.(); 
    const updated = await Course.findById(req.params.id)
      .populate("teacher", "name avatar expertise")
      .populate("category", "name image")
      .populate("reviews.user", "name");
    res.status(201).json({ message: "Đã thêm đánh giá", course: updated });
  } catch (err) {
    console.error(" addReview:", err);
    res.status(500).json({ message: "Lỗi khi gửi đánh giá", error: err.message });
  }
};
exports.getRelatedCourses = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select("category _id");
    if (!course) return res.status(404).json({ message: "Không tìm thấy khóa học" });
    const related = await Course.find({
      _id: { $ne: course._id },
      category: course.category,
    })
      .limit(4)
      .populate("teacher", "name")
      .populate("category", "name")
      .lean();
    res.json(
      related.map((c) => ({
        ...c,
        totalSections: c.sections?.length || 0,
        totalLessons: lessonCount(c.sections),
      }))
    );
  } catch (err) {
    console.error(" getRelatedCourses:", err);
    res.status(500).json({ message: "Lỗi khi lấy khoá học liên quan", error: err.message });
  }
};
exports.getCoursesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    if (categoryId) {
      const courses = await Course.find({ category: categoryId })
        .populate("teacher", "name avatar")
        .populate("category", "name")
        .lean();
      return res.json(
        courses.map((c) => ({
          ...c,
          totalSections: c.sections?.length || 0,
          totalLessons: lessonCount(c.sections),
        }))
      );
    }
    const allCourses = await Course.find()
      .populate("teacher", "name avatar")
      .populate("category", "name")
      .lean();
    const grouped = allCourses.reduce((acc, course) => {
      const cat = course.category;
      if (!cat) return acc;
      const found = acc.find((g) => g.category._id.toString() === cat._id.toString());
      const item = {
        ...course,
        totalSections: course.sections?.length || 0,
        totalLessons: lessonCount(course.sections),
      };
      if (found) found.courses.push(item);
      else acc.push({ category: cat, courses: [item] });
      return acc;
    }, []);
    res.json(grouped);
  } catch (err) {
    console.error(" getCoursesByCategory:", err);
    res.status(500).json({ message: "Không thể lấy khóa học theo danh mục" });
  }
};
exports.createCourse = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file?.path) {
      data.image = req.file.path; 
    } else if (req.file?.buffer) {
      const result = await uploadFromBuffer(req.file.buffer, "courses", "image");
      data.image = result.secure_url;
    }
    const course = await Course.create(data);
    res.status(201).json(course);
  } catch (err) {
    console.error(" createCourse:", err);
    res.status(500).json({ message: "Không thể tạo khóa học", error: err.message });
  }
};
exports.updateCourse = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file?.path) {
      data.image = req.file.path;
    } else if (req.file?.buffer) {
      const result = await uploadFromBuffer(req.file.buffer, "courses", "image");
      data.image = result.secure_url;
    }
    const updated = await Course.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!updated) return res.status(404).json({ message: "Không tìm thấy khóa học" });
    res.json(updated);
  } catch (err) {
    console.error(" updateCourse:", err);
    res.status(500).json({ message: "Không thể cập nhật khóa học", error: err.message });
  }
};
exports.deleteCourse = async (req, res) => {
  try {
    const del = await Course.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ message: "Không tìm thấy khóa học" });
    res.json({ message: "Đã xóa khóa học" });
  } catch (err) {
    console.error(" deleteCourse:", err);
    res.status(500).json({ message: "Không thể xóa khóa học", error: err.message });
  }
};
exports.updateCurriculum = async (req, res) => {
  try {
    const videoDemo = req.body.videoDemo || undefined;
    const sections = sanitizeSections(req.body.sections);
    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: { videoDemo, sections } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Không tìm thấy khóa học" });
    res.json({
      ok: true,
      totalSections: updated.sections.length,
      totalLessons: lessonCount(updated.sections),
    });
  } catch (err) {
    console.error(" updateCurriculum:", err);
    res.status(500).json({ message: "Không thể cập nhật curriculum", error: err.message });
  }
};
exports.rebuildStudents = async (req, res) => {
  try {
    await Course.updateMany({}, { $set: { students: 0 } });
    const paidOrders = await Order.find({ status: "paid", counted: true })
      .select("items")
      .lean();
    const incMap = new Map(); 
    for (const o of paidOrders) {
      for (const it of o.items || []) {
        const cid = String(it.course);
        const qty = Math.max(1, Number(it.qty || 1));
        incMap.set(cid, (incMap.get(cid) || 0) + qty);
      }
    }
    const ops = [];
    for (const [courseId, qty] of incMap.entries()) {
      ops.push({
        updateOne: {
          filter: { _id: courseId },
          update: { $inc: { students: qty } },
        },
      });
    }
    if (ops.length) await Course.bulkWrite(ops);
    res.json({ ok: true, updatedCourses: ops.length });
  } catch (err) {
    console.error(" rebuildStudents:", err);
    res.status(500).json({ message: "Không thể rebuild students", error: err.message });
  }
};