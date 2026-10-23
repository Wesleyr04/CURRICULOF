import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateContentSafety,
  isAiRefusal,
  validateResumeForExport,
} from "@/lib/security/content-guard";
import { checkAiRateLimit, resetRateLimitStore } from "@/lib/security/rate-limit";
import { NextRequest } from "next/server";

// Mock do SDK Anthropic
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

describe("Blindagem de Segurança, Custos e Guardrails de Conteúdo", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetRateLimitStore();
    process.env.AI_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key-guard";
    process.env.ANTHROPIC_MODEL = "claude-3-5-haiku-20241022";

    // Isola a telemetria durante a execução dos testes de segurança
    const { aiTelemetryService } = await import("@/lib/ai/telemetry/service");
    (aiTelemetryService as any).repository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByResponseId: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      getAggregatedMetrics: vi.fn().mockResolvedValue({}),
    };
  });

  describe("1. Camada 1: Pre-flight Moderation Local (Custo Zero de Tokens)", () => {
    it("deve bloquear localmente termos proibidos como 'Cafetina' e 'Sexo/entretenimento'", () => {
      const check1 = validateContentSafety("Cafetina");
      expect(check1.allowed).toBe(false);
      expect(check1.reason).toContain("não são permitidos");

      const check2 = validateContentSafety("Sexo/entretenimento");
      expect(check2.allowed).toBe(false);

      const check3 = validateContentSafety("Traficante de drogas");
      expect(check3.allowed).toBe(false);

      const check4 = validateContentSafety("Garota de programa");
      expect(check4.allowed).toBe(false);
    });

    it("deve bloquear strings sem sentido, lixo de teclado e repetições (gibberish)", () => {
      const checkMash = validateContentSafety("asdfghjk");
      expect(checkMash.allowed).toBe(false);

      const checkRepeat = validateContentSafety("aaaaaaa");
      expect(checkRepeat.allowed).toBe(false);

      const checkNumbers = validateContentSafety("70707070");
      expect(checkNumbers.allowed).toBe(false);

      const checkNoVowels = validateContentSafety("bcdfghjklmnp");
      expect(checkNoVowels.allowed).toBe(false);
    });

    it("deve permitir cargos e termos legítimos do mercado de trabalho", () => {
      expect(validateContentSafety("Confeiteiro").allowed).toBe(true);
      expect(validateContentSafety("Analista de Suporte").allowed).toBe(true);
      expect(validateContentSafety("Desenvolvedor Front-end").allowed).toBe(true);
      expect(validateContentSafety("Auxiliar Administrativo").allowed).toBe(true);
      expect(validateContentSafety("TI").allowed).toBe(true);
      expect(validateContentSafety("RH").allowed).toBe(true);
    });
  });

  describe("2. Bloqueio no Endpoint /api/ai/suggest-summary SEM acionar a Anthropic", () => {
    it("deve retornar 422 para 'Cafetina' / 'Sexo/entretenimento' e JAMAIS chamar a API da Anthropic", async () => {
      const { POST } = await import("@/app/api/ai/suggest-summary/route");

      const req = new NextRequest("http://localhost:3000/api/ai/suggest-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "189.40.12.50",
        },
        body: JSON.stringify({
          jobTitle: "Cafetina",
          field: "Sexo/entretenimento",
          experiences: [],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.error).toContain("não são permitidos");

      // PROVA DE CUSTO ZERO: A SDK da Anthropic NÃO foi invocada
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("3. Camada 2: Detecção de Recusa da IA (Output Guardrail)", () => {
    it("isAiRefusal deve detectar padrões de recusa do Claude", () => {
      expect(isAiRefusal("[RECUSA_CONTEUDO_INVALIDO]")).toBe(true);
      expect(isAiRefusal("Não posso elaborar um resumo profissional para essa função...")).toBe(true);
      expect(isAiRefusal("Desculpe, mas não posso criar esse conteúdo pois viola as diretrizes...")).toBe(true);
      expect(isAiRefusal("Atividade tipificada como crime no Código Penal.")).toBe(true);
      expect(isAiRefusal("Como uma IA, não posso auxiliar com isso.")).toBe(true);

      // Resumo legítimo NÃO deve ser marcado como recusa
      expect(
        isAiRefusal("Profissional dedicado com 5 anos de experiência na área culinária.")
      ).toBe(false);
    });

    it("endpoint deve retornar 422 se o modelo responder com [RECUSA_CONTEUDO_INVALIDO]", async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: "[RECUSA_CONTEUDO_INVALIDO]",
          },
        ],
      });

      const { POST } = await import("@/app/api/ai/suggest-summary/route");

      const req = new NextRequest("http://localhost:3000/api/ai/suggest-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "189.40.12.51",
        },
        body: JSON.stringify({
          jobTitle: "Atividade Ilegal Disfarçada",
          field: "Geral",
          experiences: [],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.error).toContain("utilize uma nomenclatura corporativa");
    });

    it("endpoint deve retornar 422 se o modelo responder com texto explicativo de recusa ('Não posso elaborar...')", async () => {
      mockCreate.mockResolvedValueOnce({
        content: [
          {
            type: "text",
            text: "Não posso elaborar um resumo profissional para essa ocupação pois está em desacordo com as diretrizes.",
          },
        ],
      });

      const { POST } = await import("@/app/api/ai/suggest-summary/route");

      const req = new NextRequest("http://localhost:3000/api/ai/suggest-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "189.40.12.52",
        },
        body: JSON.stringify({
          jobTitle: "Atividade Duvidosa",
          field: "Geral",
          experiences: [],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.error).toContain("utilize uma nomenclatura corporativa");
    });
  });

  describe("4. Camada 3: Rate Limit por IP (Anti-Abuso de Créditos)", () => {
    it("deve permitir até 3 requisições por minuto e bloquear a 4ª com status 429", () => {
      const ip = "200.150.10.1";

      const r1 = checkAiRateLimit(ip);
      expect(r1.success).toBe(true);

      const r2 = checkAiRateLimit(ip);
      expect(r2.success).toBe(true);

      const r3 = checkAiRateLimit(ip);
      expect(r3.success).toBe(true);

      // 4ª requisição deve ser bloqueada
      const r4 = checkAiRateLimit(ip);
      expect(r4.success).toBe(false);
      expect(r4.message).toContain("Limite de 3 gerações");
    });

    it("deve bloquear no endpoint com 429 ao ultrapassar o limite", async () => {
      const { POST } = await import("@/app/api/ai/suggest-summary/route");
      const clientIp = "177.10.20.30";

      mockCreate.mockResolvedValue({
        content: [{ type: "text", text: "Resumo válido gerado." }],
      });

      // 3 requisições permitidas
      for (let i = 0; i < 3; i++) {
        const req = new NextRequest("http://localhost:3000/api/ai/suggest-summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": clientIp,
          },
          body: JSON.stringify({ jobTitle: "Padeiro", field: "Padaria" }),
        });
        const res = await POST(req);
        expect(res.status).toBe(200);
      }

      // 4ª requisição deve retornar 429
      const req4 = new NextRequest("http://localhost:3000/api/ai/suggest-summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify({ jobTitle: "Padeiro", field: "Padaria" }),
      });
      const res4 = await POST(req4);
      expect(res4.status).toBe(429);

      const json4 = await res4.json();
      expect(json4.error).toContain("Limite de 3 gerações");
    });
  });

  describe("5. Camada 4: Validação de Exportação e Pré-visualização", () => {
    it("validateResumeForExport deve invalidar currículos com recusa de IA ou termos ilícitos", () => {
      const invalidResume1 = {
        target: {
          jobTitle: "Confeiteiro",
          field: "Cozinha",
          summary: "Não posso elaborar um resumo profissional para este cargo...",
        },
      };
      const check1 = validateResumeForExport(invalidResume1);
      expect(check1.valid).toBe(false);
      expect(check1.message).toContain("recusa da IA");

      const invalidResume2 = {
        target: {
          jobTitle: "Cafetina",
          field: "Geral",
          summary: "Resumo qualquer",
        },
      };
      const check2 = validateResumeForExport(invalidResume2);
      expect(check2.valid).toBe(false);
      expect(check2.message).toContain("não são permitidos");

      const validResume = {
        target: {
          jobTitle: "Confeiteiro",
          field: "Cozinha",
          summary: "Profissional especializado em massas folhadas e doces finos.",
        },
      };
      const check3 = validateResumeForExport(validResume);
      expect(check3.valid).toBe(true);
    });

    it("validateResumeForExport deve bloquear checkout quando requirePersonalInfo for true e faltar nome ou contato", () => {
      // 1. Sem nome completo
      const checkNoName = validateResumeForExport(
        {
          personal: { fullName: "", email: "joao@email.com" },
        },
        { requirePersonalInfo: true }
      );
      expect(checkNoName.valid).toBe(false);
      expect(checkNoName.missingField).toBe("fullName");
      expect(checkNoName.targetStep).toBe(1);

      // 2. Com nome curto/inválido (< 3 letras)
      const checkShortName = validateResumeForExport(
        {
          personal: { fullName: "J.", email: "joao@email.com" },
        },
        { requirePersonalInfo: true }
      );
      expect(checkShortName.valid).toBe(false);
      expect(checkShortName.missingField).toBe("fullName");

      // 3. Sem e-mail e sem telefone
      const checkNoContact = validateResumeForExport(
        {
          personal: { fullName: "João da Silva", email: "", phone: "" },
        },
        { requirePersonalInfo: true }
      );
      expect(checkNoContact.valid).toBe(false);
      expect(checkNoContact.missingField).toBe("contact");
      expect(checkNoContact.targetStep).toBe(1);

      // 4. Válido com nome e e-mail
      const checkValidEmail = validateResumeForExport(
        {
          personal: { fullName: "João da Silva", email: "joao@email.com" },
        },
        { requirePersonalInfo: true }
      );
      expect(checkValidEmail.valid).toBe(true);

      // 5. Válido com nome e telefone
      const checkValidPhone = validateResumeForExport(
        {
          personal: { fullName: "Maria Oliveira", phone: "(11) 99999-8888" },
        },
        { requirePersonalInfo: true }
      );
      expect(checkValidPhone.valid).toBe(true);
    });
  });
});
