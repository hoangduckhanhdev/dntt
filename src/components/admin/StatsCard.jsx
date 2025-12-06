
import React from "react";

export default function StatsCard({ title, value, accent }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`mt-2 text-2xl font-bold ${accent || "text-gray-800"}`}>{value}</div>
    </div>
  );
}
