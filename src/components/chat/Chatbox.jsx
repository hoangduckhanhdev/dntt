import React, { useEffect, useRef, useState } from "react";
import {
  FaHeadset,
  FaPaperPlane,
  FaTimes,
  FaMicrophone,
  FaImage,
  FaVolumeUp,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { aiChat, uploadImage, textToSpeech } from "../../services/aiClient";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function normalizeMessagesForAPI(messages = []) {
  return (messages || []).map((m) => {
    let content = m.content;

    if (content && typeof content === "object") {
      const text = content.text || "";
      const images = Array.isArray(content.images) ? content.images : [];

      let prefix = "";
      if (images.length > 0) {
        prefix =
          `Người dùng gửi kèm ${images.length} ảnh (URL):\n` +
          images.join("\n") +
          "\n\n";
      }

      const merged = (prefix + text).trim();
      content =
        merged || "[Người dùng chỉ gửi ảnh, không có nội dung text]";
    }

    if (typeof content !== "string") {
      content = String(content || "");
    }

    return {
      role: m.role,
      content,
    };
  });
}

function normalizeTextForDisplay(text) {
  if (!text) return "";
  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export default function Chatbox() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());

  // ❌ Không lưu lịch sử nữa – chỉ khởi tạo 1 câu chào
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Xin chào 👋 Mình là trợ lý HKCode. Bạn cần tư vấn khóa học, hay hướng dẫn đăng ký/thanh toán?",
    },
  ]);

  const listRef = useRef(null);
  const fileRef = useRef(null);

  // Voice tiếng Việt (nếu trình duyệt có)
  const [ttsVoice, setTtsVoice] = useState(null);

  // Cập nhật user nếu login/logout từ tab khác
  useEffect(() => {
    const handler = () => {
      setUser(getCurrentUser());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Auto scroll xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, open]);

  // Load danh sách voice & chọn voice tiếng Việt nếu có
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    function loadVoices() {
      const voices = window.speechSynthesis.getVoices() || [];
      const viVoices = voices.filter(
        (v) => v.lang && v.lang.toLowerCase().startsWith("vi")
      );
      if (viVoices.length > 0) {
        setTtsVoice(viVoices[0]);
      } else {
        setTtsVoice(null);
      }
    }

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

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

  // 🔊 TTS: ưu tiên server, lỗi mới fallback trình duyệt
  async function speak(text) {
    if (!text) return;

    // 1️⃣ Thử gọi TTS server (/api/ai/tts) – backend trả thẳng mp3
    try {
      // textToSpeech trả về Blob (mp3)
      const blob = await textToSpeech(text);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();

      audio.onended = () => {
        URL.revokeObjectURL(url);
      };

      return; // thành công -> không cần fallback
    } catch (err) {
      console.error("TTS server error, fallback browser TTS:", err);
    }

    // 2️⃣ Fallback: dùng TTS trình duyệt
    if (!("speechSynthesis" in window)) {
      alert("Trình duyệt của bạn không hỗ trợ đọc to văn bản.");
      return;
    }

    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);

    utter.lang = "vi-VN";
    if (ttsVoice) {
      utter.voice = ttsVoice;
    }

    synth.cancel();
    synth.speak(utter);
  }

  function handleMessagesClick(e) {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href) return;
    if (href.startsWith("/course/")) {
      e.preventDefault();
      navigate(href);
    }
  }

  const send = async () => {
    const text = input.trim();
    if (!text && pendingImages.length === 0) return;
    if (loading) return;

    const userMsgUI =
      pendingImages.length > 0
        ? { role: "user", content: { text, images: pendingImages } }
        : { role: "user", content: text };

    const MAX_HISTORY = 10;
    const apiMessages = normalizeMessagesForAPI(
      [...messages, userMsgUI].slice(-MAX_HISTORY)
    );

    setMessages((m) => [...m, userMsgUI]);
    setInput("");
    setPendingImages([]);
    setLoading(true);

    try {
      const currentUser = getCurrentUser();
      const reply = await aiChat({
        messages: apiMessages,
        user: currentUser,
      });

      const botMsg = { role: "assistant", content: reply };
      setMessages((m) => [...m, botMsg]);
    } catch (err) {
      console.error("AI chat error:", err);
      const raw = (err && err.message) || "";

      let msg =
        "Mất kết nối với HKCode AI, bạn thử lại sau một lát nhé.";

      if (
        raw === "OPENAI_NO_CREDITS" ||
        raw === "OPENAI_RATE_LIMITED" ||
        raw === "OPENAI_RATE_LIMITED_OR_QUOTA" ||
        raw === "CHAT_HTTP_429"
      ) {
        msg =
          "HKCode AI đang bị giới hạn / hết lượt gọi mô hình. Bạn thử lại sau một thời gian ngắn giúp mình nhé.";
      }

      setMessages((m) => [...m, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          aria-label="Mở chat"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-primary text-white shadow-soft hover:shadow-lg p-3 animate-chat-wiggle hover:animate-none"
        >
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-primary">
            <FaHeadset className="text-xl" />
          </span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[92vw] rounded-2xl border border-border bg-white shadow-2xl overflow-hidden">
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

          <div className="px-3 py-2 border-t border-border bg-white">
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
              <button
                onClick={recordOnce}
                className="btn btn-light"
                title="Nói nhanh (STT trình duyệt)"
              >
                <FaMicrophone />
              </button>

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

              <input
                className="input flex-1"
                placeholder="Nhập câu hỏi hoặc đính kèm ảnh…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
              />

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

function Bubble({ role, content, onSpeak }) {
  const isUser = role === "user";
  const raw = typeof content === "string" ? content : content?.text || "";
  const text = normalizeTextForDisplay(raw);

  const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(text);
  const html = hasHtmlTag ? text : (text || "").replace(/\n/g, "<br/>");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
          isUser
            ? "bg-primary text-white"
            : "bg-white border border-border text-dark"
        }`}
      >
        <div
          dangerouslySetInnerHTML={{
            __html: html,
          }}
        />

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
