const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Course = require("../models/Course");
const Category = require("../models/Category");
const Teacher = require("../models/Teacher");

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Kết nối MongoDB thành công"))
  .catch((err) => console.error("❌ Lỗi kết nối MongoDB:", err));

async function fixCourses() {
  try {
    const courses = await Course.find();
    console.log(`🔍 Có ${courses.length} khóa học cần kiểm tra...`);

    const categories = await Category.find();
    const teachers = await Teacher.find();

    // Tạo map nhanh
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.name.trim().toLowerCase()] = cat._id;
    });

    const teacherMap = {};
    teachers.forEach((tch) => {
      teacherMap[tch.name.trim().toLowerCase()] = tch._id;
    });

    for (const course of courses) {
      let updated = false;

      // 🔹 Nếu category là chuỗi, chuyển sang ObjectId tương ứng
      if (typeof course.category === "string") {
        const catId = categoryMap[course.category.trim().toLowerCase()];
        if (catId) {
          course.category = catId;
          updated = true;
          console.log(`🟢 Sửa category cho: ${course.title}`);
        } else {
          console.log(`⚠️ Không tìm thấy category: ${course.category}`);
        }
      }

      // 🔹 Nếu teacher là chuỗi, chuyển sang ObjectId tương ứng
      if (typeof course.teacher === "string") {
        const tchId = teacherMap[course.teacher.trim().toLowerCase()];
        if (tchId) {
          course.teacher = tchId;
          updated = true;
          console.log(`🟢 Sửa teacher cho: ${course.title}`);
        } else {
          console.log(`⚠️ Không tìm thấy teacher: ${course.teacher}`);
        }
      }

      if (updated) await course.save();
    }

    console.log("🎉 Đã cập nhật toàn bộ khóa học!");
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật:", err);
  } finally {
    mongoose.disconnect();
  }
}

fixCourses();
