import { IAIService, AISuggestSummaryParams, AIImproveTextParams } from "./types";
import { ResumeData, CreationMode } from "@/types/resume";
import { buildSuggestSummaryPrompt, buildImproveTextPrompt } from "./prompts";

export class OpenAIService implements IAIService {
  public providerName = "OpenAI";
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    this.model = model || process.env.OPENAI_MODEL || "gpt-4o-mini";
    this.baseUrl = baseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  }

  private async callChat(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY não configurada no servidor.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Erro na API OpenAI (${response.status}): ${err.slice(0, 200)}`);
      }

      const json = await response.json();
      return json?.choices?.[0]?.message?.content?.trim() || "";
    } finally {
      clearTimeout(timeout);
    }
  }

  async suggestSummary(params: AISuggestSummaryParams): Promise<string> {
    const prompt = buildSuggestSummaryPrompt(params);
    return this.callChat([{ role: "user", content: prompt }]);
  }

  async improveText(params: AIImproveTextParams): Promise<string> {
    const prompt = buildImproveTextPrompt(params);
    return this.callChat([{ role: "user", content: prompt }]);
  }

  async improveFullResume(
    resumeData: ResumeData,
    mode?: CreationMode,
    _correlationId?: string,
    options?: { preserveSummary?: boolean }
  ): Promise<ResumeData> {
    const activeMode = mode || resumeData.creationMode || "simple";
    const updated = JSON.parse(JSON.stringify(resumeData)) as ResumeData;
    updated.creationMode = activeMode;

    if (!options?.preserveSummary) {
      if (updated.target.summary) {
        updated.target.summary = await this.improveText({
          rawText: updated.target.summary,
          context: "summary",
          jobTitle: updated.target.jobTitle,
          mode: activeMode,
        });
      } else {
        updated.target.summary = await this.suggestSummary({
          jobTitle: updated.target.jobTitle,
          field: updated.target.field,
          experiences: updated.experiences,
          skills: updated.technicalSkills,
          mode: activeMode,
        });
      }
    }

    for (const exp of updated.experiences) {
      if (exp.description) {
        exp.description = await this.improveText({
          rawText: exp.description,
          context: "experience",
          jobTitle: exp.role,
          mode: activeMode,
        });
      }
    }

    return updated;
  }
}
