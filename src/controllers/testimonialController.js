const Testimonial = require("../models/Testimonial");

// 📌 Lấy tất cả testimonials
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json(testimonials);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy testimonials", error: err.message });
  }
};

// 📌 Thêm mới (dành cho admin)
exports.createTestimonial = async (req, res) => {
  try {
    const testimonial = new Testimonial(req.body);
    await testimonial.save();
    res.status(201).json(testimonial);
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi tạo testimonial", error: err.message });
  }
};
