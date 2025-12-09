const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const Course = require("../models/Course");
const Category = require("../models/Category");
const Teacher = require("../models/Teacher");
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Kết nối DB thành công"))
  .catch((err) => console.error("Lỗi kết nối DB:", err));
async function fixCourses() {
  const courses = await Course.find();
  console.log(` Có ${courses.length} khóa học cần kiểm tra...`);
  for (let course of courses) {
    let updated = false;
    if (course.category && typeof course.category === "string") {
      const category = await Category.findOne({ name: course.category });
      if (category) {
        console.log(`Cập nhật category cho khóa học "${course.title}" → ${category.name}`);
        course.category = category._id;
        updated = true;
      } else {
        console.log(` Không tìm thấy category: ${course.category}`);
      }
    }
    if (course.teacher && typeof course.teacher === "string") {
      const teacher = await Teacher.findOne({ name: course.teacher });
      if (teacher) {
        console.log(` Cập nhật teacher cho khóa học "${course.title}" → ${teacher.name}`);
        course.teacher = teacher._id;
        updated = true;
      } else {
        console.log(` Không tìm thấy teacher: ${course.teacher}`);
      }
    }
    if (updated) {
      await course.save();
    }
  }
  console.log(" Đã cập nhật toàn bộ khóa học!");
  mongoose.disconnect();
}
fixCourses();
