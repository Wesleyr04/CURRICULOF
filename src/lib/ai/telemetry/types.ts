import { z } from "zod";

export const ModelPricingTierSchema = z.object({
  modelPattern: z.string(),
  friendlyName: z.string(),
  inputPricePerMillion: z.number(),
  outputPricePerMillion: z.number(),
  cacheWritePricePerMillion: z.number(),
  cacheReadPricePerMillion: z.number(),
});

export type ModelPricingTier = z.infer<typeof ModelPricingTierSchema>;

export const PricingSnapshotSchema = z.object({
  model: z.string(),
  inputPricePerMillion: z.number().nullable(),
  outputPricePerMillion: z.number().nullable(),
  cacheWritePricePerMillion: z.number().nullable(),
  cacheReadPricePerMillion: z.number().nullable(),
  pricingStatus: z.enum(["matched", "unmapped_model", "pricing_unavailable", "tokens_unavailable"]),
  appliedAt: z.string(),
});

export type PricingSnapshot = z.infer<typeof PricingSnapshotSchema>;

export const TokenUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative().nullable(),
  outputTokens: z.number().int().nonnegative().nullable(),
  cacheCreationInputTokens: z.number().int().nonnegative().nullable().default(null),
  cacheReadInputTokens: z.number().int().nonnegative().nullable().default(null),
  tokensStatus: z.enum(["complete", "partial", "unavailable"]).optional().default("complete"),
});

export type TokenUsage = z.input<typeof TokenUsageSchema>;

export const CostCalculationSchema = z.object({
  usd: z.number().nullable(),
  brl: z.number().nullable(),
  exchangeRate: z.number().positive(),
  pricingSnapshot: PricingSnapshotSchema,
  isEstimated: z.boolean().default(true),
});

export type CostCalculation = z.infer<typeof CostCalculationSchema>;

export const AIOperationTypeSchema = z.enum([
  "suggest-summary",
  "improve-text",
  "improve-full",
  "direct-anthropic-route",
  "unknown",
]);

export type AIOperationType = z.infer<typeof AIOperationTypeSchema>;

export const ExecutionSourceSchema = z.enum([
  "production",
  "synthetic_test",
  "fallback",
  "error",
]);

export type ExecutionSource = z.infer<typeof ExecutionSourceSchema>;

export const AIUsageRecordSchema = z.object({
  id: z.string(), // UUID do registro
  responseId: z.string().nullable(), // ID da resposta da API (ex: msg_xxx) para idempotência
  correlationId: z.string(), // ID técnico para correlacionar múltiplas chamadas da mesma geração
  timestamp: z.string(), // ISO 8601
  provider: z.literal("anthropic"),
  model: z.string(),
  requestedModel: z.string().optional(),
  actualModel: z.string().optional(),
  operationType: AIOperationTypeSchema,
  status: z.enum(["success", "error"]),
  source: ExecutionSourceSchema.default("production"),
  attempt: z.number().int().positive().default(1),
  usage: TokenUsageSchema,
  cost: CostCalculationSchema,
  errorCode: z.string().nullable().default(null),
  errorMessageSafe: z.string().nullable().default(null),
  durationMs: z.number().nonnegative(),
});

export type AIUsageRecord = z.infer<typeof AIUsageRecordSchema>;

export interface UsageFilter {
  startDate?: string;
  endDate?: string;
  model?: string;
  operationType?: AIOperationType;
  correlationId?: string;
  source?: ExecutionSource | "all";
}

export interface AggregatedUsageMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  incompleteCalls: number;
  legacyIncompleteCount: number;
  productionCallsCount: number;
  syntheticCallsCount: number;
  hasPartialCosts: boolean;
  period: {
    earliestTimestamp: string | null;
    latestTimestamp: string | null;
  };
  totalTokens: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
    grandTotalTokens: number;
  };
  tokensStatusSummary: {
    complete: number;
    partial: number;
    unavailable: number;
  };
  totalCost: {
    usd: number;
    brl: number;
  };
  averageCostPerCall: {
    usd: number;
    brl: number;
  };
  averageCostPerResumeGeneration: {
    totalGenerations: number;
    averageUsd: number;
    averageBrl: number;
  };
  breakdownByOperation: Record<
    string,
    {
      calls: number;
      tokens: number;
      costUsd: number;
      costBrl: number;
      incompleteCalls: number;
    }
  >;
  breakdownByModel: Record<
    string,
    {
      calls: number;
      tokens: number;
      costUsd: number;
      costBrl: number;
      incompleteCalls: number;
    }
  >;
  unmappedModelsCount: number;
  disclaimer: string;
}
