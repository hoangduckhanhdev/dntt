import React from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaTwitter, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mt-12">
      {/* viền cam mảnh phía trên như các site lớn */}
      <div className="h-1 bg-gradient-to-r from-primary to-accent" />

      <div className="bg-slate-900 text-gray-300">
        <div className="container-page py-10 grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primaryLight text-primary font-semibold">
                HK
              </span>
              <h2 className="text-xl font-semibold text-white">HKCode</h2>
            </div>
            <p className="text-sm text-gray-400 leading-6">
              Nền tảng học trực tuyến giúp bạn nâng cao kỹ năng mọi lúc, mọi nơi.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Liên kết nhanh
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="nav-link text-gray-300 hover:text-white">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/courses" className="nav-link text-gray-300 hover:text-white">
                  Khóa học
                </Link>
              </li>
              <li>
                <Link to="/about" className="nav-link text-gray-300 hover:text-white">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link to="/contact" className="nav-link text-gray-300 hover:text-white">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Theo dõi chúng tôi
            </h3>
            <div className="flex items-center gap-3 text-xl">
              <a
                href="#"
                aria-label="Facebook"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/5 border border-white/10 text-white hover:text-primary hover:bg-primaryLight/20 transition"
              >
                <FaFacebookF />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/5 border border-white/10 text-white hover:text-primary hover:bg-primaryLight/20 transition"
              >
                <FaTwitter />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/5 border border-white/10 text-white hover:text-primary hover:bg-primaryLight/20 transition"
              >
                <FaYoutube />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container-page py-4 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} <span className="text-white">HKCode</span>.
            All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
