// src/pages/admin/AdminCourseStudents.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, User, Mail, Phone, BarChart2 } from "lucide-react";
import Swal from "sweetalert2";
import {
  getCourseStudents,
  getStudentProgress,
} from "../../api/adminCourseApi";

export default function AdminCourseStudents() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const [courseTitle, setCourseTitle] = useState("");
  const [totalLessons, setTotalLessons] = useState(0);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal chi tiết tiến độ
  const [showDetail, setShowDetail] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [progressDetail, setProgressDetail] = useState(null);

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await getCourseStudents(courseId);

      // Chuẩn hoá payload (có thể là {data:{...}} hoặc {...})
      const payload = res.data?.data || res.data || {};

      setCourseTitle(payload.courseTitle || "Khóa học");
      setTotalLessons(payload.totalLessons || 0);
      setStudents(payload.students || []);
    } catch (err) {
      console.error("Lỗi khi tải học viên:", err);
      Swal.fire("Lỗi", "Không thể tải danh sách học viên.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (stu) => {
    if (!stu.userId) {
      Swal.fire(
        "Thông báo",
        "Học viên này chưa liên kết với tài khoản User, không xem chi tiết tiến độ được.",
        "info"
      );
      return;
    }

    try {
      setSelectedStudent(stu);
      setShowDetail(true);
      setDetailLoading(true);

      const res = await getStudentProgress(courseId, stu.userId);
      const payload = res.data?.data || res.data || {};
      setProgressDetail(payload);
    } catch (err) {
      console.error("Lỗi khi tải tiến độ:", err);
      Swal.fire("Lỗi", "Không thể tải tiến độ học viên.", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="p-6 bg-orange-50 min-h-screen rounded-xl shadow-inner">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white border border-orange-200 text-orange-500 hover:bg-orange-100 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-orange-600">
              👨‍🎓 Học viên khóa học
            </h1>
            <p className="text-sm text-gray-500">
              Khóa học:{" "}
              <span className="font-semibold text-gray-800">
                {courseTitle}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Tổng số học viên:{" "}
              <span className="font-semibold text-orange-600">
                {students.length}
              </span>
              {totalLessons > 0 && (
                <>
                  {" • "}
                  Tổng số bài học:{" "}
                  <span className="font-semibold text-orange-600">
                    {totalLessons}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <Link
          to="/admin/courses"
          className="text-sm text-orange-600 hover:underline"
        >
          ⬅ Quay lại danh sách khóa học
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-orange-400">
          <Loader2 className="animate-spin mr-2" /> Đang tải danh sách học viên...
        </div>
      ) : students.length === 0 ? (
        <p className="text-center text-gray-500 italic py-10">
          Chưa có học viên nào đăng ký khóa học này.
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-orange-100 text-orange-800">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold">#</th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Học viên
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  SĐT
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Thanh toán
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Tiến độ
                </th>
                <th className="px-4 py-2 text-left text-sm font-semibold">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((stu, idx) => (
                <tr
                  key={stu.registerId || idx}
                  className="border-b hover:bg-orange-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                      <User size={16} />
                    </span>
                    <span className="font-medium text-gray-800">
                      {stu.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Mail size={14} /> {stu.email}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <Phone size={14} /> {stu.phone}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        stu.paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : stu.paymentStatus === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {stu.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full bg-orange-400"
                          style={{ width: `${stu.percent || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600">
                        {stu.percent || 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleViewDetail(stu)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50 text-xs"
                    >
                      <BarChart2 size={14} /> Chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL chi tiết tiến độ */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setShowDetail(false);
                setSelectedStudent(null);
                setProgressDetail(null);
              }}
            >
              ✕
            </button>

            <h2 className="text-lg font-bold text-orange-600 mb-1 flex items-center gap-2">
              <BarChart2 size={18} /> Tiến độ học viên
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {selectedStudent?.name} — {selectedStudent?.email}
            </p>

            {detailLoading || !progressDetail ? (
              <div className="flex items-center justify-center py-10 text-orange-400">
                <Loader2 className="animate-spin mr-2" /> Đang tải dữ liệu...
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Tiến độ tổng</span>
                    <span>{progressDetail.percent || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden mb-2">
                    <div
                      className="h-2 rounded-full bg-orange-400"
                      style={{
                        width: `${progressDetail.percent || 0}%`,
                      }}
                    />
                  </div>

                  {/* ✅ hiển thị số bài đã hoàn thành / tổng số bài */}
                  <div className="text-xs text-gray-600">
                    Bài đã hoàn thành:{" "}
                    <span className="font-semibold text-orange-600">
                      {(progressDetail.completedLessons || []).length}
                    </span>
                    {" / "}
                    <span className="font-semibold text-orange-600">
                      {progressDetail.totalLessons || totalLessons}
                    </span>
                  </div>
                  {progressDetail.updatedAt && (
                    <div className="text-xs text-gray-400 mt-1">
                      Cập nhật gần nhất:{" "}
                      {new Date(progressDetail.updatedAt).toLocaleString(
                        "vi-VN"
                      )}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 italic">
                  * Khi học viên hỏi: giáo viên có thể trả lời kiểu
                  “Bạn đã hoàn thành{" "}
                  <b>
                    {(progressDetail.completedLessons || []).length}/
                    {progressDetail.totalLessons || totalLessons}
                  </b>{" "}
                  bài, tương đương{" "}
                  <b>{progressDetail.percent || 0}%</b> khóa học.”
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
