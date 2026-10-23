import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAIService } from "@/lib/ai/factory";
import { AnthropicClientService } from "@/lib/ai/anthropic-client-service";
import { MockAIService } from "@/lib/ai/mock-service";
import {
  AIConfigurationError,
  handleAIRouteError,
} from "@/lib/ai/errors";
import { INITIAL_RESUME_DATA } from "@/config/layouts";

// Mock do módulo @anthropic-ai/sdk usando vi.hoisted para execução 100% offline e sem consumo de créditos
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
    constructor(public options?: any) {}
  }

  return {
    default: MockAnthropic,
    Anthropic: MockAnthropic,
  };
});

describe("Integração Anthropic Claude (Serviço, Factory e Erros)", () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };

    const { resetRateLimitStore } = await import("@/lib/security/rate-limit");
    resetRateLimitStore();

    // Isola o repositório de telemetria para garantir que nenhum teste suje o arquivo real
    const { aiTelemetryService } = await import("@/lib/ai/telemetry/service");
    (aiTelemetryService as any).repository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByResponseId: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      getAggregatedMetrics: vi.fn().mockResolvedValue({}),
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("1. Factory e Seleção de Provedores", () => {
    it("deve lançar AIConfigurationError explícito quando ANTHROPIC_API_KEY estiver ausente (sem fallback silencioso)", () => {
      delete process.env.AI_PROVIDER;
      delete process.env.ANTHROPIC_API_KEY;

      expect(() => getAIService()).toThrowError(AIConfigurationError);
      expect(() => getAIService()).toThrowError(/ANTHROPIC_API_KEY ausente/);
    });

    it("deve lançar AIConfigurationError explícito quando AI_PROVIDER=anthropic e a chave estiver ausente", () => {
      process.env.AI_PROVIDER = "anthropic";
      delete process.env.ANTHROPIC_API_KEY;

      expect(() => getAIService()).toThrowError(AIConfigurationError);
      expect(() => getAIService()).toThrowError(/ANTHROPIC_API_KEY ausente/);
    });

    it("deve retornar AnthropicClientService quando AI_PROVIDER=anthropic e ANTHROPIC_API_KEY estiver configurada", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key-12345";
      process.env.ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";

      const service = getAIService();
      expect(service).toBeInstanceOf(AnthropicClientService);
      expect(service.providerName).toBe("Anthropic Claude (Oficial)");
    });

    it("deve assumir anthropic automaticamente se ANTHROPIC_API_KEY estiver presente mesmo sem AI_PROVIDER", () => {
      delete process.env.AI_PROVIDER;
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key-auto";

      const service = getAIService();
      expect(service).toBeInstanceOf(AnthropicClientService);
    });

    it("só deve usar MockAIService se AI_PROVIDER=mock for declarado explicitamente", () => {
      process.env.AI_PROVIDER = "mock";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key-auto";

      const service = getAIService();
      expect(service).toBeInstanceOf(MockAIService);
    });

    it("deve repassar integralmente o identificador customizado de modelo (ex: claude-custom-enterprise-test) sem restringir a uma lista fixa", async () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-custom-model";
      process.env.ANTHROPIC_MODEL = "claude-custom-enterprise-test";

      mockCreate.mockResolvedValueOnce({
        content: [{ type: "text", text: "Resposta gerada pelo modelo customizado." }],
      });

      const service = getAIService();
      expect(service).toBeInstanceOf(AnthropicClientService);

      await service.suggestSummary({
        jobTitle: "Confeiteiro",
        field: "Gastronomia",
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-custom-enterprise-test",
        })
      );
    });

    it("deve lançar AIConfigurationError se o construtor for invocado com chave vazia", () => {
      expect(() => new AnthropicClientService("", "claude-3-5-haiku-20241022")).toThrowError(
        AIConfigurationError
      );
    });
  });

  describe("2. Execução dos Três Métodos do Serviço Anthropic (via Mocks)", () => {
    it("suggestSummary sem experiências deve orientar o modelo a focar no cargo e área sem inventar empresas", async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: "Profissional dedicado ao setor de confeitaria com foco em técnicas artesanais e higiene.",
          },
        ],
      });

      const service = new AnthropicClientService("sk-ant-valid-key", "claude-3-5-haiku-20241022");
      const summary = await service.suggestSummary({
        jobTitle: "Confeiteiro",
        field: "Cozinha",
        experiences: [],
      });

      expect(summary).toBe(
        "Profissional dedicado ao setor de confeitaria com foco em técnicas artesanais e higiene."
      );
      expect(mockCreate).toHaveBeenCalledTimes(1);
      const calledPrompt = mockCreate.mock.calls[0][0].messages[0].content;
      expect(calledPrompt).toContain("Nenhuma experiência anterior informada");
      expect(calledPrompt).toContain("Cargo Pretendido: Confeiteiro");
      expect(calledPrompt).toContain("Área de Atuação: Cozinha");
      expect(calledPrompt).not.toContain("TechServ");
    });
    it("suggestSummary deve invocar o modelo e retornar o resumo puro", async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: "Profissional qualificado em tecnologia com vivência em suporte técnico e infraestrutura.",
          },
        ],
      });

      const service = new AnthropicClientService("sk-ant-valid-key", "claude-3-5-haiku-20241022");
      const summary = await service.suggestSummary({
        jobTitle: "Analista de Suporte",
        field: "Tecnologia",
        skills: ["Redes", "Windows Server"],
      });

      expect(summary).toBe(
        "Profissional qualificado em tecnologia com vivência em suporte técnico e infraestrutura."
      );
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 500,
        })
      );
    });

    it("improveText deve invocar o modelo e retornar atividades aprimoradas", async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: "• Atendimento e suporte a usuários corporativos.\n• Manutenção preventiva de hardware.",
          },
        ],
      });

      const service = new AnthropicClientService("sk-ant-valid-key", "claude-3-5-haiku-20241022");
      const result = await service.improveText({
        rawText: "atendia usuarios e fazia manutencao",
        context: "experience",
      });

      expect(result).toContain("• Atendimento e suporte");
      expect(result).toContain("• Manutenção preventiva");
    });

    it("improveFullResume deve atualizar resumo e atividades preservando contatos e empresas", async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Conteúdo aprimorado via Claude." }],
      });

      const service = new AnthropicClientService("sk-ant-valid-key", "claude-3-5-haiku-20241022");
      const originalEmail = INITIAL_RESUME_DATA.personal.email;
      const originalCompany = INITIAL_RESUME_DATA.experiences[0].company;

      const improved = await service.improveFullResume(INITIAL_RESUME_DATA);

      expect(improved.personal.email).toBe(originalEmail);
      expect(improved.experiences[0].company).toBe(originalCompany);
      expect(improved.target.summary).toBe("Conteúdo aprimorado via Claude.");
    });
  });

  describe("3. Ausência de Fallback Silencioso e Propagação de Erros", () => {
    it("não deve engolir erros da Anthropic nem retornar textos simulados", async () => {
      mockCreate.mockRejectedValueOnce(
        Object.assign(new Error("Invalid API Key"), { status: 401, name: "AuthenticationError" })
      );

      const service = new AnthropicClientService("sk-ant-invalid-key");

      await expect(
        service.suggestSummary({
          jobTitle: "Analista de SOC",
          field: "Segurança",
        })
      ).rejects.toThrow();
    });

    it("deve lançar erro se a Anthropic retornar bloco de resposta sem texto", async () => {
      mockCreate.mockResolvedValueOnce({
        content: [],
      });

      const service = new AnthropicClientService("sk-ant-key");

      await expect(
        service.suggestSummary({
          jobTitle: "Desenvolvedor",
          field: "TI",
        })
      ).rejects.toThrow(/sem conteúdo de texto/);
    });
  });

  describe("4. Tratamento de Erros e Preservação de Contratos HTTP", () => {
    it("handleAIRouteError deve retornar 503 para AIConfigurationError sem expor detalhes internos", async () => {
      const response = handleAIRouteError(new AIConfigurationError("Chave ausente"));
      expect(response.status).toBe(503);

      const body = await response.json();
      expect(body.error).toContain("não foi configurado no servidor");
      expect(JSON.stringify(body)).not.toContain("Chave ausente");
    });

    it("handleAIRouteError deve retornar 401 para AuthenticationError sem expor chaves", async () => {
      const authError = Object.assign(new Error("API key expired"), {
        status: 401,
        name: "AuthenticationError",
      });
      const response = handleAIRouteError(authError);
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toContain("Falha de autenticação");
      expect(JSON.stringify(body)).not.toContain("API key expired");
    });

    it("handleAIRouteError deve retornar 429 para RateLimitError", async () => {
      const rateError = Object.assign(new Error("Rate limited"), {
        status: 429,
        name: "RateLimitError",
      });
      const response = handleAIRouteError(rateError);
      expect(response.status).toBe(429);

      const body = await response.json();
      expect(body.error).toContain("Limite de requisições excedido");
    });

    it("handleAIRouteError deve retornar 503 para falha de conexão com a Anthropic", async () => {
      const connError = Object.assign(new Error("Connection refused"), {
        name: "APIConnectionError",
      });
      const response = handleAIRouteError(connError);
      expect(response.status).toBe(503);

      const body = await response.json();
      expect(body.error).toContain("temporariamente indisponível");
    });
  });

  describe("5. Contratos das Rotas HTTP (/api/ai/*)", () => {
    it("/api/ai/suggest-summary deve retornar 200 e contrato correto quando em modo Mock", async () => {
      process.env.AI_PROVIDER = "mock";
      const { POST } = await import("@/app/api/ai/suggest-summary/route");
      const req = new Request("http://localhost:3000/api/ai/suggest-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: "Desenvolvedor",
          field: "Tecnologia",
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.summary).toBeTruthy();
      expect(json.provider).toBeTruthy();
    });

    it("/api/ai/suggest-summary deve retornar 503 imediato se AI_PROVIDER=anthropic e chave ausente (sem fallback silencioso)", async () => {
      process.env.AI_PROVIDER = "anthropic";
      delete process.env.ANTHROPIC_API_KEY;

      const { POST } = await import("@/app/api/ai/suggest-summary/route");
      const req = new Request("http://localhost:3000/api/ai/suggest-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: "Desenvolvedor",
          field: "Tecnologia",
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.error).toBeTruthy();
      expect(json.code).toBe("CONFIG_ERROR");
      expect(json.summary).toBeUndefined();
    });

    it("/api/ai/suggest-summary deve retornar 401 e código AUTH_ERROR (sem mascarar como 503) se a API da Anthropic rejeitar por chave inválida", async () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-key-invalid";

      mockCreate.mockRejectedValueOnce(
        Object.assign(new Error("invalid x-api-key"), {
          status: 401,
          name: "AuthenticationError",
        })
      );

      const { POST } = await import("@/app/api/ai/suggest-summary/route");
      const req = new Request("http://localhost:3000/api/ai/suggest-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: "Analista de Sistemas",
          field: "Tecnologia",
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(401);

      const json = await res.json();
      expect(json.code).toBe("AUTH_ERROR");
      expect(json.error).toContain("Falha de autenticação");
    });

    it("/api/ai/suggest-summary deve aceitar payload com histórico completo extenso (experiências, educação, cursos) sem erro 400", async () => {
      process.env.AI_PROVIDER = "mock";

      const { POST } = await import("@/app/api/ai/suggest-summary/route");
      const req = new Request("http://localhost:3000/api/ai/suggest-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: "Desenvolvedor Full Stack Sênior",
          field: "Engenharia de Software",
          careerStage: "experienced",
          careerContext: "Foco em arquitetura escalável e liderança técnica de times distribuídos.",
          currentSummary: "Profissional com mais de 8 anos de experiência em desenvolvimento de software de alta escala.",
          mode: "complete",
          experiences: [
            {
              role: "Tech Lead",
              company: "Empresa Alfa",
              description: "Liderança de time de engenharia focado em microserviços e alta disponibilidade.",
              achievements: "Redução de latência em 40% e migração para arquitetura cloud.",
            },
            {
              role: "Engenheiro de Software Sênior",
              company: "Empresa Beta",
              description: "Desenvolvimento de APIs em Node.js e interfaces modernas em Next.js.",
            },
          ],
          education: [
            {
              course: "Ciência da Computação",
              institution: "Universidade de São Paulo",
            },
          ],
          courses: [
            {
              name: "Arquitetura Cloud AWS",
              institution: "AWS Training",
            },
          ],
          skills: ["TypeScript", "React", "Node.js", "Docker", "PostgreSQL"],
          softSkills: ["Liderança", "Comunicação", "Resolução de Problemas"],
          certifications: ["AWS Certified Solutions Architect"],
        }),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.summary).toBeTruthy();
    });
  });

  describe("5. Regras Obrigatórias de Isolamento Anthropic e Zero Desvio para OpenRouter", () => {
    it("AI_PROVIDER=anthropic usa exclusivamente https://api.anthropic.com", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-official-123456";
      const service = getAIService() as AnthropicClientService;

      expect(service.providerName).toBe("Anthropic Claude (Oficial)");
      const diag = service.getAuthDiagnostics();
      expect(diag.targetUrl).toBe("https://api.anthropic.com/v1/messages");
      expect(diag.providerMode).toBe("Anthropic Claude (Oficial)");
    });

    it("A presença simultânea de ANTHROPIC_API_KEY e OPENROUTER_API_KEY não altera o provedor selecionado", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-official-123456";
      process.env.OPENROUTER_API_KEY = "sk-or-v1-abcdef1234567890abcdef";
      const service = getAIService() as AnthropicClientService;

      expect(service.providerName).toBe("Anthropic Claude (Oficial)");
      const diag = service.getAuthDiagnostics();
      expect(diag.targetUrl).toBe("https://api.anthropic.com/v1/messages");
      expect(diag.providerMode).toBe("Anthropic Claude (Oficial)");
      expect(diag.hasOpenRouterKeyEnv).toBe(true);
      expect(diag.hasAnthropicKeyEnv).toBe(true);
    });

    it("OPENAI_BASE_URL e ANTHROPIC_BASE_URL apontando para OpenRouter não desviam uma chamada Anthropic", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-official-123456";
      process.env.OPENAI_BASE_URL = "https://openrouter.ai/api/v1";
      process.env.ANTHROPIC_BASE_URL = "https://openrouter.ai/api/v1";
      const service = new AnthropicClientService();

      expect(service.providerName).toBe("Anthropic Claude (Oficial)");
      const diag = service.getAuthDiagnostics();
      expect(diag.targetUrl).toBe("https://api.anthropic.com/v1/messages");
    });

    it("A ausência de ANTHROPIC_API_KEY com OPENROUTER_API_KEY presente não provoca fallback para OpenRouter", () => {
      process.env.AI_PROVIDER = "anthropic";
      delete process.env.ANTHROPIC_API_KEY;
      process.env.OPENROUTER_API_KEY = "sk-or-v1-abcdef1234567890abcdef";

      expect(() => getAIService()).toThrowError(AIConfigurationError);
      expect(() => getAIService()).toThrowError(/ANTHROPIC_API_KEY ausente/);
    });

    it("Uma chave de OpenRouter não é enviada à Anthropic nem desvia a chamada silenciosamente", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-or-v1-fake-openrouter-key";

      expect(() => getAIService()).toThrowError(AIConfigurationError);
      expect(() => getAIService()).toThrowError(/incompatível com o provedor Anthropic oficial/);
      expect(() => new AnthropicClientService("sk-or-v1-fake-openrouter-key")).toThrowError(
        /incompatível com o provedor Anthropic oficial/
      );
    });

    it("AI_PROVIDER=openrouter continua funcionando de forma explícita", () => {
      process.env.AI_PROVIDER = "openrouter";
      process.env.OPENROUTER_API_KEY = "sk-or-v1-testkey1234567890abcdef";
      const service = getAIService() as AnthropicClientService;

      expect(service.providerName).toBe("OpenRouter (Claude Compatibility)");
      const diag = service.getAuthDiagnostics();
      expect(diag.targetUrl).toBe("https://openrouter.ai/api/v1/chat/completions");
      expect(diag.providerMode).toBe("OpenRouter (Claude Compatibility)");
    });

    it("Nenhum fallback silencioso para mock ou outro provedor ocorre em produção quando falta a chave", () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENROUTER_API_KEY;
      delete process.env.AI_PROVIDER;

      expect(() => getAIService()).toThrowError(AIConfigurationError);
      expect(() => getAIService()).toThrowError(/ANTHROPIC_API_KEY ausente/);
    });

    it("Os diagnósticos identificam corretamente o provedor efetivo sem revelar credenciais", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-usr-1-secretlongkey9876543210abcdef";
      const service = new AnthropicClientService();
      const diag = service.getAuthDiagnostics();

      expect(diag.providerMode).toBe("Anthropic Claude (Oficial)");
      expect(diag.targetUrl).toBe("https://api.anthropic.com/v1/messages");
      expect(diag.keyPrefix).toBe("sk-ant-usr");
      expect(diag.keySuffix).toBe("cdef");
      expect(diag.keyLength).toBe("sk-ant-usr-1-secretlongkey9876543210abcdef".length);
      // NUNCA expõe a chave completa
      expect(JSON.stringify(diag)).not.toContain("secretlongkey9876543210");
    });

    it("deve lançar AIConfigurationError se AI_PROVIDER=anthropic e forceOpenRouter=true entrarem em conflito", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-official-123456";
      process.env.OPENROUTER_API_KEY = "sk-or-v1-abcdef1234567890abcdef";

      expect(
        () => new AnthropicClientService("sk-ant-test-official-123456", undefined, "ANTHROPIC_API_KEY", true)
      ).toThrowError(AIConfigurationError);

      expect(
        () => new AnthropicClientService("sk-ant-test-official-123456", undefined, "ANTHROPIC_API_KEY", true)
      ).toThrowError(/Conflito de configuração de IA/);
    });

    it("deve lançar AIConfigurationError se AI_PROVIDER=openrouter e forceOpenRouter=false entrarem em conflito", () => {
      process.env.AI_PROVIDER = "openrouter";
      process.env.OPENROUTER_API_KEY = "sk-or-v1-testkey1234567890abcdef";

      expect(
        () => new AnthropicClientService("sk-or-v1-testkey1234567890abcdef", undefined, "OPENROUTER_API_KEY", false)
      ).toThrowError(AIConfigurationError);

      expect(
        () => new AnthropicClientService("sk-or-v1-testkey1234567890abcdef", undefined, "OPENROUTER_API_KEY", false)
      ).toThrowError(/Conflito de configuração de IA/);
    });

    it("quando AI_PROVIDER estiver ausente, forceOpenRouter booleano define o provedor com precisão", () => {
      delete process.env.AI_PROVIDER;
      process.env.OPENROUTER_API_KEY = "sk-or-v1-testkey1234567890abcdef";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test-official-123456";

      const orService = new AnthropicClientService(
        "sk-or-v1-testkey1234567890abcdef",
        undefined,
        "OPENROUTER_API_KEY",
        true
      );
      expect(orService.providerName).toBe("OpenRouter (Claude Compatibility)");

      const antService = new AnthropicClientService(
        "sk-ant-test-official-123456",
        undefined,
        "ANTHROPIC_API_KEY",
        false
      );
      expect(antService.providerName).toBe("Anthropic Claude (Oficial)");
    });
  });
});
