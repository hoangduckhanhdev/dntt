const mongoose = require("mongoose");

/**
 * Cấu hình tự động rút câu hỏi (dùng cho selectionMode = "auto")
 */
const autoConfigSchema = new mongoose.Schema(
  {
    // 🔢 Tổng số câu cần rút ra cho 1 đề (dùng ở hàm autoGenerateExamQuestions)
    totalQuestions: { type: Number, min: 1 },

    // Lọc theo chương / tag (phụ thuộc bạn định nghĩa trong ExamQuestionBank)
    chapters: [String],
    tags: [String],

    // Tỉ lệ phân bố độ khó: vd easy: 6, medium: 14, hard: 10
    difficultyDistribution: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const examSchema = new mongoose.Schema(
  {
    // 🔗 Thuộc khoá học nào
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    // 👨‍🏫 Người tạo (admin/giáo viên)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: { type: String, required: true, trim: true },
    description: { type: String },

    // quiz: kiểm tra chương / luyện tập
    // exam: giữa kỳ/cuối kỳ
    // assignment: bài tập nộp file / tự luận
    type: {
      type: String,
      enum: ["quiz", "exam", "assignment", "entry_test"],
      default: "quiz",
      index: true,
    },

    // manual: giáo viên chọn cụ thể câu hỏi (questions)
    // auto  : hệ thống random từ ngân hàng theo autoConfig (dùng khi startExam)
    selectionMode: {
      type: String,
      enum: ["manual", "auto"],
      default: "manual",
    },

    // Với chế độ manual, lưu trực tiếp danh sách câu hỏi
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ExamQuestionBank",
      },
    ],

    // Với chế độ auto, lưu rule – mỗi lần startExam sẽ auto chọn theo logic ở controller exams
    autoConfig: autoConfigSchema,

    // Gán đề cho lớp/nhóm trong khoá học
    // (nếu mảng rỗng => áp dụng cho toàn bộ học viên của course)
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CourseClass",
        index: true,
      },
    ],

    // class_only: chỉ học viên trong class/course được làm
    // public_practice: ai có link + đã đăng nhập đều được luyện tập
    accessMode: {
      type: String,
      enum: ["class_only", "public_practice"],
      default: "class_only",
    },

    // Thời gian làm (phút) – dùng cho countdown
    // Với assignment, controller sẽ set = null để hiểu là "chỉ cần trước dueAt"
    timeLimit: { type: Number, default: 30, min: 0 },

    // Khoảng thời gian mở đề
    startAt: Date,
    dueAt: Date,

    // Giới hạn số lần thi cho mỗi học viên
    attemptsAllowed: { type: Number, default: 1, min: 1 },

    // Khi 1 SV có nhiều attempt, cách tính điểm:
    // first   : lấy điểm attempt 1
    // latest  : lấy điểm attempt cuối
    // highest : lấy điểm cao nhất
    scoringStrategy: {
      type: String,
      enum: ["first", "latest", "highest"],
      default: "highest",
    },

    // Chống học thuộc đề / chia sẻ đề
    shuffleQuestions: { type: Boolean, default: true },
    shuffleOptions: { type: Boolean, default: true },

    // Cho phép tiếp tục làm nếu mất điện/mạng (dùng với autosave ở FE)
    allowResume: { type: Boolean, default: true },

    // Cấu hình hiển thị kết quả cho học viên
    showScoreToStudent: { type: Boolean, default: true },
    showCorrectAnswers: { type: Boolean, default: false },
    revealAnswersMode: {
      type: String,
      enum: ["after_submit", "after_due", "never"],
      default: "after_due",
    },

    // Chỉ khi isPublished = true thì học viên mới nhìn thấy đề
    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Index tổng hợp để query nhanh theo course + type + publish
examSchema.index({ course: 1, type: 1, isPublished: 1 });

module.exports =
  mongoose.models.Exam || mongoose.model("Exam", examSchema);
