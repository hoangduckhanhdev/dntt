// src/components/Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaUserCircle } from "react-icons/fa";
import CartBadge from "./CartBadge";
import FeedNotificationBell from "./feed/FeedNotificationBell"; // 🔔 THÊM DÒNG NÀY

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const userRef = useRef(null);
  const navigate = useNavigate();

  // Lấy user từ localStorage khi load
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);

  // Click ngoài menu thì ẩn dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Đăng xuất
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    window.location.reload();
  };

  // Style cho NavLink active
  const navClass = ({ isActive }) =>
    `nav-link relative py-2 after:absolute after:left-0 after:-bottom-0.5 after:h-[2px] after:rounded-full after:transition-all
     ${
       isActive
         ? "text-primary after:w-full after:bg-primary"
         : "after:w-0 hover:text-primary hover:after:w-full hover:after:bg-primary"
     }`;

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
      <div className="container-page py-3 flex items-center justify-between">
        {/* LOGO */}
        <Link
          to="/"
          className="group inline-flex items-center gap-2 text-2xl font-bold text-dark"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primaryLight text-primary shadow-soft group-hover:shadow-lg transition">
            HK
          </span>
          <span className="group-hover:text-primary transition"></span>
        </Link>

        {/* NAV (Desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink to="/" className={navClass}>
            Trang chủ
          </NavLink>
          <NavLink to="/courses" className={navClass}>
            Khóa học
          </NavLink>
          <NavLink to="/my-courses" className={navClass}>
            Khoá học của tôi
          </NavLink>

          {/* 🔥 Bảng tin học tập */}
          <NavLink to="/learn-feed" className={navClass}>
            Bảng tin
          </NavLink>

          <NavLink to="/teacher" className={navClass}>
            Giảng viên
          </NavLink>
          <NavLink to="/blog" className={navClass}>
            Tin tức
          </NavLink>
          <NavLink to="/about" className={navClass}>
            Giới thiệu
          </NavLink>
          <NavLink to="/contact" className={navClass}>
            Liên hệ
          </NavLink>
        </nav>

        {/* USER + MOBILE TOGGLE */}
        <div className="flex items-center gap-3 md:gap-4" ref={userRef}>
          {/* Cart luôn hiển thị */}
          <CartBadge />

          {/* 🔔 Thông báo LearnFeed – chỉ hiển thị khi đã login */}
          {user && <FeedNotificationBell />}

          {/* Auth actions */}
          {!user ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className="hidden md:inline-flex btn btn-ghost"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => navigate("/register")}
                className="hidden md:inline-flex btn btn-primary"
              >
                Đăng ký
              </button>
            </>
          ) : (
            <div className="relative">
              {/* Avatar */}
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="w-9 h-9 rounded-full object-cover border border-border cursor-pointer hover:ring-2 hover:ring-primary transition"
                />
              ) : (
                <FaUserCircle
                  size={34}
                  className="text-gray-600 cursor-pointer hover:text-primary transition"
                  onClick={() => setUserMenuOpen((v) => !v)}
                />
              )}

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-border bg-white shadow-soft animate-[fadeIn_0.2s_ease-out]">
                  {/* caret */}
                  <div className="absolute -top-2 right-4 h-3 w-3 rotate-45 bg-white border-l border-t border-border"></div>

                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-semibold text-dark truncate">
                      {user.name}
                    </p>
                    <p className="text-sm text-muted truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/my-courses"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-primaryLight"
                  >
                    Khoá học của tôi
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-4 py-2.5 text-sm hover:bg-primaryLight"
                  >
                    Hồ sơ cá nhân
                  </Link>

                  {user.role === "admin" && (
                    <Link
                      to="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="block px-4 py-2.5 text-sm hover:bg-primaryLight"
                    >
                      Trang quản trị
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-2xl"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden text-2xl text-dark"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* NAV (Mobile) */}
      <div
        id="mobile-menu"
        className={`md:hidden border-t border-border bg-white overflow-hidden transition-[max-height] duration-300 ${
          menuOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="container-page py-3 grid gap-2">
          <NavLink
            to="/"
            className="nav-link py-2"
            onClick={() => setMenuOpen(false)}
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/courses"
            className="nav-link py-2"
            onClick={() => setMenuOpen(false)}
          >
            Khóa học
          </NavLink>
          <NavLink
            to="/my-courses"
            className="nav-link py-2"
            onClick={() => setMenuOpen(false)}
          >
            Khoá học của tôi
          </NavLink>
          {/* Bảng tin (Mobile) */}
          <NavLink
            to="/learn-feed"
            className="nav-link py-2"
            onClick={() => setMenuOpen(false)}
          >
            Bảng tin
          </NavLink>
          <NavLink
            to="/teacher"
            className="nav-link py-2"
            onClick={() => setMenuOpen(false)}
          >
            Giảng viên
          </NavLink>
          <NavLink
            to="/blog"
            className="nav-link py-2"
            onClick={() => setMenuOpen(false)}
          >
            Tin tức
          </NavLink>
          <NavLink
            to="/about"
            className="nav-link py-2"
            onClick={() => setMenuOpen(false)}
          >
            Giới thiệu
          </NavLink>
          <NavLink
            to="/contact"
            className="nav-link py-2"
            onClick={() => setMenuOpen(false)}
          >
            Liên hệ
          </NavLink>

          {!user && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/login");
                }}
                className="btn btn-ghost w-full"
              >
                Đăng nhập
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/register");
                }}
                className="btn btn-primary w-full"
              >
                Đăng ký
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
