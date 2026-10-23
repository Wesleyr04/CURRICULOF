import { describe, it, expect } from "vitest";
import {
  AVAILABLE_LAYOUTS,
  INITIAL_RESUME_DATA,
  DEMO_RESUME_DATA,
  EMPTY_RESUME_DATA,
  COLOR_PALETTES,
  DEFAULT_LAYOUT_COLORS,
} from "@/config/layouts";
import { LayoutType } from "@/types/resume";

describe("Integridade dos 5 Modelos Validados", () => {
  it("deve conter exatamente os 5 layouts validados por RH com IDs distintos", () => {
    expect(AVAILABLE_LAYOUTS).toHaveLength(5);
    const ids = AVAILABLE_LAYOUTS.map((l) => l.id);
    const expectedIds: LayoutType[] = [
      "first-job",
      "classic-ats",
      "modern",
      "minimalist",
      "tech-specialist",
    ];

    expectedIds.forEach((expected) => {
      expect(ids).toContain(expected);
    });
  });

  it("o layout Clássico ATS deve ser explicitamente marcado como atsFriendly", () => {
    const atsLayout = AVAILABLE_LAYOUTS.find((l) => l.id === "classic-ats");
    expect(atsLayout).toBeDefined();
    expect(atsLayout?.atsFriendly).toBe(true);
  });

  it("o layout Primeiro Emprego deve estar presente e com descrição adequada para início de carreira", () => {
    const firstJobLayout = AVAILABLE_LAYOUTS.find((l) => l.id === "first-job");
    expect(firstJobLayout).toBeDefined();
    expect(firstJobLayout?.recommendedFor).toContain("Estágio");
  });

  it("todos os 5 layouts devem ser compatíveis com os dados padrão do currículo", () => {
    AVAILABLE_LAYOUTS.forEach((layout) => {
      const cloned = JSON.parse(JSON.stringify(INITIAL_RESUME_DATA));
      cloned.customization.layoutId = layout.id;
      expect(cloned.customization.layoutId).toBe(layout.id);
      expect(cloned.personal.fullName).toBeTruthy();
    });
  });

  it("deve suportar e aceitar personalização dinâmica de famílias tipográficas (sans, serif, mono)", () => {
    const fontOptions = ["sans", "serif", "mono"] as const;
    fontOptions.forEach((font) => {
      const data = {
        ...INITIAL_RESUME_DATA,
        customization: {
          ...INITIAL_RESUME_DATA.customization,
          fontFamily: font,
        },
      };
      expect(data.customization.fontFamily).toBe(font);
    });
  });

  it("deve disponibilizar as paletas de cores incluindo o Marrom Executivo, Azul Marinho e a nova cor Amarela", () => {
    expect(COLOR_PALETTES.length).toBeGreaterThanOrEqual(6);

    const hexValues = COLOR_PALETTES.map((c: { value: string }) => c.value);
    expect(hexValues).toContain("#1e3a8a");
    expect(hexValues).toContain("#6e5034");
    expect(hexValues).toContain("#14532d");
    expect(hexValues).toContain("#d97706");
  });

  it("deve permitir alternância e integridade de primaryColor e creationMode", () => {
    const simpleResume = {
      ...INITIAL_RESUME_DATA,
      creationMode: "simple" as const,
      customization: {
        ...INITIAL_RESUME_DATA.customization,
        primaryColor: "#d97706",
      },
    };
    expect(simpleResume.customization.primaryColor).toBe("#d97706");

    const completeResume = {
      ...INITIAL_RESUME_DATA,
      creationMode: "complete" as const,
      customization: {
        ...INITIAL_RESUME_DATA.customization,
        primaryColor: "#6e5034",
      },
    };
    expect(completeResume.creationMode).toBe("complete");
    expect(completeResume.customization.primaryColor).toBe("#6e5034");
  });

  it("deve mapear a paleta de cores característica padrão para cada modelo no DEFAULT_LAYOUT_COLORS", () => {
    expect(DEFAULT_LAYOUT_COLORS["modern"]).toBe("#6e5034"); // Marrom & Moderno
    expect(DEFAULT_LAYOUT_COLORS["minimalist"]).toBe("#1e3a5f"); // Azul Linhas Simples
    expect(DEFAULT_LAYOUT_COLORS["classic-ats"]).toBe("#0f172a"); // Preto / Monocromático
    expect(DEFAULT_LAYOUT_COLORS["first-job"]).toBe("#0f172a"); // Preto & Branco
  });
});

import { calculateSmartLayout, isColorLight } from "@/lib/smart-layout";

describe("Smart Layout Engine (Auto-adaptação e Contraste)", () => {
  it("deve calcular densidade normal/arejada quando o usuário tem poucos dados ou sem experiência", () => {
    const sparseResume = {
      ...INITIAL_RESUME_DATA,
      experiences: [],
      courses: [],
      technicalSkills: ["Comunicação"],
      softSkills: [],
      education: [
        {
          id: "edu1",
          institution: "Escola Exemplo",
          course: "Ensino Médio",
          degree: "Ensino Médio",
          startDate: "2020",
          endDate: "2023",
          status: "concluido" as const,
        },
      ],
    };

    const metrics = calculateSmartLayout(sparseResume);
    expect(metrics.density).toBe("normal");
    expect(metrics.hasExperiences).toBe(false);
    expect(metrics.fontSizePx).toBe("13px");
  });

  it("deve calcular densidade compacta quando o usuário tem alto volume de experiências e qualificações", () => {
    const heavyResume = {
      ...INITIAL_RESUME_DATA,
      experiences: [
        {
          id: "exp1",
          company: "Empresa 1",
          role: "Cargo 1",
          startDate: "2020",
          endDate: "2022",
          current: false,
          description: "Descrição detalhada de atividades de rotina, conciliação e projetos.",
        },
        {
          id: "exp2",
          company: "Empresa 2",
          role: "Cargo 2",
          startDate: "2022",
          endDate: "2024",
          current: false,
          description: "Liderança de projetos complexos, gestão de equipes e relacionamento executivo.",
        },
        {
          id: "exp3",
          company: "Empresa 3",
          role: "Cargo 3",
          startDate: "2024",
          endDate: "2025",
          current: false,
          description: "Atuação estratégica e governança.",
        },
      ],
      courses: [
        { id: "c1", name: "Curso 1", institution: "Inst 1" },
        { id: "c2", name: "Curso 2", institution: "Inst 2" },
      ],
      technicalSkills: ["Excel", "Power BI", "SQL", "Python", "SAP"],
      softSkills: ["Liderança", "Negociação", "Gestão do Tempo"],
    };

    const metrics = calculateSmartLayout(heavyResume);
    expect(metrics.density).toBe("compact");
    expect(metrics.hasExperiences).toBe(true);
    expect(metrics.fontSizePx).toBe("12px");
  });

  it("deve identificar corretamente cores claras vs escuras para contraste WCAG", () => {
    expect(isColorLight("#d97706")).toBe(true); // Amarelo/Ouro
    expect(isColorLight("#ffffff")).toBe(true);
    expect(isColorLight("#0f172a")).toBe(false); // Slate 900
    expect(isColorLight("#1e3a8a")).toBe(false); // Azul Escuro
    expect(isColorLight("#6e5034")).toBe(false); // Marrom
  });

  it("EMPTY_RESUME_DATA deve iniciar limpo sem resquícios de demonstração de TI", () => {
    expect(EMPTY_RESUME_DATA.personal.fullName).toBe("");
    expect(EMPTY_RESUME_DATA.target.jobTitle).toBe("");
    expect(EMPTY_RESUME_DATA.target.field).toBe("");
    expect(EMPTY_RESUME_DATA.target.summary).toBe("");
    expect(EMPTY_RESUME_DATA.experiences).toEqual([]);
    expect(EMPTY_RESUME_DATA.education).toEqual([]);
    expect(EMPTY_RESUME_DATA.technicalSkills).toEqual([]);
    expect(EMPTY_RESUME_DATA.softSkills).toEqual([]);
    expect(DEMO_RESUME_DATA).toBe(INITIAL_RESUME_DATA);
    expect(INITIAL_RESUME_DATA.personal.fullName).toContain("Carlos Eduardo Silva");
  });
});

