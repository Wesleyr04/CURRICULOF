import fs from "fs";
import path from "path";
import readline from "readline";
import {
  AIUsageRecord,
  AIUsageRecordSchema,
  UsageFilter,
  AggregatedUsageMetrics,
} from "./types";
import { UsageRepository, StorageInfo } from "./repository";

export class JsonlUsageRepository implements UsageRepository {
  private filePath: string;
  private fallbackFilePath: string | null = null;
  private inMemoryFallback: Map<string, AIUsageRecord> = new Map();
  private isReadOnlyFileSystem = false;

  constructor(customFilePath?: string) {
    if (customFilePath) {
      this.filePath = customFilePath;
    } else {
      // Se estiver em ambiente de teste automatizado, isola em pasta temporária para nunca sujar o arquivo padrão
      const isTestEnv = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);
      const dataDir = path.join(process.cwd(), "data");

      if (isTestEnv) {
        this.filePath = path.join(dataDir, `test-isolated-${process.pid}.jsonl`);
      } else {
        this.filePath = path.join(dataDir, "ai-usage.jsonl");
      }

      // Em ambiente serverless (Netlify / Nuvem), o diretório /tmp é o único gravável no filesystem efêmero
      if (process.env.NETLIFY || process.env.NODE_ENV === "production") {
        this.fallbackFilePath = path.join("/tmp", "ai-usage.jsonl");
      }
    }
  }

  getStorageInfo(): StorageInfo {
    const isServerless = Boolean(process.env.NETLIFY || (process.env.NODE_ENV === "production" && !this.filePath.includes("test")));
    const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);

    if (isTest) {
      return {
        type: "memory_test",
        isPersistent: false,
        description: "Ambiente de Testes Automatizados (armazenamento efêmero isolado).",
        filePath: this.filePath,
      };
    }

    if (isServerless) {
      return {
        type: "serverless_ephemeral",
        isPersistent: false,
        description:
          "Netlify Serverless Function (disco de execução somente-leitura e /tmp volátil). Métricas em disco são reiniciadas a cada reciclagem de contêiner serverless.",
        remoteConfigured: false,
        setupInstructions:
          "Para persistência permanente em produção: configure as variáveis de ambiente KV_REST_API_URL e KV_REST_API_TOKEN vinculando uma base Upstash Redis.",
        filePath: this.fallbackFilePath || this.filePath,
      };
    }

    return {
      type: "local_jsonl",
      isPersistent: true,
      description: "Ambiente Local de Desenvolvimento (persistência em disco local data/ai-usage.jsonl).",
      filePath: this.filePath,
    };
  }

  private ensureDirectory(targetPath: string): boolean {
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return true;
    } catch {
      return false;
    }
  }

  async save(record: AIUsageRecord): Promise<void> {
    // 1. Validação estrita do schema antes de persistir
    const validated = AIUsageRecordSchema.parse(record);

    // 2. Verifica idempotência antes de qualquer gravação se responseId estiver preenchido
    if (validated.responseId) {
      const existing = await this.findByResponseId(validated.responseId);
      if (existing) {
        // Já gravado anteriormente — idempotência respeitada
        return;
      }
    }

    // 3. Armazena no cache em memória
    this.inMemoryFallback.set(validated.id, validated);

    // 4. Log Estruturado Permanente (Zero-PII)
    // Permite ingestão direta e retenção contínua em Netlify Logs / Datadog / Logflare / Axiom
    console.log("[AI_USAGE_TELEMETRY]", JSON.stringify(validated));

    const line = JSON.stringify(validated) + "\n";

    // 5. Tentativa de gravação no arquivo principal (data/ai-usage.jsonl)
    if (!this.isReadOnlyFileSystem) {
      try {
        const canWrite = this.ensureDirectory(this.filePath);
        if (canWrite) {
          await fs.promises.appendFile(this.filePath, line, "utf-8");
          return;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("EROFS") || message.includes("read-only") || message.includes("EACCES")) {
          this.isReadOnlyFileSystem = true;
        } else {
          console.warn("[JsonlUsageRepository] Falha ao gravar no caminho principal:", message);
        }
      }
    }

    // 6. Fallback para /tmp se estiver em ambiente Serverless/Read-only
    if (this.fallbackFilePath) {
      try {
        this.ensureDirectory(this.fallbackFilePath);
        await fs.promises.appendFile(this.fallbackFilePath, line, "utf-8");
      } catch (fallbackErr) {
        // Fallback fail-open mantendo na memória do processo
        console.warn(
          "[JsonlUsageRepository] Falha ao gravar em fallback /tmp. Registro retido na memória volátil.",
          fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr)
        );
      }
    }
  }

  async findById(id: string): Promise<AIUsageRecord | null> {
    const memoryRecord = this.inMemoryFallback.get(id);
    if (memoryRecord) return memoryRecord;

    const all = await this.readAllRecords();
    return all.find((r) => r.id === id) || null;
  }

  async findByResponseId(responseId: string): Promise<AIUsageRecord | null> {
    for (const record of this.inMemoryFallback.values()) {
      if (record.responseId === responseId) {
        return record;
      }
    }

    const all = await this.readAllRecords();
    return all.find((r) => r.responseId === responseId) || null;
  }

  async findMany(filter?: UsageFilter): Promise<AIUsageRecord[]> {
    const all = await this.readAllRecords();
    return this.applyFilter(all, filter);
  }

  async getAggregatedMetrics(filter?: UsageFilter): Promise<AggregatedUsageMetrics> {
    const records = await this.findMany(filter);

    let totalCalls = 0;
    let successfulCalls = 0;
    let failedCalls = 0;
    let incompleteCalls = 0;
    let legacyIncompleteCount = 0;
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

    // Agrupamento por correlationId para cálculo de média por geração de currículo
    const correlationMap = new Map<string, { calls: number; costUsd: number; costBrl: number }>();

    // Quebra por operação e modelo
    const breakdownByOperation: Record<
      string,
      { calls: number; tokens: number; costUsd: number; costBrl: number; incompleteCalls: number }
    > = {};

    const breakdownByModel: Record<
      string,
      { calls: number; tokens: number; costUsd: number; costBrl: number; incompleteCalls: number }
    > = {};

    for (const r of records) {
      totalCalls++;
      if (r.status === "success") {
        successfulCalls++;
      } else {
        failedCalls++;
      }

      if (r.source === "synthetic_test") {
        syntheticCallsCount++;
      } else {
        productionCallsCount++;
      }

      // Rastreia intervalo temporal
      if (!earliestTimestamp || r.timestamp < earliestTimestamp) {
        earliestTimestamp = r.timestamp;
      }
      if (!latestTimestamp || r.timestamp > latestTimestamp) {
        latestTimestamp = r.timestamp;
      }

      // Detecção de registros legados ou incompletos
      const isLegacyIncomplete =
        r.usage.inputTokens === 0 &&
        r.usage.outputTokens === 0 &&
        r.cost.pricingSnapshot.pricingStatus === "unmapped_model";

      const isUnavailable =
        r.usage.inputTokens === null ||
        r.usage.outputTokens === null ||
        r.usage.tokensStatus === "unavailable";

      const isPartial = r.usage.tokensStatus === "partial";

      if (isLegacyIncomplete) {
        legacyIncompleteCount++;
        incompleteCalls++;
        tokensUnavailable++;
      } else if (isUnavailable) {
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

      // Agrupamento por correlationId
      const currentCorr = correlationMap.get(r.correlationId) || { calls: 0, costUsd: 0, costBrl: 0 };
      currentCorr.calls++;
      currentCorr.costUsd += recordUsd;
      currentCorr.costBrl += recordBrl;
      correlationMap.set(r.correlationId, currentCorr);

      const isIncompleteRecord = isLegacyIncomplete || isUnavailable || isPartial;

      // Quebra por Operation
      const op = r.operationType;
      if (!breakdownByOperation[op]) {
        breakdownByOperation[op] = { calls: 0, tokens: 0, costUsd: 0, costBrl: 0, incompleteCalls: 0 };
      }
      breakdownByOperation[op].calls++;
      breakdownByOperation[op].tokens += recordTokens;
      breakdownByOperation[op].costUsd += recordUsd;
      breakdownByOperation[op].costBrl += recordBrl;
      if (isIncompleteRecord) breakdownByOperation[op].incompleteCalls++;

      // Quebra por Model
      const mod = r.model;
      if (!breakdownByModel[mod]) {
        breakdownByModel[mod] = { calls: 0, tokens: 0, costUsd: 0, costBrl: 0, incompleteCalls: 0 };
      }
      breakdownByModel[mod].calls++;
      breakdownByModel[mod].tokens += recordTokens;
      breakdownByModel[mod].costUsd += recordUsd;
      breakdownByModel[mod].costBrl += recordBrl;
      if (isIncompleteRecord) breakdownByModel[mod].incompleteCalls++;
    }

    const grandTotalTokens = inputTokens + outputTokens + cacheCreationTokens + cacheReadTokens;

    const avgCallUsd = totalCalls > 0 ? Number((totalUsd / totalCalls).toFixed(6)) : 0;
    const avgCallBrl = totalCalls > 0 ? Number((totalBrl / totalCalls).toFixed(4)) : 0;

    const totalGenerations = correlationMap.size;
    const avgGenUsd =
      totalGenerations > 0 ? Number((totalUsd / totalGenerations).toFixed(6)) : 0;
    const avgGenBrl =
      totalGenerations > 0 ? Number((totalBrl / totalGenerations).toFixed(4)) : 0;

    // Arredondar quebras
    for (const op in breakdownByOperation) {
      breakdownByOperation[op].costUsd = Number(breakdownByOperation[op].costUsd.toFixed(6));
      breakdownByOperation[op].costBrl = Number(breakdownByOperation[op].costBrl.toFixed(4));
    }
    for (const mod in breakdownByModel) {
      breakdownByModel[mod].costUsd = Number(breakdownByModel[mod].costUsd.toFixed(6));
      breakdownByModel[mod].costBrl = Number(breakdownByModel[mod].costBrl.toFixed(4));
    }

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
        "Custo estimado baseado no consumo de tokens e tarifas oficiais públicas da Anthropic. Registros incompletos ou modelos não mapeados possuem custos nulos ou parciais.",
    };
  }

  private async readFromFile(filePath: string, recordsMap: Map<string, AIUsageRecord>): Promise<void> {
    if (!fs.existsSync(filePath)) return;

    try {
      const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          // Detecção retroativa sem adulterar o arquivo original:
          // Se for registro legado anterior à segregação de origem
          if (!parsed.source) {
            const isSyntheticTest =
              parsed.model === "claude-fable-5-1" ||
              (typeof parsed.durationMs === "number" && parsed.durationMs <= 10 && !parsed.responseId) ||
              parsed.cost?.pricingSnapshot?.pricingStatus === "unmapped_model";
            parsed.source = isSyntheticTest ? "synthetic_test" : "production";
          }
          const validated = AIUsageRecordSchema.parse(parsed);
          recordsMap.set(validated.id, validated);
        } catch {
          // Ignora linhas corrompidas sem derrubar a consulta
        }
      }
    } catch (err) {
      console.error(`[JsonlUsageRepository] Erro ao ler arquivo JSONL '${filePath}':`, err);
    }
  }

  private async readAllRecords(): Promise<AIUsageRecord[]> {
    const recordsMap = new Map<string, AIUsageRecord>();

    // 1. Carrega do cache em memória volátil
    for (const [id, r] of this.inMemoryFallback.entries()) {
      recordsMap.set(id, r);
    }

    // 2. Lê do arquivo principal (data/ai-usage.jsonl)
    await this.readFromFile(this.filePath, recordsMap);

    // 3. Lê do arquivo de fallback (/tmp/ai-usage.jsonl) se configurado
    if (this.fallbackFilePath && this.fallbackFilePath !== this.filePath) {
      await this.readFromFile(this.fallbackFilePath, recordsMap);
    }

    return Array.from(recordsMap.values());
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

// Instância singleton padrão do repositório
export const usageRepository = new JsonlUsageRepository();
