import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import studyRoomApi from "../api/studyRoomApi";

export default function StudyRoomList() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const [searchParams] = useSearchParams();
  const courseIdFromQuery = searchParams.get("courseId") || "";

  const [courseTitle, setCourseTitle] = useState("");
  const [loadingCourse, setLoadingCourse] = useState(false);

  const [form, setForm] = useState({
    name: "",
    courseId: courseIdFromQuery,
    lessonName: "",
    isPublic: true,
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (courseIdFromQuery) {
      setForm((prev) => ({
        ...prev,
        courseId: courseIdFromQuery,
        name: prev.name || "Phòng học nhóm của khóa học",
      }));
    } else {
      setForm((prev) => ({ ...prev, courseId: "" }));
    }
  }, [courseIdFromQuery]);

  useEffect(() => {
    const loadCourseTitle = async () => {
      if (!courseIdFromQuery) {
        setCourseTitle("");
        return;
      }
      try {
        setLoadingCourse(true);
        const course = await studyRoomApi.getCourseById(courseIdFromQuery);
        const title = course?.title || course?.name || course?.courseName || "";
        setCourseTitle(title);
      } catch (e) {
        console.error(e);
        setCourseTitle("");
      } finally {
        setLoadingCourse(false);
      }
    };
    loadCourseTitle();
  }, [courseIdFromQuery]);

  async function fetchRooms() {
    try {
      setLoading(true);
      setErr("");
      const data = await studyRoomApi.getMyRooms();
      setRooms(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setErr("Không tải được danh sách phòng học nhóm.");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setErr("Tên phòng không được để trống.");
      return;
    }

    try {
      setErr("");
      const payload = {
        name: form.name.trim(),
        courseId: form.courseId || "",
        lessonName: (form.lessonName || "").trim(),
        isPublic: !!form.isPublic,
      };

      const created = await studyRoomApi.createRoom(payload);
      if (!created?._id) {
        setErr("Server tạo phòng thất bại.");
        return;
      }

      await fetchRooms();

      setShowCreate(false);
      setForm((prev) => ({
        ...prev,
        name: "",
        lessonName: "",
        isPublic: true,
        courseId: courseIdFromQuery || "",
      }));
    } catch (error) {
      console.error(error);
      setErr("Không tạo được phòng học. Vui lòng thử lại.");
    }
  }

  const filteredRooms = useMemo(() => {
    if (!courseIdFromQuery) return rooms;
    return rooms.filter((r) => {
      const id =
        (typeof r.course === "string" && r.course) || r.course?._id || r.courseId;
      return id ? String(id) === String(courseIdFromQuery) : false;
    });
  }, [rooms, courseIdFromQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Phòng học nhóm (Study Rooms)</h1>
          <p className="text-sm text-gray-600 mt-1">
            Tạo phòng học nhóm để trao đổi bài tập, chat realtime và gọi thoại.
          </p>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          + Tạo phòng học nhóm
        </button>
      </div>

      {err && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {err}
        </div>
      )}

      {showCreate && (
        <form
          onSubmit={handleCreateRoom}
          className="mb-6 border rounded-lg p-4 bg-gray-50"
        >
          <h2 className="font-semibold mb-3 text-lg">Tạo phòng học nhóm mới</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Tên phòng <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="VD: Nhóm ôn thi chương 1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Khóa học (hiện tại)
              </label>
              <input
                value={
                  courseIdFromQuery
                    ? loadingCourse
                      ? "Đang tải tên khóa học..."
                      : courseTitle || "Không tìm thấy tên khóa học"
                    : "Không chọn khóa học"
                }
                readOnly
                className="w-full border rounded px-3 py-2 text-sm bg-gray-100"
              />
              <input type="hidden" name="courseId" value={form.courseId} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Bài học (nhập tên - tuỳ chọn)
              </label>
              <input
                name="lessonName"
                value={form.lessonName}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="VD: Chương 1 - Bài 2 (Biến & kiểu dữ liệu)"
              />
            </div>

            <div className="flex items-center space-x-2 mt-5">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={form.isPublic}
                onChange={handleChange}
              />
              <label htmlFor="isPublic" className="text-sm">
                Public – tất cả học viên trong khóa đều xem được
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-3 py-2 text-sm border rounded"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700"
            >
              Lưu phòng
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Đang tải danh sách phòng...</p>
      ) : filteredRooms.length === 0 ? (
        <p className="text-gray-600">
          Chưa có phòng học nhóm nào. Hãy tạo phòng đầu tiên nhé.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Tên phòng</th>
                <th className="px-3 py-2 text-left">Khóa học</th>
                <th className="px-3 py-2 text-left">Bài học</th>
                <th className="px-3 py-2 text-left">Người tạo</th>
                <th className="px-3 py-2 text-left">Public</th>
                <th className="px-3 py-2 text-left">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredRooms.map((room) => (
                <tr key={room._id} className="border-t">
                  <td className="px-3 py-2">{room.name}</td>

                  <td className="px-3 py-2">
                    {room.course?.title || <span className="text-gray-400">—</span>}
                  </td>

                  <td className="px-3 py-2">
                    {room.lessonName?.trim()
                      ? room.lessonName
                      : <span className="text-gray-400">—</span>}
                  </td>

                  <td className="px-3 py-2">{room.createdBy?.name || "Không rõ"}</td>
                  <td className="px-3 py-2">{room.isPublic ? "Có" : "Không"}</td>
                  <td className="px-3 py-2">
                    <Link
                      to={`/study-rooms/${room._id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Vào phòng
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
