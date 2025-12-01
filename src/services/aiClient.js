// src/services/aiClient.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const TIMEOUT_MS = 25000;

function withTimeout(promise, ms = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return {
    signal: ctrl.signal,
    done: (p) => p.finally(() => clearTimeout(t)),
  };
}

async function jsonOrText(res) {
  const txt = await res.text();
  try { return JSON.parse(txt); } catch { return txt; }
}

export async function aiChat({ messages, user }) {
  const { signal, done } = withTimeout();
  const res = await done(fetch(`${API_BASE}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, user }),
    signal,
  }));
  const data = await jsonOrText(res);
  if (!res.ok || !data?.ok) {
    const err = typeof data === "string" ? data : (data?.error || `AI_HTTP_${res.status}`);
    throw new Error(err);
  }
  return data.text || "";
}

export async function uploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { signal, done } = withTimeout();
  const res = await done(fetch(`${API_BASE}/api/upload/image`, {
    method: "POST",
    body: fd,
    signal,
  }));
  const data = await jsonOrText(res);
  if (!res.ok || !data?.ok) throw new Error((data && data.error) || "UPLOAD_FAILED");
  return data.url;
}

export async function speechToText(blob) {
  const fd = new FormData();
  // Đặt tên & mime rõ ràng để server/multer & OpenAI parse chuẩn
  const mime = blob.type || "audio/webm";
  fd.append("audio", new Blob([blob], { type: mime }), mime.includes("webm") ? "audio.webm" : "audio.mp3");

  const { signal, done } = withTimeout();
  const res = await done(fetch(`${API_BASE}/api/ai/stt`, {
    method: "POST",
    body: fd,
    signal,
  }));
  const data = await jsonOrText(res);
  if (!res.ok) {
    const err = (typeof data !== "string" && data?.error) || `STT_HTTP_${res.status}`;
    throw new Error(err);
  }
  return (typeof data !== "string" && data.text) ? data.text : "";
}

export async function textToSpeech(text) {
  const { signal, done } = withTimeout();
  const res = await done(fetch(`${API_BASE}/api/ai/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text }),
    signal,
  }));

  // Xử lý riêng lỗi quota/billing để show message đẹp
  if (!res.ok) {
    const data = await jsonOrText(res);
    if (res.status === 503 || res.status === 429) {
      throw new Error("OPENAI_RATE_LIMITED_OR_QUOTA");
    }
    const err = (typeof data !== "string" && data?.error) || `TTS_HTTP_${res.status}`;
    throw new Error(err);
  }

  const buf = await res.arrayBuffer();
  // Tạo Blob chuẩn để Audio() phát tốt
  return new Blob([buf], { type: "audio/mpeg" });
}
