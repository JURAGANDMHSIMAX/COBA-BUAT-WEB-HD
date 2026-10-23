
import express from "express";
import multer from "multer";
import OpenAI from "openai";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.get("/", (req, res) => {
  res.send("Backend editor foto AI aktif.");
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/edit", upload.single("image"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "API key belum dipasang di server."
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Foto belum dikirim."
      });
    }

    const prompt = String(
      req.body.prompt || "Tingkatkan kualitas foto secara realistis."
    );

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const result = await client.images.edit({
      model: "gpt-image-1",
      image: new File(
        [req.file.buffer],
        req.file.originalname || "photo.png",
        { type: req.file.mimetype }
      ),
      prompt,
      size: "1024x1024"
    });

    const image = result.data?.[0]?.b64_json;

    if (!image) {
      throw new Error("AI tidak mengembalikan gambar.");
    }

    res.json({ image: `data:image/png;base64,${image}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message || "Gagal memproses foto."
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server aktif di port ${port}`);
});
  
