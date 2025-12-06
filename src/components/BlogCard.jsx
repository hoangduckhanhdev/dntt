// 📄 src/components/BlogCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { API_URL } from "../api/config";

// Lấy root, ví dụ: https://hkcode.onrender.com từ https://hkcode.onrender.com/api
const API_ROOT = API_URL.replace("/api", "");

export default function BlogCard({ blog }) {
  // Hàm build URL ảnh an toàn
  const getThumbnailSrc = () => {
    const thumb = blog.thumbnail?.trim();

    // Không có thumbnail -> ảnh mặc định
    if (!thumb) {
      return `https://source.unsplash.com/800x400/?technology,education,blog,${
        blog.slug || "blog"
      }`;
    }

    // Nếu backend trả sẵn link đầy đủ
    if (thumb.startsWith("http")) return thumb;

    // Nếu backend lưu dạng "uploads/blogs/xxx.jpg"
    if (thumb.startsWith("uploads/")) {
      return `${API_ROOT}/${thumb}`;
    }

    // Nếu backend chỉ lưu tên file "xxx.jpg"
    // => tự ghép vào thư mục uploads/blogs
    return `${API_ROOT}/uploads/blogs/${thumb}`;
  };

  const thumbnailSrc = getThumbnailSrc();

  // Rút gọn nội dung hiển thị
  const shortContent =
    (blog.content?.replace(/<[^>]+>/g, "") || "").slice(0, 150) + "...";

  return (
    <div className="group rounded-2xl overflow-hidden bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 shadow-lg hover:shadow-2xl transition duration-300 ease-in-out transform hover:-translate-y-2 hover:scale-[1.02]">
      {/* Ảnh thumbnail */}
      <div className="overflow-hidden">
        <img
          src={thumbnailSrc}
          alt={blog.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              "https://via.placeholder.com/600x300?text=No+Image";
          }}
          className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Nội dung */}
      <div className="p-5 space-y-3">
        <h2 className="text-2xl font-extrabold line-clamp-2 text-pink-700 group-hover:text-indigo-700 transition-colors duration-300">
          {blog.title}
        </h2>

        <p className="text-sm font-semibold text-purple-600">
          {blog.category || "Chuyên mục"} • {blog.author || "Tác giả ẩn danh"}
        </p>

        <p className="text-gray-700 line-clamp-3">{shortContent}</p>

        <div className="pt-2">
          <Link
            to={`/blog/${blog.slug}`}
            className="inline-flex items-center text-indigo-600 font-semibold group-hover:text-pink-600 transition-all duration-300"
          >
            <span>Đọc tiếp</span>
            <span className="ml-1 group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
