const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true }, // URL ảnh danh mục
    icon: { type: String, trim: true },  // icon nếu muốn hiển thị
    isActive: { type: Boolean, default: true },
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
  },
  { timestamps: true }
);

// Tự động tạo slug khi lưu
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
