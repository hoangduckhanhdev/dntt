import React, { useEffect, useState } from "react";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaLaptopCode,
  FaShieldAlt,
  FaClock,
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";

// 🔥 DÙNG API CHUNG
import { API_URL } from "../api/config";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  const navigate = useNavigate();

  /* =======================
        FETCH COURSES
  ======================== */
  useEffect(() => {
    axios
      .get(`${API_URL}/courses`)
      .then((res) => setCourses((res.data || []).slice(0, 6)))
      .catch((err) => console.error("Lỗi tải khóa học:", err))
      .finally(() => setLoading(false));
  }, []);

  /* =======================
        FETCH CATEGORIES
  ======================== */
  useEffect(() => {
    axios
      .get(`${API_URL}/category`)
      .then((res) => {
        const data = res.data;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.categories)
          ? data.categories
          : [];
        setCategories(list);
      })
      .catch((err) => console.error("Lỗi tải danh mục:", err))
      .finally(() => setLoadingCategories(false));
  }, []);

  /* =======================
        FETCH TESTIMONIALS
  ======================== */
  useEffect(() => {
    axios
      .get(`${API_URL}/testimonials`)
      .then((res) => setTestimonials(res.data || []))
      .catch((err) => console.error("Lỗi tải testimonials:", err))
      .finally(() => setLoadingTestimonials(false));
  }, []);

  /* =======================
        FETCH BLOGS
  ======================== */
  useEffect(() => {
    axios
      .get(`${API_URL}/blogs`)
      .then((res) => {
        const blogsData = res.data?.blogs || res.data || [];
        if (Array.isArray(blogsData)) setBlogs(blogsData.slice(0, 3));
      })
      .catch((err) => console.error("Lỗi tải blog:", err))
      .finally(() => setLoadingBlogs(false));
  }, []);

  /* ========= HERO SLIDES ========= */
  const heroSlides = [
    {
      img: "https://images.unsplash.com/photo-1529101091764-c3526daf38fe",
      title: "Nâng cao kỹ năng lập trình của bạn",
      subtitle: "Học từ các giảng viên hàng đầu và phát triển sự nghiệp IT",
    },
    {
      img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d",
      title: "Bắt đầu hành trình học tập mới",
      subtitle: "Tự tin xây dựng dự án thực tế ngay từ khóa đầu tiên",
    },
  ];

  const stats = { totalCourses: 24, totalInstructors: 8, totalStudents: 1500 };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-primary font-semibold">
          ⏳ Đang tải trang chủ...
        </div>
      </div>
    );
  }

  /* ============================================================
        RETURN JSX — GIỮ NGUYÊN, CHỈ SỬA PHẦN API Ở TRÊN
     ============================================================ */
  return (
    <div className="bg-[#fffaf6]">
      {/* ========== HERO ========== */}
      <section className="relative">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          autoplay={{ delay: 4200, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          loop
          className="h-[520px]"
        >
          {heroSlides.map((s, i) => (
            <SwiperSlide key={i}>
              <div
                className="h-[520px] bg-cover bg-center flex items-center justify-center relative"
                style={{ backgroundImage: `url(${s.img})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-accent/20 to-white/10"></div>
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  className="relative z-10 text-center px-6"
                >
                  <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-xl">
                    {s.title}
                  </h1>
                  <p className="mt-3 text-primaryLight">{s.subtitle}</p>
                  <div className="mt-5 flex justify-center gap-4">
                    <Link to="/courses" className="btn btn-primary px-6 py-3">
                      Khám phá ngay
                    </Link>
                    <Link to="/contact" className="btn btn-ghost px-6 py-3">
                      Liên hệ
                    </Link>
                  </div>
                </motion.div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      <div className="container-page">
        {/* ========================= KHÓA HỌC NỔI BẬT ========================= */}
        <section className="mt-16">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-dark inline-flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              Khóa học nổi bật
            </h2>
            <div className="mt-3">
              <Link to="/courses" className="nav-link text-primary font-semibold">
                Xem tất cả →
              </Link>
            </div>
          </div>

          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c, i) => (
              <motion.div
                key={c._id || c.id || i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.35 }}
                className="group relative card card-hover overflow-hidden"
              >
                <Link to={`/course/${c._id}`} className="block">
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={c.image || `https://source.unsplash.com/800x500/?education,${i}`}
                      alt={c.title}
                      className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-90 rounded-2xl"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/registercourse/${c._id}`);
                        }}
                        className="btn btn-primary px-5 py-2"
                      >
                        Đăng ký ngay
                      </button>
                    </div>
                  </div>

                  <div className="card-pad">
                    <h3 className="font-bold text-lg text-dark line-clamp-2 group-hover:text-primary transition">
                      {c.title}
                    </h3>

                    <div className="flex items-center gap-2 mt-2 meta">
                      <img
                        src={c.teacher?.avatar || `https://i.pravatar.cc/40?img=${i + 5}`}
                        alt={c.teacher?.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span>{c.teacher?.name || "Admin"}</span>
                    </div>

                    <div className="flex items-center justify-between mt-3 meta">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span>{(c.rating ?? 4.8).toFixed(1)}</span>
                        <span className="ml-1">({c.ratingCount || 128})</span>
                      </div>
                      <span>{c.students || 520} học viên</span>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <span className="price">
                        {typeof c.price === "number"
                          ? new Intl.NumberFormat("vi-VN").format(c.price) + "₫"
                          : c.price || "Miễn phí"}
                      </span>
                      <button className="btn btn-light">Xem chi tiết</button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ========================= DANH MỤC KHÓA HỌC ========================= */}
        <section className="py-16 bg-gradient-to-b from-white via-primaryLight/40 to-white rounded-2xl mt-16">
          <h2 className="text-3xl font-extrabold text-center text-dark mb-12">
            Danh mục khóa học
          </h2>

          {loadingCategories ? (
            <div className="text-center italic">⏳ Đang tải danh mục...</div>
          ) : categories.length === 0 ? (
            <div className="text-center italic">Không có danh mục nào.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
              {categories.map((cat, idx) => (
                <motion.div
                  key={cat._id || idx}
                  whileHover={{ scale: 1.05, y: -6 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => navigate(`/categories/${cat.slug || cat._id}`)}
                  className="group relative overflow-hidden card cursor-pointer"
                >
                  <img
                    src={cat.image || `https://source.unsplash.com/600x400/?${cat.name}`}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-all duration-700 group-hover:scale-110 rounded-2xl"
                  />

                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>

                  <div className="relative z-10 flex flex-col items-center justify-center h-48 text-center p-6 text-white">
                    <div className="bg-white/90 p-4 rounded-full shadow-lg mb-4 group-hover:scale-110 transition">
                      <img
                        src={cat.icon || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                        alt={cat.name}
                        className="w-10 h-10 object-contain"
                      />
                    </div>
                    <h3 className="text-lg font-semibold">{cat.name}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/categories" className="btn btn-primary px-6 py-2">
              Xem tất cả
            </Link>
          </div>
        </section>

        {/* ========================= THỐNG KÊ ========================= */}
        <section className="mt-14">
          <div className="rounded-2xl text-white p-8 shadow-soft bg-gradient-to-r from-primary to-accent">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <FaLaptopCode className="mx-auto text-4xl mb-2" />
                <h3 className="text-3xl font-extrabold">
                  <CountUp end={stats.totalCourses} duration={2} />+
                </h3>
                <p>Khóa học</p>
              </div>
              <div>
                <FaChalkboardTeacher className="mx-auto text-4xl mb-2" />
                <h3 className="text-3xl font-extrabold">
                  <CountUp end={stats.totalInstructors} duration={2} />+
                </h3>
                <p>Giảng viên</p>
              </div>
              <div>
                <FaUserGraduate className="mx-auto text-4xl mb-2" />
                <h3 className="text-3xl font-extrabold">
                  <CountUp end={stats.totalStudents} duration={2} />+
                </h3>
                <p>Học viên</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================= TESTIMONIALS ========================= */}
        <section className="mt-14">
          <h2 className="section-title mb-6">⭐ Học viên nói gì?</h2>

          {loadingTestimonials ? (
            <div className="text-center italic">⏳ Đang tải đánh giá...</div>
          ) : testimonials.length === 0 ? (
            <div className="text-center italic">Chưa có đánh giá nào.</div>
          ) : (
            <Swiper
              modules={[Autoplay, Pagination]}
              slidesPerView={1}
              autoplay={{ delay: 4200 }}
              pagination={{ clickable: true }}
              loop
            >
              {testimonials.map((t, i) => (
                <SwiperSlide key={i}>
                  <motion.div className="card card-pad max-w-2xl mx-auto text-center">
                    <img
                      src={t.img || "https://i.pravatar.cc/150"}
                      alt={t.name}
                      className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                    />
                    <p className="italic text-dark/80">“{t.comment}”</p>
                    <p className="mt-3 font-semibold text-primary">{t.name}</p>
                  </motion.div>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </section>

        {/* ========================= BLOG ========================= */}
        <section className="mt-14 mb-24">
          <h2 className="section-title mb-6">📰 Tin tức học tập mới nhất</h2>

          {loadingBlogs ? (
            <div className="text-center italic">⏳ Đang tải blog...</div>
          ) : blogs.length === 0 ? (
            <div className="text-center italic">Chưa có bài viết nào.</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((b, i) => (
                <motion.div
                  key={b._id || i}
                  whileHover={{ scale: 1.02 }}
                  className="card overflow-hidden cursor-pointer hover:shadow-hover transition-all"
                >
                  <Link to={`/blog/${b.slug || b._id}`} className="block">
                    <div className="h-48 overflow-hidden">
                      <img
                        src={b.thumbnail || `https://source.unsplash.com/800x500/?blog,${i}`}
                        alt={b.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110 rounded-2xl"
                      />
                    </div>
                    <div className="card-pad">
                      <h3 className="font-bold text-lg text-dark line-clamp-2 hover:text-primary transition">
                        {b.title}
                      </h3>
                      <p className="text-sm text-muted mt-2">🖋️ {b.author || "Admin"}</p>
                      {b.content && (
                        <p
                          className="text-dark/80 mt-3 line-clamp-3"
                          dangerouslySetInnerHTML={{
                            __html:
                              (b.content || "").slice(0, 120) +
                              ((b.content || "").length > 120 ? "..." : ""),
                          }}
                        />
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link to="/blog" className="btn btn-primary px-6 py-2">
              Xem tất cả
            </Link>
          </div>
        </section>
      </div>

      {/* ================ CTA cuối trang ================ */}
      <section className="mt-6">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-white">
            <div className="absolute -z-0 -right-24 -top-24 h-72 w-72 rounded-full bg-primaryLight"></div>
            <div className="absolute -z-0 -left-24 -bottom-24 h-72 w-72 rounded-full bg-primaryLight"></div>

            <div className="relative z-10 grid md:grid-cols-[1.2fr_0.8fr] gap-8 p-8 md:p-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-dark">
                  Sẵn sàng thăng hạng kỹ năng?{" "}
                  <span className="text-primary">Học ngay hôm nay!</span>
                </h2>

                <p className="mt-3 text-muted max-w-2xl">
                  Truy cập toàn bộ thư viện khóa học cập nhật liên tục, dự án thực tế,
                  lộ trình rõ ràng — học nhanh, nhớ lâu, áp dụng được ngay.
                </p>

                <ul className="mt-6 grid sm:grid-cols-3 gap-3">
                  <li className="card card-pad flex items-center gap-3">
                    <FaShieldAlt className="text-primary text-xl" />
                    <div>
                      <div className="font-semibold">Cam kết chất lượng</div>
                      <div className="text-xs text-muted">Hoàn tiền 7 ngày nếu không hài lòng</div>
                    </div>
                  </li>
                  <li className="card card-pad flex items-center gap-3">
                    <FaClock className="text-primary text-xl" />
                    <div>
                      <div className="font-semibold">Truy cập trọn đời</div>
                      <div className="text-xs text-muted">Học mọi lúc, mọi nơi</div>
                    </div>
                  </li>
                  <li className="card card-pad flex items-center gap-3">
                    <FaChalkboardTeacher className="text-primary text-xl" />
                    <div>
                      <div className="font-semibold">Giảng viên hỗ trợ</div>
                      <div className="text-xs text-muted">Q&A và review bài tập</div>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col items-start justify-center">
                <div className="bg-gradient-to-r from-primary to-accent w-full rounded-2xl text-white p-6 shadow-soft">
                  <div className="text-sm opacity-90">Ưu đãi cho người mới</div>
                  <div className="text-3xl font-extrabold mt-1">Giảm 30% tất cả khóa học</div>
                  <div className="text-sm opacity-90 mt-1">
                    Nhập mã: <span className="font-semibold">HKWELCOME</span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link to="/courses" className="btn bg-white text-primary hover:bg-primaryLight">
                      Xem khóa học
                    </Link>
                    <Link to="/register" className="btn btn-ghost">
                      Đăng ký tài khoản
                    </Link>
                  </div>
                </div>

                <p className="text-xs text-muted mt-3">
                  *Điều kiện áp dụng có thể thay đổi. Vui lòng xem chi tiết tại trang thanh toán.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden sticky bottom-4 z-40 px-4">
          <div className="rounded-full shadow-soft border border-border bg-white p-2 flex items-center justify-between">
            <span className="px-3 text-sm font-medium">Bắt đầu học miễn phí ngay!</span>
            <Link to="/courses" className="btn btn-primary px-5 py-2">
              Xem khóa học
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
