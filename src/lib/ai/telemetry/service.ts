import crypto from "crypto";
import {
  AIUsageRecord,
  AIOperationType,
  TokenUsage,
  UsageFilter,
  AggregatedUsageMetrics,
  ExecutionSource,
} from "./types";
import { calculateAnthropicCost } from "./cost-calculator";
import { UsageRepository, StorageInfo } from "./repository";
import { usageRepository } from "./jsonl-repository";
import { KvUsageRepository } from "./kv-repository";

export interface RecordTelemetryInput {
  model: string;
  requestedModel?: string;
  actualModel?: string;
  operationType: AIOperationType;
  usage: TokenUsage;
  correlationId?: string;
  responseId?: string | null;
  durationMs: number;
  status: "success" | "error";
  source?: ExecutionSource;
  errorCode?: string | null;
  errorMessageSafe?: string | null;
  attempt?: number;
}

export function createDefaultTelemetryRepository(): UsageRepository {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    return new KvUsageRepository(kvUrl, kvToken);
  }

  return usageRepository;
}

export class AITelemetryService {
  private repository: UsageRepository;

  constructor(repository?: UsageRepository) {
    this.repository = repository || createDefaultTelemetryRepository();
  }

  getStorageInfo(): StorageInfo {
    return this.repository.getStorageInfo();
  }

  /**
   * Registra a telemetria da chamada de IA com política Zero-PII e padrão Fail-Open estrito.
   * Em caso de falha de persistência, loga estruturadamente no console do servidor e não interrompe a execução.
   */
  async recordUsage(input: RecordTelemetryInput): Promise<AIUsageRecord | null> {
    try {
      const id = crypto.randomUUID();
      const correlationId = input.correlationId || crypto.randomUUID();
      const timestamp = new Date().toISOString();

      const effectiveModel = input.actualModel || input.model;

      // Determinação segura da origem de execução
      const effectiveSource: ExecutionSource =
        input.source ||
        (process.env.NODE_ENV === "test" || process.env.VITEST
          ? "synthetic_test"
          : input.status === "error"
          ? "error"
          : "production");

      // Cálculo financeiro auditável
      const cost = calculateAnthropicCost(effectiveModel, input.usage);

      // Sanitização Zero-PII: apenas metadados técnicos são persistidos
      const record: AIUsageRecord = {
        id,
        responseId: input.responseId || null,
        correlationId,
        timestamp,
        provider: "anthropic",
        model: effectiveModel,
        requestedModel: input.requestedModel || input.model,
        actualModel: input.actualModel || undefined,
        operationType: input.operationType,
        status: input.status,
        source: effectiveSource,
        attempt: input.attempt ?? 1,
        usage: {
          inputTokens: input.usage.inputTokens,
          outputTokens: input.usage.outputTokens,
          cacheCreationInputTokens: input.usage.cacheCreationInputTokens ?? null,
          cacheReadInputTokens: input.usage.cacheReadInputTokens ?? null,
          tokensStatus:
            input.usage.tokensStatus ??
            (input.usage.inputTokens !== null && input.usage.outputTokens !== null
              ? "complete"
              : "unavailable"),
        },
        cost,
        errorCode: input.errorCode || null,
        errorMessageSafe: input.errorMessageSafe ? input.errorMessageSafe.slice(0, 150) : null,
        durationMs: Math.max(0, input.durationMs),
      };

      await this.repository.save(record);
      return record;
    } catch (error: unknown) {
      // Fail-Open: o monitoramento nunca deve derrubar a geração de currículo para o usuário final
      console.error(
        "[AI Telemetry Fail-Open Error] Falha interna não-bloqueante ao registrar métricas de IA:",
        error instanceof Error ? error.message : String(error)
      );
      return null;
    }
  }

  /**
   * Consulta agregada de consumo e unit economics.
   */
  async getMetrics(filter?: UsageFilter): Promise<AggregatedUsageMetrics> {
    return await this.repository.getAggregatedMetrics(filter);
  }

  /**
   * Consulta registros individuais filtrados.
   */
  async listRecords(filter?: UsageFilter): Promise<AIUsageRecord[]> {
    return await this.repository.findMany(filter);
  }
}

// Instância singleton para uso em rotas e serviços
export const aiTelemetryService = new AITelemetryService();
