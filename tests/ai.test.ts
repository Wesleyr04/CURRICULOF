import { describe, it, expect } from "vitest";
import { MockAIService } from "@/lib/ai/mock-service";
import { INITIAL_RESUME_DATA } from "@/config/layouts";

describe("Camada de Inteligência Artificial (Mock Service & Regras)", () => {
  const ai = new MockAIService();

  it("deve gerar sugestão de resumo profissional baseada nas informações fornecidas", async () => {
    const summary = await ai.suggestSummary({
      jobTitle: "Desenvolvedor Frontend",
      field: "Tecnologia",
      experiences: [
        {
          role: "Programador React",
          company: "WebTech",
          description: "Criação de interfaces responsivas",
        },
      ],
      skills: ["React", "TypeScript", "Tailwind CSS"],
    });

    expect(summary).toBeTruthy();
    expect(summary).toContain("Desenvolvedor Frontend");
    expect(summary).toContain("Tecnologia");
    expect(summary).toContain("WebTech");
  });

  it("deve gerar sugestão adaptada para primeiro emprego quando não houver experiências", async () => {
    const summary = await ai.suggestSummary({
      jobTitle: "Assistente Administrativo",
      field: "Administração",
      experiences: [],
      skills: ["Excel", "Organização"],
    });

    expect(summary).toBeTruthy();
    expect(summary).toContain("Assistente Administrativo");
    expect(summary).toContain("Administração");
    expect(summary).toContain("curva de aprendizado");
  });

  it("deve aprimorar texto de atividades garantindo primeira letra maiúscula e ponto final", async () => {
    const raw = "ajudava em atendimento ao cliente e organizava notas";
    const improved = await ai.improveText({
      rawText: raw,
      context: "experience",
    });

    expect(improved).toBeTruthy();
    expect(improved.endsWith(".")).toBe(true);
    expect(improved.charAt(0)).toBe(improved.charAt(0).toUpperCase());
  });

  it("deve aprimorar currículo completo preservando empresas, cargos e contatos", async () => {
    const originalCompany = INITIAL_RESUME_DATA.experiences[0].company;
    const originalEmail = INITIAL_RESUME_DATA.personal.email;

    const improvedResume = await ai.improveFullResume(INITIAL_RESUME_DATA);

    // Contatos e nomes de empresa devem se manter 100% íntegros
    expect(improvedResume.personal.email).toBe(originalEmail);
    expect(improvedResume.experiences[0].company).toBe(originalCompany);
    expect(improvedResume.target.summary).toBeTruthy();
  });
});
