const Blog = require("../models/Blog");
const slugify = require("slugify");

// Hàm sinh thumbnail ngẫu nhiên
const generateThumbnail = () => {
  const randomId = Math.floor(Math.random() * 1000);
  return `https://picsum.photos/seed/${randomId}/800/400`;
};

// GET /api/blog?search=&category=&page=1&limit=6
exports.getAllBlogs = async (req, res) => {
  try {
    const { search = "", category = "", page = 1, limit = 6 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (search) filter.title = { $regex: search, $options: "i" };

    const skip = (Number(page) - 1) * Number(limit);

    const [blogs, total] = await Promise.all([
      Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Blog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      blogs,
    });
  } catch (e) {
    console.error("❌ Lỗi lấy danh sách blog:", e);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// GET /api/blog/:slug
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog)
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết." });
    res.json({ success: true, blog });
  } catch (e) {
    console.error("❌ Lỗi lấy chi tiết:", e);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// POST /api/blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, category, author, thumbnail, tags = [] } = req.body;
    if (!title || !content) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu tiêu đề hoặc nội dung." });
    }

    // Slug: nếu người dùng gửi sẵn, chuẩn hóa; nếu không, tạo ở pre-save
    let slug = req.body.slug?.trim();
    if (slug) slug = slugify(slug, { lower: true, strict: true });

    // Nếu không có thumbnail, sinh ngẫu nhiên
    const finalThumbnail = thumbnail && thumbnail.trim() ? thumbnail : generateThumbnail();

    const blog = await Blog.create({
      title,
      content,
      category,
      author,
      thumbnail: finalThumbnail,
      tags,
      slug,
    });

    res.status(201).json({ success: true, message: "📝 Đã tạo bài viết mới!", blog });
  } catch (e) {
    console.error("❌ Lỗi tạo blog:", e);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// PUT /api/blog/:id
exports.updateBlog = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.title) data.slug = slugify(data.title, { lower: true, strict: true });

    const updated = await Blog.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!updated)
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết." });

    res.json({ success: true, message: "Cập nhật thành công!", blog: updated });
  } catch (e) {
    console.error("❌ Lỗi cập nhật:", e);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// DELETE /api/blog/:id
exports.deleteBlog = async (req, res) => {
  try {
    const del = await Blog.findByIdAndDelete(req.params.id);
    if (!del)
      return res.status(404).json({ success: false, message: "Không tìm thấy bài viết." });
    res.json({ success: true, message: "🗑️ Đã xóa bài viết." });
  } catch (e) {
    console.error("❌ Lỗi xóa:", e);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
