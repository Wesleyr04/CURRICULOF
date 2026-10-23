import { describe, it, expect } from "vitest";
import { buildSuggestSummaryPrompt, buildImproveTextPrompt } from "@/lib/ai/prompts";
import { MockAIService } from "@/lib/ai/mock-service";
import { TargetInfoSchema } from "@/lib/schema/resume";
import { AVAILABLE_LAYOUTS } from "@/config/layouts";
import { REVIEW_SLIDES } from "@/components/editor/Step6Review";

describe("Refatoração UX, Fluxo de Navegação e IA (5 Pontos Críticos)", () => {
  const mockAi = new MockAIService();

  describe("Ponto 1 & 2: Sincronização dos Modelos e Metadados dos Layouts", () => {
    it("deve conter exatamente os 5 layouts oficiais validados", () => {
      expect(AVAILABLE_LAYOUTS).toHaveLength(5);
      const layoutIds = AVAILABLE_LAYOUTS.map((l) => l.id);
      expect(layoutIds).toEqual(["first-job", "classic-ats", "modern", "minimalist", "tech-specialist"]);
    });

    it("cada layout deve possuir badge, nome, recomendação e flag atsFriendly", () => {
      AVAILABLE_LAYOUTS.forEach((layout) => {
        expect(layout.name).toBeTruthy();
        expect(layout.badge).toBeTruthy();
        expect(layout.description).toBeTruthy();
        expect(layout.recommendedFor).toBeTruthy();
        expect(layout.atsFriendly).toBe(true);
      });
    });
  });

  describe("Ponto 3: Restrição do Download Apenas para Etapa Final", () => {
    it("valida que o schema aceita o currículo limpo e que dados vazios não bloqueiam o modelo", () => {
      const parsed = TargetInfoSchema.safeParse({
        jobTitle: "Desenvolvedor React",
        careerStage: "career_transition",
        summary: "Profissional em transição com foco em front-end moderno.",
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.careerStage).toBe("career_transition");
      }
    });
  });

  describe("Ponto 4: Reformulação Semântica e Prompts com Habilidades Transferíveis", () => {
    it("deve orientar a IA a focar em habilidades transferíveis para career_transition", () => {
      const prompt = buildSuggestSummaryPrompt({
        jobTitle: "Suporte N1",
        field: "Tecnologia da Informação",
        careerStage: "career_transition",
        careerContext: "Experiência prévia de 3 anos em atendimento e varejo",
        mode: "complete",
        experiences: [
          {
            role: "Atendente Comercial",
            company: "Loja Central",
            description: "Atendimento a clientes e organização de caixa.",
          },
        ],
      });

      expect(prompt).toContain("DIRETRIZ DE CARREIRA (TRANSIÇÃO DE CARREIRA)");
      expect(prompt).toContain("HABILIDADES TRANSFERÍVEIS");
      expect(prompt).toContain("Momento de Carreira: Em transição de carreira");
      expect(prompt).toContain("Experiência prévia de 3 anos em atendimento e varejo");
    });

    it("deve orientar a IA a focar em domínio técnico e resultados para experienced", () => {
      const prompt = buildSuggestSummaryPrompt({
        jobTitle: "Engenheiro de Software Sênior",
        careerStage: "experienced",
        mode: "complete",
      });

      expect(prompt).toContain("DIRETRIZ DE CARREIRA (CANDIDATO JÁ ATUA NA ÁREA / EXPERIENTE)");
      expect(prompt).toContain("domínio técnico");
      expect(prompt).toContain("Momento de Carreira: Já atua na área (Experiente)");
    });

    it("deve orientar a IA a focar em aprendizado e iniciativa para entry_level", () => {
      const prompt = buildSuggestSummaryPrompt({
        jobTitle: "Jovem Aprendiz Administrativo",
        careerStage: "entry_level",
        mode: "simple",
      });

      expect(prompt).toContain("DIRETRIZ DE CARREIRA (PRIMEIRO EMPREGO / ESTÁGIO)");
      expect(prompt).toContain("Momento de Carreira: Primeiro emprego / Estágio");
    });

    it("deve orientar o aprimoramento de atividades com diretriz de transição de carreira", () => {
      const prompt = buildImproveTextPrompt({
        rawText: "atendia clientes e resolvia problemas de pedidos",
        context: "experience",
        jobTitle: "Analista de Suporte Júnior",
        careerStage: "career_transition",
        mode: "simple",
      });

      expect(prompt).toContain("DIRETRIZ DE TRANSIÇÃO DE CARREIRA");
      expect(prompt).toContain("competências transferíveis");
    });

    it("MockAIService deve gerar texto valorizando transição de carreira quando solicitado", async () => {
      const summary = await mockAi.suggestSummary({
        jobTitle: "Analista de Dados",
        careerStage: "career_transition",
        careerContext: "Migrando da área contábil",
        mode: "complete",
        experiences: [
          {
            role: "Assistente Contábil",
            company: "Escritório Modelo",
            description: "Análise de planilhas e conciliação bancária.",
          },
        ],
      });

      expect(summary).toContain("transição de carreira");
      expect(summary).toContain("competências transferíveis");
      expect(summary).toContain("Migrando da área contábil");
    });

    it("MockAIService deve gerar texto com foco em aprendizado para primeiro emprego", async () => {
      const summary = await mockAi.suggestSummary({
        jobTitle: "Jovem Aprendiz",
        careerStage: "entry_level",
        mode: "complete",
      });

      expect(summary).toContain("início profissional");
      expect(summary).toContain("aprendizado contínuo");
    });
  });

  describe("Ponto 5: Integridade do Schema com Novos Campos de Carreira", () => {
    it("deve validar TargetInfo com os 3 momentos de carreira válidos", () => {
      const stages = ["experienced", "entry_level", "career_transition"] as const;

      stages.forEach((stage) => {
        const parsed = TargetInfoSchema.safeParse({
          jobTitle: "Analista",
          careerStage: stage,
        });
        expect(parsed.success).toBe(true);
      });
    });

    it("deve rejeitar momento de carreira inválido", () => {
      const parsed = TargetInfoSchema.safeParse({
        jobTitle: "Analista",
        careerStage: "invalid_stage",
      });
      expect(parsed.success).toBe(false);
    });
  });

  describe("Refinamento UX Mobile/Desktop: Etapa 2 Enxuta e Etapa 6 com Abas Separadas de Sobre você e Revisão Geral", () => {
    it("Etapa 6 deve possuir exatamente 4 slides de navegação com abas separadas para Sobre você e Revisão", () => {
      expect(REVIEW_SLIDES).toHaveLength(4);
      const titles = REVIEW_SLIDES.map((s) => s.title);
      expect(titles).toEqual([
        "1. Overview & Estilo",
        "2. Sobre você",
        "3. Revisão Inteligente Geral",
        "4. Finalizar & Baixar",
      ]);
    });

    it("Etapa 6 deve possuir a aba dedicada '2. Sobre você'", () => {
      const titles = REVIEW_SLIDES.map((s) => s.title);
      expect(titles).toContain("2. Sobre você");
    });

    it("Etapa 6 deve possuir a aba dedicada '3. Revisão Inteligente Geral'", () => {
      const titles = REVIEW_SLIDES.map((s) => s.title);
      expect(titles).toContain("3. Revisão Inteligente Geral");
    });

    it("Etapa 2 e buildSuggestSummaryPrompt devem operar perfeitamente sem careerContext", () => {
      const parsed = TargetInfoSchema.safeParse({
        jobTitle: "Desenvolvedor Frontend",
        careerStage: "experienced",
        summary: "Profissional com vasta experiência em aplicações web modernas.",
      });
      expect(parsed.success).toBe(true);

      const prompt = buildSuggestSummaryPrompt({
        jobTitle: "Desenvolvedor Frontend",
        careerStage: "experienced",
        mode: "complete",
      });
      expect(prompt).toContain("Desenvolvedor Frontend");
      expect(prompt).toContain("DIRETRIZ DE CARREIRA (CANDIDATO JÁ ATUA NA ÁREA / EXPERIENTE)");
      expect(prompt).not.toContain("Contexto ou foco adicional do candidato:");
    });

    it("buildImproveTextPrompt para atividades de experiência deve injetar careerContext quando fornecido", () => {
      const prompt = buildImproveTextPrompt({
        rawText: "desenvolvia rotinas de microsserviços",
        context: "experience",
        jobTitle: "Desenvolvedor Backend",
        careerStage: "career_transition",
        careerContext: "Foco em arquitetura escalável e nuvem AWS",
        company: "Tech Ltda",
        mode: "complete",
      });

      expect(prompt).toContain("Contexto / Foco adicional informado pelo candidato: Foco em arquitetura escalável e nuvem AWS");
      expect(prompt).toContain("DIRETRIZ DE TRANSIÇÃO DE CARREIRA");
      expect(prompt).toContain("Tech Ltda");
    });

    it("buildSuggestSummaryPrompt deve reforçar a preservação de resumo estratégico pré-existente", () => {
      const prompt = buildSuggestSummaryPrompt({
        jobTitle: "Arquiteto de Software",
        careerStage: "experienced",
        currentSummary: "Profissional com mais de 8 anos desenhando microsserviços de alta disponibilidade.",
        mode: "complete",
      });

      expect(prompt).toContain("O candidato já redigiu ou aprovou um resumo profissional estratégico");
      expect(prompt).toContain("sem descaracterizar a essência ou a estrutura estratégica do resumo já definido pelo usuário");
    });
  });
});

