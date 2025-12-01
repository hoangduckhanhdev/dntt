import React, { useEffect, useState } from "react";
import axios from "axios";
import BlogCard from "../components/BlogCard";

export default function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const limit = 6;

  useEffect(() => {
    fetchBlogs(page);
  }, [page]);

  const fetchBlogs = async (pageNum) => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.get("http://localhost:5000/api/blogs", {
        params: { page: pageNum, limit },
      });

      const data = res.data.blogs || [];

      if (data.length > 0) {
        setBlogs((prev) => [...prev, ...data]);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("❌ Lỗi tải blog:", err);
      setError("Không thể tải bài viết. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) setPage((prev) => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-12 text-center text-purple-700 drop-shadow-sm">
        📰 Tin tức & Blog học tập
      </h1>

      {error && (
        <div className="text-center text-red-600 font-semibold mb-8">
          {error}
        </div>
      )}

      {loading && blogs.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-purple-500 border-solid"></div>
        </div>
      ) : blogs.length > 0 ? (
        <>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard key={blog._id} blog={blog} />
            ))}
          </div>

          {hasMore && (
            <div className="text-center mt-10">
              <button
                onClick={loadMore}
                disabled={loading}
                className={`px-6 py-3 rounded-xl font-bold shadow-lg transition transform duration-300 ${
                  loading
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white hover:scale-105"
                }`}
              >
                {loading ? "⏳ Đang tải..." : "🔽 Tải thêm bài viết"}
              </button>
            </div>
          )}

          {!hasMore && (
            <p className="text-center mt-10 text-gray-600 font-semibold">
              ✅ Bạn đã xem hết các bài viết.
            </p>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500 mt-10 text-lg">
          😢 Hiện chưa có bài viết nào.
        </p>
      )}
    </div>
  );
}
