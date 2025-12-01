const express = require("express");
const router = express.Router();
const RegisterCourse = require("../models/registerCourse");

// 🟢 1. API đăng ký khóa học
router.post("/", async (req, res) => {
  try {
    const { studentName, email, phone, courseId, note } = req.body;

    // Kiểm tra trùng lặp
    const existing = await RegisterCourse.findOne({ email, courseId });
    if (existing) {
      return res.status(400).json({
        message:
          existing.paymentStatus === "paid"
            ? "Bạn đã đăng ký và thanh toán khóa học này rồi."
            : "Bạn đã đăng ký nhưng chưa thanh toán.",
      });
    }

    // Tạo bản ghi mới
    const register = new RegisterCourse({
      studentName,
      email,
      phone,
      courseId,
      note,
      paymentStatus: "pending",
      paymentMethod: "PayOS", // mặc định là PayOS
    });

    await register.save();
    res.json({
      message: "Đăng ký thành công. Vui lòng tiến hành thanh toán.",
      data: register,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server khi đăng ký." });
  }
});

// 🟢 2. API cập nhật trạng thái thanh toán thủ công (ví dụ admin xác nhận)
router.put("/confirm/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await RegisterCourse.findByIdAndUpdate(id, { paymentStatus: "paid" });
    res.json({ message: "Cập nhật thanh toán thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật thanh toán." });
  }
});

// 🟢 3. API kiểm tra đăng ký bằng email hoặc số điện thoại
router.get("/check", async (req, res) => {
  try {
    const { email, phone } = req.query;

    if (!email && !phone) {
      return res.status(400).json({ message: "Cần nhập email hoặc số điện thoại." });
    }

    const query = email ? { email } : { phone };
    const register = await RegisterCourse.findOne(query).populate("courseId");

    if (!register) {
      return res.status(404).json({ message: "Không tìm thấy đăng ký nào." });
    }

    res.json(register);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi khi kiểm tra đăng ký." });
  }
});

module.exports = router;
