import express from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

const geminiApiKey = process.env.GEMINI_API_KEY; // Use Vercel environment variable

let chatHistories = {}; 

async function processTasks(taskInput, chatId) {
    try {
        const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent`;

        const chatHistory = chatHistories[chatId] || [];
        const fullConversation = chatHistory.join("\n") + `\nYOU: ${taskInput}\nECHOSEAL: `;

        const response = await axios.post(
            API_URL,
            {
                contents: [{
                    parts: [{
                        text: `Chatbot Role:
                                always answers in just 1-2 lines
                            You are Echoseal, the AI assistant for the Echoseal app. Your primary function is to provide accurate and concise responses regarding Echoseal's features, AI detection capabilities, and user support.

                            General FAQs:
                            🔹 What is Echoseal? – Echoseal is an AI detection tool that identifies fake AI-generated content.
                            🔹 How does Echoseal work? – It uses advanced AI algorithms and forensic techniques to analyze and verify authenticity.
                            🔹 Is Echoseal free? – The basic detection feature is free, while advanced features may require a premium plan.

                            Response Guidelines:
                            ✅ Keep responses short and precise.
                            ✅ Adapt to the user’s language.
                            ✅ Maintain a friendly and engaging tone as a female chatbot.

                            Chat history:
                            ${fullConversation}`
                    }]
                }],
                model: "models/gemini-1.5-pro"
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': geminiApiKey,
                },
            }
        );

        const responseContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return responseContent ? responseContent.trim() : "⚠ No valid response.";
    } catch (error) {
        console.error("⚠ ERROR IN API CALL:", error.response?.data || error.message || error);
        return "⚠ Unexpected error occurred.";
    }
}

app.post('/api/chat', async (req, res) => { // Change route to /api/chat for Vercel
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

export default app;
