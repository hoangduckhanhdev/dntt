// controllers/admin/adminTeacherController.js
const Teacher = require("../../models/Teacher");
const User = require("../../models/User"); // 🔗 liên kết với User
const slugify = require("slugify");
const cloudinary = require("../../config/cloudinary");

// ✅ Helper: Lấy public_id từ URL Cloudinary
const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  // URL mẫu: https://res.cloudinary.com/<cloud_name>/image/upload/v123456/teachers/abc123.webp
  const parts = url.split("/");
  const folderAndFile = parts.slice(-2).join("/"); // teachers/abc123.webp
  return folderAndFile.replace(/\.[^/.]+$/, ""); // bỏ đuôi .webp
};

// ✅ Helper: tìm / tạo / ĐỒNG BỘ User cho giáo viên
async function ensureUserForTeacher({ name, email, password, userId, avatar }) {
  let user = null;

  // 1) Nếu truyền userId từ FE -> dùng luôn
  if (userId) {
    user = await User.findById(userId);
  }

  // 2) Nếu không có userId nhưng có email -> tìm theo email
  if (!user && email) {
    user = await User.findOne({ email });
  }

  // 3) Nếu chưa có user nhưng có email + password -> tạo mới
  if (!user && email && password) {
    user = await User.create({
      name,
      email,
      password,
      role: "teacher",
      avatar: avatar || "",
    });
  }

  // 4) Nếu đã có user -> đảm bảo role = teacher & sync avatar, name, email
  if (user) {
    // role
    if (user.role !== "teacher") {
      user.role = "teacher";
    }

    // avatar
    if (avatar && !user.avatar) {
      user.avatar = avatar;
    }

    // name
    if (name && user.name !== name) {
      user.name = name;
    }

    // 🔥 email: chỉ đổi nếu truyền email & không trùng user khác
    if (email && user.email !== email) {
      const duplicated = await User.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (!duplicated) {
        user.email = email;
      } else {
        console.warn(
          "⚠️ Không thể cập nhật email User vì email đã được dùng bởi user khác:",
          email
        );
      }
    }

    await user.save();
  }

  return user;
}

/* ===================== LẤY DANH SÁCH TEACHER ===================== */
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ createdAt: -1 });

    const formatted = teachers.map((t) => ({
      _id: t._id,
      name: t.name,
      title: t.title || "",
      expertise: t.expertise || "",
      bio: t.bio || "",
      intro: t.intro || "",
      image: t.image || "https://via.placeholder.com/64.png?text=Avatar",
      rating: t.rating || 0,
      totalCourses: t.totalCourses || 0,
      teachingExperience: t.teachingExperience || "",
      teachingStyle: t.teachingStyle || "",
      achievements: t.achievements || [],
      coursesTaught: t.coursesTaught || [],
      phone: t.phone || "",
      zaloLink: t.zaloLink || "",
      messengerLink: t.messengerLink || "",
      registerLink: t.registerLink || "",
      isActive: typeof t.isActive === "boolean" ? t.isActive : true,
      slug: t.slug || slugify(t.name, { lower: true, strict: true }),
      user: t.user || null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    res.json({ success: true, teachers: formatted });
  } catch (err) {
    console.error("❌ Lỗi khi lấy teacher:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* ===================== TẠO TEACHER MỚI ===================== */
exports.createTeacher = async (req, res) => {
  try {
    const {
      name,
      title,
      expertise,
      bio,
      intro,
      teachingExperience,
      teachingStyle,
      achievementsText,
      phone,
      zaloLink,
      messengerLink,
      registerLink,
      email,
      password,
      userId,
    } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Tên giáo viên là bắt buộc" });
    }

    const existed = await Teacher.findOne({ name });
    if (existed) {
      return res
        .status(400)
        .json({ success: false, message: "Giáo viên đã tồn tại" });
    }

    // list achievements (mỗi dòng 1 ý)
    let achievements = [];
    if (achievementsText) {
      achievements = achievementsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    // Ảnh
    let imageUrl = null;
    if (req.file) {
      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "teachers" },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(req.file.buffer);
        });
        imageUrl = uploadResult.secure_url;
      } catch (upErr) {
        console.warn("⚠️ Upload ảnh teacher thất bại:", upErr.message);
      }
    } else if (req.body.image) {
      imageUrl = req.body.image;
    }

    // đồng bộ User
    let user = null;
    try {
      user = await ensureUserForTeacher({
        name,
        email,
        password,
        userId,
        avatar: imageUrl,
      });
    } catch (uErr) {
      console.warn("⚠️ Không thể đồng bộ User cho Teacher:", uErr.message);
    }

    const teacher = await Teacher.create({
      name,
      title,
      expertise,
      bio,
      intro,
      teachingExperience,
      teachingStyle,
      achievements,
      phone,
      zaloLink,
      messengerLink,
      registerLink,
      image: imageUrl,
      slug: slugify(name, { lower: true, strict: true }),
      isActive: true,
      user: user ? user._id : undefined,
    });

    res.status(201).json({ success: true, teacher });
  } catch (err) {
    console.error("❌ Lỗi khi tạo teacher:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* ===================== CẬP NHẬT TEACHER ===================== */
exports.updateTeacher = async (req, res) => {
  try {
    const {
      name,
      title,
      expertise,
      bio,
      intro,
      teachingExperience,
      teachingStyle,
      achievementsText,
      phone,
      zaloLink,
      messengerLink,
      registerLink,
      isActive,
      email,
      userId,
    } = req.body;

    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy giáo viên" });
    }

    // Ảnh
    if (req.file) {
      if (teacher.image) {
        const publicId = getPublicIdFromUrl(teacher.image);
        if (publicId) {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (delErr) {
            console.warn("⚠️ Không thể xóa ảnh cũ:", delErr.message);
          }
        }
      }

      try {
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "teachers" },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(req.file.buffer);
        });
        teacher.image = uploadResult.secure_url;
      } catch (upErr) {
        console.warn("⚠️ Upload ảnh mới teacher thất bại:", upErr.message);
      }
    } else if (req.body.image) {
      teacher.image = req.body.image;
    }

    if (name) {
      teacher.name = name;
      teacher.slug = slugify(name, { lower: true, strict: true });
    }
    if (title) teacher.title = title;
    if (expertise) teacher.expertise = expertise;
    if (bio) teacher.bio = bio;
    if (intro) teacher.intro = intro;
    if (teachingExperience) teacher.teachingExperience = teachingExperience;
    if (teachingStyle) teacher.teachingStyle = teachingStyle;
    if (phone) teacher.phone = phone;
    if (zaloLink) teacher.zaloLink = zaloLink;
    if (messengerLink) teacher.messengerLink = messengerLink;
    if (registerLink) teacher.registerLink = registerLink;

    if (achievementsText !== undefined) {
      teacher.achievements = achievementsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (typeof isActive === "boolean") {
      teacher.isActive = isActive;
    } else if (typeof isActive === "string") {
      teacher.isActive = isActive === "true";
    }

    // ======= ĐỒNG BỘ USER <-> TEACHER (name, avatar, email, role) =======
    let user = null;
    const currentUserId = teacher.user ? teacher.user.toString() : null;

    try {
      user = await ensureUserForTeacher({
        name: teacher.name,
        email,
        userId: userId || currentUserId,
        avatar: teacher.image,
      });

      if (user) {
        teacher.user = user._id;
      }
    } catch (uErr) {
      console.warn(
        "⚠️ Không thể đồng bộ User khi update teacher:",
        uErr.message
      );
    }

    await teacher.save();
    res.json({ success: true, teacher });
  } catch (err) {
    console.error("❌ Lỗi khi cập nhật teacher:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

/* ===================== XOÁ TEACHER ===================== */
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy giáo viên" });
    }

    // Xóa ảnh Cloudinary nếu có
    if (teacher.image) {
      const publicId = getPublicIdFromUrl(teacher.image);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.warn("⚠️ Không thể xóa ảnh:", err.message);
        }
      }
    }

    // Cập nhật User liên quan (nếu có)
    if (teacher.user) {
      try {
        await User.findByIdAndUpdate(teacher.user, {
          $set: { role: "student" },
        });
      } catch (err) {
        console.warn(
          "⚠️ Không thể cập nhật role User khi xóa teacher:",
          err.message
        );
      }
    }

    await teacher.deleteOne();
    res.json({ success: true, message: "Đã xóa giáo viên" });
  } catch (err) {
    console.error("❌ Lỗi khi xóa teacher:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
