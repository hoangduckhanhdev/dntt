// src/pages/LearnFeedPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiActivity, FiInfo } from "react-icons/fi";
import FeedComposer from "../components/feed/FeedComposer";
import FeedPostCard from "../components/feed/FeedPostCard";

const API_BASE = "http://localhost:5000/api";

// 🔐 Helper: axios config có kèm token
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

export default function LearnFeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}
  }, []);

  const loadFeed = async ({ reset = false } = {}) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;

      const res = await axios.get(
        `${API_BASE}/feed?page=${currentPage}&limit=10`,
        getAuthConfig()
      );

      const data = res.data || [];
      if (reset) {
        setPosts(data);
      } else {
        setPosts((prev) => [...prev, ...data]);
      }

      setHasMore(data.length === 10);
      setPage(currentPage + 1);
    } catch (err) {
      console.error("loadFeed error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load lần đầu
  useEffect(() => {
    loadFeed({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReload = () => {
    setPage(1);
    loadFeed({ reset: true });
  };

  return (
    <div className="bg-slate-50/70 min-h-screen">
      <div className="container-page py-6 lg:py-8">
        {/* HEADER */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-500 text-xs font-semibold mb-2">
              <FiActivity className="w-4 h-4" />
              <span>LearnFeed · BETA</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              Bảng tin học tập
            </h1>
            <p className="text-sm md:text-[15px] text-slate-600 mt-1 max-w-2xl">
              Chia sẻ câu hỏi, kinh nghiệm học, ghi chú bài học, video bài làm…
              Giống mạng xã hội nhưng chỉ dành cho việc học.
            </p>
          </div>

          {user && (
            <div className="px-4 py-3 rounded-2xl bg-white shadow-sm border border-orange-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-700 uppercase">
                {user.name?.[0] || "U"}
              </div>
              <div className="text-sm">
                <div className="font-semibold text-slate-900">
                  Xin chào, {user.name}
                </div>
                <div className="text-xs text-slate-500">
                  Hãy chia sẻ điều bạn đang học hôm nay 👋
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MAIN LAYOUT */}
        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-6 items-start">
          {/* Cột chính: Composer + Feed */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm">
              <FeedComposer onPosted={handleReload} />
            </div>

            <div className="space-y-4">
              {posts.map((p) => (
                <FeedPostCard key={p._id} post={p} onChange={handleReload} />
              ))}

              {!loading && posts.length === 0 && (
                <div className="text-sm text-slate-500 text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
                  Chưa có bài nào trên bảng tin. Hãy là người đầu tiên chia sẻ
                  nhé!
                </div>
              )}

              {loading && (
                <div className="text-sm text-slate-500 text-center py-4">
                  Đang tải...
                </div>
              )}

              {hasMore && !loading && posts.length > 0 && (
                <div className="flex justify-center pt-2">
                  <button
                    className="px-4 py-1.5 text-sm rounded-full border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors"
                    onClick={() => loadFeed()}
                  >
                    Xem thêm
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SIDEBAR */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500">
                  <FiInfo className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-slate-900">
                  LearnFeed là gì?
                </h2>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bảng tin nơi học viên, giảng viên chia sẻ bài học, câu hỏi, video
                luyện tập. Học như lướt mạng xã hội nhưng không vô bổ.
              </p>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-white border border-orange-100 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">
                Gợi ý cho bạn
              </h2>
              <ul className="text-xs text-slate-700 space-y-1.5">
                <li>• Đặt câu hỏi khi bạn chưa hiểu bài.</li>
                <li>• Chụp ảnh / quay video bài làm để mọi người góp ý.</li>
                <li>• Viết lại “key takeaways” sau mỗi buổi học.</li>
                <li>• Tôn trọng mọi người, tuyệt đối không spam.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">
                Gợi ý 
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                LearnFeed như một tính năng signature, giúp
                giữ chân học viên, tăng tương tác giống Facebook/TikTok nhưng
                tập trung vào nội dung học tập. Admin có thể quản lý, ghim bài,
                xem thống kê loại nội dung được tương tác nhiều.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
