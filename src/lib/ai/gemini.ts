import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Model cascade - ordered from most capable to fallback
// When rate limited (429), we cascade to the next model
const MODEL_CASCADE = {
  main: [
    "gemini-3-flash-preview",           // Latest Gemini 3 (best quality)
    "gemini-2.5-flash",                 // Stable Gemini 2.5 flash
    "gemini-2.5-flash-lite",            // Lightweight 2.5
    "gemini-2.0-flash",                 // Legacy 2.0 flash (until March 2026)
  ],
  fast: [
    "gemini-2.5-flash-lite",            // Fast and cost-efficient
    "gemini-2.5-flash",                 // Stable fallback
    "gemini-2.0-flash",                 // Legacy fallback
  ],
};

// Track which model index to use (resets periodically)
let mainModelIndex = 0;
let fastModelIndex = 0;
let lastResetTime = Date.now();
const RESET_INTERVAL_MS = 60000; // Reset to primary model after 1 minute

function resetModelIndexesIfNeeded() {
  const now = Date.now();
  if (now - lastResetTime > RESET_INTERVAL_MS) {
    mainModelIndex = 0;
    fastModelIndex = 0;
    lastResetTime = now;
  }
}

// Get the main model for conversations
export function getMainModel(): GenerativeModel {
  resetModelIndexesIfNeeded();
  const modelName = MODEL_CASCADE.main[mainModelIndex] || MODEL_CASCADE.main[0];
  return genAI.getGenerativeModel({
    model: modelName,
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
  resetModelIndexesIfNeeded();
  const modelName = MODEL_CASCADE.fast[fastModelIndex] || MODEL_CASCADE.fast[0];
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      topK: 20,
      maxOutputTokens: 256,
    },
  });
}

// Check if error is a rate limit error
function isRateLimitError(error: unknown): boolean {
  // Check error message
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("429") ||
      message.includes("rate limit") ||
      message.includes("quota") ||
      message.includes("resource exhausted") ||
      message.includes("too many requests")
    ) {
      return true;
    }
  }

  // Check if error has status property (API error objects)
  const errorObj = error as Record<string, unknown>;
  if (errorObj && typeof errorObj === "object") {
    // Check status directly
    if (errorObj.status === 429) return true;

    // Check nested error details
    if (errorObj.errorDetails && Array.isArray(errorObj.errorDetails)) {
      const hasRateLimit = errorObj.errorDetails.some((detail: Record<string, unknown>) =>
        detail?.reason === "RATE_LIMIT_EXCEEDED" ||
        detail?.["@type"]?.toString().includes("QuotaFailure")
      );
      if (hasRateLimit) return true;
    }

    // Check statusText
    if (typeof errorObj.statusText === "string" &&
        errorObj.statusText.toLowerCase().includes("too many requests")) {
      return true;
    }
  }

  // Stringify and check
  try {
    const errorStr = JSON.stringify(error).toLowerCase();
    if (errorStr.includes("429") || errorStr.includes("rate") || errorStr.includes("quota")) {
      return true;
    }
  } catch {
    // Ignore stringify errors
  }

  return false;
}

// Small delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate content with automatic cascade fallback on rate limits
export async function generateContent(
  model: GenerativeModel,
  prompt: string,
  modelType: "main" | "fast" = "main"
): Promise<string> {
  const cascade = modelType === "main" ? MODEL_CASCADE.main : MODEL_CASCADE.fast;
  let currentIndex = modelType === "main" ? mainModelIndex : fastModelIndex;
  let lastError: Error | null = null;

  // Try each model in the cascade
  for (let attempt = 0; attempt < cascade.length; attempt++) {
    const modelIndex = (currentIndex + attempt) % cascade.length;
    const modelName = cascade[modelIndex];

    try {
      // Get model for this attempt
      const currentModel = attempt === 0
        ? model
        : genAI.getGenerativeModel({
            model: modelName,
            generationConfig: model.generationConfig,
          });

      console.log(`[Gemini] Trying model: ${modelName} (attempt ${attempt + 1}/${cascade.length})`);
      const result = await currentModel.generateContent(prompt);
      const response = result.response;

      // Success - update the index for future calls
      if (modelType === "main") {
        mainModelIndex = modelIndex;
      } else {
        fastModelIndex = modelIndex;
      }

      console.log(`[Gemini] Success with model: ${modelName}`);
      return response.text();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Gemini] Error with ${modelName}:`, lastError.message);

      // Log full error for debugging
      console.error(`[Gemini] Full error:`, JSON.stringify(error, null, 2).slice(0, 500));

      if (isRateLimitError(error)) {
        console.log(`[Gemini] Rate limited on ${modelName}, trying next model...`);
        // Update index to skip this model for future calls
        if (modelType === "main") {
          mainModelIndex = (modelIndex + 1) % cascade.length;
        } else {
          fastModelIndex = (modelIndex + 1) % cascade.length;
        }
        // Small delay before trying next model
        await delay(500);
        continue;
      }

      // For non-rate-limit errors, throw immediately
      throw lastError;
    }
  }

  // All models failed - throw with descriptive message
  throw new Error(`All ${cascade.length} Gemini models failed. Last error: ${lastError?.message || "Unknown error"}`);
}

// Wrapper that specifies main model type
export async function generateContentMain(prompt: string): Promise<string> {
  const model = getMainModel();
  return generateContent(model, prompt, "main");
}

// Wrapper that specifies fast model type
export async function generateContentFast(prompt: string): Promise<string> {
  const model = getFastModel();
  return generateContent(model, prompt, "fast");
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
