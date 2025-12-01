// backend/src/controllers/feedController.js
const FeedPost = require("../models/FeedPost");
const FeedReaction = require("../models/FeedReaction");
const FeedComment = require("../models/FeedComment");
const FeedNotification = require("../models/FeedNotification");

/* =========================
   Helper lấy thông tin user
========================= */
const getUserId = (req) => req.user?._id || req.user?.id;
const getUserRole = (req) => req.user?.role || "student";

/* =========================
   GET /api/feed
   Lấy danh sách bài feed
========================= */
exports.getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10, course, type } = req.query;
    const filter = {};
    if (course) filter.course = course;
    if (type) filter.type = type;

    const posts = await FeedPost.find(filter)
      .populate("author", "name avatar role")
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json(posts);
  } catch (err) {
    console.error("getFeed error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   POST /api/feed
   Tạo bài post mới (student/teacher/admin)
========================= */
exports.createPost = async (req, res) => {
  try {
    const userId = getUserId(req);
    const role = getUserRole(req);

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { type, content, title, course, tags, quiz, media } = req.body;

    if (!type || (!content && !media)) {
      return res
        .status(400)
        .json({ message: "Thiếu type hoặc nội dung / media" });
    }

    const post = await FeedPost.create({
      author: userId,
      role, // student | teacher | admin
      type,
      content: content || "",
      title,
      course: course || null,
      tags: tags || [],
      quiz: type === "mini_quiz" ? quiz || {} : undefined,
      media: media || undefined,
    });

    const populated = await post.populate("author", "name avatar role");
    res.status(201).json(populated);
  } catch (err) {
    console.error("createPost error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   POST /api/feed/:id/like
   Toggle like / unlike + tạo notification
========================= */
exports.likePost = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const postId = req.params.id;
    const post = await FeedPost.findById(postId);

    if (!post) return res.status(404).json({ message: "Không tìm thấy post" });

    const existing = await FeedReaction.findOne({ post: postId, user: userId });

    let liked;
    if (existing) {
      // Đã like → bỏ like
      await FeedReaction.deleteOne({ _id: existing._id });
      await FeedPost.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
      liked = false;
    } else {
      // Chưa like → tạo like
      await FeedReaction.create({ post: postId, user: userId, type: "like" });
      await FeedPost.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
      liked = true;

      // 🔔 Tạo notification cho chủ post (nếu không phải tự like bài mình)
      if (String(post.author) !== String(userId)) {
        await FeedNotification.create({
          user: post.author,
          actor: userId,
          type: "like",
          post: post._id,
        });
      }
    }

    res.json({ liked });
  } catch (err) {
    console.error("likePost error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   POST /api/feed/:id/comments
   Thêm comment + notification
========================= */
exports.commentPost = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const postId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res
        .status(400)
        .json({ message: "Nội dung comment không được trống" });
    }

    const post = await FeedPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy post" });

    const comment = await FeedComment.create({
      post: postId,
      user: userId,
      content: content.trim(),
    });

    await FeedPost.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });

    const populated = await comment.populate("user", "name avatar role");

    // 🔔 Notification cho chủ post (không tự comment bài mình)
    if (String(post.author) !== String(userId)) {
      await FeedNotification.create({
        user: post.author,
        actor: userId,
        type: "comment",
        post: post._id,
      });
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error("commentPost error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   Lấy danh sách comment 1 post
   GET /api/feed/:id/comments
========================= */
exports.getComments = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await FeedComment.find({ post: postId })
      .populate("user", "name avatar role")
      .sort({ createdAt: 1 });

    res.json(comments);
  } catch (err) {
    console.error("getComments error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   POST /api/feed/:id/answer
   Trả lời mini quiz 1 câu
========================= */
exports.answerMiniQuiz = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const postId = req.params.id;
    const { optionIndex } = req.body;

    const post = await FeedPost.findById(postId);
    if (!post) return res.status(404).json({ message: "Không tìm thấy post" });

    if (post.type !== "mini_quiz" || !post.quiz || !post.quiz.options) {
      return res.status(400).json({ message: "Post này không phải mini quiz" });
    }

    if (
      typeof optionIndex !== "number" ||
      optionIndex < 0 ||
      optionIndex >= post.quiz.options.length
    ) {
      return res.status(400).json({ message: "optionIndex không hợp lệ" });
    }

    const isCorrect = !!post.quiz.options[optionIndex].isCorrect;
    res.json({ correct: isCorrect });
  } catch (err) {
    console.error("answerMiniQuiz error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   PATCH /api/feed/:id/pin
   Ghim / bỏ ghim (admin)
========================= */
exports.pinPost = async (req, res) => {
  try {
    const role = getUserRole(req);
    if (role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin được ghim bài" });
    }

    const postId = req.params.id;
    const { isPinned } = req.body;

    const post = await FeedPost.findByIdAndUpdate(
      postId,
      { isPinned: !!isPinned },
      { new: true }
    ).populate("author", "name avatar role");

    if (!post) return res.status(404).json({ message: "Không tìm thấy post" });

    res.json(post);
  } catch (err) {
    console.error("pinPost error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE /api/feed/:id
   Xóa post (admin)
========================= */
exports.deletePost = async (req, res) => {
  try {
    const role = getUserRole(req);
    if (role !== "admin") {
      return res.status(403).json({ message: "Chỉ admin được xóa bài" });
    }

    const postId = req.params.id;

    await FeedReaction.deleteMany({ post: postId });
    await FeedComment.deleteMany({ post: postId });

    const deleted = await FeedPost.findByIdAndDelete(postId);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy post" });

    res.json({ success: true });
  } catch (err) {
    console.error("deletePost error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ======================================
   🔔 FEED NOTIFICATIONS
====================================== */

/* GET /api/feed/notifications
   Lấy list notification của user hiện tại
====================================== */
exports.getNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const noti = await FeedNotification.find({ user: userId })
      .populate("actor", "name avatar")
      .populate("post", "content")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(noti);
  } catch (err) {
    console.error("getNotifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* PATCH /api/feed/notifications/:id/read
   Đánh dấu 1 thông báo đã đọc
====================================== */
exports.readNotification = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const noti = await FeedNotification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!noti) return res.status(404).json({ message: "Không tìm thấy" });

    res.json(noti);
  } catch (err) {
    console.error("readNotification error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* PATCH /api/feed/notifications/read-all
   Đánh dấu tất cả đã đọc
====================================== */
exports.readAllNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await FeedNotification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );

    res.json({ success: true });
  } catch (err) {
    console.error("readAllNotifications error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
