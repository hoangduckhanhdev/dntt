
const mongoose = require("mongoose");
const slugify = require("slugify");

const teacherSchema = new mongoose.Schema(
  {
    // 🔗 Liên kết 1–1 với User
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true, 
    },

    name: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    expertise: { type: String, trim: true },
    bio: { type: String, trim: true },

    image: { type: String, trim: true },

    rating: { type: Number, default: 0 },
    totalCourses: { type: Number, default: 0 },
    intro: { type: String, trim: true },                
    teachingExperience: { type: String, trim: true },   
    teachingStyle: { type: String, trim: true },        
    achievements: { type: [String], default: [] },      
    coursesTaught: [{ type: String, trim: true }],

    // slug là duy nhất, cho phép null (sparse) và tự sinh nếu không gửi lên
    slug: { type: String, unique: true, index: true, sparse: true },

    isActive: { type: Boolean, default: true },

    // Thông tin liên hệ
    phone: { type: String, trim: true },
    zaloLink: { type: String, trim: true },
    messengerLink: { type: String, trim: true },
    registerLink: { type: String, trim: true },
  },
  { timestamps: true }
);

teacherSchema.pre("validate", function (next) {
  try {
    if (!this.slug && this.name) {
      const base = slugify(this.name, { lower: true, strict: true }) || "teacher";
      // thêm đuôi thời gian để tránh trùng
      this.slug = `${base}-${Date.now().toString(36)}`;
    }
    next();
  } catch (e) {
    next(e);
  }
});
teacherSchema.methods.updateCourseCount = async function () {
  const Course = mongoose.model("Course");
  this.totalCourses = await Course.countDocuments({ teacher: this._id });
  return this.save();
};

module.exports =
  mongoose.models.Teacher || mongoose.model("Teacher", teacherSchema);
