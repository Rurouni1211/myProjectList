const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to enable CORS
app.use(
  cors({
    origin: "http://localhost:5003", // Allow your frontend's origin (you can add more origins if needed)
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

// Your translation route
app.post("/translate", async (req, res) => {
  const { text, targetLang } = req.body;

  try {
    const response = await axios.post(
      "https://api-free.deepl.com/v2/translate",
      {
        text: [text],
        target_lang: targetLang,
      },
      {
        headers: {
          Authorization: `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      message: "Failed to translate text",
      error: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
