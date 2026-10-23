import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { IAIService, AISuggestSummaryParams, AIImproveTextParams } from "./types";
import { ResumeData, CreationMode } from "@/types/resume";
import { normalizeJobTitle } from "./mock-service";
import { buildSuggestSummaryPrompt, buildImproveTextPrompt, AI_SYSTEM_INSTRUCTIONS } from "./prompts";
import { AIConfigurationError, AIContentRefusalError } from "./errors";
import { isAiRefusal } from "@/lib/security/content-guard";
import { aiTelemetryService } from "./telemetry/service";
import { AIOperationType, TokenUsage } from "./telemetry/types";

export class AnthropicClientService implements IAIService {
  public providerName = "Anthropic Claude (Oficial)";
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    const rawKey = apiKey || process.env.ANTHROPIC_API_KEY || "";
    const cleanKey = rawKey.replace(/[\r\n"']/g, "").trim();
    if (!cleanKey) {
      throw new AIConfigurationError(
        "A chave de API da Anthropic (ANTHROPIC_API_KEY) não foi configurada no servidor."
      );
    }

    const rawModel = model || process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";
    const cleanModel = (typeof rawModel === "string" ? rawModel : "").replace(/[\r\n"']/g, "").trim();
    if (!cleanModel) {
      throw new AIConfigurationError("O identificador do modelo ANTHROPIC_MODEL é inválido.");
    }

    this.model = cleanModel;
    this.client = new Anthropic({
      apiKey: cleanKey,
    });
  }

  private async callAnthropic(
    promptText: string,
    maxTokens: number = 600,
    operationType: AIOperationType = "unknown",
    correlationId?: string
  ): Promise<string> {
    const startTime = Date.now();
    const effectiveCorrelationId = correlationId || crypto.randomUUID();

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        system: AI_SYSTEM_INSTRUCTIONS,
        messages: [{ role: "user", content: promptText }],
      });

      const durationMs = Date.now() - startTime;

      // Captura exata e oficial dos metadados de uso e cache retornados pelo SDK
      const hasUsage = Boolean(response.usage);
      const inputTokens = typeof response.usage?.input_tokens === "number" ? response.usage.input_tokens : null;
      const outputTokens = typeof response.usage?.output_tokens === "number" ? response.usage.output_tokens : null;
      const cacheCreationInputTokens =
        typeof response.usage?.cache_creation_input_tokens === "number"
          ? response.usage.cache_creation_input_tokens
          : null;
      const cacheReadInputTokens =
        typeof response.usage?.cache_read_input_tokens === "number"
          ? response.usage.cache_read_input_tokens
          : null;

      const tokensStatus =
        hasUsage && inputTokens !== null && outputTokens !== null
          ? "complete"
          : hasUsage
          ? "partial"
          : "unavailable";

      const usagePayload: TokenUsage = {
        inputTokens,
        outputTokens,
        cacheCreationInputTokens,
        cacheReadInputTokens,
        tokensStatus,
      };

      // Log temporário seguro de auditoria em produção (Zero-PII: sem prompt, sem currículo, sem secrets)
      console.log("[ANTHROPIC_RESPONSE_METADATA_AUDIT]", {
        responseId: response.id || null,
        modelReceived: response.model || null,
        hasUsage: Boolean(response.usage),
        inputTokens,
        outputTokens,
        cacheCreation: cacheCreationInputTokens,
        cacheRead: cacheReadInputTokens,
        tokensStatus,
        stopReason: response.stop_reason || null,
        durationMs,
      });

      // Telemetria com Fail-Open garantido
      await aiTelemetryService.recordUsage({
        model: response.model || this.model,
        requestedModel: this.model,
        actualModel: response.model || this.model,
        operationType,
        source: "production",
        usage: usagePayload,
        correlationId: effectiveCorrelationId,
        responseId: response.id || null,
        durationMs,
        status: "success",
      });

      if (response.stop_reason === "refusal") {
        throw new AIContentRefusalError(
          "Não foi possível gerar uma sugestão para os termos informados. Por favor, utilize uma nomenclatura corporativa ou profissional válida."
        );
      }

      // Busca o bloco de texto real, suportando modelos que retornam blocos de thinking antes do texto
      const textBlock = response.content.find((block) => block.type === "text");
      if (textBlock && textBlock.type === "text") {
        const text = textBlock.text.trim();
        if (text) {
          if (isAiRefusal(text)) {
            throw new AIContentRefusalError(
              "Não foi possível gerar uma sugestão para os termos informados. Por favor, utilize uma nomenclatura corporativa ou profissional válida."
            );
          }
          return text;
        }
      }

      throw new Error("A API da Anthropic retornou uma resposta sem conteúdo de texto.");
    } catch (error: unknown) {
      // Se for um erro já tratado de recusa de conteúdo, não registra como falha de API
      if (!(error instanceof AIContentRefusalError)) {
        const durationMs = Date.now() - startTime;
        const errObj = error as { name?: string; status?: number; message?: string };
        const errorCode = errObj?.name || (errObj?.status ? `HTTP_${errObj.status}` : "API_ERROR");

        await aiTelemetryService.recordUsage({
          model: this.model,
          requestedModel: this.model,
          actualModel: undefined,
          operationType,
          source: "error",
          usage: {
            inputTokens: null,
            outputTokens: null,
            cacheCreationInputTokens: null,
            cacheReadInputTokens: null,
            tokensStatus: "unavailable",
          },
          correlationId: effectiveCorrelationId,
          responseId: null,
          durationMs,
          status: "error",
          errorCode,
          errorMessageSafe: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }

      throw error;
    }
  }

  async suggestSummary(params: AISuggestSummaryParams): Promise<string> {
    const prompt = buildSuggestSummaryPrompt(params);
    return await this.callAnthropic(prompt, 500, "suggest-summary", params.correlationId);
  }

  async improveText(params: AIImproveTextParams): Promise<string> {
    const raw = params.rawText.trim();
    if (!raw) return "";

    const prompt = buildImproveTextPrompt(params);
    return await this.callAnthropic(prompt, 500, "improve-text", params.correlationId);
  }

  async improveFullResume(
    resumeData: ResumeData,
    mode?: CreationMode,
    correlationId?: string
  ): Promise<ResumeData> {
    const activeMode = mode || resumeData.creationMode || "simple";
    const fullGenCorrelationId = correlationId || crypto.randomUUID();
    const updated = JSON.parse(JSON.stringify(resumeData)) as ResumeData;
    updated.creationMode = activeMode;

    // Normaliza o cargo pretendido
    if (updated.target.jobTitle) {
      updated.target.jobTitle = normalizeJobTitle(updated.target.jobTitle);
    }

    // 1. Aprimora ou gera o Resumo Profissional conectando todo o histórico do candidato (experiências, habilidades, cursos)
    const effectiveJobTitle = updated.target.jobTitle || updated.experiences[0]?.role || "Profissional";
    const effectiveField = updated.target.field || effectiveJobTitle;

    try {
      const enrichedSummary = await this.suggestSummary({
        jobTitle: effectiveJobTitle,
        field: effectiveField,
        careerStage: updated.target.careerStage,
        careerContext: updated.target.careerContext,
        currentSummary:
          updated.target.summary && updated.target.summary.trim().length > 10
            ? updated.target.summary.trim()
            : undefined,
        experiences: updated.experiences,
        skills: updated.technicalSkills,
        softSkills: updated.softSkills,
        education: updated.education,
        courses: updated.courses,
        certifications: updated.certifications,
        mode: activeMode,
        correlationId: fullGenCorrelationId,
      });

      if (enrichedSummary && enrichedSummary.trim()) {
        updated.target.summary = enrichedSummary.trim();
      }
    } catch (summaryErr) {
      // Preserva o resumo original se houver falha específica na chamada de resumo
      console.warn(
        "[AnthropicClientService] Falha ao enriquecer resumo na revisão geral, preservando resumo original:",
        summaryErr
      );
    }

    // 2. Aprimora atividades de cada experiência em paralelo resiliente (reduz latência na Vercel e evita timeouts)
    const expPromises = updated.experiences.map(async (exp) => {
      if (exp.role) {
        exp.role = normalizeJobTitle(exp.role);
      }
      if (exp.description && exp.description.trim().length > 0) {
        try {
          const improvedExpText = await this.improveText({
            rawText: exp.description,
            context: "experience",
            jobTitle: exp.role || updated.target.jobTitle,
            careerStage: updated.target.careerStage,
            careerContext: updated.target.careerContext,
            company: exp.company,
            achievements: exp.achievements,
            mode: activeMode,
            correlationId: fullGenCorrelationId,
          });

          if (improvedExpText && improvedExpText.trim()) {
            exp.description = improvedExpText.trim();
          }
        } catch (expErr) {
          // Preserva o texto da atividade original sem quebrar o processamento do restante do currículo
          console.warn(
            `[AnthropicClientService] Falha ao aprimorar experiência '${exp.role || exp.id}', mantendo texto original:`,
            expErr
          );
        }
      }
      return exp;
    });

    await Promise.all(expPromises);

    return updated;
  }
}

