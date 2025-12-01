// src/components/feed/FeedPostCard.jsx
import React, { useState } from "react";
import axios from "axios";
import MiniQuizView from "./MiniQuizView";

const API_BASE = "http://localhost:5000/api";

// 🔐 Helper: lấy config axios có kèm token
const getAuthConfig = () => {
  try {
    const token = localStorage.getItem("token");
    const headers = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return {
      headers,
      withCredentials: true,
    };
  } catch {
    return { withCredentials: true };
  }
};

export default function FeedPostCard({ post, onChange }) {
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState([]);

  /* ============================
     LIKE
  ============================ */
  const handleLike = async () => {
    try {
      setLiking(true);
      await axios.post(
        `${API_BASE}/feed/${post._id}/like`,
        {},
        getAuthConfig()
      );
      onChange && onChange();
    } catch (err) {
      console.error(err);
    } finally {
      setLiking(false);
    }
  };

  /* ============================
     LOAD COMMENTS
  ============================ */
  const loadComments = async () => {
    try {
      setCommentLoading(true);

      const res = await axios.get(
        `${API_BASE}/feed/${post._id}/comments`,
        getAuthConfig()
      );

      setComments(res.data || []);
    } catch (err) {
      console.error("Load comments error:", err);
    } finally {
      setCommentLoading(false);
    }
  };

  /* ============================
     SUBMIT COMMENT
  ============================ */
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    try {
      const res = await axios.post(
        `${API_BASE}/feed/${post._id}/comments`,
        { content: commentInput },
        getAuthConfig()
      );

      setCommentInput("");
      setComments((prev) => [...prev, res.data]);
      onChange && onChange();
    } catch (err) {
      console.error("Post comment error:", err);
    }
  };

  /* Khi mở comment lần đầu → load comment */
  const toggleComments = () => {
    setShowComments((v) => !v);
    if (!showComments) loadComments();
  };

  // Helper lấy chữ cái đầu tên
  const getInitial = (name) => {
    if (!name) return "U";
    return name.trim()[0].toUpperCase();
  };

  return (
    <div className="border rounded-xl bg-white shadow-sm p-3">
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-2">
        {/* Avatar: ưu tiên ảnh, fallback chữ cái đầu */}
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 overflow-hidden">
          {post.author?.avatar ? (
            <img
              src={post.author.avatar}
              alt="avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                // nếu ảnh lỗi thì ẩn img, giữ lại vòng tròn xám + chữ
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            getInitial(post.author?.name)
          )}
        </div>

        <div>
          <div className="text-sm font-semibold">
            {post.author?.name || "User"}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(post.createdAt).toLocaleString()}
          </div>
        </div>

        {post.isPinned && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
            📌 Ghim
          </span>
        )}
      </div>

      {/* CONTENT */}
      {post.type === "mini_quiz" && post.quiz?.question ? (
        <MiniQuizView post={post} onChange={onChange} />
      ) : (
        <div className="text-sm whitespace-pre-wrap mb-2">{post.content}</div>
      )}

      {/* MEDIA (image/video) */}
      {post.media?.url && (
        <div className="mt-2">
          {post.media.type === "video" ? (
            <video
              src={post.media.url}
              controls
              className="w-full max-h-[400px] rounded-xl"
            />
          ) : (
            <img
              src={post.media.url}
              alt="post-media"
              className="w-full max-h-[400px] rounded-xl object-cover"
            />
          )}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex items-center gap-4 text-xs text-gray-600 mt-3 pt-2 border-t">
        <button onClick={handleLike} disabled={liking}>
          👍 {post.likesCount || 0} Thích
        </button>

        <button onClick={toggleComments}>
          💬 {post.commentsCount || 0} Bình luận
        </button>

        <button>↗️ {post.sharesCount || 0} Chia sẻ</button>
      </div>

      {/* COMMENTS SECTION */}
      {showComments && (
        <div className="mt-3 border-t pt-2">
          <h4 className="text-sm font-semibold mb-2">Bình luận</h4>

          {commentLoading ? (
            <div className="text-xs text-gray-500">Đang tải bình luận...</div>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c._id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700 overflow-hidden">
                    {c.user?.avatar ? (
                      <img
                        src={c.user.avatar}
                        alt="avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      getInitial(c.user?.name)
                    )}
                  </div>

                  <div className="bg-gray-100 px-3 py-2 rounded-xl max-w-[80%]">
                    <div className="text-xs font-semibold">{c.user?.name}</div>
                    <div className="text-sm">{c.content}</div>
                  </div>
                </div>
              ))}

              {comments.length === 0 && (
                <div className="text-xs text-gray-500">
                  Chưa có bình luận.
                </div>
              )}
            </div>
          )}

          {/* COMMENT INPUT */}
          <form onSubmit={handleSubmitComment} className="flex gap-2 mt-3">
            <input
              type="text"
              placeholder="Viết bình luận..."
              className="flex-1 border px-3 py-1 rounded-full text-sm"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-1 bg-blue-600 text-white rounded-full text-sm"
            >
              Gửi
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
