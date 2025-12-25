
import axios from "axios";
import { ADMIN_API_URL, API_URL } from "./config";
const BASE_URL = ADMIN_API_URL || `${API_URL}/admin`;

const adminApi = axios.create({
  baseURL: BASE_URL,
});
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); 
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);
const setToken = (token) => {
  if (token) adminApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  else delete adminApi.defaults.headers.common["Authorization"];
};
export const getCounts = async () => {
  const result = { users: 0, courses: 0, blogs: 0 };
  try {
    const [u, c, b] = await Promise.allSettled([
      adminApi.get("/users"),
      adminApi.get("/courses"),
      adminApi.get("/blogs"),
    ]);

    if (u.status === "fulfilled" && Array.isArray(u.value.data)) {
      result.users = u.value.data.length;
    }
    if (c.status === "fulfilled" && Array.isArray(c.value.data?.data)) {
      result.courses = c.value.data.data.length;
    } else if (c.status === "fulfilled" && Array.isArray(c.value.data)) {
      result.courses = c.value.data.length;
    }

    if (b.status === "fulfilled" && Array.isArray(b.value.data)) {
      result.blogs = b.value.data.length;
    }
  } catch (e) {
    console.warn("adminApi.getCounts partial fail", e);
  }
  return result;
};

export default adminApi;
export { setToken };
