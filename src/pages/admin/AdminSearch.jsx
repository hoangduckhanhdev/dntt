import React, { useState } from "react";
import axios from "axios";
import { Search, User, BookOpen, FileText } from "lucide-react";

export default function AdminSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await axios.get(`/api/admin/search?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-2xl shadow-lg border border-orange-100">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        <Search className="text-orange-500" /> Tìm kiếm dữ liệu
      </h1>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Nhập từ khóa (người dùng, khóa học, blog...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-400 outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? "Đang tìm..." : "Tìm kiếm"}
        </button>
      </div>

      {results && (
        <div className="space-y-6">
          <Section title="Người dùng" icon={<User />} data={results.users} color="orange" />
          <Section title="Khóa học" icon={<BookOpen />} data={results.courses} color="blue" />
          <Section title="Blog" icon={<FileText />} data={results.blogs} color="green" />
        </div>
      )}
    </div>
  );
}

const Section = ({ title, icon, data, color }) => {
  if (!data || data.length === 0) return null;
  return (
    <div>
      <h2 className={`text-lg font-semibold text-${color}-600 flex items-center gap-2 mb-2`}>
        {icon} {title}
      </h2>
      <ul className="space-y-2">
        {data.map((item) => (
          <li key={item._id} className="border p-3 rounded-lg hover:bg-gray-50 transition">
            <p className="font-medium text-gray-800">{item.name || item.title}</p>
            {item.email && <p className="text-sm text-gray-500">{item.email}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
};
