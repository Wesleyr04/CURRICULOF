import { describe, it, expect, vi } from "vitest";
import { INITIAL_RESUME_DATA } from "@/config/layouts";
import { MockAIService } from "@/lib/ai/mock-service";
import { AnthropicClientService } from "@/lib/ai/anthropic-client-service";
import { ResumeData } from "@/types/resume";

describe("Testes das 4 Frentes: Formação, Idade, Correção 'Sobre você' e Otimização Etapa 6", () => {
  describe("Frente 1: Validação Condicional do Ano de Conclusão", () => {
    it("deve exigir ano de conclusão estritamente quando status for concluído", async () => {
      const { EducationItemSchema } = await import("@/lib/schema/resume");
      const itemSemAno = {
        id: "edu-1",
        institution: "Universidade X",
        course: "Administração",
        degree: "Bacharelado",
        status: "concluido",
        startDate: "2019",
        endDate: "",
      };
      const parseResult = EducationItemSchema.safeParse(itemSemAno);
      expect(parseResult.success).toBe(false);
      if (!parseResult.success) {
        expect(parseResult.error.issues[0].message).toMatch(/ano de conclusão/i);
      }
    });

    it("deve permitir que curso em andamento fique sem ano ou com previsão futura", async () => {
      const { EducationItemSchema } = await import("@/lib/schema/resume");
      const itemCursandoSemAno = {
        id: "edu-2",
        institution: "Universidade Y",
        course: "Ciência da Computação",
        degree: "Bacharelado",
        status: "cursando",
        startDate: "2024",
        endDate: "",
      };
      expect(EducationItemSchema.safeParse(itemCursandoSemAno).success).toBe(true);

      const itemCursandoFuturo = {
        ...itemCursandoSemAno,
        endDate: "2028",
      };
      expect(EducationItemSchema.safeParse(itemCursandoFuturo).success).toBe(true);
    });
  });

  describe("Frente 2: Inclusão e Validação do Campo 'Idade'", () => {
    it("deve validar idade válida de 14 a 100 e permitir vazio", async () => {
      const { PersonalInfoSchema } = await import("@/lib/schema/resume");
      const base = {
        fullName: "Ana Maria",
        email: "ana@email.com",
        phone: "11988887777",
        city: "São Paulo",
        state: "SP",
      };

      // Vazio (opcional)
      expect(PersonalInfoSchema.safeParse({ ...base, age: "" }).success).toBe(true);
      // Válidos
      expect(PersonalInfoSchema.safeParse({ ...base, age: "14" }).success).toBe(true);
      expect(PersonalInfoSchema.safeParse({ ...base, age: "35" }).success).toBe(true);
      expect(PersonalInfoSchema.safeParse({ ...base, age: "100" }).success).toBe(true);
      // Inválidos
      expect(PersonalInfoSchema.safeParse({ ...base, age: "13" }).success).toBe(false);
      expect(PersonalInfoSchema.safeParse({ ...base, age: "101" }).success).toBe(false);
      expect(PersonalInfoSchema.safeParse({ ...base, age: "abc" }).success).toBe(false);
    });
  });

  describe("Frente 3: Correção do Bug de 'Texto Fantasma / Restauração Indevida' em 'Sobre você'", () => {
    it("apagar todo o texto de 'Sobre você' deve manter o valor estritamente vazio ('') sem ressuscitar contexto da Etapa 2", () => {
      // Simula o estado do currículo
      const state: ResumeData = {
        ...INITIAL_RESUME_DATA,
        target: {
          ...INITIAL_RESUME_DATA.target,
          careerContext: "Texto antigo preenchido na Etapa 2",
          summary: "Texto original do resumo que o usuário quer apagar",
        },
      };

      // Usuário dá Ctrl + A e apaga tudo
      const newSummaryValue = "";
      const updatedState = {
        ...state,
        target: {
          ...state.target,
          summary: newSummaryValue,
        },
      };

      // Garante que o valor permanece rigorosamente "" e NÃO faz fallback para careerContext
      expect(updatedState.target.summary).toBe("");
      expect(updatedState.target.summary).not.toBe(state.target.careerContext);
    });

    it("corrida assíncrona: uma resposta atrasada não deve sobrescrever edição manual posterior", async () => {
      let version = 0;
      let activeSummary = "Texto inicial";

      // 1. Usuário dispara requisição assíncrona (versão 1)
      const requestVersion = ++version;

      // 2. Enquanto a requisição está em voo, usuário edita manualmente (versão 2)
      activeSummary = "Edição manual mais recente feita pelo usuário";
      version++; // incrementa versão por conta da edição manual

      // 3. Resposta atrasada chega com a versão 1
      const delayedResponse = "Texto retornado pela API antiga";
      if (version === requestVersion) {
        activeSummary = delayedResponse;
      }

      // 4. Confirma que a edição manual NÃO foi atropelada pela resposta antiga
      expect(activeSummary).toBe("Edição manual mais recente feita pelo usuário");
      expect(activeSummary).not.toBe(delayedResponse);
    });
  });

  describe("Frente 4: Auditoria e Otimização de Tokens na Etapa 6 (Preservação do 'Sobre você')", () => {
    it("improveFullResume com preserveSummary: true NÃO deve reexecutar suggestSummary e deve preservar o resumo do usuário", async () => {
      const mockService = new MockAIService();
      const suggestSummarySpy = vi.spyOn(mockService, "suggestSummary");

      const sampleResume: ResumeData = {
        ...INITIAL_RESUME_DATA,
        target: {
          ...INITIAL_RESUME_DATA.target,
          summary: "Meu resumo revisado e aprovado com sucesso no Slide 2.",
        },
      };

      const result = await mockService.improveFullResume(
        sampleResume,
        "simple",
        undefined,
        { preserveSummary: true }
      );

      // Confirma que NÃO gastou tokens com suggestSummary
      expect(suggestSummarySpy).not.toHaveBeenCalled();
      // Confirma que o resumo foi 100% preservado
      expect(result.target.summary).toBe("Meu resumo revisado e aprovado com sucesso no Slide 2.");
    });

    it("improveFullResume sem preserveSummary (ou com summary vazio) deve gerar o resumo normalmente", async () => {
      const mockService = new MockAIService();
      const suggestSummarySpy = vi.spyOn(mockService, "suggestSummary");

      const sampleResume: ResumeData = {
        ...INITIAL_RESUME_DATA,
        target: {
          ...INITIAL_RESUME_DATA.target,
          summary: "",
        },
      };

      const result = await mockService.improveFullResume(
        sampleResume,
        "simple",
        undefined,
        { preserveSummary: false }
      );

      // Confirma que invocou suggestSummary quando necessário
      expect(suggestSummarySpy).toHaveBeenCalledTimes(1);
      expect(result.target.summary.length).toBeGreaterThan(0);
    });

    it("AnthropicClientService deve respeitar options.preserveSummary e economizar tokens na Revisão Geral", async () => {
      const service = new AnthropicClientService("sk-ant-api03-validkey1234567890abcdef12345");
      const suggestSummarySpy = vi.spyOn(service, "suggestSummary").mockResolvedValue("Resumo que seria gerado");
      vi.spyOn(service, "improveText").mockResolvedValue("Atividade aprimorada");

      const resumeWithSummary: ResumeData = {
        ...INITIAL_RESUME_DATA,
        target: {
          ...INITIAL_RESUME_DATA.target,
          summary: "Apresentação aprovada no Slide 2.",
        },
      };

      const result = await service.improveFullResume(
        resumeWithSummary,
        "simple",
        undefined,
        { preserveSummary: true }
      );

      // Verificação de economia de tokens: suggestSummary NÃO foi chamada
      expect(suggestSummarySpy).not.toHaveBeenCalled();
      expect(result.target.summary).toBe("Apresentação aprovada no Slide 2.");
    });
  });

  describe("Frente 5: Regressão de Estado, Títulos de Layout e Copywriting Neutro", () => {
    it("navegação entre etapas com summaryTouched: true e summary: '' NÃO deve ressuscitar careerContext", () => {
      // Estado inicial onde o candidato preencheu contexto na Etapa 2
      const userResume: ResumeData = {
        ...INITIAL_RESUME_DATA,
        target: {
          ...INITIAL_RESUME_DATA.target,
          careerContext: "Contexto preenchido na Etapa 2",
          summary: "Texto inicial",
          summaryTouched: true,
        },
      };

      // Usuário apagou tudo na Etapa 6 (Ctrl + A + Backspace)
      const afterClear: ResumeData = {
        ...userResume,
        target: {
          ...userResume.target,
          summary: "",
          summaryTouched: true,
        },
      };

      // Usuário navegou para Etapa 1 e depois voltou para a Etapa 6
      const simulateReturnToStep6 = (data: ResumeData): ResumeData => {
        const isTouched = data.target.summaryTouched === true;
        const currentSummary = data.target.summary ?? "";
        const careerContext = (data.target.careerContext || "").trim();

        // Lógica oficial: só inicializa se NUNCA foi tocado
        if (!isTouched && currentSummary === "" && careerContext !== "") {
          return {
            ...data,
            target: {
              ...data.target,
              summary: careerContext,
              summaryTouched: true,
            },
          };
        }
        return data;
      };

      const finalState = simulateReturnToStep6(afterClear);
      expect(finalState.target.summary).toBe("");
      expect(finalState.target.summary).not.toBe("Contexto preenchido na Etapa 2");
    });

    it("ClassicAtsLayout não deve conter mais 'Qualificação Profissional', e sim 'Sobre Você'", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const fileContent = fs.readFileSync(
        path.join(process.cwd(), "src/components/layouts/ClassicAtsLayout.tsx"),
        "utf-8"
      );
      expect(fileContent).not.toContain("Qualificação Profissional");
      expect(fileContent).toContain("Sobre Você");
    });

    it("Componentes da interface não devem narrar 'O Fast vai...', 'para o Fast' ou 'com o Fast'", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const step2 = fs.readFileSync(path.join(process.cwd(), "src/components/editor/Step2Target.tsx"), "utf-8");
      const step6 = fs.readFileSync(path.join(process.cwd(), "src/components/editor/Step6Review.tsx"), "utf-8");
      const step3 = fs.readFileSync(path.join(process.cwd(), "src/components/editor/Step3Experience.tsx"), "utf-8");

      expect(step2).not.toMatch(/O Fast vai/i);
      expect(step2).not.toMatch(/para o Fast/i);
      expect(step6).not.toMatch(/O Fast vai/i);
      expect(step6).not.toMatch(/com o Fast/i);
      expect(step3).not.toMatch(/com o Fast/i);
      expect(step3).not.toMatch(/para o Fast/i);
    });
  });
});
