import React, { useEffect, useRef, useState, useMemo } from "react";
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

export default function Chatbox() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [pendingImages, setPendingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "user") {
        setUser(getCurrentUser());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const storageKey = useMemo(
    () => `hk_chat_messages_${user?._id || "guest"}`,
    [user?._id]
  );

  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      } else {
        setMessages([
          {
            role: "assistant",
            content:
              "Xin chào 👋 Mình là trợ lý HKCode. Bạn cần tư vấn khóa học, hay hướng dẫn đăng ký/thanh toán?",
          },
        ]);
      }
    } catch {
      setMessages([
        {
          role: "assistant",
          content:
            "Xin chào 👋 Mình là trợ lý HKCode. Bạn cần tư vấn khóa học, hay hướng dẫn đăng ký/thanh toán?",
        },
      ]);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      if (messages && messages.length) {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      }
    } catch {}
  }, [messages, storageKey]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

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

    const userMsg =
      pendingImages.length > 0
        ? { role: "user", content: { text, images: pendingImages } }
        : { role: "user", content: text };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPendingImages([]);
    setLoading(true);

    try {
      const currentUser = getCurrentUser();
      const reply = await aiChat({
        messages: [...messages, userMsg],
        user: currentUser,
      });

      const botMsg = { role: "assistant", content: reply };
      setMessages((m) => [...m, botMsg]);
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

  return (
    <>
      {!open && (
        <button
          aria-label="Mở chat"
          onClick={() => setOpen(true)}
          className="
            fixed bottom-6 right-6 z-50
            rounded-full bg-primary text-white
            shadow-soft hover:shadow-lg
            p-3
            animate-chat-wiggle
            hover:animate-none
          "
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
              <Bubble key={i} role={m.role} content={m.content} onSpeak={speak} />
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
        <div
          dangerouslySetInnerHTML={{
            __html: (text || "").replace(/\n/g, "<br/>"),
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
