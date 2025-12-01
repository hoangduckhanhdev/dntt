const About = require("../models/About");

// 🔸 Lấy dữ liệu giới thiệu
exports.getAbout = async (req, res) => {
  try {
    const about = await About.findOne();
    if (!about) {
      return res.status(404).json({ message: "Không tìm thấy dữ liệu giới thiệu" });
    }
    res.json(about);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔸 Tạo mới
exports.createAbout = async (req, res) => {
  try {
    const newAbout = new About(req.body);
    await newAbout.save();
    res.status(201).json(newAbout);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 🔸 Cập nhật (update)
exports.updateAbout = async (req, res) => {
  try {
    const updated = await About.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ message: "Không tìm thấy dữ liệu để cập nhật" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// 🔸 Xóa (delete)
exports.deleteAbout = async (req, res) => {
  try {
    const deleted = await About.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Không tìm thấy dữ liệu để xóa" });
    res.json({ message: "Đã xóa thành công" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
