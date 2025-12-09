const { z } = require("zod");
const Course = require("../models/Course");
const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const ExamQuestionBank = require("../models/ExamQuestionBank");
const Skill = require("../models/Skill");
const googleTTS = require("google-tts-api"); // ✅ thêm dòng này

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `
Bạn là Chatbox AI của HKCode.
- Luôn trả lời tiếng Việt, thân thiện.
- Ngắn gọn, ưu tiên gợi ý hữu ích.
- Nếu backend đã tự tạo HTML (thẻ <div>, <h3>, <a> /course/...), hãy giữ nguyên nội dung đó,
  không tự ý sửa HTML.
`;

function escapeHtml(str = "") {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ===== Helpers cho chat khóa học ===== */

function extractLastUserText(messages = []) {
  const userMsgs = (messages || []).filter((m) => m.role === "user");
  const last = userMsgs[userMsgs.length - 1];
  if (!last) return "";
  return typeof last.content === "string"
    ? last.content
    : last.content?.text || "";
}

function parseCourseQuery(text) {
  const lower = (text || "").toLowerCase();
  if (!lower.includes("khóa học")) return null;

  const priceMatch = lower.match(/(\d[\d\.]*)/);
  let maxPrice = null;
  if (priceMatch) {
    const nStr = priceMatch[1].replace(/[^\d]/g, "");
    const n = parseInt(nStr, 10);
    if (!Number.isNaN(n)) maxPrice = n;
  }

  let keyword = null;
  if (lower.includes("lập trình web") || lower.includes("web")) {
    keyword = "web";
  }

  return { maxPrice, keyword };
}

async function findCoursesForQuery(q) {
  const filter = {};

  if (q.maxPrice != null) {
    filter.$or = [
      { price: { $lte: q.maxPrice } },
      { salePrice: { $lte: q.maxPrice } },
    ];
  }

  if (q.keyword) {
    filter.title = new RegExp(q.keyword, "i");
  }

  const courses = await Course.find(filter)
    .sort({ price: 1 })
    .limit(3)
    .lean();

  return courses;
}

function buildCourseCardsHtml(courses = []) {
  if (!courses.length) {
    return `
<p>Hiện mình chưa tìm thấy khóa học nào phù hợp với yêu cầu này trên HKCode.</p>
<p>Bạn có thể thử nhập lại: ví dụ "gửi cho tôi khóa học lập trình web dưới 5.000".</p>
`.trim();
  }

  const items = courses
    .map((c) => {
      const title = escapeHtml(c.title || "Khóa học HKCode");

      // 👉 LUÔN ưu tiên dùng _id để điều hướng /course/:id
      const courseParam = c._id ? String(c._id) : "";
      const hasLink = !!courseParam;

      // danh mục / giảng viên: chỉ hiển thị khi có dữ liệu
      const rawCategory = c.category?.name || c.categoryName || "";
      const rawTeacher = c.teacher?.fullName || c.teacherName || "";

      const categoryName = rawCategory ? escapeHtml(rawCategory) : "";
      const teacherName = rawTeacher ? escapeHtml(rawTeacher) : "";

      const ratingAvg =
        typeof c.ratingAverage === "number"
          ? c.ratingAverage.toFixed(1).replace(".0", "")
          : "0";
      const students =
        typeof c.studentCount === "number" ? c.studentCount : 0;

      const priceRaw =
        typeof c.salePrice === "number"
          ? c.salePrice
          : typeof c.price === "number"
          ? c.price
          : 0;
      const price = `${priceRaw.toLocaleString("vi-VN")}đ`;

      const shortDesc = escapeHtml(
        c.shortDescription ||
          c.subtitle ||
          "Khóa học giúp bạn nắm vững kiến thức quan trọng trong chủ đề này."
      );

      const linkHtml = hasLink
        ? `<a href="/course/${escapeHtml(
            courseParam
          )}" style="color:#f97316;font-weight:600">
             Xem chi tiết &amp; đăng ký
           </a>`
        : `<span style="color:#9ca3af;">
             Liên hệ HKCode để xem chi tiết khóa học
           </span>`;

      const infoPieces = [];
      if (categoryName) infoPieces.push(`Danh mục: ${categoryName}`);
      if (teacherName) infoPieces.push(`Giảng viên: ${teacherName}`);

      const ratingPart = `⭐ ${ratingAvg}/5 • ${students} học viên`;
      const infoLine =
        infoPieces.length > 0
          ? `${infoPieces.join(" • ")} • ${ratingPart}`
          : ratingPart;

      return `
<div class="hk-course-card" style="margin-bottom:16px">
  <h3 style="font-size:18px;font-weight:600;margin-bottom:4px">
    ${title} — ${price}
  </h3>
  <p style="font-size:13px;color:#555;margin-bottom:4px">
    ${infoLine}
  </p>
  <p style="margin-bottom:6px">
    ${linkHtml}
  </p>
  <p style="font-size:14px;color:#333">
    ${shortDesc}
  </p>
</div>`;
    })
    .join("\n");

  const intro = `<p>Mình tìm được một số khóa học phù hợp trên HKCode:</p>`;
  return `${intro}\n${items}`;
}

/* ====== CHAT BOX ====== */

exports.chat = async (req, res) => {
  try {
    if (!OPENAI_KEY) {
      return res.status(500).json({
        ok: false,
        error: "Thiếu OPENAI_API_KEY trên server.",
      });
    }

    const { messages = [] } = req.body || {};

    const lastText = extractLastUserText(messages);
    const courseQuery = parseCourseQuery(lastText);

    if (courseQuery) {
      try {
        const courses = await findCoursesForQuery(courseQuery);
        const html = buildCourseCardsHtml(courses);
        return res.json({ ok: true, text: html });
      } catch (dbErr) {
        console.error("Lỗi truy vấn Course cho chatbox:", dbErr);
      }
    }

    const resp = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    const data = await resp.json();
    const answer =
      data?.choices?.[0]?.message?.content ||
      "Xin lỗi, hiện mình không trả lời được.";
    return res.json({ ok: true, text: answer });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: err.message });
  }
};

/* ====== CÁC HÀM KHÁC GIỮ NGUYÊN ====== */

exports.gradeEssay = async (req, res) => {
  try {
    const { question, studentAnswer, maxScore = 10 } = req.body;
    const prompt = `
Chấm điểm tự luận theo format JSON.
Câu hỏi: ${question}
Bài làm: ${studentAnswer}
Yêu cầu trả về:
{
  "score": số từ 0 đến ${maxScore},
  "comment": "nhận xét tiếng Việt"
}
`;
    const ai = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await ai.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed = { score: 0, comment: "Không phân tích được" };
    try {
      parsed = JSON.parse(raw);
    } catch (e) {}
    res.json({
      ok: true,
      scoreSuggestion: parsed.score,
      commentSuggestion: parsed.comment,
    });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: err.message });
  }
};

exports.explainAnswer = async (req, res) => {
  try {
    if (!OPENAI_KEY) {
      return res
        .status(500)
        .json({ ok: false, error: "Thiếu OPENAI_API_KEY trên server." });
    }
    const {
      questionId,
      questionContent = "",
      type = "",
      options = [],
      studentAnswer = {},
      score = 0,
      maxScore = 0,
    } = req.body || {};
    const selectedOptionIds = (studentAnswer.selectedOptionIds || []).map(
      String
    );
    const answerText = studentAnswer.answerText || "";
    const optionLines = options.map((op, idx) => {
      const label = String.fromCharCode(65 + idx);
      const tag = op.isCorrect ? " (đáp án đúng)" : "";
      return `${label}. ${op.text}${tag}`;
    });
    const correctOptions = options.filter((op) => op.isCorrect);
    const correctAnswerText =
      correctOptions.length > 0
        ? correctOptions.map((op) => op.text).join("; ")
        : "";
    const studentSelectedTexts = options
      .filter((op) => selectedOptionIds.includes(String(op.id)))
      .map((op) => op.text);
    let studentAnswerText = "";
    if (type === "multiple_choice" || type === "true_false") {
      if (studentSelectedTexts.length > 0) {
        studentAnswerText = studentSelectedTexts.join("; ");
      } else if (answerText) {
        studentAnswerText = answerText;
      } else {
        studentAnswerText = "(Không trả lời)";
      }
    } else {
      studentAnswerText = answerText || "(Không trả lời)";
    }
    const humanType =
      type === "multiple_choice"
        ? "Trắc nghiệm"
        : type === "true_false"
        ? "Đúng/Sai"
        : type === "short_answer"
        ? "Tự luận ngắn"
        : type === "essay"
        ? "Bài luận"
        : "Khác";
    const prompt = `
Bạn là trợ lý giải thích đáp án bài kiểm tra cho học viên người Việt, có thể là các môn: tiếng Anh, toán, lập trình, logic...
Thông tin câu hỏi:
- Loại câu hỏi: ${humanType}
- Nội dung câu hỏi: ${questionContent}
Các lựa chọn (nếu có):
${optionLines.join("\n")}
Đáp án đúng theo hệ thống: ${
      correctAnswerText || "(có thể là câu tự luận, không có lựa chọn rõ ràng)"
    }
Câu trả lời của học viên: ${studentAnswerText}
Điểm hệ thống chấm: ${score}/${maxScore}
YÊU CẦU:
- Giải thích NGẮN GỌN, dễ hiểu, bằng tiếng Việt.
- Tập trung đúng vào kiến thức của môn đó (nếu là toán: giải thích từng bước; lập trình: giải thích logic/code; tiếng Anh: ngữ pháp/từ vựng; ...).
- Giải thích vì sao câu trả lời của học viên đúng hoặc sai.
- Giải thích vì sao đáp án đúng là hợp lý nhất.
- Đưa ra 1 mẹo nhỏ giúp học viên làm tốt hơn ở lần sau.
- Không nhắc tới "AI", "mô hình ngôn ngữ", "tôi chỉ là...".
Hãy TRẢ VỀ đúng chuẩn JSON, không thêm chữ nào ngoài JSON:
{
  "verdict": "Đúng" hoặc "Sai" hoặc "Chưa trả lời",
  "explanation": "Giải thích ngắn gọn vì sao câu trả lời của học viên đúng hoặc sai.",
  "correctAnswerText": "Nội dung (hoặc danh sách) đáp án đúng.",
  "reasonCorrect": "Giải thích vì sao đáp án đúng là hợp lý nhất.",
  "tip": "Một mẹo ngắn giúp học viên làm tốt hơn với dạng câu hỏi tương tự."
}
`;
    const ai = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await ai.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("❌ Lỗi parse JSON explainAnswer:", e);
      parsed = {
        verdict: "Không rõ",
        explanation: raw,
        correctAnswerText,
        reasonCorrect: "",
        tip: "",
      };
    }
    return res.json({
      ok: true,
      verdict: parsed.verdict || "Không rõ",
      explanation: parsed.explanation || "",
      correctAnswerText:
        parsed.correctAnswerText || correctAnswerText || "",
      reasonCorrect: parsed.reasonCorrect || "",
      tip: parsed.tip || "",
    });
  } catch (err) {
    console.error(err);
    return res.json({
      ok: false,
      error: err.message,
    });
  }
};

exports.lessonTutor = async (req, res) => {
  try {
    if (!OPENAI_KEY) {
      return res
        .status(500)
        .json({ ok: false, error: "Thiếu OPENAI_API_KEY trên server." });
    }
    const {
      lessonTitle = "",
      lessonContent = "",
      userQuestion = "",
      courseTitle = "",
      language = "vi",
    } = req.body || {};
    if (!userQuestion.trim()) {
      return res
        .status(400)
        .json({ ok: false, error: "Thiếu câu hỏi của học viên (userQuestion)." });
    }
    const langInstruction =
      language === "en"
        ? "Answer in clear, simple English. Use short sentences and examples."
        : "Trả lời bằng tiếng Việt, rõ ràng, dễ hiểu, dùng ví dụ đơn giản.";
    const prompt = `
Bạn là gia sư riêng của học viên, giải thích kiến thức trong bài học (có thể là các môn: tiếng Anh, toán, lập trình, tư duy, logic...).
Thông tin khoá học (nếu có):
- Khoá học: ${courseTitle || "(không rõ)"}
Bài học hiện tại:
- Tiêu đề: ${lessonTitle || "(không rõ tiêu đề)"}
Tóm tắt / nội dung bài học (nếu có):
${lessonContent || "(không có tóm tắt, hãy dùng kiến thức nền phù hợp với tiêu đề bài / câu hỏi)"}
Câu hỏi của học viên:
"${userQuestion}"
YÊU CẦU:
- ${langInstruction}
- Ưu tiên giải thích dựa trên nội dung, mục tiêu của bài học này.
- Chia nhỏ ý, có thể dùng bullet để học viên dễ đọc.
- Nếu học viên hiểu sai, hãy chỉ ra chỗ sai và sửa lại.
- Có thể cho 1–2 ví dụ minh hoạ liên quan.
- Không nói rằng bạn là AI hay mô hình ngôn ngữ, chỉ trả lời như một gia sư người thật.
`;
    const ai = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await ai.json();
    const answer =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Xin lỗi, hiện mình chưa giải thích được câu hỏi này.";
    return res.json({
      ok: true,
      answer,
    });
  } catch (err) {
    console.error("❌ Lỗi lessonTutor:", err);
    return res.json({
      ok: false,
      error: err.message,
    });
  }
};

exports.generateQuestionsByAI = async (req, res) => {
  try {
    if (!OPENAI_KEY) {
      return res
        .status(500)
        .json({ ok: false, error: "Thiếu OPENAI_API_KEY trên server." });
    }
    const {
      subject = "general",
      topic = "",
      level = "medium",
      numQuestions = 5,
      questionType = "multiple_choice",
      language = "vi",
    } = req.body || {};
    const prompt = `
Bạn là trợ lý tạo câu hỏi kiểm tra cho hệ thống LMS đa môn.
THÔNG TIN ĐẦU VÀO:
- Môn học (subject): ${subject}
- Chủ đề/chương (topic): ${topic || "không ghi rõ"}
- Độ khó (level): ${level} (easy/medium/hard)
- Số câu hỏi: ${numQuestions}
- Dạng câu hỏi (questionType): ${questionType}
  - "multiple_choice": trắc nghiệm 1 đáp án đúng
  - "true_false": Đúng/Sai
  - "short_answer": trả lời ngắn (1-2 câu)
- Ngôn ngữ câu hỏi (language): ${language}
YÊU CẦU:
1. Tạo đúng ${numQuestions} câu hỏi phù hợp với môn học và chủ đề.
2. Mỗi câu hỏi trả về theo cấu trúc JSON:
{
  "type": "multiple_choice" | "true_false" | "short_answer",
  "content": "Nội dung câu hỏi",
  "options": [
    { "text": "phương án A", "isCorrect": true/false },
    ...
  ],
  "correctAnswerText": "nếu là short_answer thì ghi đáp án đúng ở đây (text)",
  "explanation": "giải thích ngắn gọn vì sao đáp án đúng"
}
- Với "multiple_choice":
  - tối thiểu 3, tối đa 5 phương án.
  - chính xác 1 phương án có "isCorrect": true.
- Với "true_false":
  - tạo 2 phương án, ví dụ "Đúng" và "Sai" / "True" và "False".
- Với "short_answer":
  - "options" có thể là [], dùng "correctAnswerText" để ghi đáp án mẫu.
3. Ngôn ngữ:
- Nếu language = "vi" → câu hỏi, phương án, giải thích bằng tiếng Việt.
- Nếu language = "en" → bằng tiếng Anh.
TRẢ VỀ DUY NHẤT JSON với format:
{
  "questions": [
    {
      "type": "...",
      "content": "...",
      "options": [...],
      "correctAnswerText": "...",
      "explanation": "..."
    }
  ]
}
Không thêm text ngoài JSON.
`;
    const ai = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await ai.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("❌ Lỗi parse JSON generateQuestionsByAI:", e);
    }
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];
    return res.json({
      ok: true,
      questions,
    });
  } catch (err) {
    console.error(err);
    return res.json({ ok: false, error: err.message });
  }
};

exports.generateSkillMapFromEntryTest = async (req, res) => {
  try {
    const { examId, attemptId, courseId, userId } = req.body;
    const attempt = await ExamAttempt.findById(attemptId)
      .populate("answers.question")
      .lean();
    if (!attempt) {
      return res
        .status(404)
        .json({ ok: false, message: "Không tìm thấy attempt" });
    }
    const skillScore = {};
    for (const ans of attempt.answers) {
      const q = ans.question;
      if (!q.skill) continue;
      const sid = String(q.skill);
      if (!skillScore[sid]) skillScore[sid] = { got: 0, max: 0 };
      skillScore[sid].got += ans.score || 0;
      skillScore[sid].max += q.score || 0;
    }
    const skillDocs = await Skill.find({ _id: { $in: Object.keys(skillScore) } });
    const aiPayload = skillDocs.map((sk) => {
      const sc = skillScore[String(sk._id)];
      const pct = sc.max > 0 ? Math.round((sc.got / sc.max) * 100) : 0;
      return {
        skill: sk.name,
        description: sk.description,
        percent: pct,
      };
    });
    const prompt = `
Bạn là AI phân tích năng lực học viên dựa trên điểm theo kỹ năng.
Dữ liệu đầu vào:
${JSON.stringify(aiPayload, null, 2)}
Hãy trả về JSON:
{
  "skillLevels": { "React cơ bản": "beginner" | "intermediate" | "advanced" },
  "suggestedSkills": ["kỹ năng 1", "kỹ năng 2"],
  "recommendedPath": ["kỹ năng nên học trước", "kỹ năng học sau"]
}
`;
    const ai = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await ai.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {}
    return res.json({
      ok: true,
      input: aiPayload,
      ai: parsed,
    });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: err.message });
  }
};

exports.analyzeLearningPathAfterExam = async (req, res) => {
  try {
    const { examId, attemptId } = req.body;
    const attempt = await ExamAttempt.findById(attemptId)
      .populate("answers.question")
      .lean();
    if (!attempt) {
      return res
        .status(404)
        .json({ ok: false, message: "Không tìm thấy attempt" });
    }
    const skillScore = {};
    attempt.answers.forEach((ans) => {
      const q = ans.question;
      if (!q.skill) return;
      const sid = String(q.skill);
      if (!skillScore[sid]) skillScore[sid] = { got: 0, max: 0 };
      skillScore[sid].got += ans.score;
      skillScore[sid].max += q.score;
    });
    const skillDocs = await Skill.find({
      _id: { $in: Object.keys(skillScore) },
    });
    const info = skillDocs.map((sk) => {
      const sc = skillScore[String(sk._id)];
      const pct = sc.max ? Math.round((sc.got / sc.max) * 100) : 0;
      return { skill: sk.name, percent: pct };
    });
    const prompt = `
Bạn là AI cố vấn học tập.
Dưới đây là điểm theo kỹ năng sau bài kiểm tra:
${JSON.stringify(info, null, 2)}
Hãy trả về JSON:
{
  "weakSkills": ["kỹ năng yếu"],
  "shouldReview": ["những skill cần ôn lại"],
  "recommendations": ["gợi ý học tập chi tiết bằng tiếng Việt"]
}
`;
    const ai = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await ai.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {}
    return res.json({ ok: true, ai: parsed, raw });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: err.message });
  }
};

exports.suggestNextSkills = async (req, res) => {
  try {
    const { courseId, learnedSkills = [] } = req.body;
    const allSkills = await Skill.find({ course: courseId }).lean();
    const prompt = `
Bạn là AI tư vấn lộ trình học.
Danh sách kỹ năng đã học:
${JSON.stringify(learnedSkills)}
Danh sách kỹ năng toàn khóa:
${JSON.stringify(allSkills.map((s) => s.name))}
Hãy trả về JSON:
{
  "nextSkills": ["kỹ năng 1", "kỹ năng 2"],
  "reason": "giải thích ngắn gọn"
}
`;
    const ai = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await ai.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {}
    return res.json({ ok: true, ai: parsed });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, error: err.message });
  }
};

/* ====== TTS CHO CHATBOX HKCODE ====== */

exports.tts = async (req, res) => {
  try {
    const { text } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ ok: false, error: "TEXT_REQUIRED" });
    }

    // 1) Tạo URL audio tiếng Việt từ Google
    const url = googleTTS.getAudioUrl(text, {
      lang: "vi",       // tiếng Việt
      slow: false,
      host: "https://translate.google.com",
    });

    // 2) Backend tự tải file mp3 từ Google
    const audioResp = await fetch(url); // Node 22 có global fetch
    if (!audioResp.ok) {
      console.error("❌ TTS google fetch error:", audioResp.status);
      return res
        .status(500)
        .json({ ok: false, error: "TTS_GOOGLE_ERROR" });
    }

    const arrayBuffer = await audioResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3) Trả trực tiếp mp3 về cho frontend
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length);
    return res.send(buffer);
  } catch (err) {
    console.error("❌ TTS error:", err);
    return res
      .status(500)
      .json({ ok: false, error: "TTS_SERVER_ERROR" });
  }
};

