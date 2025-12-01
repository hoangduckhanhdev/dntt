// src/pages/StudyRoomDetail.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import studyRoomApi from "../api/studyRoomApi";
import { getSocket } from "../hooks/useSocket";

export default function StudyRoomDetail() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // Lấy user hiện tại từ localStorage
  const currentUser = (() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  })();
  const currentUserId = currentUser?._id || currentUser?.id;

  // Scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Load messages + setup socket
  useEffect(() => {
    if (!roomId) return;

    fetchMessages();

    const socket = getSocket();
    socketRef.current = socket;

    // join phòng chat
    socket.emit("join_study_room", {
      roomId,
      userId: currentUserId,
    });

    // lắng nghe tin nhắn mới
    const handleNewMsg = (msg) => {
      const msgRoomId =
        typeof msg.room === "string" ? msg.room : msg.room?._id;

      if (msgRoomId !== roomId) return;
      setMessages((prev) => [...prev, msg]);
    };

    const handleTyping = ({ roomId: rId, userId, isTyping }) => {
      if (rId !== roomId || userId === currentUserId) return;
      setTypingUsers((prev) => ({
        ...prev,
        [userId]: isTyping,
      }));
    };

    socket.on("study_room_message_new", handleNewMsg);
    socket.on("study_room_typing", handleTyping);

    return () => {
      socket.emit("leave_study_room", {
        roomId,
        userId: currentUserId,
      });

      socket.off("study_room_message_new", handleNewMsg);
      socket.off("study_room_typing", handleTyping);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, currentUserId]);

  async function fetchMessages() {
    try {
      setLoading(true);
      setErr("");
      const data = await studyRoomApi.getRoomMessages(roomId);
      setMessages(data || []);
    } catch (error) {
      console.error(error);
      setErr("Không tải được lịch sử chat.");
    } finally {
      setLoading(false);
    }
  }

  function handleChangeInput(e) {
    const value = e.target.value;
    setInput(value);

    const socket = socketRef.current;
    if (!socket) return;

    socket.emit("study_room_typing", {
      roomId,
      userId: currentUserId,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("study_room_typing", {
        roomId,
        userId: currentUserId,
        isTyping: false,
      });
    }, 1500);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const content = input.trim();
    const socket = socketRef.current;
    if (!socket) return;

    // gửi qua socket
    socket.emit("study_room_message", {
      roomId,
      userId: currentUserId,
      content,
      type: "text",
    });

    // chỉ clear input, chờ server emit "study_room_message_new"
    setInput("");
  }

  const typingSomeone =
    Object.values(typingUsers).filter(Boolean).length > 0;

  // 👉 Hàm gọi thoại nhóm bằng Jitsi Meet
  const handleGroupCall = () => {
    if (!roomId) {
      alert("Không tìm thấy ID phòng học nhóm.");
      return;
    }

    // Đặt tên phòng Jitsi duy nhất cho từng StudyRoom
    const roomName = `elearning-room-${roomId}`;
    const url = `https://meet.jit.si/${roomName}`;

    // Mở phòng gọi trong tab mới
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link
            to="/study-rooms"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Quay lại danh sách phòng
          </Link>
          <h1 className="text-xl font-bold mt-1">Phòng học nhóm</h1>
          <p className="text-xs text-gray-500">
            Chat realtime giữa học viên và giáo viên trong lớp.
          </p>
        </div>

        {/* Nút gọi thoại nhóm */}
        <button
          type="button"
          className="px-3 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={handleGroupCall}
        >
          📞 Gọi thoại nhóm
        </button>
      </div>

      {err && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">
          {err}
        </div>
      )}

      <div className="flex-1 border rounded-lg flex flex-col bg-white overflow-hidden">
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {loading ? (
            <p>Đang tải tin nhắn...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-500">
              Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện đầu tiên nhé.
            </p>
          ) : (
            messages.map((msg) => {
              const senderId =
                msg.sender?._id || msg.sender?.id || msg.sender;
              const isMe = senderId === currentUserId;

              return (
                <div
                  key={msg._id}
                  className={`mb-2 flex ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      isMe
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    {!isMe && msg.sender?.name && (
                      <div className="text-xs font-semibold mb-0.5 opacity-80">
                        {msg.sender.name}
                      </div>
                    )}
                    <div>{msg.content}</div>
                    <div className="text-[10px] opacity-60 mt-1 text-right">
                      {msg.createdAt &&
                        new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {typingSomeone && (
          <div className="px-3 pb-1 text-xs text-gray-500">
            Ai đó đang nhập...
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="border-t px-3 py-2 flex items-center space-x-2"
        >
          <input
            value={input}
            onChange={handleChangeInput}
            className="flex-1 border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Nhập tin nhắn..."
          />
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-700"
          >
            Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
