// server.js (Express.js)
import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Replace with your actual Gemini API key (NOT RECOMMENDED for production)
const geminiApiKey = "AIzaSyBcVtv-DZT4vXvldt68kTIPgLKRN0HRxjQ";

let chatHistories = {};

async function processTasks(taskInput, chatId) {
  try {
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent`;

    const chatHistory = chatHistories[chatId] || [];
    const fullConversation = chatHistory.join("\n") + `\nYOU: ${taskInput}\nECHOSEAL: `;

    const response = await axios.post(
      API_URL,
      {
        contents: [
          {
            parts: [
              {
                text: `you are AI NOTEMATE(this is your name ) your work is to summirze the text whatever user provide you.
                                and extra don't do anything just give the summirze of the text whatever user provide you.

                                Response Guidelines:
                                ✅ Keep responses short and precise.
                                ✅ Adapt to the user’s language.
                                ✅ Maintain a friendly and engaging tone as a female chatbot.

                                Chat history:
                                ${fullConversation}`,
              },
            ],
          },
        ],
        model: "models/gemini-1.5-pro",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": geminiApiKey,
        },
      }
    );

    const responseContent =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return responseContent ? responseContent.trim() : "⚠ No valid response.";
  } catch (error) {
    console.error(
      "⚠ ERROR IN API CALL:",
      error.response?.data || error.message || error
    );
    return "⚠ Unexpected error occurred.";
  }
}

app.post("/api/chat", async (req, res) => {
  const { chatId, message } = req.body;

  if (!chatId || !message) {
    return res.status(400).json({ error: "chatId and message are required." });
  }

  try {
    const response = await processTasks(message, chatId);

    if (!chatHistories[chatId]) {
      chatHistories[chatId] = [];
    }

    chatHistories[chatId].push(`YOU: ${message}`);
    chatHistories[chatId].push(`ECHOSEAL: ${response}`);

    res.json({ response: response });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});