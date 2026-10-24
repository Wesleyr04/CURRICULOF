import { AIUsageRecord, AIUsageRecordSchema, UsageFilter, AggregatedUsageMetrics } from "./types";
import { UsageRepository, StorageInfo } from "./repository";

export class KvUsageRepository implements UsageRepository {
  private url: string;
  private token: string;

  constructor(customUrl?: string, customToken?: string) {
    this.url = (customUrl || process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "").trim().replace(/\/$/, "");
    this.token = (customToken || process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || "").trim();
  }

  public isConfigured(): boolean {
    return Boolean(this.url && this.token);
  }

  getStorageInfo(): StorageInfo {
    const configured = this.isConfigured();
    return {
      type: "kv_remote",
      isPersistent: configured,
      description: configured
        ? "Armazenamento em nuvem persistente (Upstash Redis) conectado com sucesso via REST API."
        : "Upstash Redis não configurado no ambiente. Registros não persistirão entre reciclagens de contêiner serverless.",
      remoteConfigured: configured,
      setupInstructions: configured
        ? null
        : "Para ativar a persistência definitiva em produção na Netlify: configure as variáveis de ambiente KV_REST_API_URL e KV_REST_API_TOKEN vinculando uma base Upstash Redis.",
    };
  }

  private async executeCommand<T>(command: string, ...args: (string | number)[]): Promise<T | null> {
    if (!this.isConfigured()) return null;

    try {
      const endpoint = `${this.url}/${command}/${args.map((a) => encodeURIComponent(String(a))).join("/")}`;
      const res = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        console.warn(`[KvUsageRepository] Erro HTTP ${res.status} ao executar ${command}:`, await res.text().catch(() => ""));
        return null;
      }

      const json = await res.json();
      return json.result as T;
    } catch (err) {
      console.error(`[KvUsageRepository] Falha ao comunicar com Redis REST endpoint (${command}):`, err);
      return null;
    }
  }

  private async executePostCommand<T>(command: (string | number)[]): Promise<T | null> {
    if (!this.isConfigured()) return null;

    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
        cache: "no-store",
      });

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      return json.result as T;
    } catch (err) {
      console.error("[KvUsageRepository] Falha ao executar comando POST no KV:", err);
      return null;
    }
  }

  async save(record: AIUsageRecord): Promise<void> {
    if (!this.isConfigured()) return;

    const validated = AIUsageRecordSchema.parse(record);

    // 1. Verificação de idempotência se responseId estiver preenchido
    if (validated.responseId) {
      const existing = await this.findByResponseId(validated.responseId);
      if (existing) {
        return;
      }
    }

    const recordKey = `ai_usage:record:${validated.id}`;
    const serialized = JSON.stringify(validated);
    const score = new Date(validated.timestamp).getTime();

    // 2. Grava o registro e adiciona na timeline ordenada por timestamp
    await this.executePostCommand(["SET", recordKey, serialized]);
    await this.executePostCommand(["ZADD", "ai_usage:timeline", score, validated.id]);

    // 3. Mapeia responseId para idempotência
    if (validated.responseId) {
      await this.executePostCommand(["SET", `ai_usage:res_id:${validated.responseId}`, validated.id]);
    }
  }

  async findById(id: string): Promise<AIUsageRecord | null> {
    if (!this.isConfigured()) return null;

    const data = await this.executeCommand<string>("get", `ai_usage:record:${id}`);
    if (!data) return null;

    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      return AIUsageRecordSchema.parse(parsed);
    } catch {
      return null;
    }
  }

  async findByResponseId(responseId: string): Promise<AIUsageRecord | null> {
    if (!this.isConfigured()) return null;

    const targetId = await this.executeCommand<string>("get", `ai_usage:res_id:${responseId}`);
    if (!targetId) return null;

    return await this.findById(targetId);
  }

  async findMany(filter?: UsageFilter): Promise<AIUsageRecord[]> {
    if (!this.isConfigured()) return [];

    let minScore = "-inf";
    let maxScore = "+inf";

    if (filter?.startDate) {
      minScore = String(new Date(filter.startDate).getTime());
    }
    if (filter?.endDate) {
      maxScore = String(new Date(filter.endDate).getTime());
    }

    // Busca os IDs no set ordenado
    const ids = await this.executePostCommand<string[]>([
      "ZRANGEBYSCORE",
      "ai_usage:timeline",
      minScore,
      maxScore,
    ]);

    if (!ids || ids.length === 0) return [];

    const records: AIUsageRecord[] = [];
    // Busca os registros (com limite de segurança de 500 registros mais recentes)
    const slicedIds = ids.slice(-500);

    for (const id of slicedIds) {
      const rec = await this.findById(id);
      if (rec) records.push(rec);
    }

    return this.applyFilter(records, filter);
  }

  async getAggregatedMetrics(filter?: UsageFilter): Promise<AggregatedUsageMetrics> {
    const records = await this.findMany(filter);

    let totalCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    let incompleteCalls = 0;
    const legacyIncompleteCount = 0;
    let productionCallsCount = 0;
    let syntheticCallsCount = 0;

    let inputTokens = 0;
    let outputTokens = 0;
    let cacheCreationTokens = 0;
    let cacheReadTokens = 0;

    let tokensComplete = 0;
    let tokensPartial = 0;
    let tokensUnavailable = 0;

    let totalUsd = 0;
    let totalBrl = 0;

    let unmappedModelsCount = 0;
    let hasPartialCosts = false;

    let earliestTimestamp: string | null = null;
    let latestTimestamp: string | null = null;

    const correlationMap = new Map<string, { calls: number; costUsd: number; costBrl: number }>();
    const breakdownByOperation: Record<string, { calls: number; tokens: number; costUsd: number; costBrl: number; incompleteCalls: number }> = {};
    const breakdownByModel: Record<string, { calls: number; tokens: number; costUsd: number; costBrl: number; incompleteCalls: number }> = {};

    for (const r of records) {
      totalCalls++;
      if (r.status === "success") successfulCalls++;
      else failedCalls++;

      if (r.source === "synthetic_test") syntheticCallsCount++;
      else productionCallsCount++;

      if (!earliestTimestamp || r.timestamp < earliestTimestamp) earliestTimestamp = r.timestamp;
      if (!latestTimestamp || r.timestamp > latestTimestamp) latestTimestamp = r.timestamp;

      const isUnavailable =
        r.usage.inputTokens === null ||
        r.usage.outputTokens === null ||
        r.usage.tokensStatus === "unavailable";
      const isPartial = r.usage.tokensStatus === "partial";

      if (isUnavailable) {
        incompleteCalls++;
        tokensUnavailable++;
      } else if (isPartial) {
        incompleteCalls++;
        tokensPartial++;
      } else {
        tokensComplete++;
      }

      const safeInput = r.usage.inputTokens ?? 0;
      const safeOutput = r.usage.outputTokens ?? 0;
      const safeCacheCreation = r.usage.cacheCreationInputTokens ?? 0;
      const safeCacheRead = r.usage.cacheReadInputTokens ?? 0;

      inputTokens += safeInput;
      outputTokens += safeOutput;
      cacheCreationTokens += safeCacheCreation;
      cacheReadTokens += safeCacheRead;

      const recordTokens = safeInput + safeOutput + safeCacheCreation + safeCacheRead;

      if (r.cost.usd === null || r.cost.brl === null) {
        hasPartialCosts = true;
      }

      const recordUsd = r.cost.usd ?? 0;
      const recordBrl = r.cost.brl ?? 0;

      totalUsd += recordUsd;
      totalBrl += recordBrl;

      if (r.cost.pricingSnapshot.pricingStatus === "unmapped_model") {
        unmappedModelsCount++;
      }

      const currentCorr = correlationMap.get(r.correlationId) || { calls: 0, costUsd: 0, costBrl: 0 };
      currentCorr.calls++;
      currentCorr.costUsd += recordUsd;
      currentCorr.costBrl += recordBrl;
      correlationMap.set(r.correlationId, currentCorr);

      const isIncomplete = isUnavailable || isPartial;

      const op = r.operationType;
      if (!breakdownByOperation[op]) {
        breakdownByOperation[op] = { calls: 0, tokens: 0, costUsd: 0, costBrl: 0, incompleteCalls: 0 };
      }
      breakdownByOperation[op].calls++;
      breakdownByOperation[op].tokens += recordTokens;
      breakdownByOperation[op].costUsd += recordUsd;
      breakdownByOperation[op].costBrl += recordBrl;
      if (isIncomplete) breakdownByOperation[op].incompleteCalls++;

      const mod = r.model;
      if (!breakdownByModel[mod]) {
        breakdownByModel[mod] = { calls: 0, tokens: 0, costUsd: 0, costBrl: 0, incompleteCalls: 0 };
      }
      breakdownByModel[mod].calls++;
      breakdownByModel[mod].tokens += recordTokens;
      breakdownByModel[mod].costUsd += recordUsd;
      breakdownByModel[mod].costBrl += recordBrl;
      if (isIncomplete) breakdownByModel[mod].incompleteCalls++;
    }

    const grandTotalTokens = inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens;
    const avgCallUsd = totalCalls > 0 ? Number((totalUsd / totalCalls).toFixed(6)) : 0;
    const avgCallBrl = totalCalls > 0 ? Number((totalBrl / totalCalls).toFixed(4)) : 0;

    const totalGenerations = correlationMap.size;
    const avgGenUsd = totalGenerations > 0 ? Number((totalUsd / totalGenerations).toFixed(6)) : 0;
    const avgGenBrl = totalGenerations > 0 ? Number((totalBrl / totalGenerations).toFixed(4)) : 0;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      incompleteCalls,
      legacyIncompleteCount,
      productionCallsCount,
      syntheticCallsCount,
      hasPartialCosts,
      period: {
        earliestTimestamp,
        latestTimestamp,
      },
      totalTokens: {
        inputTokens,
        outputTokens,
        cacheCreationTokens,
        cacheReadTokens,
        grandTotalTokens,
      },
      tokensStatusSummary: {
        complete: tokensComplete,
        partial: tokensPartial,
        unavailable: tokensUnavailable,
      },
      totalCost: {
        usd: Number(totalUsd.toFixed(6)),
        brl: Number(totalBrl.toFixed(4)),
      },
      averageCostPerCall: {
        usd: avgCallUsd,
        brl: avgCallBrl,
      },
      averageCostPerResumeGeneration: {
        totalGenerations,
        averageUsd: avgGenUsd,
        averageBrl: avgGenBrl,
      },
      breakdownByOperation,
      breakdownByModel,
      unmappedModelsCount,
      disclaimer:
        "Custo calculado com base nos tokens consumidos registrados no Upstash Redis e na tabela pública da Anthropic.",
    };
  }

  private applyFilter(records: AIUsageRecord[], filter?: UsageFilter): AIUsageRecord[] {
    if (!filter) return records;

    return records.filter((r) => {
      if (filter.source && filter.source !== "all" && r.source !== filter.source) {
        return false;
      }
      if (filter.startDate && new Date(r.timestamp) < new Date(filter.startDate)) {
        return false;
      }
      if (filter.endDate && new Date(r.timestamp) > new Date(filter.endDate)) {
        return false;
      }
      if (filter.model && r.model !== filter.model) {
        return false;
      }
      if (filter.operationType && r.operationType !== filter.operationType) {
        return false;
      }
      if (filter.correlationId && r.correlationId !== filter.correlationId) {
        return false;
      }
      return true;
    });
  }
}
