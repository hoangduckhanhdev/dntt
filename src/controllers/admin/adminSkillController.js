const Skill = require("../../models/Skill");
const Course = require("../../models/Course");
const xlsx = require("xlsx"); 
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
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
exports.createSkill = async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.course || !b.name) {
      return res
        .status(400)
        .json({ message: "Thiếu course hoặc name cho skill" });
    }
    const course = await Course.findById(b.course);
    if (!course) return res.status(404).json({ message: "Course not found" });
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
exports.deleteSkill = async (req, res) => {
  try {
    const id = req.params.id;
    const skill = await Skill.findByIdAndDelete(id);
    if (!skill) return res.status(404).json({ message: "Skill not found" });
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
exports.importSkills = async (req, res) => {
  try {
    const courseId = req.body.course || req.body.courseId;
    if (!courseId) {
      return res.status(400).json({ message: "Thiếu course trong request" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Thiếu file import" });
    }
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    if (!rows.length) {
      return res.status(400).json({ message: "File không có dữ liệu" });
    }
    const created = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = (row.name || row.Name || "").toString().trim();
      if (!name) continue; 
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
        parentSkill: null, 
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
exports.aiSuggestSkills = async (req, res) => {
  try {
    const {
      courseId,
      topic,
      difficulty = "intermediate",
      targetAudience = "beginner developers",
      language = "vi",
    } = req.body || {};
    if (!courseId) {
      return res
        .status(400)
        .json({ message: "Thiếu courseId trong request body" });
    }
    const courseDoc = await Course.findById(courseId).lean();
    if (!courseDoc) {
      return res.status(404).json({ message: "Course not found" });
    }
    const finalTopic =
      topic ||
      `Khoá học: ${courseDoc.title}. Nội dung: ${
        courseDoc.description || "đào tạo kỹ năng lập trình"
      }`;
    const outputLanguage =
      language === "en"
        ? "English"
        : "Vietnamese (tự nhiên, dễ hiểu, ngắn gọn)";
    const systemPrompt = `
Bạn là chuyên gia thiết kế lộ trình học và skill map dạng sơ đồ tư duy cho các khoá học lập trình / IT.
Nhiệm vụ:
- Phân rã topic khoá học thành các kỹ năng con theo cấu trúc tree (cha/con).
- Mỗi skill có:
  - name: Tên kỹ năng, ngắn gọn (3–8 từ).
  - description: Mô tả ngắn (1–2 câu) tập trung vào outcome, không lan man.
  - level: "beginner" | "intermediate" | "advanced".
  - parentName: tên skill cha (string) hoặc null nếu là skill gốc.
  - order: số thứ tự trong cùng cấp (0,1,2,3…).
Yêu cầu:
- Trả về JSON THUẦN theo schema sau, không thêm giải thích, không thêm text ngoài JSON:
{
  "skills": [
    {
      "name": "...",
      "description": "...",
      "level": "beginner|intermediate|advanced",
      "parentName": null | "Tên kỹ năng cha",
      "order": 0
    }
  ]
}
- Sử dụng ngôn ngữ: ${outputLanguage}.
- Ưu tiên khoảng 15–25 kỹ năng, chia thành 3–5 nhóm chính (skill gốc), mỗi nhóm có các skill con rõ ràng.
`;
    const userPrompt = `
Thiết kế skill map cho topic sau:
Topic / Khoá học: ${finalTopic}
Độ khó mong muốn chính của khoá học: ${difficulty}
Đối tượng học: ${targetAudience}
`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });
    const raw = completion.choices?.[0]?.message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("aiSuggestSkills JSON parse error:", e, raw);
      return res.status(500).json({
        message: "AI trả về dữ liệu không hợp lệ.",
        raw,
      });
    }
    const skills = Array.isArray(parsed.skills) ? parsed.skills : [];
    if (!skills.length) {
      return res.status(400).json({
        message: "AI không tạo được danh sách kỹ năng.",
      });
    }
    await Skill.deleteMany({ course: courseId });
    const createdDocs = [];
    const nameToId = {};
    for (let i = 0; i < skills.length; i++) {
      const s = skills[i];
      const name = (s.name || "").toString().trim();
      if (!name) continue;
      let level = (s.level || difficulty || "intermediate")
        .toString()
        .toLowerCase();
      if (!["beginner", "intermediate", "advanced"].includes(level)) {
        level = "intermediate";
      }
      let orderVal =
        typeof s.order === "number" ? s.order : Number(i) || 0;
      const description = (s.description || "").toString().trim();
      const doc = await Skill.create({
        course: courseId,
        name,
        description,
        level,
        order: orderVal,
        parentSkill: null, 
      });
      createdDocs.push(doc);
      nameToId[name.toLowerCase()] = doc._id;
    }
    for (let i = 0; i < skills.length; i++) {
      const s = skills[i];
      const childName = (s.name || "").toString().trim();
      const parentName = (s.parentName || "").toString().trim();
      if (!childName || !parentName) continue;
      const childId = nameToId[childName.toLowerCase()];
      const parentId = nameToId[parentName.toLowerCase()];
      if (childId && parentId) {
        await Skill.updateOne(
          { _id: childId },
          { $set: { parentSkill: parentId } }
        );
      }
    }
    const allSkills = await Skill.find({ course: courseId })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return res.json(allSkills);
  } catch (err) {
    console.error("aiSuggestSkills error:", err);
    return res.status(500).json({
      message: "Server error khi AI gợi ý Skill Map",
    });
  }
};
