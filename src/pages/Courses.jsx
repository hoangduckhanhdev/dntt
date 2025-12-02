import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CourseCard from "../components/CourseCard";
import { API_URL } from "../api/config"; // ✅ THÊM DÒNG NÀY

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setErr("");
        setLoading(true);

        const [courseRes, categoryRes] = await Promise.all([
          // ❌ KHÔNG dùng localhost nữa
          // axios.get("http://localhost:5000/api/courses"),
          // axios.get("http://localhost:5000/api/category"),

          // ✅ Dùng API_URL đã config (Render sẽ tự dùng https://hkcode.onrender.com)
          axios.get(`${API_URL}/courses`),
          axios.get(`${API_URL}/category`),
        ]);

        // tuỳ backend trả về, mình giữ nguyên logic cũ
        setCourses(courseRes.data || []);
        setCategories(categoryRes.data || []);
      } catch (e) {
        console.error("Lỗi tải khoá học / danh mục:", e);
        setErr("Không tải được dữ liệu. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter + search + sort (memo để mượt)
  const displayed = useMemo(() => {
    const matchCategory = (c) =>
      selectedCategory === "all" ||
      c.category === selectedCategory ||
      c.category?._id === selectedCategory ||
      c.category?.name ===
        categories.find((cat) => cat._id === selectedCategory)?.name;

    const matchSearch = (c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.teacher?.name?.toLowerCase().includes(q)
      );
    };

    let list = courses.filter((c) => matchCategory(c) && matchSearch(c));

    switch (sortBy) {
      case "priceAsc":
        list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "priceDesc":
        list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "popular":
        list = [...list].sort((a, b) => (b.students || 0) - (a.students || 0));
        break;
      default:
        // newest
        list = [...list].sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
    }
    return list;
  }, [courses, categories, selectedCategory, search, sortBy]);

  // Skeleton loader
  const Skeleton = () => (
    <div className="animate-pulse">
      <div className="h-44 rounded-2xl bg-orange-200/30" />
      <div className="mt-4 h-4 w-3/5 rounded bg-orange-200/40" />
      <div className="mt-2 h-4 w-2/5 rounded bg-orange-200/30" />
      <div className="mt-4 h-9 w-28 rounded-full bg-orange-200/60" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      {/* Hero */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-6 pt-10 pb-6">
          <div className="rounded-3xl bg-white/70 backdrop-blur shadow-sm ring-1 ring-orange-100 p-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-orange-600">
              Khám phá khoá học
            </h1>
            <p className="mt-2 text-gray-600"></p>

            {/* Filter bar */}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1 relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên khoá học, mô tả, giảng viên…"
                  className="w-full rounded-full border border-orange-200 bg-white px-5 py-3 pr-12 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500">
                  🔎
                </span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="newest">Mới nhất</option>
                <option value="popular">Phổ biến</option>
                <option value="priceAsc">Giá tăng dần</option>
                <option value="priceDesc">Giá giảm dần</option>
              </select>
            </div>

            {/* Categories pill row */}
            <div className="mt-6 overflow-x-auto">
              <div className="flex gap-2 py-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`whitespace-nowrap px-4 py-2 rounded-full border transition-all text-sm
                    ${
                      selectedCategory === "all"
                        ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                        : "bg-white text-gray-700 border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                >
                  Tất cả
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat._id}
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full border transition-all text-sm
                      ${
                        selectedCategory === cat._id
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-white text-gray-700 border-orange-200 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {err && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {err}
          </div>
        )}

        {loading ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        ) : displayed.length ? (
          <>
            {selectedCategory === "all" ? (
              categories.map((cat) => {
                const group = displayed.filter(
                  (c) =>
                    c.category === cat._id ||
                    c.category?._id === cat._id ||
                    c.category?.name === cat.name
                );
                if (!group.length) return null;
                return (
                  <section key={cat._id} className="mt-10">
                    <div className="flex items-end justify-between">
                      <h2 className="text-xl font-semibold text-orange-600">
                        {cat.name}
                      </h2>
                      <div className="h-[2px] flex-1 ml-4 bg-gradient-to-r from-orange-200 to-transparent" />
                    </div>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {group.map((course) => (
                        <div
                          key={course._id}
                          className="group rounded-2xl bg-white shadow-sm ring-1 ring-orange-100 hover:shadow-md transition overflow-hidden"
                        >
                          <CourseCard course={course} />
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })
            ) : (
              <section className="mt-10">
                <div className="flex items-end justify-between">
                  <h2 className="text-xl font-semibold text-orange-600">
                    {
                      categories.find((c) => c._id === selectedCategory)?.name ||
                      "Khóa học"
                    }
                  </h2>
                  <div className="h-[2px] flex-1 ml-4 bg-gradient-to-r from-orange-200 to-transparent" />
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayed.map((course) => (
                    <div
                      key={course._id}
                      className="group rounded-2xl bg-white shadow-sm ring-1 ring-orange-100 hover:shadow-md transition overflow-hidden"
                    >
                      <CourseCard course={course} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-orange-100 flex items-center justify-center text-3xl">
              🗂️
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-800">
              Chưa có khoá học phù hợp
            </h3>
            <p className="mt-1 text-gray-500">
              Thử đổi danh mục, từ khoá tìm kiếm hoặc sắp xếp khác nhé.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
