import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/teacher");
        setTeachers(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách giảng viên:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  const filteredTeachers = useMemo(() => {
    const q = search.toLowerCase();
    return teachers.filter((t) => {
      const name = (t.name || "").toLowerCase();
      const expertise = (t.expertise || "").toLowerCase();
      return name.includes(q) || expertise.includes(q);
    });
  }, [teachers, search]);

  const renderSkeleton = () => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-white/70 border border-orange-100 rounded-2xl shadow-sm p-5 animate-pulse"
        >
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-gray-200" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto mb-4" />
          <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-orange-50/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-semibold mb-3">
            👨‍🏫 Đội ngũ giảng viên HKCode
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-2">
            Danh sách giảng viên
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl mx-auto">
            Những người đồng hành cùng bạn trong hành trình học tập – bạn có thể
            tìm theo tên hoặc chuyên môn.
          </p>
        </div>

        {/* Thanh tìm kiếm + tổng số */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-orange-100 px-3 py-2 shadow-sm">
            <span className="text-orange-400 text-lg">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc chuyên môn..."
              className="w-full outline-none text-sm bg-transparent placeholder:text-slate-400"
            />
          </div>
          <div className="text-sm text-slate-500 sm:text-right">
            Tổng:{" "}
            <span className="font-semibold text-orange-600">
              {teachers.length}
            </span>{" "}
            giảng viên
          </div>
        </div>

        {/* Danh sách giảng viên */}
        {loading ? (
          renderSkeleton()
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            Không tìm thấy giảng viên nào phù hợp với từ khóa{" "}
            <span className="font-semibold text-orange-600">"{search}"</span>.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((teacher) => {
              const avatar =
                teacher.image ||
                teacher.avatar ||
                "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

              const rating =
                typeof teacher.rating === "number"
                  ? teacher.rating.toFixed(1)
                  : "0.0";

              const expertise =
                teacher.expertise || "Chưa cập nhật chuyên môn";

              return (
                <button
                  key={teacher._id}
                  type="button"
                  onClick={() => navigate(`/teacher/${teacher._id}`)}
                  className="group text-left bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 p-5 flex flex-col"
                >
                  {/* Badge */}
                  <div className="flex justify-between items-center mb-3 text-xs">
                    <span className="px-2 py-1 rounded-full bg-orange-50 text-orange-600 font-semibold">
                      Giảng viên
                    </span>
                    <span className="flex items-center gap-1 text-yellow-500 font-medium">
                      ⭐ <span className="text-slate-700">{rating}</span>
                    </span>
                  </div>

                  {/* Avatar + tên */}
                  <div className="flex flex-col items-center text-center mb-4">
                    <div className="relative mb-3">
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-orange-200 to-amber-200 blur opacity-0 group-hover:opacity-100 transition-opacity" />
                      <img
                        src={avatar}
                        alt={teacher.name}
                        className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                      {teacher.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">{expertise}</p>
                  </div>

                  {/* Info dưới */}
                  <div className="mt-auto pt-3 border-t border-dashed border-orange-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Khoá học:{" "}
                      <span className="font-semibold text-slate-700">
                        {teacher.totalCourses || 0}
                      </span>
                    </span>
                    <span className="text-orange-500 font-medium group-hover:translate-x-0.5 transition-transform">
                      Xem chi tiết →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
