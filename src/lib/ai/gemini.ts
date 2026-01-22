import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Model configurations
const MAIN_MODEL = process.env.GEMINI_MODEL_MAIN || "gemini-2.5-flash-preview-05-20";
const FAST_MODEL = process.env.GEMINI_MODEL_FAST || "gemini-2.0-flash";

// Get the main model for conversations
export function getMainModel(): GenerativeModel {
  return genAI.getGenerativeModel({
    model: MAIN_MODEL,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 1024,
    },
  });
}

// Get the fast model for classification
export function getFastModel(): GenerativeModel {
  return genAI.getGenerativeModel({
    model: FAST_MODEL,
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      topK: 20,
      maxOutputTokens: 256,
    },
  });
}

// Simple wrapper for generating content
export async function generateContent(
  model: GenerativeModel,
  prompt: string
): Promise<string> {
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate AI response");
  }
}

// Parse JSON from AI response (handles markdown code blocks)
export function parseJsonResponse<T>(response: string): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim();

  // Remove ```json or ``` wrapper
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }

  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error("Failed to parse JSON response:", response);
    throw new Error("Failed to parse AI response as JSON");
  }
}

export { genAI };
