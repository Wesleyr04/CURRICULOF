import { IAIService } from "./types";
import { MockAIService } from "./mock-service";
import { GeminiAIService } from "./gemini-service";
import { OpenAIService } from "./openai-service";

export function getAIService(): IAIService {
  const provider = (process.env.AI_PROVIDER || "mock").toLowerCase();

  if (provider === "gemini") {
    if (process.env.GEMINI_API_KEY) {
      return new GeminiAIService();
    }
    console.warn("[IA] AI_PROVIDER está definido como 'gemini', mas GEMINI_API_KEY não foi encontrada. Alternando para MockAIService.");
    return new MockAIService();
  }

  if (provider === "openai") {
    if (process.env.OPENAI_API_KEY) {
      return new OpenAIService();
    }
    console.warn("[IA] AI_PROVIDER está definido como 'openai', mas OPENAI_API_KEY não foi encontrada. Alternando para MockAIService.");
    return new MockAIService();
  }

  return new MockAIService();
}
