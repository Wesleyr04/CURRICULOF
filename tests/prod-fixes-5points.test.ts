import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sanitizeAiErrorMessage, handleAIRouteError } from "@/lib/ai/errors";
import { AnthropicClientService } from "@/lib/ai/anthropic-client-service";
import { getAIService } from "@/lib/ai/factory";

describe("Correções de Produção - 5 Problemas Reais de UX/Mobile/IA", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("1. Sanitização de Erros de IA e Proibição Absoluta de HTML", () => {
    it("deve converter dump HTML bruto do OpenRouter (404) para mensagem amigável em português", () => {
      const rawHtmlDump =
        '404 <!DOCTYPE html><html lang="en"><head><meta property="og:title" content="OpenRouter"/><title>404 Not Found</title></head><body><h1>Not Found</h1></body></html>';
      const sanitized = sanitizeAiErrorMessage(rawHtmlDump);

      expect(sanitized).not.toContain("<!DOCTYPE");
      expect(sanitized).not.toContain("<html");
      expect(sanitized).not.toContain("OpenRouter");
      expect(sanitized).toContain("Serviço de IA temporariamente indisponível");
    });

    it("deve sanitizar erros de rede técnicos com status HTTP (502, 504, Cloudflare, ECONNREFUSED)", () => {
      const networkError = "502 Bad Gateway: Cloudflare worker timeout after 30000ms";
      const sanitized = sanitizeAiErrorMessage(networkError);

      expect(sanitized).not.toContain("502");
      expect(sanitized).not.toContain("Cloudflare");
      expect(sanitized).toContain("Instabilidade temporária na conexão");
    });

    it("handleAIRouteError nunca deve vazar HTML no payload JSON de resposta", async () => {
      const htmlError = new Error("404 <!DOCTYPE html><html><body>Error</body></html>");
      const res = handleAIRouteError(htmlError);

      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.error).not.toContain("<!DOCTYPE");
      expect(data.error).not.toContain("<html");
      expect(data.diagnostic).toBeUndefined(); // diagnostic cru foi removido para evitar vazamento
    });
  });

  describe("2. Suporte a OpenRouter e Anthropic Oficial Isolada", () => {
    it("deve configurar OpenRouter isolado quando AI_PROVIDER=openrouter e OPENROUTER_API_KEY estiver configurada", () => {
      process.env.AI_PROVIDER = "openrouter";
      process.env.OPENROUTER_API_KEY = "sk-or-v1-abcdef1234567890abcdef";
      const service = new AnthropicClientService();

      expect(service.providerName).toContain("OpenRouter");
    });

    it("deve utilizar Anthropic Claude (Oficial) com baseURL oficial quando a chave for da Anthropic", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-api03-abcdef1234567890abcdef";
      const service = new AnthropicClientService();

      expect(service.providerName).toContain("Anthropic Claude (Oficial)");
    });

    it("deve validar com sucesso e considerar Anthropic Oficial quando o prefixo for sk-ant-usr-1", () => {
      process.env.AI_PROVIDER = "anthropic";
      process.env.ANTHROPIC_API_KEY = "sk-ant-usr-1-testkey1234567890abcdef";
      const service = new AnthropicClientService();

      expect(service.providerName).toBe("Anthropic Claude (Oficial)");
      const diag = service.getAuthDiagnostics();
      expect(diag.providerMode).toBe("Anthropic Claude (Oficial)");
      expect(diag.targetUrl).toBe("https://api.anthropic.com/v1/messages");
      expect(diag.keyPrefix).toBe("sk-ant-usr");
    });

    it("factory deve aceitar OPENROUTER_API_KEY apenas quando AI_PROVIDER=openrouter for explicitamente configurado", () => {
      process.env.AI_PROVIDER = "openrouter";
      delete process.env.ANTHROPIC_API_KEY;
      process.env.OPENROUTER_API_KEY = "sk-or-v1-abcdef1234567890abcdef";

      const service = getAIService();
      expect(service.providerName).toContain("OpenRouter");
    });

    it("factory não deve fazer fallback para OPENROUTER_API_KEY quando AI_PROVIDER=anthropic e ANTHROPIC_API_KEY estiver ausente", () => {
      process.env.AI_PROVIDER = "anthropic";
      delete process.env.ANTHROPIC_API_KEY;
      process.env.OPENROUTER_API_KEY = "sk-or-v1-abcdef1234567890abcdef";

      expect(() => getAIService()).toThrowError(
        /ANTHROPIC_API_KEY ausente no ambiente do servidor/
      );
    });
  });

  describe("3. Suporte a Primeiro Emprego / Estágio na Rota /api/ai/improve-full", () => {
    it("não deve falhar quando candidato não tiver experiências profissionais (modo primeiro emprego)", async () => {
      process.env.AI_PROVIDER = "mock";
      const { POST } = await import("@/app/api/ai/improve-full/route");

      const firstJobPayload = {
        creationMode: "simple",
        personal: {
          fullName: "Maria Silva",
          email: "maria@email.com",
          phone: "11987654321",
          city: "São Paulo",
          state: "SP",
        },
        target: {
          jobTitle: "Estagiário de Administração",
          careerStage: "entry_level",
          careerContext: "Estudante do 3º semestre buscando primeira oportunidade para aplicar conhecimentos de Excel e atendimento.",
          summary: "", // Campo vazio - deve ser gerado pelo Fast
        },
        experiences: [], // Zero experiências
        education: [
          {
            id: "ed1",
            institution: "Universidade Paulista",
            course: "Administração",
            degree: "Bacharelado",
            status: "cursando",
          },
        ],
        technicalSkills: ["Excel", "Word", "Atendimento"],
        softSkills: ["Pontualidade", "Proatividade"],
      };

      const req = new Request("http://localhost:3000/api/ai/improve-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(firstJobPayload),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.resume).toBeDefined();
      expect(data.resume.target.jobTitle).toBeDefined();
      // O resumo profissional deve ter sido gerado a partir do contexto e formação
      expect(data.resume.target.summary).toBeTruthy();
      expect(data.resume.experiences).toHaveLength(0);
    });

    it("deve filtrar experiências fantasmas (itens vazios criados por engano) sem quebrar o schema", async () => {
      process.env.AI_PROVIDER = "mock";
      const { POST } = await import("@/app/api/ai/improve-full/route");

      const payloadWithGhostExp = {
        personal: {
          fullName: "João Souza",
          email: "joao@email.com",
          phone: "11987654321",
          city: "Curitiba",
          state: "PR",
        },
        target: {
          jobTitle: "Assistente Administrativo",
          careerStage: "experienced",
          careerContext: "Experiência em rotinas de escritório e contas a pagar.",
          summary: "",
        },
        experiences: [
          // Item fantasma sem cargo nem empresa
          { id: "ghost_1", company: "", role: "", description: "" },
        ],
        education: [],
        technicalSkills: ["Contas a Pagar"],
      };

      const req = new Request("http://localhost:3000/api/ai/improve-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadWithGhostExp),
      });

      const res = await POST(req as any);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.resume).toBeDefined();
      expect(data.resume.experiences).toHaveLength(0);
    });
  });

  describe("4. Compatibilidade de Credenciais do Mercado Pago", () => {
    it("deve aceitar MP_ACCESS_TOKEN", async () => {
      process.env.MP_ACCESS_TOKEN = "TEST-1234567890";
      delete process.env.MERCADOPAGO_ACCESS_TOKEN;
      delete process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN;

      const { MercadoPagoGateway } = await import("@/lib/payment/mercadopago-gateway");
      const gateway = new MercadoPagoGateway();
      expect(gateway.name).toContain("Mercado Pago");
    });

    it("deve aceitar MERCADOPAGO_ACCESS_TOKEN", async () => {
      delete process.env.MP_ACCESS_TOKEN;
      process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-MERCADOPAGO-123";
      delete process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN;

      const { MercadoPagoGateway } = await import("@/lib/payment/mercadopago-gateway");
      const gateway = new MercadoPagoGateway();
      expect(gateway.name).toContain("Mercado Pago");
    });
  });
});
