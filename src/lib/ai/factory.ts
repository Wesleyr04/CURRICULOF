import { IAIService } from "./types";
import { MockAIService } from "./mock-service";
import { GeminiAIService } from "./gemini-service";
import { OpenAIService } from "./openai-service";
import { AnthropicClientService } from "./anthropic-client-service";
import { AIConfigurationError } from "./errors";

export function getAIService(): IAIService {
  const provider = (process.env.AI_PROVIDER || "")
    .replace(/[\r\n"']/g, "")
    .toLowerCase()
    .trim();

  // 1. O MockAIService SÓ é retornado se AI_PROVIDER for explicitamente declarado como 'mock'
  if (provider === "mock") {
    return new MockAIService();
  }

  // 2. Provedor Gemini
  if (provider === "gemini") {
    const geminiKey = (process.env.GEMINI_API_KEY || "").replace(/[\r\n"']/g, "").trim();
    if (geminiKey) {
      return new GeminiAIService();
    }
    throw new AIConfigurationError(
      "AI_PROVIDER está configurado como 'gemini', mas GEMINI_API_KEY não foi configurada no ambiente."
    );
  }

  // 3. Provedor OpenAI
  if (provider === "openai") {
    const openaiKey = (process.env.OPENAI_API_KEY || "").replace(/[\r\n"']/g, "").trim();
    if (openaiKey) {
      return new OpenAIService();
    }
    throw new AIConfigurationError(
      "AI_PROVIDER está configurado como 'openai', mas OPENAI_API_KEY não foi configurada no ambiente."
    );
  }

  // 4. Provedor Anthropic (Padrão Oficial)
  // Se AI_PROVIDER não for 'mock', a integração oficial da Anthropic é obrigatória.
  // Jamais permitir fallback silencioso para Mock quando a chave faltar.
  const rawKey = process.env.ANTHROPIC_API_KEY || "";
  const apiKey = rawKey.replace(/[\r\n"']/g, "").trim();
  if (!apiKey) {
    throw new AIConfigurationError("ANTHROPIC_API_KEY ausente no ambiente do servidor.");
  }

  const rawModel = process.env.ANTHROPIC_MODEL || "";
  const cleanModel = rawModel.replace(/[\r\n"']/g, "").trim();

  return new AnthropicClientService(apiKey, cleanModel || undefined);
}
