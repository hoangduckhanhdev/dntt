// services/aiClient.js
const API_BASE = "http://localhost:5000/api";

// ===== CHAT =====
export async function aiChat(payload) {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.ok) {
    const errMsg =
      (data && data.error) || `CHAT_HTTP_${res.status || "ERR"}`;
    throw new Error(errMsg);
  }

  // backend trả { ok: true, text: "..." }
  return data.text || "";
}

// ===== UPLOAD IMAGE =====
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload/image`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.ok || !data.url) {
    throw new Error(data.error || "UPLOAD_IMAGE_FAIL");
  }

  return data.url;
}

// TTS: gọi /api/ai/tts và nhận Blob audio (mp3)
export async function textToSpeech(text) {
  const res = await fetch(`${API_BASE}/ai/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`TTS_HTTP_${res.status || "ERR"}`);
  }

  // backend trả thẳng audio/mpeg
  const blob = await res.blob();
  return blob;
}
