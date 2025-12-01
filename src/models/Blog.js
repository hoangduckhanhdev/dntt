const mongoose = require("mongoose");
const slugify = require("slugify");

const BlogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    content: { type: String, required: true }, // hỗ trợ HTML
    thumbnail: { type: String, default: "" },  // auto ảnh nếu chưa có
    category: { type: String, default: "Tin tức" },
    tags: { type: [String], default: [] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hàm tạo thumbnail ngẫu nhiên
const generateThumbnail = () => {
  const randomId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${randomId}/800/400`;
};

// Pre-save hook
BlogSchema.pre("save", async function (next) {
  // Tạo slug duy nhất
  if (this.isModified("title") || !this.slug) {
    const base = slugify(this.title, { lower: true, strict: true });
    let slug = base;
    let i = 1;
    while (await mongoose.models.Blog.findOne({ slug })) {
      slug = `${base}-${i++}`;
    }
    this.slug = slug;
  }

  // Tạo thumbnail nếu chưa có
  if (!this.thumbnail) {
    this.thumbnail = generateThumbnail();
  }

  next();
});

module.exports = mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
