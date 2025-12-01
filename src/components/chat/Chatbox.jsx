// src/components/.../Chatbox.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  FaHeadset,      // icon người hỗ trợ đeo tai nghe
  FaPaperPlane,
  FaTimes,
  FaMicrophone,
  FaImage,
  FaVolumeUp,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { aiChat, uploadImage, textToSpeech } from "../../services/aiClient";

export default function Chatbox() {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState([]); // URL ảnh đã upload

  // ✅ Lấy lịch sử chat từ localStorage (nếu có)
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("hk_chat_messages");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        role: "assistant",
        content:
          "Xin chào 👋 Mình là trợ lý HKCode. Bạn cần tư vấn khóa học, hay hướng dẫn đăng ký/thanh toán?",
      },
    ];
  });

  const [loading, setLoading] = useState(false);

  const listRef = useRef(null);
  const fileRef = useRef(null);

  // ✅ Mỗi khi messages đổi → lưu lại
  useEffect(() => {
    try {
      localStorage.setItem("hk_chat_messages", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Tự scroll xuống cuối khi mở / chat mới
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  /* ================== IMAGE ================== */
  async function onPickImage(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const url = await uploadImage(f);
      setPendingImages((arr) => [...arr, url]);
    } catch (err) {
      console.error(err);
      alert("Tải ảnh thất bại");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(u) {
    setPendingImages((arr) => arr.filter((x) => x !== u));
  }

  /* ================== MIC – STT TRÌNH DUYỆT ================== */
  async function recordOnce() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onerror = (event) => {
      console.error("STT browser error:", event.error);
      alert("Nhận diện giọng nói thất bại, vui lòng thử lại.");
    };

    recognition.start();
  }

  /* ================== TTS – GỌI BACKEND (có fallback) ================== */
  async function speak(text) {
    if (!text) return;
    try {
      const blob = await textToSpeech(text);
      const audio = new Audio(URL.createObjectURL(blob));
      audio.play();
    } catch (err) {
      console.error("TTS server error, fallback browser TTS:", err);
      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = "vi-VN";
        window.speechSynthesis.speak(utter);
      }
    }
  }

  /* ========== BẮT CLICK LINK TRONG BUBBLE → ĐI TỚI /course/:id KHÔNG RELOAD ========== */
  function handleMessagesClick(e) {
    const a = e.target.closest("a");
    if (!a) return;

    const href = a.getAttribute("href");
    if (!href) return;

    // Nếu là link nội bộ tới course → dùng navigate SPA
    if (href.startsWith("/course/")) {
      e.preventDefault();
      navigate(href);
    }
  }

  /* ================== SEND ================== */
  const send = async () => {
    const text = input.trim();
    if (!text && pendingImages.length === 0) return;
    if (loading) return;

    const userMsg =
      pendingImages.length > 0
        ? { role: "user", content: { text, images: pendingImages } }
        : { role: "user", content: text };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPendingImages([]);
    setLoading(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const reply = await aiChat({ messages: [...messages, userMsg], user });
      const botMsg = { role: "assistant", content: reply };
      setMessages((m) => [...m, botMsg]);
      // Nếu muốn auto đọc luôn:
      // speak(reply);
    } catch (err) {
      console.error(err);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Mất kết nối. Thử lại sau nhé." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ================== UI ================== */
  return (
    <>
      {/* Nút mở chat – icon người hỗ trợ đeo tai nghe, lắc qua lại */}
      {!open && (
        <button
          aria-label="Mở chat"
          onClick={() => setOpen(true)}
          className="
            fixed bottom-6 right-6 z-50
            rounded-full bg-primary text-white
            shadow-soft hover:shadow-lg
            p-3
            animate-chat-wiggle      /* 👈 animation lắc */
            hover:animate-none       /* di chuột vào thì đứng yên */
          "
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-primary">
            <FaHeadset className="text-xl" />
          </span>
        </button>
      )}

      {/* Hộp chat */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[92vw] rounded-2xl border border-border bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-accent text-white">
            <div className="font-semibold">HKCode Chatbox</div>
            <button
              aria-label="Đóng"
              onClick={() => setOpen(false)}
              className="opacity-90 hover:opacity-100"
            >
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="h-[380px] overflow-y-auto p-3 space-y-3 bg-[#fffaf6]"
            onClick={handleMessagesClick}
          >
            {messages.map((m, i) => (
              <Bubble
                key={i}
                role={m.role}
                content={m.content}
                onSpeak={speak}
              />
            ))}
            {loading && <Typing />}
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-border bg-white">
            {/* preview ảnh */}
            {pendingImages.length > 0 && (
              <div className="flex gap-2 mb-2 overflow-x-auto">
                {pendingImages.map((u) => (
                  <div key={u} className="relative">
                    <img
                      src={u}
                      className="h-14 w-14 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(u)}
                      className="absolute -top-2 -right-2 bg-white rounded-full border px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              {/* Mic */}
              <button
                onClick={recordOnce}
                className="btn btn-light"
                title="Nói nhanh (STT trình duyệt)"
              >
                <FaMicrophone />
              </button>

              {/* Image */}
              <button
                onClick={() => fileRef.current?.click()}
                className="btn btn-light"
                title="Gửi ảnh"
              >
                <FaImage />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPickImage}
              />

              {/* Text input */}
              <input
                className="input flex-1"
                placeholder="Nhập câu hỏi hoặc đính kèm ảnh…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />

              {/* Send */}
              <button
                onClick={send}
                disabled={loading}
                className="btn btn-primary"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* =============== Bubble =============== */
function Bubble({ role, content, onSpeak }) {
  const isUser = role === "user";
  const text =
    typeof content === "string" ? content : content?.text || "";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
          isUser
            ? "bg-primary text-white"
            : "bg-white border border-border text-dark"
        }`}
      >
        {/* text */}
        <div
          dangerouslySetInnerHTML={{
            __html: (text || "").replace(/\n/g, "<br/>"),
          }}
        />

        {/* nếu user gửi có ảnh thì hiển thị luôn */}
        {typeof content !== "string" &&
          Array.isArray(content?.images) &&
          content.images.length > 0 && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {content.images.map((u, idx) => (
                <img
                  key={idx}
                  src={u}
                  className="w-full h-20 object-cover rounded-md border"
                />
              ))}
            </div>
          )}

        {/* nút nghe trả lời */}
        {!isUser && !!text && (
          <button
            onClick={() => onSpeak?.(text)}
            className="mt-2 text-xs underline opacity-80 hover:opacity-100"
          >
            <FaVolumeUp className="inline mr-1" /> Nghe trả lời
          </button>
        )}
      </div>
    </div>
  );
}

/* =============== Typing indicator =============== */
function Typing() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-border text-dark rounded-2xl px-3.5 py-2.5 text-[15px]">
        <span className="inline-flex gap-1 items-center">
          <i className="animate-pulse">●</i>
          <i className="animate-pulse" style={{ animationDelay: "80ms" }}>
            ●
          </i>
          <i className="animate-pulse" style={{ animationDelay: "160ms" }}>
            ●
          </i>
        </span>
      </div>
    </div>
  );
}
