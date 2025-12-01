// controllers/admin/adminUserController.js
const fs = require("fs");
const User = require("../../models/User");
const Teacher = require("../../models/Teacher");
const cloudinary = require("../../config/cloudinary");
const slugify = require("slugify");

/* ========== Helper: upload avatar lên Cloudinary ========== */
async function uploadAvatar(file) {
  if (!file) return "";

  const result = await cloudinary.uploader.upload(file.path, {
    folder: "avatars",
  });

  try {
    fs.unlinkSync(file.path);
  } catch (e) {}

  return result.secure_url;
}

async function ensureTeacherProfile(user, avatarUrlFromReq = "") {
  if (!user) return;

  if (user.role === "teacher") {
    let teacher = await Teacher.findOne({ user: user._id });

    const baseData = {
      name: user.name,
      image: avatarUrlFromReq || user.avatar || undefined,
      isActive: true,
    };

    if (!teacher) {
      // Tạo mới teacher gắn với user
      teacher = await Teacher.create({
        ...baseData,
        user: user._id,
        slug: slugify(user.name || "teacher", { lower: true, strict: true }),
      });
    } else {
      // Cập nhật lại thông tin từ User
      teacher.name = baseData.name || teacher.name;
      if (baseData.image) teacher.image = baseData.image;
      teacher.isActive = true;
      await teacher.save();
    }
  } else {
    // Không còn là giảng viên -> disable hồ sơ teacher (không xoá)
    await Teacher.updateOne(
      { user: user._id },
      { $set: { isActive: false } }
    ).catch(() => {});
  }
}

/* ========== GET /api/admin/users ========== */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();

    const userIds = users.map((u) => u._id);
    const teacherProfiles = await Teacher.find({
      user: { $in: userIds },
      isActive: true, // chỉ tính hồ sơ teacher đang active
    })
      .select("user")
      .lean();

    const mapTeacherByUser = teacherProfiles.reduce((acc, t) => {
      acc[t.user.toString()] = true;
      return acc;
    }, {});

    const enriched = users.map((u) => ({
      ...u,
      hasTeacherProfile: !!mapTeacherByUser[u._id.toString()],
    }));

    res.json(enriched);
  } catch (err) {
    console.error("❌ getUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========== GET /api/admin/users/:id ========== */
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const teacher = await Teacher.findOne({ user: user._id, isActive: true })
      .select("_id")
      .lean();

    res.json({
      ...user,
      hasTeacherProfile: !!teacher,
      teacherId: teacher?._id || null,
    });
  } catch (err) {
    console.error("❌ getUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========== POST /api/admin/users ========== */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let avatarUrl = "";

    if (req.file) {
      avatarUrl = await uploadAvatar(req.file);
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      avatar: avatarUrl,
    });

    // Nếu là giảng viên -> tự khởi tạo hồ sơ Teacher
    await ensureTeacherProfile(user, avatarUrl);

    res.status(201).json(user);
  } catch (err) {
    console.error("❌ createUser error:", err);
    res
      .status(400)
      .json({ message: err.message || "Cannot create user" });
  }
};

/* ========== PUT /api/admin/users/:id ========== */
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, role } = req.body;
    let avatarUrl = "";

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    if (req.file) {
      avatarUrl = await uploadAvatar(req.file);
      user.avatar = avatarUrl;
    }

    await user.save();

    // Đồng bộ hồ sơ giáo viên (nếu cần)
    await ensureTeacherProfile(user, avatarUrl);

    res.json({ message: "User updated", user });
  } catch (err) {
    console.error("❌ updateUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========== DELETE /api/admin/users/:id ========== */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Nếu có hồ sơ giáo viên -> xoá luôn để không bị rác
    await Teacher.deleteOne({ user: user._id }).catch(() => {});

    await user.deleteOne();
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("❌ deleteUser error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========== PUT /api/admin/users/:id/role ========== */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    // Nếu đổi sang / đổi khỏi teacher -> sync hồ sơ teacher
    await ensureTeacherProfile(user);

    res.json({ message: "Role updated" });
  } catch (err) {
    console.error("❌ updateUserRole error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ========== PUT /api/admin/users/:id/avatar ========== */
const updateUserAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!req.file)
      return res.status(400).json({ message: "No file uploaded" });

    const avatarUrl = await uploadAvatar(req.file);
    user.avatar = avatarUrl;
    await user.save();

    // Cập nhật avatar sang Teacher (nếu có)
    await ensureTeacherProfile(user, avatarUrl);

    res.json({ message: "Avatar updated", user });
  } catch (err) {
    console.error("❌ updateUserAvatar error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// 🧩 Đổi mật khẩu User: PUT /api/admin/users/:id/password
const updateUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Mật khẩu phải từ 6 ký tự trở lên" });
    }

    // ⚠️ ĐOẠN NÀY GIẢ SỬ BẠN ĐÃ HASH PASSWORD Ở User MODEL (pre('save'))
    // chỉ cần gán password mới, save lại là được
    user.password = password;

    await user.save();

    res.json({ message: "Đã cập nhật mật khẩu mới" });
  } catch (err) {
    console.error("❌ updateUserPassword error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserAvatar,
  updateUserPassword,
};
