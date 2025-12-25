import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE, API_URL } from "../api/config";

const resolveCourseImage = (courseWrapper) => {
  const course = courseWrapper.course || courseWrapper;

  let img =
    course.thumbnail ||
    course.image ||
    course.courseImage ||
    course.cover ||
    course.banner ||
    course.thumb;

  const collectStrings = (obj, acc = []) => {
    if (!obj || typeof obj !== "object") return acc;
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (!val) continue;
      if (typeof val === "string") acc.push(val);
      else if (typeof val === "object") collectStrings(val, acc);
    }
    return acc;
  };

  if (!img) {
    const allStrings = collectStrings(course);
    img =
      allStrings.find((s) => /\.(png|jpe?g|webp|gif|svg)$/i.test(s.split("?")[0])) ||
      allStrings.find((s) => s.includes("/uploads/") || s.includes("images/"));
  }

  if (img && !img.startsWith("http")) {
    img = `${API_BASE}${img.startsWith("/") ? "" : "/"}${img}`;
  }

  return img;
};

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");
        if (!token) {
          // Không có token => về login
          navigate("/login?redirect=/my-courses");
          return;
        }
        const res = await axios.get(`${API_URL}/my-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const list = Array.isArray(res.data?.courses) ? res.data.courses : [];
        setCourses(list);
      } catch (err) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message;

        console.error("GET /my-courses error:", status, err?.response?.data || err);

        if (status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login?redirect=/my-courses");
          return;
        }

        setError(msg || "Không lấy được danh sách khoá học");
      } finally {
        setLoading(false);
      }
    };

    fetchMyCourses();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50/40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="mb-6">
            <div className="h-8 w-56 bg-orange-200/40 rounded mb-2 animate-pulse" />
            <div className="h-4 w-72 bg-orange-200/30 rounded animate-pulse" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-soft border border-orange-100 p-4 animate-pulse"
              >
                <div className="h-28 bg-orange-100/60 rounded-xl mb-4" />
                <div className="h-4 w-3/4 bg-orange-100/80 rounded mb-2" />
                <div className="h-3 w-1/2 bg-orange-100/60 rounded mb-4" />
                <div className="h-2 bg-orange-100 rounded-full mb-3" />
                <div className="h-8 w-24 bg-orange-200/80 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50/40">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-dark mb-1">
            Khoá học của tôi
          </h1>
          <p className="text-sm md:text-base text-muted">
            Theo dõi tiến độ học tập và tiếp tục học những khoá bạn đã đăng ký.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-soft p-8 text-center border border-orange-100">
            <p className="text-muted mb-3">
              Bạn chưa đăng ký khoá học nào. Bắt đầu hành trình học tập ngay hôm nay nhé!
            </p>
            <Link
              to="/courses"
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-accent transition"
            >
              Khám phá khoá học
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {courses.map((wrapper) => {
              const rawCourse = wrapper.course || wrapper;
              const detailLink = `/course/${rawCourse.slug || rawCourse._id}`;
              const learnLink = `/learning/${rawCourse._id}`;
              const percent = Number(wrapper.progress ?? rawCourse.progress ?? 0);
              const img = resolveCourseImage(wrapper);

              return (
                <div
                  key={rawCourse._id}
                  className="bg-white rounded-2xl shadow-soft border border-orange-100 overflow-hidden flex flex-col md:flex-row md:items-stretch"
                >
                  <div className="md:w-1/3 relative">
                    <Link to={detailLink} className="block h-full">
                      <img
                        src={img || "https://placehold.co/400x240?text=Course"}
                        alt={rawCourse.title}
                        className="w-full h-40 md:h-full object-cover"
                      />
                    </Link>

                    {percent >= 100 && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-green-500 text-white text-xs font-semibold shadow">
                        Đã hoàn thành
                      </div>
                    )}
                  </div>

                  <div className="flex-1 p-4 md:p-5 flex flex-col">
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h2 className="text-base md:text-lg font-semibold text-dark line-clamp-2">
                          {rawCourse.title}
                        </h2>
                        {rawCourse.level && (
                          <span className="px-2 py-0.5 rounded-full bg-orange-50 text-[11px] font-semibold text-primary border border-orange-100 whitespace-nowrap">
                            {rawCourse.level}
                          </span>
                        )}
                      </div>

                      {rawCourse.shortDescription && (
                        <p className="text-sm text-muted line-clamp-2 mb-3">
                          {rawCourse.shortDescription}
                        </p>
                      )}

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted">Tiến độ khoá học</span>
                          <span className="text-xs font-semibold text-primary">
                            {Number.isFinite(percent) ? percent.toFixed(0) : 0}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-orange-100 overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                      <div className="flex flex-col text-xs">
                        {rawCourse.category && <span className="text-muted mb-0.5">{rawCourse.category}</span>}
                        {typeof rawCourse.price === "number" && (
                          <span className="text-sm font-semibold text-primary">
                            {rawCourse.price.toLocaleString("vi-VN")} đ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={detailLink}
                          className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full border border-border text-xs font-medium text-muted hover:bg-orange-50"
                        >
                          Xem chi tiết
                        </Link>
                        <Link
                          to={learnLink}
                          className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary text-white text-xs md:text-sm font-semibold hover:bg-accent transition"
                        >
                          {percent > 0 ? "Tiếp tục học" : "Bắt đầu học"}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
