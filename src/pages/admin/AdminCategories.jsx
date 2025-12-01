import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash } from "lucide-react";
import { getAllCategories, createCategory, updateCategory, deleteCategory } from "../../api/adminCategoryApi";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  // ✅ Lấy danh sách danh mục
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await getAllCategories();
      setCategories(data.categories || data || []);
    } catch (err) {
      console.error(err);
      alert("Không thể tải danh mục!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ✅ Mở modal thêm mới
  const openAddModal = () => {
    setFormData({ name: "", description: "" });
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  // ✅ Mở modal chỉnh sửa
  const openEditModal = (cat) => {
    setFormData({ name: cat.name || "", description: cat.description || "" });
    setEditingCategory(cat);
    setIsModalOpen(true);
  };

  // ✅ Lưu dữ liệu từ modal
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Tên danh mục là bắt buộc!");
      return;
    }

    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, formData);
      } else {
        await createCategory(formData);
      }
      fetchCategories();
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi lưu danh mục!");
    }
  };

  // ✅ Xóa danh mục
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
      try {
        await deleteCategory(id);
        fetchCategories();
      } catch (err) {
        console.error(err);
        alert("Không thể xóa danh mục!");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-orange-700">Quản lý danh mục</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-orange-400 text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition"
        >
          <Plus size={18} />
          <span>Thêm danh mục</span>
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <p className="text-center text-gray-500">Đang tải...</p>
      ) : categories.length === 0 ? (
        <p className="text-center text-gray-500">Chưa có danh mục nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-orange-50 text-orange-800">
              <tr>
                <th className="px-4 py-3 text-left">Tên danh mục</th>
                <th className="px-4 py-3 text-left">Mô tả</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-center w-32">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-t hover:bg-orange-50">
                  <td className="px-4 py-3 font-medium">{cat.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{cat.description || "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.slug || "—"}</td>
                  <td className="px-4 py-3 text-center flex justify-center gap-3">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="text-orange-500 hover:text-orange-700 transition"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="text-red-500 hover:text-red-700 transition"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-orange-700">
              {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Tên danh mục</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Nhập tên danh mục"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Mô tả (tùy chọn)"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-400 text-white hover:bg-orange-500 transition"
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
