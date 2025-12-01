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

  // nếu bạn navigate từ StudentExamDo và truyền state: { aiSkillMap: ... }
  const aiSkillMap = location.state?.aiSkillMap || null;

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await skillApi.getSkillsByCourse(courseId);
        setSkills(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setErr("Không tải được danh sách kỹ năng.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchSkills();
    }
  }, [courseId]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            🧠 Bản đồ kỹ năng khoá học
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem toàn bộ kỹ năng & mối liên kết trong một màn hình. Nếu bạn làm
            test đầu vào, AI sẽ gợi ý mức độ hiện tại và lộ trình học.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Link
            to={`/course/${courseId}`}
            className="text-xs text-orange-600 hover:underline"
          >
            ⬅ Quay lại trang khoá học
          </Link>
          {aiSkillMap && (
            <span className="text-[11px] text-emerald-600">
              Đang hiển thị dữ liệu AI từ bài test đầu vào
            </span>
          )}
        </div>
      </div>

      {/* Thông tin AI nếu có */}
      {aiSkillMap && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
          <div className="font-semibold mb-1">
            🎯 Dữ liệu AI từ bài test đầu vào
          </div>
          <p className="text-xs">
            AI đã phân tích điểm theo từng kỹ năng, gợi ý mức độ hiện tại và
            thứ tự nên học. Các node được highlight theo lộ trình đề xuất.
          </p>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        {loading && <div className="text-sm text-gray-500">Đang tải...</div>}
        {err && <div className="text-sm text-red-500 mb-3">{err}</div>}

        {!loading && !err && (
          <SkillMapMindmap
            skills={skills}
            aiData={
              aiSkillMap
                ? {
                    skillLevels: aiSkillMap.ai?.skillLevels || {},
                    recommendedPath: aiSkillMap.ai?.recommendedPath || [],
                  }
                : null
            }
          />
        )}
      </div>
    </div>
  );
}
