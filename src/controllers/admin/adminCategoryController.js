const Category = require("../../models/Category");

// ✅ Lấy danh sách danh mục (bao gồm cả dữ liệu cũ chưa có isActive)
exports.getCategories = async (req, res) => {
  try {
    // Nếu isActive không tồn tại, mặc định coi là true
    const categories = await Category.find().sort({ createdAt: -1 });

    // Đảm bảo isActive luôn là boolean
    const formatted = categories.map(cat => ({
      _id: cat._id,
      name: cat.name,
      description: cat.description || "",
      image: cat.image || "",
      icon: cat.icon || "",
      slug: cat.slug || "",
      isActive: typeof cat.isActive === "boolean" ? cat.isActive : true,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    res.json({ success: true, categories: formatted });
  } catch (err) {
    console.error("❌ Lỗi khi lấy danh mục:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ✅ Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image, icon } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Tên danh mục là bắt buộc" });

    const existed = await Category.findOne({ name });
    if (existed)
      return res.status(400).json({ success: false, message: "Danh mục này đã tồn tại" });

    const category = await Category.create({ name, description, image, icon });
    res.status(201).json({ success: true, category });
  } catch (err) {
    console.error("❌ Lỗi khi tạo danh mục:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ✅ Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, image, icon, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category)
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });

    // Cập nhật các trường nếu có
    category.name = name || category.name;
    category.description = description || category.description;
    category.image = image || category.image;
    category.icon = icon || category.icon;
    if (typeof isActive === "boolean") category.isActive = isActive;

    await category.save();
    res.json({ success: true, category });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật danh mục:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ✅ Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ success: false, message: "Không tìm thấy danh mục" });

    await category.deleteOne();
    res.json({ success: true, message: "Đã xóa danh mục" });
  } catch (err) {
    console.error("❌ Lỗi khi xóa danh mục:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
