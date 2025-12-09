const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const ExamQuestionBank = require("../models/ExamQuestionBank");
const CourseClass = require("../models/CourseClass");
const RegisterCourse = require("../models/registerCourse");
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5);
async function autoGenerateExamQuestions(exam) {
  const cfg = exam.autoConfig || {};
  const filter = { course: exam.course };
  const chapters = Array.isArray(cfg.chapters) ? cfg.chapters : [];
  const tags = Array.isArray(cfg.tags) ? cfg.tags : [];
  if (chapters.length) filter.chapter = { $in: chapters };
  if (tags.length) filter.tags = { $in: tags };
  let allQuestions = await ExamQuestionBank.find(filter).lean();
  if (!allQuestions.length) {
    allQuestions = await ExamQuestionBank.find({
      course: exam.course,
    }).lean();
  }
  if (!allQuestions.length) return []; 
  const totalQuestions =
    Number(
      cfg.totalQuestions ??
        cfg.total ??
        cfg.count ??
        0
    ) || 0;
  const distCfg =
    cfg.difficultyDistribution || {
      easy: Number(cfg.easyCount ?? cfg.easy ?? cfg.de ?? 0) || 0,
      medium: Number(cfg.mediumCount ?? cfg.medium ?? cfg.tb ?? 0) || 0,
      hard: Number(cfg.hardCount ?? cfg.hard ?? cfg.kho ?? 0) || 0,
    };
  const diffEasy = Number(distCfg.easy || 0);
  const diffMedium = Number(distCfg.medium || 0);
  const diffHard = Number(distCfg.hard || 0);
  const sumDist = diffEasy + diffMedium + diffHard;
  const targetTotal =
    totalQuestions || (sumDist > 0 ? sumDist : allQuestions.length);
  const usedIds = new Set();
  let selected = [];
  const pickFrom = (list, count) => {
    if (!count || !list.length) return;
    const shuffled = shuffleArray([...list]);
    for (const q of shuffled) {
      const idStr = String(q._id);
      if (!usedIds.has(idStr)) {
        selected.push(q);
        usedIds.add(idStr);
        if (selected.length >= count) break;
      }
    }
  };
  if (sumDist > 0) {
    const easyQs = allQuestions.filter((q) => q.difficulty === "easy");
    const mediumQs = allQuestions.filter((q) => q.difficulty === "medium");
    const hardQs = allQuestions.filter((q) => q.difficulty === "hard");
    pickFrom(easyQs, diffEasy);
    pickFrom(mediumQs, diffMedium);
    pickFrom(hardQs, diffHard);
  }
  if (selected.length < targetTotal) {
    const need = targetTotal - selected.length;
    const remainPool = allQuestions.filter(
      (q) => !usedIds.has(String(q._id))
    );
    const shuffledRemain = shuffleArray([...remainPool]);
    for (const q of shuffledRemain) {
      selected.push(q);
      usedIds.add(String(q._id));
      if (selected.length >= targetTotal) break;
    }
  }
  if (selected.length > targetTotal) {
    selected = shuffleArray([...selected]).slice(0, targetTotal);
  }
  if (!selected.length && allQuestions.length) {
    selected.push(
      allQuestions[Math.floor(Math.random() * allQuestions.length)]
    );
  }
  return selected;
}
async function canStudentAccessExam(userId, exam) {
  if (!exam) return false;
  if (exam.accessMode === "public_practice") return true;
  const reg = await RegisterCourse.findOne({
    courseId: exam.course,
    userId,
    paymentStatus: "paid",
  }).lean();
  if (!reg) return false;
  if (!exam.assignedClasses || exam.assignedClasses.length === 0) return true;
  const countClass = await CourseClass.countDocuments({
    _id: { $in: exam.assignedClasses },
    students: userId,
  });
  return countClass > 0;
}
async function autoGradeEssayAI(question, studentAnswer) {
  try {
    const prompt = `
Bạn là giáo viên. Hãy chấm điểm bài tự luận.
CÂU HỎI:
${question.content}
ĐÁP ÁN (nếu có):
${question.correctAnswer || "Không có đáp án chuẩn"}
BÀI LÀM CỦA HỌC VIÊN:
${studentAnswer || "(Không có bài làm)"}
Điểm tối đa: ${question.score}
Hãy trả kết quả theo định dạng JSON:
{
  "score": số điểm từ 0 đến ${question.score},
  "comment": "nhận xét ngắn gọn"
}
`;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });
    const raw = completion.choices[0].message.content;
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const jsonText = raw.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Lỗi AI essay:", err);
    return { score: 0, comment: "AI không chấm được" };
  }
}
async function autoGradeAttempt(attempt) {
  let total = 0;
  let maxTotal = 0;
  for (const ans of attempt.answers) {
    const q = await ExamQuestionBank.findById(ans.question);
    if (!q) continue;
    ans.maxScore = q.score || 0;
    if (q.type === "multiple_choice") {
      ans.autoGraded = true;
      const correctIds = q.options
        .filter((o) => o.isCorrect)
        .map((o) => String(o._id));
      const student = (ans.selectedOptionIds || []).map(String);
      const ok =
        correctIds.length === student.length &&
        correctIds.every((id) => student.includes(id));
      ans.score = ok ? q.score : 0;
    }
    else if (q.type === "true_false") {
      ans.autoGraded = true;
      ans.score =
        (ans.answerText || "").trim().toLowerCase() ===
        (q.correctAnswer || "").trim().toLowerCase()
          ? q.score
          : 0;
    }
    else if (q.type === "short_answer") {
      if (q.aiAutoGrade) {
        const ai = await autoGradeEssayAI(q, ans.answerText);
        ans.score = ai.score;
        ans.teacherComment = ai.comment;
        ans.autoGraded = true;
      } else {
        ans.autoGraded = true;
        ans.score =
          (ans.answerText || "").trim().toLowerCase() ===
          (q.correctAnswer || "").trim().toLowerCase()
            ? q.score
            : 0;
      }
    }
    else if (q.type === "essay") {
      if (q.aiAutoGrade) {
        const ai = await autoGradeEssayAI(q, ans.answerText);
        ans.score = ai.score;
        ans.teacherComment = ai.comment;
        ans.autoGraded = true;
      } else {
        ans.score = 0;
        ans.autoGraded = false; 
      }
    }
    else if (q.type === "file_upload") {
      ans.autoGraded = false;
      ans.score = 0;
    }
    total += ans.score || 0;
    maxTotal += ans.maxScore || 0;
  }
  attempt.totalScore = total;
  attempt.maxScore = maxTotal;
}
exports.startExam = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.user._id;
    const now = new Date();
    const exam = await Exam.findById(examId).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (!exam.isPublished)
      return res.status(403).json({ message: "Exam not published" });
    if (exam.startAt && now < exam.startAt)
      return res.status(400).json({ message: "Đề thi chưa mở" });
    if (exam.dueAt && now > exam.dueAt)
      return res.status(400).json({ message: "Đề thi đã hết hạn" });
    const allowed = await canStudentAccessExam(userId, exam);
    if (!allowed)
      return res
        .status(403)
        .json({ message: "Bạn không có quyền làm bài thi này" });
    let attempt = await ExamAttempt.findOne({
      exam: examId,
      student: userId,
      status: "in_progress",
    });
    if (attempt && exam.timeLimit && exam.timeLimit > 0) {
      const elapsed = now - attempt.startedAt;
      const limit = exam.timeLimit * 60 * 1000;
      if (elapsed >= limit) {
        await autoGradeAttempt(attempt);
        attempt.status = "timeout";
        attempt.submittedAt = now;
        await attempt.save();
        attempt = null;
      }
    }
    if (attempt && (!attempt.answers || attempt.answers.length === 0)) {
      const hasQuestionConfig =
        exam.selectionMode === "auto" ||
        (exam.selectionMode === "manual" && exam.questions.length > 0);
      if (hasQuestionConfig) {
        await ExamAttempt.deleteOne({ _id: attempt._id });
        attempt = null;
      }
    }
    if (!attempt) {
      const count = await ExamAttempt.countDocuments({
        exam: examId,
        student: userId,
      });
      if (count >= exam.attemptsAllowed)
        return res.status(400).json({ message: "Bạn đã hết lượt làm bài" });
      let questionsDocs = [];
      if (exam.selectionMode === "auto") {
        questionsDocs = await autoGenerateExamQuestions(exam);
      } else {
        questionsDocs = exam.questions || [];
      }
      if (!questionsDocs.length)
        return res
          .status(400)
          .json({ message: "Đề thi chưa có câu hỏi" });
      const questionIds = questionsDocs.map((q) => q._id || q);
      questionsDocs = await ExamQuestionBank.find({ _id: { $in: questionIds } });
      if (!questionsDocs.length)
        return res
          .status(400)
          .json({ message: "Không tìm thấy câu hỏi hợp lệ" });
      if (exam.shuffleQuestions) {
        questionsDocs = shuffleArray(questionsDocs);
      }
      const answers = questionsDocs.map((q) => {
        let options = (q.options || []).map((opt) => ({
          optionId: opt._id,
          text: opt.text,
        }));
        if (exam.shuffleOptions && options.length) {
          options = shuffleArray(options);
        }
        return {
          question: q._id,
          questionContent: q.content,
          optionSnapshots: options,
          score: 0,
          maxScore: 0,
        };
      });
      attempt = await ExamAttempt.create({
        exam: examId,
        student: userId,
        attemptIndex: count + 1,
        answers,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    }
    await attempt.populate({
      path: "answers.question",
      model: "ExamQuestionBank",
    });
    let remainingSeconds = null;
    if (exam.timeLimit && exam.timeLimit > 0) {
      const elapsed = now - attempt.startedAt;
      const limit = exam.timeLimit * 60 * 1000;
      remainingSeconds = Math.max(0, Math.floor((limit - elapsed) / 1000));
    }
    return res.json({
      attempt,
      exam: {
        _id: exam._id,
        title: exam.title,
        type: exam.type, 
        course: exam.course, 
        timeLimit: exam.timeLimit,
        startAt: exam.startAt,
        dueAt: exam.dueAt,
      },
      remainingSeconds,
    });
  } catch (err) {
    console.error("startExam error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.autoSaveExam = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.user._id;
    let incoming = req.body.answers;
    if (!Array.isArray(incoming) && Array.isArray(req.body.answers?.answers)) {
      incoming = req.body.answers.answers;
    }
    if (!Array.isArray(incoming)) incoming = [];
    const attempt = await ExamAttempt.findOne({
      exam: examId,
      student: userId,
      status: "in_progress",
    });
    if (!attempt)
      return res.status(404).json({ message: "Attempt not found" });
    incoming.forEach((inc) => {
      const idx = attempt.answers.findIndex(
        (a) => String(a.question) === String(inc.question)
      );
      if (idx !== -1) {
        attempt.answers[idx].selectedOptionIds =
          inc.selectedOptionIds || [];
        attempt.answers[idx].answerText = inc.answerText || "";
        attempt.answers[idx].fileUrl = inc.fileUrl || "";
      }
    });
    await attempt.save();
    return res.json({ message: "Auto saved" });
  } catch (err) {
    console.error("autoSaveExam error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.submitExam = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.user._id;
    const now = new Date();
    const exam = await Exam.findById(examId);
    if (!exam)
      return res.status(404).json({ message: "Exam not found" });
    if (exam.dueAt && now > exam.dueAt)
      return res.status(400).json({ message: "Đã quá hạn nộp bài" });
    const attempt = await ExamAttempt.findOne({
      exam: examId,
      student: userId,
      status: "in_progress",
    });
    if (!attempt)
      return res.status(404).json({ message: "Attempt not found" });
    await autoGradeAttempt(attempt);
    attempt.status = "submitted";
    attempt.submittedAt = now;
    await attempt.save();
    return res.json({ message: "Nộp bài thành công", attempt });
  } catch (err) {
    console.error("submitExam error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
exports.getMyAttempts = async (req, res) => {
  try {
    const examId = req.params.examId;
    const userId = req.user._id;
    const attempts = await ExamAttempt.find({
      exam: examId,
      student: userId,
      status: { $in: ["submitted", "graded", "timeout"] },
    })
      .sort({ attemptIndex: -1 })
      .populate(
        "exam",
        "title type showScoreToStudent showCorrectAnswers revealAnswersMode timeLimit startAt dueAt"
      )
      .populate({
        path: "answers.question",
        model: "ExamQuestionBank",
      });
    return res.json(attempts);
  } catch (err) {
    console.error("getMyAttempts error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
