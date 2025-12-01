// ======================= AI LEARNING ANALYZER (CLEAN VERSION) =========================
const ExamAttempt = require("../models/ExamAttempt");
const ExamQuestionBank = require("../models/ExamQuestionBank");
const Skill = require("../models/Skill");
const OpenAI = require("openai");

// Khởi tạo OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ============================================================
   1) BUILD TREE (parentSkill → children)
============================================================ */
function buildMindmapTree(skills) {
  const map = {};
  skills.forEach((s) => {
    map[s._id] = { ...s, children: [] };
  });

  const roots = [];

  skills.forEach((s) => {
    if (s.parentSkill && map[s.parentSkill]) {
      map[s.parentSkill].children.push(map[s._id]);
    } else {
      roots.push(map[s._id]);
    }
  });

  return roots;
}

/* ============================================================
   2) HÀM PHÂN TÍCH THUẦN (KHÔNG DÍNH res/json)
   → dùng chung cho cả API JSON & API ảnh
============================================================ */
async function analyzeAttemptPure(attemptId) {
  const attempt = await ExamAttempt.findById(attemptId)
    .populate({
      path: "exam",
      populate: { path: "course", model: "Course" },
    })
    .lean();

  if (!attempt) return null;

  const courseId = attempt.exam?.course?._id;
  if (!courseId) return null;

  const answers = attempt.answers || [];
  const questionIds = answers.map((a) => a.question);

  const questions = await ExamQuestionBank.find({
    _id: { $in: questionIds },
  })
    .populate("skill")
    .lean();

  // Build performance từng skill
  const skillMap = {};

  answers.forEach((ans) => {
    const q = questions.find((x) => String(x._id) === String(ans.question));
    if (!q || !q.skill) return;

    const sid = String(q.skill._id);

    if (!skillMap[sid]) {
      skillMap[sid] = {
        skill: q.skill,
        correct: 0,
        total: 0,
      };
    }

    skillMap[sid].total++;
    if (ans.score >= ans.maxScore) skillMap[sid].correct++;
  });

  const skillPerformance = Object.values(skillMap).map((s) => ({
    skillId: s.skill._id,
    name: s.skill.name,
    parent: s.skill.parentSkill,
    percent: s.total ? Math.round((s.correct / s.total) * 100) : 0,
    correct: s.correct,
    total: s.total,
  }));

  const classified = skillPerformance.map((s) => ({
    ...s,
    status:
      s.percent >= 80 ? "strong" : s.percent < 50 ? "weak" : "medium",
  }));

  // Build mindmap JSON cho toàn bộ skill course
  const allSkills = await Skill.find({ course: courseId }).lean();
  const mindmap = buildMindmapTree(allSkills);

  return {
    attempt,
    courseId,
    skills: classified,
    mindmap,
  };
}

/* ============================================================
   3) API: PHÂN TÍCH KỸ NĂNG SAU BÀI THI (TRẢ JSON)
   GET /api/learning/analyze/:attemptId
============================================================ */
exports.analyzeLearningAfterExam = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const baseData = await analyzeAttemptPure(attemptId);
    if (!baseData) {
      return res.status(404).json({
        ok: false,
        message: "Không tìm thấy bài làm hoặc khoá học.",
      });
    }

    // Nếu chưa cấu hình OpenAI thì chỉ trả dữ liệu phân tích thô
    if (!process.env.OPENAI_API_KEY) {
      return res.json({
        ok: true,
        ...baseData,
        ai: {
          weakSkills: [],
          strongSkills: [],
          recommendations: [],
          summary:
            "OpenAI API key chưa được cấu hình. Hệ thống chỉ trả về dữ liệu kỹ năng thô.",
        },
      });
    }

    const aiPrompt = `
Dữ liệu kết quả kỹ năng (JSON):
${JSON.stringify(baseData.skills, null, 2)}

Hãy phân tích và trả về JSON:
{
  "weakSkills": [...],          // danh sách kỹ năng còn yếu (theo tên)
  "strongSkills": [...],        // danh sách kỹ năng tốt (theo tên)
  "recommendations": [...],     // 3-7 gợi ý học tập cụ thể, ngắn gọn
  "summary": "Tóm tắt nhận xét 2-3 câu bằng tiếng Việt, xưng hô 'bạn'."
}
`;

    const aiRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: aiPrompt }],
      temperature: 0.2,
    });

    const raw = aiRes.choices[0]?.message?.content || "{}";
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    let aiJSON = {};

    try {
      aiJSON = JSON.parse(raw.substring(jsonStart, jsonEnd + 1));
    } catch (e) {
      console.warn("⚠️ Không parse được JSON từ OpenAI, raw =", raw);
      aiJSON = {
        weakSkills: [],
        strongSkills: [],
        recommendations: [],
        summary:
          "AI không phân tích được dữ liệu. Bạn hãy hỏi lại giáo viên để được tư vấn lộ trình học.",
      };
    }

    return res.json({
      ok: true,
      ...baseData,
      ai: aiJSON,
    });
  } catch (err) {
    console.error("❌ analyzeLearningAfterExam error:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error khi phân tích kỹ năng.",
    });
  }
};

/* ============================================================
   4) API: TẠO ẢNH SƠ ĐỒ TƯ DUY PNG
   GET /api/learning/mindmap-image/:attemptId
============================================================ */
exports.generateMindmapImage = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const baseData = await analyzeAttemptPure(attemptId);
    if (!baseData || !baseData.mindmap) {
      return res.status(400).json({
        ok: false,
        message: "Không tạo được JSON sơ đồ tư duy (mindmap).",
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        message:
          "OpenAI API key chưa được cấu hình, không thể tạo sơ đồ tư duy hình ảnh.",
      });
    }

    const prompt = `
Vẽ sơ đồ tư duy (mindmap) từ JSON cấu trúc cây sau (nodes có 'name' và 'children'):
${JSON.stringify(baseData.mindmap, null, 2)}

Yêu cầu:
- Xuất ra hình PNG, kích thước 1024x1024
- Màu pastel nhẹ, hiện đại, dễ nhìn
- Các nhánh rõ ràng, có tiêu đề từng kỹ năng
- Có thể dùng icon nhỏ cho các nhánh chính nếu muốn
`;

    const img = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
    });

    const base64 = img.data[0]?.b64_json;
    if (!base64) {
      return res.status(500).json({
        ok: false,
        message: "Không nhận được dữ liệu ảnh từ OpenAI.",
      });
    }

    const buffer = Buffer.from(base64, "base64");

    res.setHeader("Content-Type", "image/png");
    return res.send(buffer);
  } catch (err) {
    console.error("❌ generateMindmapImage error:", err);
    return res.status(500).json({
      ok: false,
      message: "Server error khi tạo sơ đồ tư duy hình ảnh.",
    });
  }
};
