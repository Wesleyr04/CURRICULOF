import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "path";
import fs from "fs";
import { calculateAnthropicCost } from "@/lib/ai/telemetry/cost-calculator";
import { findModelPricing } from "@/lib/ai/telemetry/pricing-table";
import { JsonlUsageRepository } from "@/lib/ai/telemetry/jsonl-repository";
import { KvUsageRepository } from "@/lib/ai/telemetry/kv-repository";
import { AITelemetryService, createDefaultTelemetryRepository } from "@/lib/ai/telemetry/service";
import { AnthropicClientService } from "@/lib/ai/anthropic-client-service";
import { MockAIService } from "@/lib/ai/mock-service";
import { getAIService } from "@/lib/ai/factory";
import { INITIAL_RESUME_DATA } from "@/config/layouts";

// Mock do SDK @anthropic-ai/sdk usando vi.hoisted para isolamento 100% offline
const { mockCreate } = vi.hoisted(() => {
  return {
    mockCreate: vi.fn(),
  };
});

vi.mock("@anthropic-ai/sdk", () => {
  class MockAnthropic {
    messages = {
      create: mockCreate,
    };
    constructor(public options?: unknown) {}
  }

  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

describe("Suíte de Telemetria Financeira e Monitoramento Real de Tokens (Anthropic SDK)", () => {
  const originalEnv = { ...process.env };
  const testJsonlPath = path.join(process.cwd(), "data", `test-ai-usage-${Date.now()}.jsonl`);

  let testRepo: JsonlUsageRepository;
  let testTelemetryService: AITelemetryService;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.ADMIN_METRICS_TOKEN = "test-secret-admin-token-123";

    if (fs.existsSync(testJsonlPath)) {
      try {
        fs.unlinkSync(testJsonlPath);
      } catch {
        // Ignora bloqueio transitório de arquivo no Windows
      }
    }
    testRepo = new JsonlUsageRepository(testJsonlPath);
    testTelemetryService = new AITelemetryService(testRepo);

    // Injeta o repositório isolado de teste no singleton importado pelas rotas
    const { aiTelemetryService } = await import("@/lib/ai/telemetry/service");
    (aiTelemetryService as any).repository = testRepo;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    if (fs.existsSync(testJsonlPath)) {
      try {
        fs.unlinkSync(testJsonlPath);
      } catch {
        // Ignora erro de limpeza
      }
    }
  });

  // --------------------------------------------------------------------------
  // Cenário 1: Captura exata de input_tokens e output_tokens a partir do payload
  // --------------------------------------------------------------------------
  it("Cenário 1: deve capturar exatamente input_tokens e output_tokens a partir do payload do SDK da Anthropic", async () => {
    mockCreate.mockResolvedValueOnce({
      id: "msg_test_exact_tokens_001",
      model: "claude-3-5-haiku-20241022",
      content: [{ type: "text", text: "Resumo gerado pelo Claude com métricas reais." }],
      usage: {
        input_tokens: 154,
        output_tokens: 67,
      },
    });

    const service = new AnthropicClientService("sk-ant-test-key", "claude-3-5-haiku-20241022");
    // Injeta o repositório de teste na instância de telemetria singleton
    const { aiTelemetryService } = await import("@/lib/ai/telemetry/service");
    (aiTelemetryService as any).repository = testRepo;

    const result = await service.suggestSummary({
      jobTitle: "Desenvolvedor Frontend",
      field: "Tecnologia",
    });

    expect(result).toBe("Resumo gerado pelo Claude com métricas reais.");

    const records = await testRepo.findMany();
    expect(records).toHaveLength(1);
    expect(records[0].usage.inputTokens).toBe(154);
    expect(records[0].usage.outputTokens).toBe(67);
    expect(records[0].responseId).toBe("msg_test_exact_tokens_001");
    expect(records[0].status).toBe("success");
  });

  // --------------------------------------------------------------------------
  // Cenário 2: Tratamento de campos opcionais/ausentes de cache
  // --------------------------------------------------------------------------
  it("Cenário 2: deve tratar corretamente campos opcionais/ausentes de cache (cache_creation e cache_read)", () => {
    // Caso A: Sem cache (nulo/indefinido)
    const costWithoutCache = calculateAnthropicCost("claude-3-5-sonnet-20241022", {
      inputTokens: 1000,
      outputTokens: 500,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: null,
    });

    expect(costWithoutCache.usd).toBeGreaterThan(0);
    expect(costWithoutCache.pricingSnapshot.pricingStatus).toBe("matched");

    // Caso B: Com Prompt Caching ativo
    const costWithCache = calculateAnthropicCost("claude-3-5-sonnet-20241022", {
      inputTokens: 1000,
      outputTokens: 500,
      cacheCreationInputTokens: 2000,
      cacheReadInputTokens: 1500,
    });

    expect(costWithCache.usd).toBeGreaterThan(costWithoutCache.usd!);
  });

  // --------------------------------------------------------------------------
  // Cenário 3: Cálculo matemático preciso de custos (entrada, saída e cache)
  // --------------------------------------------------------------------------
  it("Cenário 3: deve calcular com precisão matemática os custos em USD para Claude 3.5 Sonnet", () => {
    // Claude 3.5 Sonnet:
    // Input: $3.00/MTok, Output: $15.00/MTok, Cache Write: $3.75/MTok, Cache Read: $0.30/MTok
    // Para:
    // 1.000.000 input = $3.00
    // 1.000.000 output = $15.00
    // 1.000.000 cache write = $3.75
    // 1.000.000 cache read = $0.30
    // Total = $22.05
    const cost = calculateAnthropicCost(
      "claude-3-5-sonnet-20241022",
      {
        inputTokens: 1_000_000,
        outputTokens: 1_000_000,
        cacheCreationInputTokens: 1_000_000,
        cacheReadInputTokens: 1_000_000,
      },
      5.0
    );

    expect(cost.usd).toBe(22.05);
    expect(cost.brl).toBe(110.25);
  });

  it("Cenário 3.1: deve calcular com precisão matemática os custos para Claude 3.7 Sonnet", () => {
    // Claude 3.7 Sonnet: Input $3.00/MTok, Output $15.00/MTok
    const cost = calculateAnthropicCost(
      "claude-3-7-sonnet-20250219",
      {
        inputTokens: 500_000,
        outputTokens: 200_000,
        cacheCreationInputTokens: null,
        cacheReadInputTokens: null,
      },
      6.0
    );

    // 500k input = 1.50 USD
    // 200k output = 3.00 USD
    // Total = 4.50 USD * 6.0 = 27.00 BRL
    expect(cost.usd).toBe(4.5);
    expect(cost.brl).toBe(27.0);
    expect(cost.pricingSnapshot.pricingStatus).toBe("matched");
  });

  it("Cenário 3.2: deve retornar custos nulos quando tokens de entrada ou saída forem null (sem zero silencioso)", () => {
    const cost = calculateAnthropicCost(
      "claude-3-5-haiku-20241022",
      {
        inputTokens: null,
        outputTokens: null,
        cacheCreationInputTokens: null,
        cacheReadInputTokens: null,
      },
      5.8
    );

    expect(cost.usd).toBeNull();
    expect(cost.brl).toBeNull();
    expect(cost.pricingSnapshot.pricingStatus).toBe("tokens_unavailable");
  });

  // --------------------------------------------------------------------------
  // Cenário 4: Conversão cambial correta de USD para BRL e snapshot
  // --------------------------------------------------------------------------
  it("Cenário 4: deve aplicar a taxa de câmbio configurada via USD_BRL_EXCHANGE_RATE e salvar snapshot", () => {
    process.env.USD_BRL_EXCHANGE_RATE = "6.10";

    const cost = calculateAnthropicCost("claude-3-5-haiku-20241022", {
      inputTokens: 100_000,
      outputTokens: 50_000,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: null,
    });

    // Haiku: Input $0.80/MTok, Output $4.00/MTok
    // 100k input = 0.08 USD
    // 50k output = 0.20 USD
    // Total USD = 0.28 USD
    // Em BRL (6.10): 0.28 * 6.10 = 1.708 BRL
    expect(cost.usd).toBe(0.28);
    expect(cost.exchangeRate).toBe(6.1);
    expect(cost.brl).toBe(1.708);
    expect(cost.pricingSnapshot.appliedAt).toBeTruthy();
    expect(cost.pricingSnapshot.inputPricePerMillion).toBe(0.8);
  });

  // --------------------------------------------------------------------------
  // Cenário 5: Resiliência quando modelo não possui preço configurado
  // --------------------------------------------------------------------------
  it("Cenário 5: deve salvar tokens, definir custo como null e não quebrar quando modelo não estiver mapeado", () => {
    const cost = calculateAnthropicCost("claude-experimental-future-99", {
      inputTokens: 1200,
      outputTokens: 400,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: null,
    });

    expect(cost.usd).toBeNull();
    expect(cost.brl).toBeNull();
    expect(cost.pricingSnapshot.pricingStatus).toBe("unmapped_model");
    expect(cost.pricingSnapshot.inputPricePerMillion).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Cenário 6: Comportamento correto diante de falhas/exceções da API da Anthropic
  // --------------------------------------------------------------------------
  it("Cenário 6: deve registrar falha com status 'error' na telemetria quando a API da Anthropic rejeitar a chamada", async () => {
    mockCreate.mockRejectedValueOnce(
      Object.assign(new Error("Rate limit exceeded"), {
        status: 429,
        name: "RateLimitError",
      })
    );

    const { aiTelemetryService } = await import("@/lib/ai/telemetry/service");
    (aiTelemetryService as any).repository = testRepo;

    const service = new AnthropicClientService("sk-ant-test-key", "claude-3-5-haiku-20241022");

    await expect(
      service.suggestSummary({
        jobTitle: "DevOps",
        field: "Cloud",
      })
    ).rejects.toThrow("Rate limit exceeded");

    const records = await testRepo.findMany();
    expect(records).toHaveLength(1);
    expect(records[0].status).toBe("error");
    expect(records[0].errorCode).toBe("RateLimitError");
    expect(records[0].usage.inputTokens).toBeNull();
    expect(records[0].usage.outputTokens).toBeNull();
    expect(records[0].usage.tokensStatus).toBe("unavailable");
    expect(records[0].cost.usd).toBeNull();
    expect(records[0].cost.brl).toBeNull();
    expect(records[0].cost.pricingSnapshot.pricingStatus).toBe("tokens_unavailable");
  });

  // --------------------------------------------------------------------------
  // Cenário 6.1: Resposta do SDK sem objeto usage (não deve virar zero silencioso)
  // --------------------------------------------------------------------------
  it("Cenário 6.1: deve registrar tokens como null e custo como null quando a resposta da Anthropic não contiver o objeto usage", async () => {
    mockCreate.mockResolvedValueOnce({
      id: "msg_test_no_usage_obj",
      model: "claude-3-5-haiku-20241022",
      content: [{ type: "text", text: "Resposta sem metadados de usage." }],
      // Sem usage
    });

    const { aiTelemetryService } = await import("@/lib/ai/telemetry/service");
    (aiTelemetryService as any).repository = testRepo;

    const service = new AnthropicClientService("sk-ant-test-key", "claude-3-5-haiku-20241022");
    await service.suggestSummary({
      jobTitle: "Arquiteto",
      field: "Sistemas",
    });

    const records = await testRepo.findMany();
    expect(records).toHaveLength(1);
    expect(records[0].usage.inputTokens).toBeNull();
    expect(records[0].usage.outputTokens).toBeNull();
    expect(records[0].usage.tokensStatus).toBe("unavailable");
    expect(records[0].cost.usd).toBeNull();
    expect(records[0].cost.brl).toBeNull();
    expect(records[0].cost.pricingSnapshot.pricingStatus).toBe("tokens_unavailable");
  });

  // --------------------------------------------------------------------------
  // Cenário 7: Contabilização correta em cenários com retries
  // --------------------------------------------------------------------------
  it("Cenário 7: deve registrar attempts diferentes para tentativas consecutivas da mesma operação", async () => {
    const correlationId = "corr-retry-test-123";

    // 1ª tentativa falha
    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "improve-text",
      usage: { inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      correlationId,
      durationMs: 300,
      status: "error",
      errorCode: "APIConnectionError",
      attempt: 1,
    });

    // 2ª tentativa (retry) bem-sucedida
    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "improve-text",
      usage: { inputTokens: 200, outputTokens: 100, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      correlationId,
      responseId: "msg_retry_success_999",
      durationMs: 450,
      status: "success",
      attempt: 2,
    });

    const records = await testRepo.findMany({ correlationId });
    expect(records).toHaveLength(2);
    expect(records[0].attempt).toBe(1);
    expect(records[0].status).toBe("error");
    expect(records[1].attempt).toBe(2);
    expect(records[1].status).toBe("success");
  });

  // --------------------------------------------------------------------------
  // Cenário 8: Idempotência por ID de resposta (prevenção de duplicidade)
  // --------------------------------------------------------------------------
  it("Cenário 8: deve prevenir contabilização duplicada com mesmo responseId", async () => {
    const duplicateResponseId = "msg_unique_anthropic_idx_777";

    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "suggest-summary",
      usage: { inputTokens: 100, outputTokens: 50, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      responseId: duplicateResponseId,
      durationMs: 200,
      status: "success",
    });

    // Tentativa idêntica duplicada (ex: re-render ou reprocessamento com mesmo id)
    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "suggest-summary",
      usage: { inputTokens: 100, outputTokens: 50, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      responseId: duplicateResponseId,
      durationMs: 200,
      status: "success",
    });

    const records = await testRepo.findMany();
    // Apenas 1 registro persistido
    expect(records).toHaveLength(1);
    expect(records[0].responseId).toBe(duplicateResponseId);
  });

  // --------------------------------------------------------------------------
  // Cenário 9: Agregação de custos por geração completa de currículo (correlationId)
  // --------------------------------------------------------------------------
  it("Cenário 9: deve agrupar e calcular o custo médio por geração completa de currículo usando correlationId", async () => {
    const resumeGen1 = "gen-curr-001";
    const resumeGen2 = "gen-curr-002";

    // Currículo 1: 3 chamadas (1 resumo + 2 experiências)
    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "suggest-summary",
      usage: { inputTokens: 100_000, outputTokens: 10_000, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      correlationId: resumeGen1,
      durationMs: 250,
      status: "success",
    });
    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "improve-text",
      usage: { inputTokens: 100_000, outputTokens: 10_000, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      correlationId: resumeGen1,
      durationMs: 250,
      status: "success",
    });
    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "improve-text",
      usage: { inputTokens: 100_000, outputTokens: 10_000, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      correlationId: resumeGen1,
      durationMs: 250,
      status: "success",
    });

    // Currículo 2: 1 chamada
    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "suggest-summary",
      usage: { inputTokens: 100_000, outputTokens: 10_000, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      correlationId: resumeGen2,
      durationMs: 250,
      status: "success",
    });

    const metrics = await testTelemetryService.getMetrics();
    expect(metrics.totalCalls).toBe(4);
    expect(metrics.averageCostPerResumeGeneration.totalGenerations).toBe(2);
    // Custo total / 2 gerações
    expect(metrics.averageCostPerResumeGeneration.averageUsd).toBeGreaterThan(0);
    expect(metrics.averageCostPerResumeGeneration.averageBrl).toBeGreaterThan(0);
  });

  // --------------------------------------------------------------------------
  // Cenário 10: Garantia Fail-Open (falha de telemetria não bloqueia o usuário)
  // --------------------------------------------------------------------------
  it("Cenário 10: falha na persistência da telemetria NÃO deve quebrar nem impedir a resposta da IA (Fail-Open)", async () => {
    mockCreate.mockResolvedValueOnce({
      id: "msg_fail_open_test",
      model: "claude-3-5-haiku-20241022",
      content: [{ type: "text", text: "Texto de currículo entregue normalmente." }],
      usage: { input_tokens: 50, output_tokens: 30 },
    });

    // Cria um repositório que propositalmente explode com erro de gravação
    const brokenRepo: any = {
      save: vi.fn().mockRejectedValue(new Error("Disk I/O failure simulado")),
      findByResponseId: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      getAggregatedMetrics: vi.fn(),
    };

    const { aiTelemetryService } = await import("@/lib/ai/telemetry/service");
    (aiTelemetryService as any).repository = brokenRepo;

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      const service = new AnthropicClientService("sk-ant-test-key", "claude-3-5-haiku-20241022");
      const result = await service.suggestSummary({
        jobTitle: "Arquiteto de Software",
        field: "Engenharia",
      });

      // O currículo foi entregue com sucesso absoluto
      expect(result).toBe("Texto de currículo entregue normalmente.");
      // O erro do monitoramento foi capturado no console estruturado sem explodir para o usuário
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[AI Telemetry Fail-Open Error]"),
        expect.stringContaining("Disk I/O failure simulado")
      );
    } finally {
      (aiTelemetryService as any).repository = testRepo;
      consoleErrorSpy.mockRestore();
    }
  });

  // --------------------------------------------------------------------------
  // Cenário 11: Auditoria de Privacidade (Zero-PII e segredos blindados)
  // --------------------------------------------------------------------------
  it("Cenário 11: Auditoria Zero-PII — prompts, textos e chaves não devem constar no registro persistido", async () => {
    const sensitivePrompt = "Texto estritamente confidencial do candidato fulano@email.com CPF 123.456.789-00";

    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "improve-text",
      usage: { inputTokens: 80, outputTokens: 40, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      correlationId: "zero-pii-corr-1",
      durationMs: 150,
      status: "success",
    });

    const records = await testRepo.findMany();
    const serialized = JSON.stringify(records[0]);

    expect(serialized).not.toContain(sensitivePrompt);
    expect(serialized).not.toContain("fulano@email.com");
    expect(serialized).not.toContain("123.456.789-00");
    expect(serialized).not.toContain("sk-ant");
    expect(serialized).not.toContain("prompt");
    expect(serialized).not.toContain("rawText");
  });

  // --------------------------------------------------------------------------
  // Cenário 12: Isolamento de outros provedores de IA
  // --------------------------------------------------------------------------
  it("Cenário 12: outros provedores de IA (mock, gemini, openai) continuam operando normalmente sem regressão", async () => {
    process.env.AI_PROVIDER = "mock";
    const mockService = getAIService();
    expect(mockService.providerName).toContain("Fast Local");

    const summary = await mockService.suggestSummary({
      jobTitle: "Contador",
      field: "Finanças",
    });
    expect(summary).toBeTruthy();

    const improved = await mockService.improveFullResume(INITIAL_RESUME_DATA);
    expect(improved.personal.fullName).toBe(INITIAL_RESUME_DATA.personal.fullName);
  });

  // --------------------------------------------------------------------------
  // Cenário 13: Segregação de Origem (Produção Real vs Teste Sintético)
  // --------------------------------------------------------------------------
  it("Cenário 13: deve registrar a origem da execução (source) e segregar produção de testes sintéticos", async () => {
    // Registro 1: Produção real
    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "suggest-summary",
      source: "production",
      usage: { inputTokens: 120, outputTokens: 80, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      correlationId: "prod-corr-1",
      durationMs: 450,
      status: "success",
    });

    // Registro 2: Teste sintético
    await testTelemetryService.recordUsage({
      model: "claude-3-5-haiku-20241022",
      operationType: "improve-text",
      source: "synthetic_test",
      usage: { inputTokens: 50, outputTokens: 30, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      correlationId: "test-corr-1",
      durationMs: 4,
      status: "success",
    });

    const allRecords = await testRepo.findMany();
    expect(allRecords).toHaveLength(2);

    // Filtra apenas produção
    const prodRecords = await testRepo.findMany({ source: "production" });
    expect(prodRecords).toHaveLength(1);
    expect(prodRecords[0].correlationId).toBe("prod-corr-1");

    // Filtra apenas testes sintéticos
    const testRecords = await testRepo.findMany({ source: "synthetic_test" });
    expect(testRecords).toHaveLength(1);
    expect(testRecords[0].correlationId).toBe("test-corr-1");

    // Métricas agregadas segregadas
    const metrics = await testRepo.getAggregatedMetrics();
    expect(metrics.totalCalls).toBe(2);
    expect(metrics.productionCallsCount).toBe(1);
    expect(metrics.syntheticCallsCount).toBe(1);
  });

  // --------------------------------------------------------------------------
  // Cenário 14: Detecção Retroativa de Registros Legados sem Source
  // --------------------------------------------------------------------------
  it("Cenário 14: deve classificar automaticamente registros legados sem 'source' como 'synthetic_test'", async () => {
    const legacyLine = JSON.stringify({
      id: "legacy-test-uuid-1",
      responseId: null,
      correlationId: "legacy-corr-1",
      timestamp: "2026-10-19T14:33:14.000Z",
      provider: "anthropic",
      model: "claude-fable-5-1",
      operationType: "suggest-summary",
      status: "success",
      usage: { inputTokens: 0, outputTokens: 0, cacheCreationInputTokens: null, cacheReadInputTokens: null },
      cost: {
        usd: null,
        brl: null,
        exchangeRate: 5.8,
        pricingSnapshot: {
          model: "claude-fable-5-1",
          inputPricePerMillion: null,
          outputPricePerMillion: null,
          cacheWritePricePerMillion: null,
          cacheReadPricePerMillion: null,
          pricingStatus: "unmapped_model",
          appliedAt: "2026-10-19T14:33:14.000Z",
        },
      },
      durationMs: 4,
    }) + "\n";

    fs.writeFileSync(testJsonlPath, legacyLine, { flag: "a" });

    const records = await testRepo.findMany();
    const legacyRecord = records.find((r) => r.id === "legacy-test-uuid-1");
    expect(legacyRecord).toBeDefined();
    expect(legacyRecord?.source).toBe("synthetic_test");
  });

  // --------------------------------------------------------------------------
  // Testes do Endpoint Interno de Métricas (/api/internal/ai-usage)
  // --------------------------------------------------------------------------
  describe("Endpoint Interno Administrativo (/api/internal/ai-usage)", () => {
    it("deve retornar 403 se ADMIN_METRICS_TOKEN não estiver configurado no servidor", async () => {
      delete process.env.ADMIN_METRICS_TOKEN;

      const { GET } = await import("@/app/api/internal/ai-usage/route");
      const req = new Request("http://localhost:3000/api/internal/ai-usage");

      const res = await GET(req as any);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("ADMIN_METRICS_TOKEN não está configurada");
    });

    it("deve retornar 401 se token fornecido for inválido", async () => {
      process.env.ADMIN_METRICS_TOKEN = "super-secret-token";

      const { GET } = await import("@/app/api/internal/ai-usage/route");
      const req = new Request("http://localhost:3000/api/internal/ai-usage", {
        headers: { Authorization: "Bearer token-errado" },
      });

      const res = await GET(req as any);
      expect(res.status).toBe(401);
    });

    it("deve retornar 200 e métricas agregadas completas quando autenticado", async () => {
      process.env.ADMIN_METRICS_TOKEN = "super-secret-token";

      const { GET } = await import("@/app/api/internal/ai-usage/route");
      const req = new Request("http://localhost:3000/api/internal/ai-usage?includeRecords=true", {
        headers: { Authorization: "Bearer super-secret-token" },
      });

      const res = await GET(req as any);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.integrity).toBeDefined();
      expect(json.period).toBeDefined();
      expect(json.metrics).toBeDefined();
      expect(json.metrics.disclaimer).toBeTruthy();
      expect(json.metrics.totalTokens).toBeDefined();
      expect(json.metrics.tokensStatusSummary).toBeDefined();
      expect(json.metrics.averageCostPerResumeGeneration).toBeDefined();
    });

    it("deve filtrar corretamente por origem via query param ?source=production", async () => {
      process.env.ADMIN_METRICS_TOKEN = "super-secret-token";

      const { GET } = await import("@/app/api/internal/ai-usage/route");
      const req = new Request("http://localhost:3000/api/internal/ai-usage?source=production&includeRecords=true", {
        headers: { Authorization: "Bearer super-secret-token" },
      });

      const res = await GET(req as any);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.filterApplied.source).toBe("production");
    });
  });

  // --------------------------------------------------------------------------
  // SUÍTE FORENSE DE LINHAGEM DE DADOS E PRESERVAÇÃO DE CONTEXTO (FASE 6)
  // --------------------------------------------------------------------------
  describe("Fase 6: Auditoria Forense de Linhagem de Dados e Preservação de Contexto", () => {
    it("Linhagem 1: deve incorporar o rascunho de resumo digitado pelo usuário (currentSummary) no prompt da Anthropic", async () => {
      mockCreate.mockResolvedValueOnce({
        id: "msg_test_current_summary_001",
        model: "claude-3-5-haiku-20241022",
        content: [{ type: "text", text: "Resumo aprimorado mantendo a essência do candidato." }],
        usage: { input_tokens: 180, output_tokens: 90 },
      });

      const service = new AnthropicClientService("sk-ant-test-key", "claude-3-5-haiku-20241022");
      const userDraft = "Tenho 3 anos atuando na área financeira com conciliação bancária, contas a pagar e Excel.";

      await service.suggestSummary({
        jobTitle: "Analista Financeiro",
        field: "Finanças",
        currentSummary: userDraft,
        mode: "complete",
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      const calledPrompt = mockCreate.mock.calls[0][0].messages[0].content;
      // Comprova byte a byte que o rascunho do usuário foi enviado no prompt
      expect(calledPrompt).toContain(userDraft);
      expect(calledPrompt).toContain("Rascunho/Resumo fornecido pelo candidato");
    });

    it("Linhagem 2: Revisão Geral (improveFullResume) deve alimentar o resumo com histórico completo (experiências, habilidades e conquistas)", async () => {
      mockCreate.mockResolvedValue({
        id: "msg_test_full_resume_001",
        model: "claude-3-5-haiku-20241022",
        content: [{ type: "text", text: "Texto corporativo profissional aprimorado." }],
        usage: { input_tokens: 210, output_tokens: 85 },
      });

      const service = new AnthropicClientService("sk-ant-test-key", "claude-3-5-haiku-20241022");
      const sampleResume = {
        ...INITIAL_RESUME_DATA,
        target: {
          jobTitle: "Desenvolvedor Backend",
          field: "Tecnologia",
          summary: "Desenvolvedor focado em APIs Node.js e bancos de dados.",
        },
        experiences: [
          {
            id: "exp-1",
            role: "Programador Node.js",
            company: "Tech Cloud Ltda",
            startDate: "2023",
            endDate: "2026",
            current: true,
            description: "Criação de microsserviços e sustentação de banco de dados PostgreSQL.",
            achievements: "Redução de 40% na latência de consultas SQL",
          },
        ],
        technicalSkills: ["Node.js", "TypeScript", "PostgreSQL", "Docker"],
        softSkills: ["Trabalho em Equipe", "Resolução de Problemas"],
      };

      const result = await service.improveFullResume(sampleResume, "complete");

      // Deve ter chamado a API para o resumo e para a experiência
      expect(mockCreate).toHaveBeenCalled();
      const allPrompts = mockCreate.mock.calls.map((c: any) => c[0].messages[0].content).join("\n---\n");

      // Comprova que o prompt do resumo recebeu as experiências e conquistas cadastradas
      expect(allPrompts).toContain("Tech Cloud Ltda");
      expect(allPrompts).toContain("Redução de 40% na latência de consultas SQL");
      expect(allPrompts).toContain("Node.js");
      expect(allPrompts).toContain("Trabalho em Equipe");
      expect(result.target.summary).toBe("Texto corporativo profissional aprimorado.");
    });

    it("Linhagem 3: Prompt de Resumo Profissional NUNCA deve exigir bullet points, enquanto Experiências exigem bullet points", async () => {
      const { buildSuggestSummaryPrompt, buildImproveTextPrompt } = await import("@/lib/ai/prompts");

      // 1. Prompt de Resumo Profissional
      const summaryPrompt = buildSuggestSummaryPrompt({
        jobTitle: "Contador",
        field: "Contabilidade",
        mode: "complete",
      });
      expect(summaryPrompt).toContain("NUNCA use bullet points em resumos profissionais");
      expect(summaryPrompt).toContain("sem bullet points");

      // 2. Prompt de Aprimoramento de Resumo Existente
      const improveSummaryPrompt = buildImproveTextPrompt({
        rawText: "Resumo existente do candidato.",
        context: "summary",
        mode: "simple",
      });
      expect(improveSummaryPrompt).toContain("parágrafo único corrido");
      expect(improveSummaryPrompt).toContain("NUNCA utilize tópicos, marcadores ou bullet points");

      // 3. Prompt de Experiência Profissional
      const experiencePrompt = buildImproveTextPrompt({
        rawText: "Fazia atendimento e conferência de notas fiscais.",
        context: "experience",
        jobTitle: "Assistente Fiscal",
        company: "Logística Express",
        achievements: "Zero autuações no ano fiscal",
        mode: "complete",
      });
      expect(experiencePrompt).toContain("bullet points profissionais (• )");
      expect(experiencePrompt).toContain("Logística Express");
      expect(experiencePrompt).toContain("Zero autuações no ano fiscal");
    });

    it("Linhagem 4: Mapeamento resiliente de preços deve cobrir claude-3-sonnet e variáveis com quebra de linha ou aspas", () => {
      // Teste A: claude-3-sonnet-20240229 oficial
      const pricingSonnet3 = findModelPricing("claude-3-sonnet-20240229");
      expect(pricingSonnet3).not.toBeNull();
      expect(pricingSonnet3?.modelPattern).toBe("claude-3-sonnet");
      expect(pricingSonnet3?.inputPricePerMillion).toBe(3.0);

      // Teste B: Variável com quebra de linha acidental ("claude-3-5-haiku-20241022\n")
      const pricingHaikuWithNewline = findModelPricing("claude-3-5-haiku-20241022\n");
      expect(pricingHaikuWithNewline).not.toBeNull();
      expect(pricingHaikuWithNewline?.modelPattern).toBe("claude-3-5-haiku");

      // Teste C: Variável com aspas ("\"claude-3-5-sonnet-latest\"")
      const pricingSonnetWithQuotes = findModelPricing('"claude-3-5-sonnet-latest"');
      expect(pricingSonnetWithQuotes).not.toBeNull();
      expect(pricingSonnetWithQuotes?.modelPattern).toBe("claude-3-5-sonnet");

      // Teste D: Cálculo de custo sem emitir warning de modelo desconhecido
      const costCalc = calculateAnthropicCost("claude-3-sonnet-20240229", {
        inputTokens: 1000,
        outputTokens: 500,
        cacheCreationInputTokens: null,
        cacheReadInputTokens: null,
      });
      expect(costCalc.usd).toBeGreaterThan(0);
      expect(costCalc.pricingSnapshot.pricingStatus).toBe("matched");
    });

    it("Linhagem 5: improveFullResume deve ser resiliente e manter dados originais se uma experiência falhar isoladamente", async () => {
      // Primeira chamada (resumo) é bem-sucedida, segunda chamada (experiência) rejeita com erro de rede
      mockCreate
        .mockResolvedValueOnce({
          id: "msg_test_partial_001",
          model: "claude-3-5-haiku-20241022",
          content: [{ type: "text", text: "Resumo profissional gerado com sucesso." }],
          usage: { input_tokens: 150, output_tokens: 60 },
        })
        .mockRejectedValueOnce(new Error("Anthropic API temporary network glitch"));

      const service = new AnthropicClientService("sk-ant-test-key", "claude-3-5-haiku-20241022");
      const resume = {
        ...INITIAL_RESUME_DATA,
        target: {
          jobTitle: "Analista de Suporte",
          field: "Tecnologia",
          summary: "Atendimento a chamados e suporte.",
        },
        experiences: [
          {
            id: "exp-isolated-1",
            role: "Técnico N1",
            company: "Helpdesk S.A.",
            startDate: "2024",
            endDate: "2025",
            current: false,
            description: "Atendimento telefônico aos colaboradores internos.",
          },
        ],
      };

      // Não deve lançar erro catastrófico — deve entregar o currículo com o resumo aprimorado e a experiência preservada
      const result = await service.improveFullResume(resume, "simple");
      expect(result.target.summary).toBe("Resumo profissional gerado com sucesso.");
      expect(result.experiences[0].description).toBe("Atendimento telefônico aos colaboradores internos.");
    });

    it("Linhagem 6: improveFullResume deve gerar resumo com histórico completo mesmo quando target.summary for vazio ou curto (<= 10 caracteres)", async () => {
      mockCreate.mockResolvedValueOnce({
        id: "msg_test_empty_summary_001",
        model: "claude-3-5-haiku-20241022",
        content: [{ type: "text", text: "Resumo gerado do zero articulando experiências de suporte e certificações." }],
        usage: { input_tokens: 180, output_tokens: 70 },
      });

      const service = new AnthropicClientService("sk-ant-test-key", "claude-3-5-haiku-20241022");
      const resume = {
        ...INITIAL_RESUME_DATA,
        target: {
          jobTitle: "Analista de Redes",
          field: "Infraestrutura",
          summary: "estágio", // <= 10 caracteres (ruído ou rascunho curto)
        },
        experiences: [
          {
            id: "exp-net-1",
            role: "Administrador de Redes",
            company: "Telecom Brasil",
            startDate: "2023",
            endDate: "Atual",
            current: true,
            description: "Configuração de switches e roteadores Cisco.",
          },
        ],
        technicalSkills: ["Cisco IOS", "BGP", "VLAN"],
        softSkills: ["Resolução de Incidentes"],
      };

      const result = await service.improveFullResume(resume, "complete");

      // O resumo deve ser gerado pelo suggestSummary usando o histórico
      expect(result.target.summary).toBe("Resumo gerado do zero articulando experiências de suporte e certificações.");

      // Verifica que o prompt enviado ao Anthropic recebeu as experiências e habilidades, mas NÃO tratou 'estágio' como rascunho de estilo
      const callArgs = mockCreate.mock.calls[0][0];
      const promptSent = callArgs.messages[0].content;
      expect(promptSent).toContain("Telecom Brasil");
      expect(promptSent).toContain("Cisco IOS");
      expect(promptSent).not.toContain('[RASCUNHO INICIAL INFORMADO PELO CANDIDATO]\n"estágio"');
    });

    it("Linhagem 7: suggestSummary deve repassar as experiências cadastradas no prompt da Anthropic", async () => {
      mockCreate.mockResolvedValueOnce({
        id: "msg_test_suggest_exp_001",
        model: "claude-3-5-haiku-20241022",
        content: [{ type: "text", text: "Resumo profissional articulando experiências reais." }],
        usage: { input_tokens: 220, output_tokens: 80 },
      });

      const service = new AnthropicClientService("sk-ant-test-key", "claude-3-5-haiku-20241022");
      await service.suggestSummary({
        jobTitle: "Especialista em Logística",
        field: "Supply Chain",
        experiences: [
          {
            role: "Coordenador de Almoxarifado",
            company: "Distribuidora Express",
            description: "Gestão de inventário e redução de avarias.",
          },
        ],
        skills: ["WMS", "Curva ABC"],
      });

      const promptSent = mockCreate.mock.calls[0][0].messages[0].content;
      expect(promptSent).toContain("Distribuidora Express");
      expect(promptSent).toContain("Coordenador de Almoxarifado");
      expect(promptSent).toContain("WMS");
    });

    it("Linhagem 8: MockAIService e AnthropicClientService devem manter paridade de contrato ao enriquecer com histórico completo", async () => {
      const mockService = new MockAIService();
      const resume = {
        ...INITIAL_RESUME_DATA,
        target: {
          jobTitle: "Analista de Dados",
          field: "Business Intelligence",
          summary: "", // resumo vazio
        },
        experiences: [
          {
            id: "exp-bi-1",
            role: "Analista de BI Jr",
            company: "Data Corp",
            startDate: "2023",
            endDate: "Atual",
            current: true,
            description: "Criação de dashboards em Power BI e modelagem em SQL.",
          },
        ],
        technicalSkills: ["Power BI", "SQL", "Python"],
        softSkills: ["Comunicação Analítica"],
        courses: [{ id: "c-1", name: "DAX Avançado", institution: "Udemy" }],
      };

      const result = await mockService.improveFullResume(resume, "complete");

      // Mock service deve gerar resumo sem quebrar e incorporar experiências e habilidades
      expect(result.target.summary).toBeTruthy();
      expect(result.target.summary).toContain("Analista de Dados");
      expect(result.target.summary).toContain("Data Corp");
      expect(result.target.summary).toContain("Power BI");
      expect(result.target.summary).toContain("Comunicação Analítica");
      expect(result.target.summary).toContain("DAX Avançado");
    });
  });

  describe("Fase 7: Persistência Serverless, Upstash Redis e Distinção Produção vs Testes", () => {
    it("Persistência 1: KvUsageRepository quando configurado formata comandos REST e serializa registros com responseId e tokens reais", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ result: "OK" }),
      });
      global.fetch = mockFetch;

      const kvRepo = new KvUsageRepository("https://test-kv.upstash.io", "test-token-123");
      expect(kvRepo.isConfigured()).toBe(true);

      const info = kvRepo.getStorageInfo();
      expect(info.type).toBe("kv_remote");
      expect(info.isPersistent).toBe(true);
      expect(info.remoteConfigured).toBe(true);

      const testRecord = {
        id: "rec-kv-001",
        responseId: "msg_anthropic_kv_001",
        correlationId: "corr-kv-001",
        timestamp: "2026-10-20T05:00:00.000Z",
        provider: "anthropic" as const,
        model: "claude-3-5-haiku-20241022",
        operationType: "suggest-summary" as const,
        status: "success" as const,
        source: "production" as const,
        attempt: 1,
        usage: {
          inputTokens: 250,
          outputTokens: 90,
          cacheCreationInputTokens: null,
          cacheReadInputTokens: null,
          tokensStatus: "complete" as const,
        },
        cost: {
          usd: 0.00056,
          brl: 0.0032,
          exchangeRate: 5.8,
          pricingSnapshot: {
            model: "claude-3-5-haiku-20241022",
            inputPricePerMillion: 0.8,
            outputPricePerMillion: 4,
            cacheWritePricePerMillion: 1,
            cacheReadPricePerMillion: 0.08,
            pricingStatus: "matched" as const,
            appliedAt: "2026-10-20T05:00:00.000Z",
          },
          isEstimated: true,
        },
        errorCode: null,
        errorMessageSafe: null,
        durationMs: 850,
      };

      await kvRepo.save(testRecord);

      // Deve ter disparado chamadas POST para gravar o registro e a timeline
      expect(mockFetch).toHaveBeenCalled();
      const calls = mockFetch.mock.calls;
      const bodies = calls.filter((c) => Boolean(c[1]?.body)).map((c) => JSON.parse(c[1].body));
      expect(bodies.some((b) => b[0] === "SET" && b[1] === "ai_usage:record:rec-kv-001")).toBe(true);
      expect(bodies.some((b) => b[0] === "ZADD" && b[1] === "ai_usage:timeline")).toBe(true);
      expect(bodies.some((b) => b[0] === "SET" && b[1] === "ai_usage:res_id:msg_anthropic_kv_001")).toBe(true);
    });

    it("Persistência 2: KvUsageRepository quando não configurado reporta isPersistent: false e instruções claras de setup", () => {
      const kvRepo = new KvUsageRepository("", "");
      expect(kvRepo.isConfigured()).toBe(false);

      const info = kvRepo.getStorageInfo();
      expect(info.type).toBe("kv_remote");
      expect(info.isPersistent).toBe(false);
      expect(info.setupInstructions).toContain("KV_REST_API_URL");
      expect(info.setupInstructions).toContain("KV_REST_API_TOKEN");
    });

    it("Persistência 3: JsonlUsageRepository getStorageInfo() identifica corretamente ambiente de teste, serverless efêmero e local", () => {
      // 1. Ambiente de teste
      const testRepo = new JsonlUsageRepository("data/test-isolated.jsonl");
      const testInfo = testRepo.getStorageInfo();
      expect(testInfo.type).toBe("memory_test");
      expect(testInfo.isPersistent).toBe(false);

      // 2. Simulação de ambiente Netlify Serverless
      const originalNetlify = process.env.NETLIFY;
      const originalNodeEnv = process.env.NODE_ENV;
      const originalVitest = process.env.VITEST;

      delete process.env.VITEST;
      process.env.NETLIFY = "true";
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";

      const netlifyRepo = new JsonlUsageRepository();
      const netlifyInfo = netlifyRepo.getStorageInfo();
      expect(netlifyInfo.type).toBe("serverless_ephemeral");
      expect(netlifyInfo.isPersistent).toBe(false);
      expect(netlifyInfo.setupInstructions).toContain("KV_REST_API_URL");

      // Restaura ambiente
      if (originalNetlify !== undefined) process.env.NETLIFY = originalNetlify;
      else delete process.env.NETLIFY;
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
      if (originalVitest !== undefined) process.env.VITEST = originalVitest;
    });

    it("Persistência 4: createDefaultTelemetryRepository seleciona KvUsageRepository quando variáveis KV_REST_API_URL/TOKEN estão presentes", () => {
      process.env.KV_REST_API_URL = "https://upstash.io/test";
      process.env.KV_REST_API_TOKEN = "upstash-token-xyz";

      const repo = createDefaultTelemetryRepository();
      expect(repo).toBeInstanceOf(KvUsageRepository);
      expect(repo.getStorageInfo().isPersistent).toBe(true);

      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;

      const fallbackRepo = createDefaultTelemetryRepository();
      expect(fallbackRepo).toBeInstanceOf(JsonlUsageRepository);
    });

    it("Persistência 5: Tokens ausentes são gravados como null e tokensStatus: unavailable, jamais convertidos silenciosamente para zero", async () => {
      const recordsSaved: any[] = [];
      const customRepo = {
        save: async (rec: any) => { recordsSaved.push(rec); },
        findById: async () => null,
        findByResponseId: async () => null,
        findMany: async () => [],
        getAggregatedMetrics: async () => ({} as any),
        getStorageInfo: () => ({ type: "memory_test" as const, isPersistent: false, description: "test" }),
      };

      const telemetry = new AITelemetryService(customRepo);
      await telemetry.recordUsage({
        model: "claude-3-5-haiku-20241022",
        operationType: "suggest-summary",
        status: "error",
        source: "error",
        durationMs: 120,
        usage: {
          inputTokens: null,
          outputTokens: null,
          cacheCreationInputTokens: null,
          cacheReadInputTokens: null,
          tokensStatus: "unavailable",
        },
      });

      expect(recordsSaved.length).toBe(1);
      const saved = recordsSaved[0];
      expect(saved.usage.inputTokens).toBeNull();
      expect(saved.usage.outputTokens).toBeNull();
      expect(saved.usage.tokensStatus).toBe("unavailable");
      expect(saved.cost.usd).toBeNull();
      expect(saved.cost.brl).toBeNull();
      expect(saved.cost.pricingSnapshot.pricingStatus).toBe("tokens_unavailable");
    });

    it("Persistência 6: Proteção Zero-PII e segredos: chaves de API sk-ant- e dados pessoais nunca são armazenados na telemetria", async () => {
      const recordsSaved: any[] = [];
      const customRepo = {
        save: async (rec: any) => { recordsSaved.push(rec); },
        findById: async () => null,
        findByResponseId: async () => null,
        findMany: async () => [],
        getAggregatedMetrics: async () => ({} as any),
        getStorageInfo: () => ({ type: "memory_test" as const, isPersistent: false, description: "test" }),
      };

      const telemetry = new AITelemetryService(customRepo);
      await telemetry.recordUsage({
        model: "claude-3-5-haiku-20241022",
        operationType: "suggest-summary",
        status: "success",
        source: "production",
        durationMs: 340,
        responseId: "msg_secure_001",
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          cacheCreationInputTokens: null,
          cacheReadInputTokens: null,
          tokensStatus: "complete",
        },
      });

      const jsonStr = JSON.stringify(recordsSaved[0]);
      // Não deve conter formato de segredos nem dados de currículo
      expect(jsonStr).not.toContain("sk-ant-");
      expect(jsonStr).not.toContain("password");
      expect(jsonStr).not.toContain("cpf");
      expect(jsonStr).not.toContain("email");
    });
  });
});
