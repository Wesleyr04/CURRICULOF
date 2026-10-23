import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { IAIService, AISuggestSummaryParams, AIImproveTextParams } from "./types";
import { ResumeData, CreationMode } from "@/types/resume";
import { normalizeJobTitle } from "./mock-service";
import { buildSuggestSummaryPrompt, buildImproveTextPrompt, AI_SYSTEM_INSTRUCTIONS } from "./prompts";
import {
  AIConfigurationError,
  AIAuthenticationError,
  AIRateLimitError,
  AIContentRefusalError,
  AIServiceUnavailableError,
  sanitizeAiErrorMessage,
} from "./errors";
import { isAiRefusal } from "@/lib/security/content-guard";
import { aiTelemetryService } from "./telemetry/service";
import { AIOperationType, TokenUsage } from "./telemetry/types";

export class AnthropicClientService implements IAIService {
  public providerName = "Anthropic Claude (Oficial)";
  private client: Anthropic | null = null;
  private apiKey: string;
  private model: string;
  private isOpenRouter: boolean;
  private openRouterModel: string;

  constructor(apiKey?: string, model?: string) {
    const rawKey =
      apiKey ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      "";
    const cleanKey = rawKey.replace(/[\r\n"']/g, "").trim();
    if (!cleanKey) {
      throw new AIConfigurationError(
        "A chave de API da IA (ANTHROPIC_API_KEY ou OPENROUTER_API_KEY) não foi configurada no servidor."
      );
    }

    this.apiKey = cleanKey;

    // Detecta se a chave ou ambiente são do OpenRouter
    const envBaseUrl = (process.env.ANTHROPIC_BASE_URL || "").toLowerCase();
    const envProvider = (process.env.AI_PROVIDER || "").toLowerCase();
    this.isOpenRouter =
      cleanKey.startsWith("sk-or-") ||
      Boolean(process.env.OPENROUTER_API_KEY) ||
      envBaseUrl.includes("openrouter.ai") ||
      envProvider.includes("openrouter");

    const rawModel =
      model ||
      process.env.ANTHROPIC_MODEL ||
      process.env.OPENROUTER_MODEL ||
      (this.isOpenRouter ? "anthropic/claude-3.5-haiku" : "claude-3-5-haiku-20241022");
    const cleanModel = (typeof rawModel === "string" ? rawModel : "").replace(/[\r\n"']/g, "").trim();

    if (!cleanModel) {
      throw new AIConfigurationError("O identificador do modelo de inteligência artificial é inválido.");
    }

    this.model = cleanModel;

    if (this.isOpenRouter) {
      this.providerName = "OpenRouter (Claude Compatibility)";
      // Se o modelo não contiver barra '/' no OpenRouter, padroniza para formato do OpenRouter
      this.openRouterModel = cleanModel.includes("/")
        ? cleanModel
        : cleanModel.startsWith("claude")
        ? `anthropic/${cleanModel.replace("-20241022", "")}`
        : cleanModel;
    } else {
      this.providerName = "Anthropic Claude (Oficial)";
      this.openRouterModel = cleanModel;
      // Força baseURL oficial da Anthropic para evitar que ANTHROPIC_BASE_URL mal configurada quebre chamadas nativas
      this.client = new Anthropic({
        apiKey: cleanKey,
        baseURL: "https://api.anthropic.com",
      });
    }
  }

  /**
   * Chamada compatível com a API REST do OpenRouter (chat/completions padrão OpenAI)
   * Previne 100% o erro 404 HTML da Cloudflare ao tentar chamar /v1/messages
   */
  private async callOpenRouterApi(
    promptText: string,
    maxTokens: number = 600,
    operationType: AIOperationType = "unknown",
    correlationId?: string
  ): Promise<string> {
    const startTime = Date.now();
    const effectiveCorrelationId = correlationId || crypto.randomUUID();

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://fastcurriculo.com.br",
          "X-Title": "FastCurriculo",
        },
        body: JSON.stringify({
          model: this.openRouterModel,
          messages: [
            { role: "system", content: AI_SYSTEM_INSTRUCTIONS },
            { role: "user", content: promptText },
          ],
          max_tokens: maxTokens,
          temperature: 0.2,
        }),
      });

      const durationMs = Date.now() - startTime;

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("[OpenRouter API Error]", res.status, errText.slice(0, 200));

        if (res.status === 401) {
          throw new AIAuthenticationError(
            "Falha de autenticação com o provedor de IA. Credenciais inválidas ou revogadas."
          );
        }
        if (res.status === 429) {
          throw new AIRateLimitError("Limite de requisições excedido no provedor de IA.");
        }
        if (res.status === 403) {
          const err = new Error("Acesso não autorizado ao modelo de inteligência artificial.");
          Object.assign(err, { status: 403, name: "PermissionDeniedError" });
          throw err;
        }

        const safeMsg = sanitizeAiErrorMessage(errText);
        throw new AIServiceUnavailableError(safeMsg);
      }

      const data = await res.json().catch(() => null);
      if (!data) {
        throw new AIServiceUnavailableError(
          "O provedor de inteligência artificial retornou uma resposta vazia."
        );
      }

      const generatedText = (data.choices?.[0]?.message?.content || "").trim();

      if (!generatedText) {
        throw new AIServiceUnavailableError(
          "Não foi possível obter texto gerado pelo provedor de inteligência artificial."
        );
      }

      if (isAiRefusal(generatedText)) {
        throw new AIContentRefusalError(
          "Não foi possível gerar uma sugestão para os termos informados. Por favor, utilize uma nomenclatura corporativa ou profissional válida."
        );
      }

      // Registro de telemetria
      const inputTokens = typeof data.usage?.prompt_tokens === "number" ? data.usage.prompt_tokens : null;
      const outputTokens = typeof data.usage?.completion_tokens === "number" ? data.usage.completion_tokens : null;

      await aiTelemetryService.recordUsage({
        model: data.model || this.openRouterModel,
        requestedModel: this.openRouterModel,
        actualModel: data.model || this.openRouterModel,
        operationType,
        source: "production",
        usage: {
          inputTokens,
          outputTokens,
          cacheCreationInputTokens: null,
          cacheReadInputTokens: null,
          tokensStatus: inputTokens !== null && outputTokens !== null ? "complete" : "unavailable",
        },
        correlationId: effectiveCorrelationId,
        responseId: data.id || null,
        durationMs,
        status: "success",
      });

      return generatedText;
    } catch (error: unknown) {
      if (!(error instanceof AIContentRefusalError)) {
        const durationMs = Date.now() - startTime;
        await aiTelemetryService.recordUsage({
          model: this.openRouterModel,
          requestedModel: this.openRouterModel,
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
          errorCode: "OPENROUTER_ERROR",
          errorMessageSafe: sanitizeAiErrorMessage(error),
        });
      }
      throw error;
    }
  }

  private async callAnthropic(
    promptText: string,
    maxTokens: number = 600,
    operationType: AIOperationType = "unknown",
    correlationId?: string
  ): Promise<string> {
    if (this.isOpenRouter || !this.client) {
      return this.callOpenRouterApi(promptText, maxTokens, operationType, correlationId);
    }

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
        const safeErrorMsg = sanitizeAiErrorMessage(error);

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
          errorMessageSafe: safeErrorMsg,
        });

        // Diferenciação e propagação fiel de erros da API para evitar mascaramento como 503
        const rawErrMsg = typeof errObj?.message === "string" ? errObj.message : "";
        const effectiveErrMsg = rawErrMsg || safeErrorMsg;

        if (
          errObj?.status === 401 ||
          errObj?.name === "AuthenticationError" ||
          (rawErrMsg && (rawErrMsg.includes("authentication_error") || rawErrMsg.includes("invalid x-api-key")))
        ) {
          const authErr = new AIAuthenticationError(
            effectiveErrMsg || "Falha de autenticação com o provedor de IA. Credenciais inválidas ou revogadas."
          );
          Object.assign(authErr, { status: 401, name: "AuthenticationError" });
          throw authErr;
        }

        if (errObj?.status === 429 || errObj?.name === "RateLimitError") {
          const rateErr = new AIRateLimitError(effectiveErrMsg || "Limite de requisições excedido no provedor de IA.");
          Object.assign(rateErr, { status: 429, name: "RateLimitError" });
          throw rateErr;
        }

        if (errObj?.status === 403 || errObj?.name === "PermissionDeniedError") {
          const permErr = new Error(effectiveErrMsg || "Acesso não autorizado ao modelo de inteligência artificial.");
          Object.assign(permErr, { status: 403, name: "PermissionDeniedError" });
          throw permErr;
        }

        if (
          errObj?.status === 400 ||
          errObj?.status === 404 ||
          errObj?.name === "BadRequestError" ||
          errObj?.name === "NotFoundError"
        ) {
          const reqErr = new Error(effectiveErrMsg || "Requisição inválida enviada ao provedor de IA.");
          Object.assign(reqErr, { status: errObj?.status || 400, name: errObj?.name || "BadRequestError" });
          throw reqErr;
        }

        throw new AIServiceUnavailableError(safeErrorMsg);
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

