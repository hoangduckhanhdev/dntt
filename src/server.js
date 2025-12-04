// src/server.js
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/database");
const StudyRoomMessage = require("./models/StudyRoomMessage");

const PORT = process.env.PORT || 5000;

// các origin cho Socket.IO (giống bên app.js)
const SOCKET_ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,                    // Render
  "http://localhost:5173",                     // dev
  "http://127.0.0.1:5173",
  "https://hkcode-frontend.onrender.com",
].filter(Boolean);

async function startServer() {
  try {
    await connectDB();
    console.log("✅ MongoDB connected successfully");

    // Tạo HTTP server
    const server = http.createServer(app);

    // ======================= 🔹 SOCKET.IO CONFIG 🔹 =======================
    const io = new Server(server, {
      cors: {
        origin(origin, callback) {
          if (!origin) return callback(null, true); // cho phép Postman, healthcheck
          if (SOCKET_ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
          }
          console.log("❌ Socket.IO CORS blocked origin:", origin);
          return callback(new Error("Not allowed by CORS (socket.io)"));
        },
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
      },
    });

    // Cho phép controller sử dụng io.emit(...)
    app.set("io", io);

    // ======================= 🔹 SOCKET EVENTS 🔹 =======================
    io.on("connection", (socket) => {
      console.log("🔌 Client connected:", socket.id);

      // 1️⃣ — PHÒNG HỌC NHÓM (CHAT TEXT)
      socket.on("join_study_room", ({ roomId, userId }) => {
        if (!roomId) return;
        socket.join(roomId);
        console.log(`👥 User ${userId} joined room ${roomId}`);

        socket.to(roomId).emit("study_room_user_joined", {
          userId,
          roomId,
          socketId: socket.id,
        });
      });

      socket.on("leave_study_room", ({ roomId, userId }) => {
        if (!roomId) return;
        socket.leave(roomId);
        console.log(`👋 User ${userId} left room ${roomId}`);

        socket.to(roomId).emit("study_room_user_left", {
          userId,
          roomId,
          socketId: socket.id,
        });
      });

      // Nhắn tin trong phòng học
      socket.on(
        "study_room_message",
        async ({ roomId, userId, content, type }) => {
          try {
            if (!roomId || !userId || !content) return;

            const message = await StudyRoomMessage.create({
              room: roomId,
              sender: userId,
              content,
              type: type || "text",
            });

            const payload = {
              _id: message._id,
              room: roomId,
              sender: userId,
              content,
              type: message.type,
              createdAt: message.createdAt,
            };

            io.to(roomId).emit("study_room_message_new", payload);
          } catch (err) {
            console.error("❌ Error saving study room message:", err);
            socket.emit("study_room_error", {
              message: "Không gửi được tin nhắn",
            });
          }
        }
      );

      socket.on("study_room_typing", ({ roomId, userId, isTyping }) => {
        if (!roomId) return;
        socket
          .to(roomId)
          .emit("study_room_typing", { roomId, userId, isTyping });
      });

      // 2️⃣ — PHÒNG HỌP / GỌI THOẠI (WEBRTC SIGNALING)
      socket.on("join_study_room_call", ({ roomId, userId }) => {
        if (!roomId) return;

        const callRoom = `call:${roomId}`;
        socket.join(callRoom);

        console.log(`📞 User ${userId} joined call in room ${roomId}`);

        socket.to(callRoom).emit("study_room_call_user_joined", {
          roomId,
          userId,
          socketId: socket.id,
        });
      });

      socket.on("leave_study_room_call", ({ roomId, userId }) => {
        if (!roomId) return;

        const callRoom = `call:${roomId}`;
        socket.leave(callRoom);

        console.log(`📴 User ${userId} left call in room ${roomId}`);

        socket.to(callRoom).emit("study_room_call_user_left", {
          roomId,
          userId,
          socketId: socket.id,
        });
      });

      socket.on(
        "study_room_call_webrtc_offer",
        ({ roomId, offer, fromUserId }) => {
          const callRoom = `call:${roomId}`;
          socket.to(callRoom).emit("study_room_call_webrtc_offer", {
            roomId,
            offer,
            fromUserId,
            fromSocketId: socket.id,
          });
        }
      );

      socket.on(
        "study_room_call_webrtc_answer",
        ({ roomId, answer, fromUserId, toSocketId }) => {
          if (toSocketId) {
            io.to(toSocketId).emit("study_room_call_webrtc_answer", {
              roomId,
              answer,
              fromUserId,
              fromSocketId: socket.id,
            });
          } else {
            const callRoom = `call:${roomId}`;
            socket.to(callRoom).emit("study_room_call_webrtc_answer", {
              roomId,
              answer,
              fromUserId,
              fromSocketId: socket.id,
            });
          }
        }
      );

      socket.on(
        "study_room_call_webrtc_ice_candidate",
        ({ roomId, candidate, fromUserId, toSocketId }) => {
          if (toSocketId) {
            io.to(toSocketId).emit(
              "study_room_call_webrtc_ice_candidate",
              {
                roomId,
                candidate,
                fromUserId,
                fromSocketId: socket.id,
              }
            );
          } else {
            const callRoom = `call:${roomId}`;
            socket.to(callRoom).emit(
              "study_room_call_webrtc_ice_candidate",
              {
                roomId,
                candidate,
                fromUserId,
                fromSocketId: socket.id,
              }
            );
          }
        }
      );

      socket.on("study_room_call_end", ({ roomId, userId }) => {
        const callRoom = `call:${roomId}`;
        console.log(`⏹ Call in room ${roomId} ended by ${userId}`);
        io.to(callRoom).emit("study_room_call_ended", { roomId, userId });
      });

      // 3️⃣ — NGẮT KẾT NỐI
      socket.on("disconnect", () => {
        console.log("❌ Client disconnected:", socket.id);
      });
    });

    // ======================= START SERVER =======================
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      const backendURL = process.env.BACKEND_URL || `http://localhost:${PORT}`;
      console.log(`🌐 Available at: ${backendURL}`);
    });

    process.on("unhandledRejection", (err) => {
      console.error("❌ Unhandled Rejection:", err);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
