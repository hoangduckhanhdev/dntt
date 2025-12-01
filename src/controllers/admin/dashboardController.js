// controllers/admin/dashboardController.js
const User = require("../../models/User");
const Teacher = require("../../models/Teacher");
const Course = require("../../models/Course");
const Blog = require("../../models/Blog");
const Category = require("../../models/Category");

let Order;
try {
  Order = require("../../models/Order");
} catch {
  console.warn("⚠️ Không tìm thấy model Order — bỏ qua thống kê doanh thu.");
}

let RegisterCourse;
try {
  RegisterCourse = require("../../models/registerCourse");
} catch {
  console.warn("⚠️ Không tìm thấy model RegisterCourse — bỏ qua thống kê học viên theo khóa.");
}

// helper format label tháng/năm
const monthLabel = (y, m) => `T${m}/${y}`;

/**
 * GET /api/admin/dashboard
 * Dashboard cho ADMIN (có doanh thu)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // ---------- Tổng số liệu cơ bản ----------
    const [users, teachers, courses, blogs] = await Promise.all([
      User.countDocuments(),
      Teacher.countDocuments(),
      Course.countDocuments(),
      Blog.countDocuments(),
    ]);

    // ---------- User theo tháng (6 tháng gần nhất, tách năm) ----------
    const since6m = new Date();
    since6m.setMonth(since6m.getMonth() - 5); // gồm cả tháng hiện tại

    const userStatsAgg = await User.aggregate([
      { $match: { createdAt: { $gte: since6m } } },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          users: { $sum: 1 },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } },
    ]);

    const userStats = userStatsAgg.map((r) => ({
      name: monthLabel(r._id.y, r._id.m),
      users: r.users,
    }));

    // ---------- Khóa học theo danh mục ----------
    const courseByCategoryAgg = await Course.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: Category.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "cat",
        },
      },
      {
        $project: {
          count: 1,
          name: { $ifNull: [{ $arrayElemAt: ["$cat.name", 0] }, "Không rõ"] },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const courseByCategory = courseByCategoryAgg.map((x) => ({
      name: x.name,
      count: x.count,
    }));

    // ---------- Doanh thu (chỉ tính đơn "paid") ----------
    let totalRevenue = 0;
    let revenueStats = [];
    let revenueDaily = [];
    let todayRevenue = 0;
    let todayOrders = 0;

    if (Order) {
      // Tổng doanh thu
      const totalAgg = await Order.aggregate([
        { $match: { status: "paid" } },
        { $group: { _id: null, sum: { $sum: "$total" } } },
      ]);
      totalRevenue = totalAgg[0]?.sum || 0;

      // Doanh thu theo tháng (12 tháng gần nhất)
      const since12m = new Date();
      since12m.setMonth(since12m.getMonth() - 11);

      const revMonthlyAgg = await Order.aggregate([
        { $match: { status: "paid", createdAt: { $gte: since12m } } },
        {
          $group: {
            _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1 } },
      ]);
      revenueStats = revMonthlyAgg.map((r) => ({
        name: monthLabel(r._id.y, r._id.m),
        revenue: r.revenue,
      }));

      // Doanh thu theo ngày (7 ngày gần nhất)
      const since7d = new Date();
      since7d.setDate(since7d.getDate() - 6); // gồm hôm nay

      const revDailyAgg = await Order.aggregate([
        { $match: { status: "paid", createdAt: { $gte: since7d } } },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            revenue: { $sum: "$total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
      ]);
      const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
      revenueDaily = revDailyAgg.map((r) => ({
        date: `${pad(r._id.d)}/${pad(r._id.m)}`,
        revenue: r.revenue,
        orders: r.orders,
      }));

      // Đơn & doanh thu hôm nay
      const startToday = new Date();
      startToday.setHours(0, 0, 0, 0);
      const todayAgg = await Order.aggregate([
        { $match: { status: "paid", createdAt: { $gte: startToday } } },
        {
          $group: {
            _id: null,
            sum: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
      ]);
      todayRevenue = todayAgg[0]?.sum || 0;
      todayOrders = todayAgg[0]?.count || 0;
    }

    // ---------- Trả dữ liệu ----------
    res.json({
      success: true,
      data: {
        total: {
          users,
          teachers,
          courses,
          blogs,
          totalRevenue,
          todayRevenue,
          todayOrders,
        },
        charts: {
          userStats,
          courseByCategory,
          revenueStats, // monthly
          revenueDaily, // last 7 days
        },
      },
    });
  } catch (err) {
    console.error("❌ Dashboard error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =====================
// 🔹 Dashboard dành cho GIÁO VIÊN (không có doanh thu)
// =====================

// tìm Teacher theo user đang đăng nhập
async function findTeacherForUser(userDoc) {
  if (!userDoc) return null;
  return Teacher.findOne({ user: userDoc._id }).lean();
}

exports.getTeacherDashboard = async (req, res) => {
  try {
    // chỉ cho role teacher dùng
    if (!req.userDoc || req.userDoc.role !== "teacher") {
      return res
        .status(403)
        .json({ message: "Chỉ giáo viên mới xem được thống kê này." });
    }

    const teacher = await findTeacherForUser(req.userDoc);
    if (!teacher) {
      return res.status(404).json({
        message:
          "Không tìm thấy hồ sơ giáo viên cho tài khoản này. Vui lòng liên hệ quản trị.",
      });
    }

    // khoá học do giáo viên này dạy
    const myCourses = await Course.find({ teacher: teacher._id })
      .select("_id title students createdAt")
      .lean();

    const totalMyCourses = myCourses.length;
    const myCourseIds = myCourses.map((c) => c._id);

    // tổng số lượt đăng ký đã thanh toán các khoá của mình
    let totalMyStudents = 0;
    if (RegisterCourse && myCourseIds.length > 0) {
      totalMyStudents = await RegisterCourse.countDocuments({
        courseId: { $in: myCourseIds },
        paymentStatus: "paid",
      });
    }

    // 5 khoá mới nhất
    const latestCourses = [...myCourses]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    res.json({
      success: true,
      teacherName: teacher.name || req.userDoc.name,
      totalMyCourses,
      totalMyStudents,
      latestCourses,
    });
  } catch (err) {
    console.error("❌ Teacher dashboard error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
