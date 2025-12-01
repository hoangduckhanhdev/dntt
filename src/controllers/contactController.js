const Contact = require("../models/Contact");


exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findOne();
    if (!contact) return res.status(404).json({ message: "Không tìm thấy dữ liệu liên hệ" });
    res.json(contact);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi server" });
  }
};


exports.createContact = async (req, res) => {
  try {
    const newContact = new Contact(req.body);
    await newContact.save();
    res.status(201).json({ message: "Thêm liên hệ thành công", data: newContact });
  } catch (err) {
    res.status(400).json({ message: "Lỗi khi thêm liên hệ", error: err.message });
  }
};


exports.updateContact = async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate({}, req.body, { new: true });
    if (!contact) return res.status(404).json({ message: "Không tìm thấy dữ liệu để cập nhật" });
    res.json({ message: "Cập nhật liên hệ thành công", data: contact });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi cập nhật", error: err.message });
  }
};


exports.deleteContact = async (req, res) => {
  try {
    await Contact.deleteMany({});
    res.json({ message: "Đã xóa toàn bộ thông tin liên hệ" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa liên hệ", error: err.message });
  }
};
