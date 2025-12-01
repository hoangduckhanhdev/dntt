import axios from "axios";

// ✅ Base URL của backend
const API_BASE = "http://localhost:5000/api/admin/categories";

// ======================= 🔹 Lấy tất cả danh mục 🔹 =======================
export const getAllCategories = async () => {
  try {
    return await axios.get(`${API_BASE}`);
  } catch (err) {
    console.error("Lỗi khi lấy danh mục:", err);
    throw err;
  }
};

// ======================= 🔹 Tạo danh mục mới 🔹 =======================
export const createCategory = async (data) => {
  try {
    return await axios.post(`${API_BASE}`, data);
  } catch (err) {
    console.error("Lỗi khi tạo danh mục:", err);
    throw err;
  }
};

// ======================= 🔹 Cập nhật danh mục 🔹 =======================
export const updateCategory = async (id, data) => {
  try {
    return await axios.put(`${API_BASE}/${id}`, data);
  } catch (err) {
    console.error("Lỗi khi cập nhật danh mục:", err);
    throw err;
  }
};

// ======================= 🔹 Xóa danh mục 🔹 =======================
export const deleteCategory = async (id) => {
  try {
    return await axios.delete(`${API_BASE}/${id}`);
  } catch (err) {
    console.error("Lỗi khi xóa danh mục:", err);
    throw err;
  }
};
