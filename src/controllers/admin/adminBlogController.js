const mongoose = require("mongoose");
const Blog = require("../../models/Blog");

// ========================= LẤY TẤT CẢ BLOG =========================
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy dữ liệu blog",
    });
  }
};

// ========================= TẠO BLOG MỚI =========================
exports.createBlog = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề và nội dung là bắt buộc",
      });
    }

    const blogData = {
      title,
      content,
      category: category || "Tin tức",
      tags: typeof tags === "string" ? JSON.parse(tags) : tags || [],
      author: req.user.id,
    };

    // ✅ DÙNG URL CLOUDINARY
    if (req.file) {
      // CloudinaryStorage gán URL vào path (và thường có cả secure_url)
      blogData.thumbnail = req.file.path || req.file.secure_url;
    }

    const blog = await Blog.create(blogData);
    res.status(201).json({ success: true, data: blog });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: "Validation Error", errors: messages });
    }
    res.status(500).json({
      success: false,
      message: "Không thể tạo blog mới",
      error: error.message,
    });
  }
};

// ========================= CẬP NHẬT BLOG =========================
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID blog không hợp lệ" });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Tiêu đề và nội dung là bắt buộc",
      });
    }

    const blogData = {
      title,
      content,
      category: category || "Tin tức",
      tags: typeof tags === "string" ? JSON.parse(tags) : tags || [],
    };

    // ✅ Nếu có thumbnail mới, dùng URL Cloudinary
    if (req.file) {
      blogData.thumbnail = req.file.path || req.file.secure_url;
    }

    const blog = await Blog.findByIdAndUpdate(req.params.id, blogData, {
      new: true,
      runValidators: true,
    });

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog không tồn tại" });
    }

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Không thể cập nhật blog",
      error: error.message,
    });
  }
};

// ========================= XÓA BLOG =========================
exports.deleteBlog = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "ID blog không hợp lệ" });
    }

    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog không tồn tại" });
    }

    res.status(200).json({ success: true, message: "Xóa blog thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa blog",
    });
  }
};

// ========================= TÌM KIẾM BLOG =========================
exports.searchBlogs = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Cần query để tìm kiếm" });
    }

    const blogs = await Blog.find({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
      ],
    })
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tìm kiếm blog" });
  }
};
