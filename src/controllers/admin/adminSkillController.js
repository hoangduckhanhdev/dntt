// src/controllers/admin/adminSkillController.js
const Skill = require("../../models/Skill");
const Course = require("../../models/Course");
const xlsx = require("xlsx"); // thêm để đọc file Excel

/* =========================
   Lấy danh sách skill theo course
   GET /api/admin/skills?course=COURSE_ID
========================= */
exports.getSkills = async (req, res) => {
  try {
    const { course } = req.query;

    const filter = {};
    if (course) filter.course = course;

    const skills = await Skill.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.json(skills);
  } catch (err) {
    console.error("getSkills error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   Lấy chi tiết 1 skill
   GET /api/admin/skills/:id
========================= */
exports.getSkill = async (req, res) => {
  try {
    const id = req.params.id;
    const skill = await Skill.findById(id).lean();

    if (!skill) return res.status(404).json({ message: "Skill not found" });

    res.json(skill);
  } catch (err) {
    console.error("getSkill error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   Tạo mới skill
   POST /api/admin/skills
========================= */
exports.createSkill = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.course || !b.name) {
      return res
        .status(400)
        .json({ message: "Thiếu course hoặc name cho skill" });
    }

    // Kiểm tra course tồn tại
    const course = await Course.findById(b.course);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Tìm order lớn nhất trong cùng course + cùng parentSkill để đẩy xuống cuối
    const siblingsFilter = {
      course: b.course,
      parentSkill: b.parentSkill || null,
    };

    const lastSibling = await Skill.findOne(siblingsFilter)
      .sort({ order: -1 })
      .lean();

    const nextOrder = lastSibling ? (lastSibling.order || 0) + 1 : 1;

    const skill = await Skill.create({
      course: b.course,
      name: b.name,
      description: b.description || "",
      parentSkill: b.parentSkill || null,
      level: b.level || "intermediate",
      order:
        typeof b.order === "number" && b.order >= 0 ? b.order : nextOrder,
    });

    res.status(201).json(skill);
  } catch (err) {
    console.error("createSkill error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   Cập nhật skill
   PUT /api/admin/skills/:id
========================= */
exports.updateSkill = async (req, res) => {
  try {
    const b = req.body || {};
    const id = req.params.id;

    const skill = await Skill.findById(id);
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    if (b.name !== undefined) skill.name = b.name;
    if (b.description !== undefined) skill.description = b.description;
    if (b.level !== undefined) skill.level = b.level;
    if (b.order !== undefined) skill.order = b.order;
    if (b.parentSkill !== undefined) skill.parentSkill = b.parentSkill || null;

    await skill.save();
    res.json(skill);
  } catch (err) {
    console.error("updateSkill error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   Xoá skill
   DELETE /api/admin/skills/:id
========================= */
exports.deleteSkill = async (req, res) => {
  try {
    const id = req.params.id;

    const skill = await Skill.findByIdAndDelete(id);
    if (!skill) return res.status(404).json({ message: "Skill not found" });

    // Các skill con đang trỏ parentSkill = skill._id → set parentSkill = null
    await Skill.updateMany(
      { parentSkill: id },
      { $set: { parentSkill: null } }
    );

    res.json({ message: "Skill deleted" });
  } catch (err) {
    console.error("deleteSkill error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   Reorder skill (kéo–thả)
   POST /api/admin/skills/reorder/list
   body: { items: [{ _id, order }, ...] }
========================= */
exports.reorderSkills = async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res
        .status(400)
        .json({ message: "Thiếu danh sách items để reorder" });
    }

    const ops = items.map((it) => ({
      updateOne: {
        filter: { _id: it._id },
        update: { $set: { order: it.order } },
      },
    }));

    await Skill.bulkWrite(ops);

    res.json({ message: "Reorder thành công" });
  } catch (err) {
    console.error("reorderSkills error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   IMPORT SKILL MAP TỪ EXCEL/CSV
   POST /api/admin/skills/import
   form-data:
     - file: (xlsx/xls/csv)
     - course: courseId
========================= */
exports.importSkills = async (req, res) => {
  try {
    const courseId = req.body.course || req.body.courseId;
    if (!courseId) {
      return res.status(400).json({ message: "Thiếu course trong request" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Thiếu file import" });
    }

    // kiểm tra course tồn tại
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // đọc file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
      return res.status(400).json({ message: "File không có dữ liệu" });
    }

    // Đang giả định cấu trúc:
    // name | description | level | order
    // (giống như mình note ở FE)
    const created = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      const name = (row.name || row.Name || "").toString().trim();
      if (!name) continue; // bỏ dòng trống

      let level = (row.level || row.Level || "intermediate").toString().trim();
      const levelLower = level.toLowerCase();
      if (!["beginner", "intermediate", "advanced"].includes(levelLower)) {
        level = "intermediate";
      } else {
        level = levelLower;
      }

      let orderVal = row.order ?? row.Order;
      if (orderVal === "" || orderVal === undefined || orderVal === null) {
        orderVal = 0;
      }
      orderVal = Number(orderVal) || 0;

      const description =
        (row.description || row.Description || "").toString().trim();

      const skill = await Skill.create({
        course: courseId,
        name,
        description,
        level,
        order: orderVal,
        parentSkill: null, // import đơn giản, không dùng nhóm ở file
      });

      created.push(skill);
    }

    res.json({
      message: "Import Skill Map thành công",
      count: created.length,
      items: created,
    });
  } catch (err) {
    console.error("importSkills error:", err);
    res.status(500).json({ message: "Server error khi import Skill Map" });
  }
};
