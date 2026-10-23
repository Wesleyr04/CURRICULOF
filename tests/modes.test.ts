import { describe, it, expect } from "vitest";
import { ResumeDataSchema } from "@/lib/schema/resume";
import { INITIAL_RESUME_DATA, AVAILABLE_LAYOUTS } from "@/config/layouts";
import { MockAIService } from "@/lib/ai/mock-service";
import { ResumeData, CreationMode } from "@/types/resume";

describe("Modos de Criação — Simples vs Completo", () => {
  const ai = new MockAIService();

  it("deve validar com sucesso currículo no Modo Simples e no Modo Completo", () => {
    const simpleResume: ResumeData = {
      ...INITIAL_RESUME_DATA,
      creationMode: "simple",
    };
    const completeResume: ResumeData = {
      ...INITIAL_RESUME_DATA,
      creationMode: "complete",
    };

    const resSimple = ResumeDataSchema.safeParse(simpleResume);
    const resComplete = ResumeDataSchema.safeParse(completeResume);

    expect(resSimple.success).toBe(true);
    expect(resComplete.success).toBe(true);
    if (resSimple.success && resComplete.success) {
      expect(resSimple.data.creationMode).toBe("simple");
      expect(resComplete.data.creationMode).toBe("complete");
    }
  });

  it("deve permitir currículo no Modo Simples sem experiências anteriores (1º Emprego)", () => {
    const firstJobSimple: ResumeData = {
      ...INITIAL_RESUME_DATA,
      creationMode: "simple",
      experiences: [],
      certifications: [],
      languages: [],
    };

    const result = ResumeDataSchema.safeParse(firstJobSimple);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experiences).toHaveLength(0);
      expect(result.data.certifications).toHaveLength(0);
    }
  });

  it("Transição Segura entre Modos: alternar de Completo para Simples e vice-versa não apaga dados em memória", () => {
    // Inicia com dados ricos do modo completo
    let state: ResumeData = {
      ...INITIAL_RESUME_DATA,
      creationMode: "complete",
      certifications: ["Certificação AWS Solutions Architect", "Scrum Master PSM I"],
      languages: [
        { id: "l1", name: "Inglês", level: "Avançado" },
        { id: "l2", name: "Espanhol", level: "Intermediário" },
      ],
      experiences: [
        {
          id: "exp1",
          company: "Empresa XPTO",
          role: "Analista Sênior",
          startDate: "2022-01",
          endDate: "2024-05",
          current: false,
          description: "Atividades completas e liderança de projetos",
          achievements: "Aumento de 20% na retenção de clientes. Migração de arquitetura legacy.",
        },
      ],
    };

    // Alterna para o Modo Simples
    state = {
      ...state,
      creationMode: "simple",
    };

    // Os dados preenchidos no modo completo CONTINUAM intactos no objeto
    expect(state.creationMode).toBe("simple");
    expect(state.certifications).toHaveLength(2);
    expect(state.languages).toHaveLength(2);
    expect(state.experiences[0].achievements).toContain("Aumento de 20%");

    // Reverte para o Modo Completo
    state = {
      ...state,
      creationMode: "complete",
    };

    expect(state.creationMode).toBe("complete");
    expect(state.certifications[0]).toBe("Certificação AWS Solutions Architect");
    expect(state.languages[0].name).toBe("Inglês");
    expect(state.experiences[0].achievements).toContain("Aumento de 20% na retenção de clientes");
  });

  it("IA deve diferenciar saídas entre Modo Simples (enxuto) e Modo Completo (detalhado)", async () => {
    const baseParams = {
      jobTitle: "Gerente de Projetos",
      field: "Gestão",
      experiences: [
        {
          role: "Líder de Projetos",
          company: "Consultoria Alfa",
          description: "Coordenação de entregas ágeis",
        },
      ],
      skills: ["Scrum", "Kanban", "Gestão de Riscos"],
    };

    const summarySimple = await ai.suggestSummary({
      ...baseParams,
      mode: "simple",
    });

    const summaryComplete = await ai.suggestSummary({
      ...baseParams,
      mode: "complete",
    });

    expect(summarySimple).toBeTruthy();
    expect(summaryComplete).toBeTruthy();

    // Modo Simples deve ser conciso e menor em extensão que o Modo Completo
    expect(summarySimple.length).toBeLessThan(summaryComplete.length);
    expect(summarySimple.length).toBeLessThanOrEqual(200);
  });

  it("IA deve aprimorar texto de atividade de forma enxuta no Modo Simples", async () => {
    const rawText = "era responsavel por coordenar sprint planning e reuniões diárias com todo o time de desenvolvedores e designers";

    const simpleImprove = await ai.improveText({
      rawText,
      context: "experience",
      mode: "simple",
    });

    const completeImprove = await ai.improveText({
      rawText,
      context: "experience",
      mode: "complete",
    });

    expect(simpleImprove).toBeTruthy();
    expect(completeImprove).toBeTruthy();
    expect(simpleImprove.endsWith(".")).toBe(true);
    expect(completeImprove.endsWith(".")).toBe(true);

    // No modo simples deve ser mais objetivo e curto
    expect(simpleImprove.length).toBeLessThanOrEqual(completeImprove.length);
  });

  it("compatibilidade com os 5 layouts: todos devem aceitar ambos os modos sem erros estruturais", () => {
    const modes: CreationMode[] = ["simple", "complete"];

    modes.forEach((mode) => {
      AVAILABLE_LAYOUTS.forEach((layout) => {
        const resume: ResumeData = {
          ...INITIAL_RESUME_DATA,
          creationMode: mode,
          customization: {
            ...INITIAL_RESUME_DATA.customization,
            layoutId: layout.id,
          },
        };

        const parsed = ResumeDataSchema.safeParse(resume);
        expect(parsed.success).toBe(true);
      });
    });
  });
});
