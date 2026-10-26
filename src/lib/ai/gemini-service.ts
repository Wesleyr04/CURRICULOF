import { IAIService, AISuggestSummaryParams, AIImproveTextParams } from "./types";
import { ResumeData, CreationMode } from "@/types/resume";
import { buildSuggestSummaryPrompt, buildImproveTextPrompt, AI_SYSTEM_INSTRUCTIONS } from "./prompts";
import { AIServiceUnavailableError } from "./errors";

export class GeminiAIService implements IAIService {
  public providerName = "Google Gemini";
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || "";
    this.model = model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  }

  private async callGemini(promptText: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("GEMINI_API_KEY não configurada no servidor.");
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            temperature: 0.3, // baixa temperatura para evitar alucinações
            maxOutputTokens: 800,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Erro na API Gemini (${response.status}): ${errorBody.slice(0, 200)}`);
      }

      const data = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedText) {
        throw new Error("Resposta vazia retornada pelo modelo Gemini.");
      }

      return generatedText.trim();
    } finally {
      clearTimeout(timeout);
    }
  }

  async suggestSummary(params: AISuggestSummaryParams): Promise<string> {
    const prompt = buildSuggestSummaryPrompt(params);
    return this.callGemini(prompt);
  }

  async improveText(params: AIImproveTextParams): Promise<string> {
    const prompt = buildImproveTextPrompt(params);
    return this.callGemini(prompt);
  }

  async improveFullResume(
    resumeData: ResumeData,
    mode?: CreationMode,
    _correlationId?: string,
    options?: { preserveSummary?: boolean }
  ): Promise<ResumeData> {
    const activeMode = mode || resumeData.creationMode || "simple";
    const prompt = `${AI_SYSTEM_INSTRUCTIONS}
${activeMode === "simple" ? "DIRETRIZ MODO SIMPLES: Seja extremamente enxuto e conciso." : "DIRETRIZ MODO COMPLETO: Apresente descrições estruturadas e detalhadas."}

TAREFA:
Melhore as descrições de atividades das experiências e o resumo profissional do currículo abaixo, corrigindo ortografia, melhorando o vocabulário e a clareza, SEM INVENTAR novas empresas, novos cargos, novos dados ou novas certificações.
Retorne um JSON válido estritamente com as chaves "targetSummary" e "experiences" (array com objetos contendo "id", "description", "achievements").

<user_untrusted_data>
${JSON.stringify({
  target: resumeData.target,
  experiences: resumeData.experiences,
  skills: resumeData.technicalSkills,
})}
</user_untrusted_data>

Retorne APENAS o JSON puro, sem crases de código markdown.`;

    const rawResponse = await this.callGemini(prompt);
    const cleaned = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      const updated = JSON.parse(JSON.stringify(resumeData)) as ResumeData;

      if (parsed.targetSummary && !options?.preserveSummary) {
        updated.target.summary = parsed.targetSummary;
      }

      if (Array.isArray(parsed.experiences)) {
        for (const expUpdate of parsed.experiences) {
          const match = updated.experiences.find((e) => e.id === expUpdate.id);
          if (match && expUpdate.description) {
            match.description = expUpdate.description;
            if (expUpdate.achievements) {
              match.achievements = expUpdate.achievements;
            }
          }
        }
      }

      return updated;
    } catch (err: unknown) {
      throw new AIServiceUnavailableError(
        "Falha ao gerar currículo estruturado com Google Gemini: " +
          (err instanceof Error ? err.message : String(err))
      );
    }
  }
}
