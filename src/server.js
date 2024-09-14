import express from "express"; // ES module import
import cors from "cors"; // ES module import
import axios from "axios"; // ES module import

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to enable CORS
app.use(
  cors({
    origin: "*", // Allow your frontend's origin (you can add more origins if needed)
    methods: ["GET", "POST"],
  })
);

app.use(express.json());

// Translation route
app.post("/translate", async (req, res) => {
  const { text, targetLang } = req.body;

  // Ensure that the text is an array and targetLang is not empty
  if (!Array.isArray([text]) || !targetLang) {
    return res.status(400).json({
      message:
        "Bad Request: Missing or incorrect text or targetLang parameters",
    });
  }

  try {
    const response = await axios.post(
      "https://api-free.deepl.com/v2/translate",
      {
        text: [text], // Make sure text is an array
        target_lang: targetLang, // Ensure targetLang is a valid language code
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
