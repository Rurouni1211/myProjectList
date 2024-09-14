import axios from "axios";

export const translateText = async (text, targetLang) => {
  try {
    const response = await fetch(
      "https://myvideo-bfb0503de47b.herokuapp.com/translate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text, targetLang: targetLang }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data.translations[0].text;
  } catch (error) {
    console.error("Error translating text:", error);
    return text; // Fallback to original text if translation fails
  }
};
