// src/components/feed/MiniQuizView.jsx
import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export default function MiniQuizView({ post, onChange }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selected == null) return;
    try {
      setSubmitting(true);
      const res = await axios.post(
        `${API_BASE}/feed/${post._id}/answer`,
        { optionIndex: selected },
        { withCredentials: true }
      );
      setResult(res.data); // { correct: boolean }
      onChange && onChange();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-2 bg-slate-50">
      <div className="font-semibold text-sm mb-2">
        🧩 Mini quiz: {post.quiz?.question}
      </div>
      <div className="space-y-1 mb-2">
        {post.quiz?.options?.map((opt, idx) => (
          <label
            key={idx}
            className={`flex items-center gap-2 text-sm border rounded px-2 py-1 cursor-pointer ${
              selected === idx ? "bg-blue-50 border-blue-400" : "bg-white"
            }`}
          >
            <input
              type="radio"
              name={`quiz-${post._id}`}
              checked={selected === idx}
              onChange={() => setSelected(idx)}
            />
            <span>{opt.text}</span>
          </label>
        ))}
      </div>
      <button
        onClick={handleSubmit}
        disabled={submitting || selected == null}
        className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
      >
        {submitting ? "Đang kiểm tra..." : "Nộp đáp án"}
      </button>

      {result && (
        <div
          className={`mt-2 text-xs ${
            result.correct ? "text-green-600" : "text-red-600"
          }`}
        >
          {result.correct ? "Chính xác! 🎉" : "Chưa đúng rồi, thử lại nhé!"}
          {post.quiz?.explanation && (
            <div className="mt-1 text-gray-700">
              Giải thích: {post.quiz.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
