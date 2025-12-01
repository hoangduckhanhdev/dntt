// src/pages/admin/AdminStudyRooms.jsx
import React, { useEffect, useState } from "react";
import adminStudyRoomApi from "../../api/adminStudyRoomApi";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Trash2, PlusCircle, Loader2, Users } from "lucide-react";

export default function AdminStudyRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editRoom, setEditRoom] = useState(null);

  const navigate = useNavigate();

  // ROLE CHECK: chỉ admin + teacher mới vào được
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u || (u.role !== "admin" && u.role !== "teacher")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      setLoading(true);
      setErr("");
      const res = await adminStudyRoomApi.getRooms();
      setRooms(res.rooms || []);
    } catch (error) {
      console.error(error);
      setErr("Không tải được danh sách phòng.");
    } finally {
      setLoading(false);
    }
  }

  function openEdit(room) {
    setEditRoom({
      ...room,
      name: room.name,
      isPublic: room.isPublic,
    });
  }

  async function handleSaveEdit() {
    try {
      await adminStudyRoomApi.updateRoom(editRoom._id, {
        name: editRoom.name,
        isPublic: editRoom.isPublic,
      });

      setEditRoom(null);
      fetchRooms();
    } catch (error) {
      console.error(error);
      alert("Không thể cập nhật phòng!");
    }
  }

  async function handleDelete(roomId) {
    if (!window.confirm("Bạn chắc chắn muốn xoá phòng này?")) return;
    try {
      await adminStudyRoomApi.deleteRoom(roomId);
      fetchRooms();
    } catch (error) {
      console.error(error);
      alert("Không thể xoá phòng!");
    }
  }

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Quản lý phòng học nhóm
        </h1>

        {/* Nút tạo phòng mới: dùng trang /study-rooms (user layout) */}
        <Link
          to="/study-rooms"
          className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-2"
        >
          <PlusCircle size={18} /> Tạo phòng mới
        </Link>
      </div>

      {err && (
        <div className="text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded mb-3">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Loader2 className="animate-spin" size={20} /> Đang tải...
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Tên phòng</th>
                <th className="px-3 py-2 text-left">Khoá học</th>
                <th className="px-3 py-2 text-left">Người tạo</th>
                <th className="px-3 py-2 text-center">Public</th>
                <th className="px-3 py-2 text-center">Thành viên</th>
                <th className="px-3 py-2 text-center">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {rooms.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    Chưa có phòng học nhóm nào.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr className="border-t" key={room._id}>
                    <td className="px-3 py-2">{room.name}</td>
                    <td className="px-3 py-2">
                      {room.course?.title || (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {room.createdBy?.name || "—"}
                    </td>

                    <td className="px-3 py-2 text-center">
                      {room.isPublic ? (
                        <span className="text-green-600 font-semibold">
                          Có
                        </span>
                      ) : (
                        <span className="text-gray-500">Không</span>
                      )}
                    </td>

                    <td className="px-3 py-2 text-center text-gray-600">
                      <Users size={18} className="inline-block" />{" "}
                      {room.members?.length || 0}
                    </td>

                    {/* THAO TÁC */}
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-3">
                        {/* 👁 Vào phòng (mở layout user) */}
                        <Link
                          to={`/study-rooms/${room._id}`}
                          className="text-indigo-600 hover:underline text-sm"
                        >
                          Vào phòng
                        </Link>

                        {/* ✏ Sửa phòng */}
                        <button
                          className="text-amber-600 hover:text-amber-800"
                          title="Chỉnh sửa phòng"
                          onClick={() => openEdit(room)}
                        >
                          <Pencil size={18} />
                        </button>

                        {/* 🗑 Xoá phòng */}
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Xoá phòng"
                          onClick={() => handleDelete(room._id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL SỬA PHÒNG */}
      {editRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-3">Chỉnh sửa phòng</h2>

            <label className="block text-sm mb-1">Tên phòng</label>
            <input
              className="w-full border rounded px-3 py-2 mb-3"
              value={editRoom.name}
              onChange={(e) =>
                setEditRoom({ ...editRoom, name: e.target.value })
              }
            />

            <label className="flex items-center gap-2 mb-3 text-sm">
              <input
                type="checkbox"
                checked={editRoom.isPublic}
                onChange={(e) =>
                  setEditRoom({ ...editRoom, isPublic: e.target.checked })
                }
              />
              Phòng Public
            </label>

            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-2 text-sm border rounded"
                onClick={() => setEditRoom(null)}
              >
                Hủy
              </button>
              <button
                className="px-4 py-2 text-sm bg-green-600 text-white rounded"
                onClick={handleSaveEdit}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
