import axios from "axios";

const API_URL = "/api/admin/search";

const adminSearchApi = {
  // 📄 Tìm kiếm toàn hệ thống
  search: async (keyword, token) => {
    const res = await axios.get(`${API_URL}?q=${encodeURIComponent(keyword)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },
};

export default adminSearchApi;
