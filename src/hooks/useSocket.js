// src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

let socketInstance = null;

/**
 * ✅ Tạo kết nối socket.io một lần duy nhất trong toàn app
 */
export function getSocket() {
  if (!socketInstance) {
    socketInstance = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      reconnection: true, // 🔹 tự động reconnect khi mất kết nối
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketInstance.on("connect", () => {
      console.log("🟢 Socket connected:", socketInstance.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
    });
  }
  return socketInstance;
}

/**
 * ✅ Hook tiện ích để lắng nghe sự kiện realtime
 * @param {string} event - tên sự kiện (ví dụ: "notification:new")
 * @param {Function} handler - callback khi nhận dữ liệu
 */
export default function useSocket(event, handler) {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const callback = (payload) => {
      if (handlerRef.current) handlerRef.current(payload);
    };

    socket.on(event, callback);

    // Cleanup: hủy listener khi component unmount
    return () => {
      socket.off(event, callback);
    };
  }, [event]);
}
