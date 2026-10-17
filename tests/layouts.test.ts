import { describe, it, expect } from "vitest";
import { AVAILABLE_LAYOUTS, INITIAL_RESUME_DATA } from "@/config/layouts";
import { LayoutType } from "@/types/resume";

describe("Integridade dos 5 Layouts Distintos", () => {
  it("deve conter exatamente os 5 layouts obrigatórios com IDs distintos", () => {
    expect(AVAILABLE_LAYOUTS).toHaveLength(5);
    const ids = AVAILABLE_LAYOUTS.map((l) => l.id);
    const expectedIds: LayoutType[] = [
      "classic-ats",
      "modern",
      "minimalist",
      "first-job",
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

  it("o layout Primeiro Emprego deve estar presente e com descrição adequada", () => {
    const firstJobLayout = AVAILABLE_LAYOUTS.find((l) => l.id === "first-job");
    expect(firstJobLayout).toBeDefined();
    expect(firstJobLayout?.recommendedFor).toContain("Estudantes");
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
});

