import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
const port = 5000;

// Use the correct DeepL API endpoint based on your plan (free or paid)
const API_URL = "https://api-free.deepl.com/v2/translate"; // Use https://api.deepl.com/v2/translate for paid API
const API_KEY = import.meta.env.VITE_DEEPL_API_KEY; // Replace with your actual DeepL API key (include ":fx" for free API)

app.use(cors());
app.use(express.json());

app.post("/translate", async (req, res) => {
  const { text, targetLang } = req.body;

  try {
    console.log(`Requesting translation for: "${text}" into ${targetLang}`);

    // Make request to DeepL API
    const response = await axios.post(
      API_URL,
      {
        text: [text], // Ensure text is sent as an array
        target_lang: targetLang,
      },
      {
        headers: {
          Authorization: `DeepL-Auth-Key ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("DeepL API response:", response.data);
    res.json(response.data);
  } catch (error) {
    // Log more detailed error information
    if (error.response) {
      // DeepL API returned an error
      console.error("Error with DeepL API request");
      console.error("Status Code:", error.response.status);
      console.error("Response Data:", error.response.data);
      console.error("Response Headers:", error.response.headers);

      // Send error response to client
      res.status(error.response.status).json({
        message: "Failed to translate text",
        error: error.response.data
          ? JSON.stringify(error.response.data)
          : "Unknown error",
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from DeepL API");
      console.error("Error Request Data:", error.request);

      res.status(500).json({
        message: "Failed to translate text",
        error: "No response from DeepL API",
      });
    } else {
      // Something else happened while setting up the request
      console.error("Error in request setup:", error.message);

      res.status(500).json({
        message: "Failed to translate text",
        error: error.message,
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
