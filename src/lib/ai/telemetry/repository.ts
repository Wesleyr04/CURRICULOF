import { AIUsageRecord, UsageFilter, AggregatedUsageMetrics } from "./types";

export interface StorageInfo {
  type: "kv_remote" | "local_jsonl" | "serverless_ephemeral" | "memory_test";
  isPersistent: boolean;
  description: string;
  filePath?: string;
  remoteConfigured?: boolean;
  setupInstructions?: string | null;
}

export interface UsageRepository {
  /**
   * Salva um registro de auditoria de uso e custo.
   * Deve ser idempotente baseado em `responseId` quando este estiver presente.
   */
  save(record: AIUsageRecord): Promise<void>;

  /**
   * Busca um registro pelo identificador único técnico.
   */
  findById(id: string): Promise<AIUsageRecord | null>;

  /**
   * Busca um registro pelo identificador retornado pela API da Anthropic (idempotência).
   */
  findByResponseId(responseId: string): Promise<AIUsageRecord | null>;

  /**
   * Lista registros aplicando filtros opcionais (data, modelo, operação, correlationId).
   */
  findMany(filter?: UsageFilter): Promise<AIUsageRecord[]>;

  /**
   * Calcula métricas agregadas consolidadas no período especificado.
   */
  getAggregatedMetrics(filter?: UsageFilter): Promise<AggregatedUsageMetrics>;

  /**
   * Retorna os metadados e o estado de persistência real do backend de armazenamento.
   */
  getStorageInfo(): StorageInfo;
}
