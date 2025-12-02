import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_URL, API_BASE } from "../api/config"; // ✅ dùng config chung

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      setLoading(true);
      setError(null);
      try {
        // ❌ Cũ: http://localhost:5000/api/blogs/${slug}
        const res = await axios.get(`${API_URL}/blogs/${slug}`); // ✅
        setBlog(res.data.blog);
      } catch (err) {
        console.error("❌ Lỗi khi lấy chi tiết blog:", err);
        setError("Không thể tải bài viết. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchBlog();
  }, [slug]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-purple-600 text-xl font-semibold animate-pulse">
        ⏳ Đang tải bài viết...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-20 text-red-500 text-xl font-semibold">
        {error}
      </div>
    );

  if (!blog)
    return (
      <div className="text-center py-20 text-gray-500 text-xl font-semibold">
        ❌ Không tìm thấy bài viết.
      </div>
    );

  // Tạo URL ảnh chuẩn từ backend Render
  const thumbnailUrl =
    blog.thumbnail && blog.thumbnail.startsWith("http")
      ? blog.thumbnail
      : blog.thumbnail
      ? `${API_BASE}/uploads/${blog.thumbnail}` // ✅ dùng API_BASE
      : null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 rounded-2xl shadow-lg">
      <Link
        to="/blog"
        className="inline-block mb-6 text-indigo-600 font-bold hover:text-pink-600 hover:underline transition-colors duration-300"
      >
        ← Quay lại danh sách
      </Link>

      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-purple-700 text-center drop-shadow-sm">
        {blog.title}
      </h1>

      <p className="text-center text-sm text-gray-600 mb-6">
        📅 {new Date(blog.createdAt).toLocaleDateString("vi-VN")} &nbsp;| ✍️{" "}
        {blog.author || "Tác giả ẩn danh"}
      </p>

      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt={blog.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://placehold.co/800x400?text=No+Image"; // ✅ tránh via.placeholder.com lỗi DNS
          }}
          className="w-full h-96 md:h-[500px] object-cover rounded-2xl mb-8 shadow-lg hover:scale-[1.02] transition-transform duration-500"
        />
      )}

      <div
        className="prose prose-lg max-w-none text-gray-700 leading-relaxed prose-headings:text-purple-700 prose-a:text-indigo-600 prose-a:hover:text-pink-600"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />
    </div>
  );
}
