import React, { useEffect, useState, useRef } from "react";
import { Plus, Edit, Trash } from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill/dist/quill.snow.css";
import {
  getAllBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  searchBlogs,
} from "../../api/adminBlogApi";
import { ADMIN_API_URL } from "../../api/config"; // ✅ thêm

// Lấy root server: https://hkcode.onrender.com từ https://hkcode.onrender.com/api/admin
const API_ROOT = ADMIN_API_URL.replace("/api/admin", "");

// Hàm chuẩn hóa URL thumbnail
const getBlogThumbUrl = (thumb) => {
  if (!thumb) return "https://via.placeholder.com/80x80?text=No+Image";

  thumb = thumb.trim();

  // Nếu là link đầy đủ
  if (thumb.startsWith("http")) return thumb;

  // Nếu lưu dạng "/uploads/xxx" hoặc "uploads/xxx"
  let path = thumb;
  if (!path.startsWith("/")) path = "/" + path;

  // 👉 Từ đây trở đi path ví dụ: "/uploads/blogs/abc.jpg" hoặc "/uploads/courses/xxx"
  return `${API_ROOT}${path}`;
};

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "Tin tức",
    tags: [],
    thumbnail: "",
  });
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const quillRef = useRef(null);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const { data } = await getAllBlogs();
      setBlogs(data || []);
    } catch (err) {
      console.error(err);
      alert("Không thể tải blog!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery) return fetchBlogs();
    setLoading(true);
    try {
      const { data } = await searchBlogs(searchQuery);
      setBlogs(data || []);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tìm kiếm blog!");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      title: "",
      content: "",
      category: "Tin tức",
      tags: [],
      thumbnail: "",
    });
    setFile(null);
    setEditingBlog(null);
    setIsModalOpen(true);
  };

  const openEditModal = (blog) => {
    setFormData({
      title: blog.title || "",
      content: blog.content || "",
      category: blog.category || "Tin tức",
      tags: blog.tags || [],
      thumbnail: blog.thumbnail || "",
    });
    setFile(null);
    setEditingBlog(blog);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const plainContent = formData.content.replace(/<(.|\n)*?>/g, "").trim();
    if (!formData.title.trim() || !plainContent) {
      alert("Tiêu đề và nội dung là bắt buộc!");
      return;
    }

    try {
      const data = new FormData();
      data.append("title", formData.title.trim());
      data.append("content", formData.content);
      data.append("category", formData.category.trim());
      data.append("tags", JSON.stringify(formData.tags));

      // ✅ Chỉ gửi file mới nếu có chọn
      if (file) data.append("thumbnail", file);

      if (editingBlog) {
        await updateBlog(editingBlog._id, data);
      } else {
        await createBlog(data);
      }

      fetchBlogs();
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving blog:", err.response?.data || err);
      alert(err.response?.data?.message || "Lỗi khi lưu blog!");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa blog này?")) return;
    try {
      await deleteBlog(id);
      fetchBlogs();
    } catch (err) {
      console.error(err);
      alert("Không thể xóa blog!");
    }
  };

  return (
    <div className="bg-orange-50 min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-orange-600">Quản lý Blog</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-orange-300 rounded px-3 py-2"
          />
          <button
            onClick={handleSearch}
            className="bg-orange-300 hover:bg-orange-400 text-white px-4 py-2 rounded"
          >
            Tìm
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-orange-300 hover:bg-orange-400 text-white px-4 py-2 rounded"
          >
            <Plus size={18} />
            Thêm Blog
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-orange-500">Đang tải...</p>
      ) : blogs.length === 0 ? (
        <p className="text-center text-orange-500">Chưa có blog nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-orange-200 rounded-lg overflow-hidden">
            <thead className="bg-orange-100 text-orange-700">
              <tr>
                <th className="px-4 py-2 text-left">Tiêu đề</th>
                <th className="px-4 py-2 text-left">Thumbnail</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Tác giả</th>
                <th className="px-4 py-2 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={blog._id} className="border-t hover:bg-orange-50">
                  <td className="px-4 py-2 font-medium">{blog.title}</td>
                  <td className="px-4 py-2">
                    {blog.thumbnail ? (
                      <img
                        src={getBlogThumbUrl(blog.thumbnail)}
                        alt="thumb"
                        className="w-20 h-12 object-cover rounded"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">{blog.category}</td>
                  <td className="px-4 py-2">
                    {blog.author?.name || "Admin"}
                  </td>
                  <td className="px-4 py-2 flex justify-center gap-2">
                    <button
                      onClick={() => openEditModal(blog)}
                      className="text-orange-500 hover:text-orange-700"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-xl font-semibold mb-4 text-orange-600">
              {editingBlog ? "Chỉnh sửa Blog" : "Thêm Blog mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full border border-orange-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Nhập tiêu đề"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Nội dung</label>
                <ReactQuill
                  ref={quillRef}
                  value={formData.content}
                  onChange={(value) =>
                    setFormData({ ...formData, content: value })
                  }
                  theme="snow"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full border border-orange-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Tags (phân cách dấu phẩy)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(",")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full border border-orange-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">Thumbnail</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full border border-orange-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                {formData.thumbnail && !file && (
                  <img
                    src={getBlogThumbUrl(formData.thumbnail)}
                    alt="thumb"
                    className="mt-2 w-40 h-24 object-cover rounded"
                  />
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border border-orange-300 hover:bg-orange-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-400 text-white rounded hover:bg-orange-500 transition"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
