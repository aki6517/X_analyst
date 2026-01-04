import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiClient: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.");
    }

    if (!geminiClient) {
        geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    return geminiClient;
}

export function getGeminiModel() {
    const client = getGeminiClient();
    return client.getGenerativeModel({ model: "gemini-3-flash-preview" });
}
