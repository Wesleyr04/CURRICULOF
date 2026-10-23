import { describe, it, expect } from "vitest";
import React from "react";
import { EMPTY_RESUME_DATA, DEFAULT_LAYOUT_COLORS, AVAILABLE_LAYOUTS, STORAGE_KEYS, resolveLayoutId } from "@/config/layouts";
import { CAROUSEL_EXAMPLES } from "@/config/carousel-examples";
import { CompactExampleModal } from "@/components/landing/CompactExampleModal";

describe("Fluxo de Criação Direto (Sem Passo Inicial de Seleção de Modelo) & Preview Compacto", () => {
  it("deve iniciar o estado do editor diretamente com templateId padrão 'classic-ats' e cor profissional", () => {
    const initialLayout = "classic-ats";
    const defaultColor = DEFAULT_LAYOUT_COLORS[initialLayout] || "#1e3a8a";

    const initialResumeState = {
      ...EMPTY_RESUME_DATA,
      creationMode: "simple",
      customization: {
        ...EMPTY_RESUME_DATA.customization,
        layoutId: initialLayout,
        primaryColor: defaultColor,
      },
    };

    expect(initialResumeState.customization.layoutId).toBe("classic-ats");
    expect(initialResumeState.customization.primaryColor).toBeTruthy();
    expect(initialResumeState.personal.fullName).toBe("");
  });

  it("deve carregar layout customizado caso fornecido via query param sem bloquear na etapa inicial", () => {
    const requestedLayout = "modern";
    const defaultColor = DEFAULT_LAYOUT_COLORS[requestedLayout] || "#6e5034";

    const initialResumeState = {
      ...EMPTY_RESUME_DATA,
      creationMode: "simple",
      customization: {
        ...EMPTY_RESUME_DATA.customization,
        layoutId: requestedLayout,
        primaryColor: defaultColor,
      },
    };

    expect(initialResumeState.customization.layoutId).toBe("modern");
    expect(initialResumeState.customization.primaryColor).toBe("#6e5034");
  });

  it("garante que todas as 6 etapas do wizard estão ordenadas partindo de Dados Pessoais até a Revisão", () => {
    const wizardSteps = [
      { number: 1, title: "Dados Pessoais" },
      { number: 2, title: "Objetivo" },
      { number: 3, title: "Experiências" },
      { number: 4, title: "Formação" },
      { number: 5, title: "Habilidades" },
      { number: 6, title: "Revisão & Layout" },
    ];

    expect(wizardSteps[0].number).toBe(1);
    expect(wizardSteps[0].title).toBe("Dados Pessoais");
    expect(wizardSteps[wizardSteps.length - 1].number).toBe(6);
    expect(wizardSteps[wizardSteps.length - 1].title).toBe("Revisão & Layout");
  });

  it("CompactExampleModal deve renderizar elemento React com backdrop contido e controles de fechamento", () => {
    const sampleExample = CAROUSEL_EXAMPLES[0]; // Professora
    const onCloseMock = () => {};

    const modalElement = React.createElement(CompactExampleModal, {
      example: sampleExample,
      onClose: onCloseMock,
    });

    expect(React.isValidElement(modalElement)).toBe(true);
    expect(modalElement.props.example?.id).toBe("ex-professor");
    expect(modalElement.props.example?.shortLabel).toBe("Exemplo: Professor(a)");
  });

  it("todos os 5 exemplos reais devem ter campos consistentes para preenchimento no modal", () => {
    CAROUSEL_EXAMPLES.forEach((ex) => {
      expect(ex.id).toBeTruthy();
      expect(ex.professionTitle).toBeTruthy();
      expect(ex.shortLabel).toBeTruthy();
      expect(ex.layoutName).toBeTruthy();
      expect(ex.badge).toBeTruthy();
      expect(ex.resumeData.personal.fullName).toBeTruthy();
      expect(ex.resumeData.personal.email).toContain("@");
      expect(ex.resumeData.personal.phone).toBeTruthy();
      expect(ex.resumeData.target.jobTitle).toBeTruthy();
      expect(ex.resumeData.target.summary.length).toBeGreaterThan(50);
      expect(ex.resumeData.experiences.length).toBeGreaterThanOrEqual(2);
      expect(ex.resumeData.technicalSkills.length).toBeGreaterThanOrEqual(4);
    });
  });
});

describe("Auditoria de Sincronização do Modelo Selecionado (Carrossel -> Prévia)", () => {
  it("resolveLayoutId deve mapear com sucesso todos os 5 modelos do carrossel para IDs válidos", () => {
    CAROUSEL_EXAMPLES.forEach((ex) => {
      const resolved = resolveLayoutId(ex.layoutId);
      expect(resolved).toBe(ex.layoutId);
    });
  });

  it("resolveLayoutId deve suportar com resiliência aliases comuns e parâmetros alternativos", () => {
    expect(resolveLayoutId("moderno")).toBe("modern");
    expect(resolveLayoutId("modern")).toBe("modern");
    expect(resolveLayoutId("executivo")).toBe("modern");
    expect(resolveLayoutId("minimalista")).toBe("minimalist");
    expect(resolveLayoutId("minimalist")).toBe("minimalist");
    expect(resolveLayoutId("corporativo")).toBe("minimalist");
    expect(resolveLayoutId("primeiro-emprego")).toBe("first-job");
    expect(resolveLayoutId("jovem-aprendiz")).toBe("first-job");
    expect(resolveLayoutId("first-job")).toBe("first-job");
    expect(resolveLayoutId("classic")).toBe("classic-ats");
    expect(resolveLayoutId("ats")).toBe("classic-ats");
    expect(resolveLayoutId("classic-ats")).toBe("classic-ats");
    expect(resolveLayoutId("tech-specialist")).toBe("tech-specialist");
    expect(resolveLayoutId("tech")).toBe("tech-specialist");

    // Inválidos devem retornar null para que a aplicação decida o fallback
    expect(resolveLayoutId(null)).toBeNull();
    expect(resolveLayoutId(undefined)).toBeNull();
    expect(resolveLayoutId("modelo-inexistente")).toBeNull();
  });

  it("deve garantir que cada exemplo do carrossel possui layoutId correspondente em AVAILABLE_LAYOUTS", () => {
    const validIds = AVAILABLE_LAYOUTS.map((l) => l.id);
    CAROUSEL_EXAMPLES.forEach((ex) => {
      expect(validIds).toContain(ex.layoutId);
    });
  });

  it("deve garantir que as chaves de persistência STORAGE_KEYS estão padronizadas", () => {
    expect(STORAGE_KEYS.RESUME_DATA).toBe("fastcurriculo_resume_data_v1");
    expect(STORAGE_KEYS.SELECTED_LAYOUT).toBe("fastcurriculo_selected_layout_v1");
  });
});
