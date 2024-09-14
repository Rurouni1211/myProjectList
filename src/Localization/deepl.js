import axios from "axios";

export const translateText = async (text, targetLang) => {
  try {
    // Ensure `text` is sent as a string
    const formattedText = typeof text === "string" ? text : text.toString();

    // Make the POST request to the backend
    const response = await axios.post("/translate", {
      text: formattedText, // Send the text to be translated
      targetLang: targetLang, // Send the target language (e.g., 'DE' for German)
    });

    // Return the translated text from the DeepL API response
    return response.data.translations[0].text;
  } catch (error) {
    console.error("Error translating text:", error);
    return text; // Fallback to original text if translation fails
  }
};
