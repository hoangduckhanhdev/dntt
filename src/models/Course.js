// models/Course.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // không bắt buộc
  userName: { type: String },                                   // lưu nhanh tên hiển thị
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  video: { type: String },              // URL YouTube (watch / youtu.be / embed…)
  duration: { type: String },           // ví dụ "08:20"
  order: { type: Number, default: 0 },
});

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  lessons: { type: [lessonSchema], default: [] },
  order: { type: Number, default: 0 },
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    price: { type: Number, default: 0 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    teacher:  { type: mongoose.Schema.Types.ObjectId, ref: "Teacher",  required: true },

    image: { type: String },

    // hiển thị demo và outline
    videoDemo: { type: String },
    sections: { type: [sectionSchema], default: [] },

    // ⭐️ số học viên đã thanh toán (sẽ tự tăng khi đơn "paid")
    students: { type: Number, default: 0 },

    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Giữ nguyên
courseSchema.methods.updateRating = function () {
  if (this.reviews.length > 0) {
    const avg = this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
    this.rating = Math.round(avg * 10) / 10;
  } else {
    this.rating = 0;
  }
  return this.save();
};

module.exports = mongoose.model("Course", courseSchema);
