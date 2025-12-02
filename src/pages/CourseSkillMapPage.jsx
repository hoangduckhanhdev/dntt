// src/pages/CourseSkillMapPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import skillApi from "../api/skillApi";
import SkillMapMindmap from "../components/SkillMapMindmap";

export default function CourseSkillMapPage() {
  const { courseId } = useParams();
  const location = useLocation();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Nhận dữ liệu AI nếu navigate từ bài kiểm tra đầu vào
  const aiSkillMap = location.state?.aiSkillMap || null;

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setErr("");

        const data = await skillApi.getSkillsByCourse(courseId);

        setSkills(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("❌ Lỗi lấy skill:", e);
        setErr("Không tải được danh sách kỹ năng.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) fetchSkills();
  }, [courseId]);

  // Chuẩn hóa dữ liệu AI truyền vào Mindmap để tránh crash
  const aiData = aiSkillMap
    ? {
        skillLevels: aiSkillMap?.ai?.skillLevels || {},
        recommendedPath: aiSkillMap?.ai?.recommendedPath || [],
      }
    : null;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            🧠 Bản đồ kỹ năng khoá học
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Xem toàn bộ kỹ năng & mối liên kết trong một màn hình.  
            Nếu bạn đã làm test đầu vào, AI sẽ đánh giá mức độ của bạn và gợi ý lộ trình học.
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Link
            to={`/course/${courseId}`}
            className="text-xs text-orange-600 hover:underline"
          >
            ⬅ Quay lại trang khoá học
          </Link>

          {aiData && (
            <span className="text-[11px] text-emerald-600">
              Đang hiển thị phân tích từ AI
            </span>
          )}
        </div>
      </div>

      {/* Banner AI */}
      {aiData && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
          <div className="font-semibold mb-1">🎯 Dữ liệu từ bài test đầu vào</div>
          <p className="text-xs leading-relaxed">
            AI đã phân tích điểm theo từng kỹ năng, đánh giá mức độ hiện tại,
            và gợi ý thứ tự bạn nên học. Các node được highlight theo lộ trình gợi ý.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl border shadow-sm p-4 min-h-[500px]">
        {loading && (
          <div className="text-sm text-gray-500 animate-pulse">
            Đang tải bản đồ kỹ năng...
          </div>
        )}

        {err && (
          <div className="text-sm text-red-500 mb-3">
            {err}
          </div>
        )}

        {!loading && !err && (
          <SkillMapMindmap
            skills={skills}
            aiData={aiData}
          />
        )}
      </div>
    </div>
  );
}
