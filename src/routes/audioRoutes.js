// src/routes/audioRoutes.js
const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fetch = require("node-fetch");
const googleTTS = require("google-tts-api");

const router = express.Router();

/* =================== Helpers =================== */

// dùng memory storage để đọc được buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 }, // 12MB
});

// Lấy key Groq (dùng cho STT)
function getGroqKey() {
  return (process.env.GROQ_API_KEY || "").trim();
}

// Helper timeout cho mọi request ra ngoài
function withTimeout(ms = 25000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  const clear = () => clearTimeout(timer);
  return { signal: ctrl.signal, clear };
}

/* =================== STT (Speech → Text) ===================
   Dùng Groq Whisper (không dùng quota OpenAI)
   POST /api/ai/stt
   body: multipart/form-data { audio: <blob webm/mp3/wav> }
*/
router.post("/stt", upload.single("audio"), async (req, res) => {
  try {
    const KEY = getGroqKey();
    if (!KEY) {
      return res
        .status(500)
        .json({ ok: false, error: "GROQ_KEY_MISSING" });
    }
    if (!req.file?.buffer) {
      return res.status(400).json({ ok: false, error: "NO_AUDIO" });
    }

    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: req.file.originalname || "audio.webm",
      contentType: req.file.mimetype || "audio/webm",
    });
    // Model Whisper của Groq
    form.append("model", "whisper-large-v3");
    // form.append("language", "vi"); // có thể mở nếu muốn fix tiếng Việt

    const headers = {
      Authorization: `Bearer ${KEY}`,
      ...form.getHeaders(),
    };

    const { signal, clear } = withTimeout();
    const r = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers,
        body: form,
        signal,
      }
    ).finally(clear);

    const txt = await r.text().catch(() => "");
    if (!r.ok) {
      console.error("GROQ_STT_UPSTREAM", r.status, txt?.slice(0, 500));
      if (r.status === 429) {
        return res
          .status(503)
          .json({ ok: false, error: "GROQ_RATE_LIMITED" });
      }
      return res
        .status(500)
        .json({ ok: false, error: "GROQ_STT_UPSTREAM_ERROR" });
    }

    const data = JSON.parse(txt || "{}");
    return res.json({ ok: true, text: data.text || "" });
  } catch (e) {
    const msg =
      e?.name === "AbortError" ? "GROQ_STT_TIMEOUT" : e?.message || "GROQ_STT_ERROR";
    console.error("GROQ_STT_ERR", msg);
    res.status(500).json({ ok: false, error: msg });
  }
});

/* =================== TTS (Text → Speech) ===================
   Dùng google-tts-api (miễn phí, không cần key)
   POST /api/ai/tts
   body: { text: "..." }
   return: audio/mpeg
*/
router.post("/tts", express.json(), async (req, res) => {
  try {
    const text = (req.body?.text || "").trim();
    if (!text) {
      return res.status(400).json({ ok: false, error: "NO_TEXT" });
    }

    // google-tts-api giới hạn độ dài → cắt bớt cho an toàn
    const safeText = text.length > 200 ? text.slice(0, 200) : text;

    // Tạo URL âm thanh tiếng Việt
    const url = googleTTS.getAudioUrl(safeText, {
      lang: "vi",
      slow: false,
      host: "https://translate.google.com",
    });

    const { signal, clear } = withTimeout(15000);
    const r = await fetch(url, { signal }).finally(clear);

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      console.error("FREE_TTS_UPSTREAM", r.status, txt?.slice(0, 300));
      return res
        .status(500)
        .json({ ok: false, error: "FREE_TTS_UPSTREAM_ERROR" });
    }

    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buf.length);
    return res.send(buf);
  } catch (e) {
    const msg =
      e?.name === "AbortError" ? "FREE_TTS_TIMEOUT" : e?.message || "FREE_TTS_ERROR";
    console.error("FREE_TTS_ERR", msg);
    res.status(500).json({ ok: false, error: msg });
  }
});

module.exports = router;
