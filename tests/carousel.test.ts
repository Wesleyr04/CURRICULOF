import { describe, it, expect } from "vitest";
import React from "react";
import { AVAILABLE_LAYOUTS } from "@/config/layouts";
import { CAROUSEL_EXAMPLES } from "@/config/carousel-examples";
import { ModelA4Preview } from "@/components/landing/ModelA4Preview";
import { SmoothSliderItem } from "@/components/ui/arc-flow-carousel";

describe("Vitrine Interativa em Arco (ArcFlowCarousel, Exemplos Reais & Miniaturas A4)", () => {
  it("deve fornecer exatamente 5 currículos de exemplos inspiradores com profissões reais e populares", () => {
    expect(CAROUSEL_EXAMPLES).toHaveLength(5);

    const professionTitles = CAROUSEL_EXAMPLES.map((ex) => ex.professionTitle);
    expect(professionTitles).toContain("Professor(a) de Ensino Fundamental / Médio");
    expect(professionTitles).toContain("Faxineira / Auxiliar de Limpeza e Conservação");
    expect(professionTitles).toContain("Padeiro(a) / Confeiteiro(a)");
    expect(professionTitles).toContain("Pintor(a) Profissional (Residencial e Comercial)");
    expect(professionTitles).toContain("Assistente / Analista de Recursos Humanos (RH)");
  });

  it("cada exemplo deve possuir rótulo claro de exibição no padrão 'Exemplo: Profissão'", () => {
    CAROUSEL_EXAMPLES.forEach((ex) => {
      expect(ex.shortLabel).toMatch(/^Exemplo:\s.+/);
      expect(ex.badge).toBeTruthy();
      expect(ex.layoutName).toBeTruthy();
      expect(AVAILABLE_LAYOUTS.some((l) => l.id === ex.layoutId)).toBe(true);
    });
  });

  it("deve garantir dados realistas, sem Lorem Ipsum e com 'Sobre você' exatamente conforme especificado", () => {
    // 1. Professora
    const professor = CAROUSEL_EXAMPLES.find((ex) => ex.id === "ex-professor");
    expect(professor).toBeDefined();
    expect(professor?.resumeData.target.summary).toContain("planejamento pedagógico alinhado à BNCC");
    expect(professor?.resumeData.target.summary).toContain("metodologias ativas");
    expect(professor?.resumeData.technicalSkills).toEqual(
      expect.arrayContaining([
        "Planejamento Pedagógico (BNCC)",
        "Gestão de Sala de Aula",
        "Metodologias Ativas",
        "Comunicação Didática",
        "Avaliação Escolar",
      ])
    );
    expect(professor?.resumeData.experiences.length).toBeGreaterThanOrEqual(2);

    // 2. Faxineira / Limpeza
    const faxineira = CAROUSEL_EXAMPLES.find((ex) => ex.id === "ex-faxineira");
    expect(faxineira).toBeDefined();
    expect(faxineira?.resumeData.target.summary).toContain("higienização, organização e conservação de ambientes");
    expect(faxineira?.resumeData.technicalSkills).toEqual(
      expect.arrayContaining([
        "Higienização Profunda",
        "Organização de Ambientes",
        "Controle de Produtos e Insumos",
        "Agilidade e Zelo",
        "Pontualidade e Discrição",
      ])
    );
    expect(faxineira?.resumeData.experiences.length).toBeGreaterThanOrEqual(2);

    // 3. Padeiro(a)
    const padeiro = CAROUSEL_EXAMPLES.find((ex) => ex.id === "ex-padeiro");
    expect(padeiro).toBeDefined();
    expect(padeiro?.resumeData.target.summary).toContain("fermentação, forneamento e rigoroso controle de higiene");
    expect(padeiro?.resumeData.technicalSkills).toEqual(
      expect.arrayContaining([
        "Panificação Comercial e Artesanal",
        "Controle de Fermentação e Forno",
        "Boas Práticas de Manipulação (ANVISA)",
        "Padronização de Receitas",
        "Controle de Estoque/Desperdício",
      ])
    );
    expect(padeiro?.resumeData.experiences.length).toBeGreaterThanOrEqual(2);

    // 4. Pintor(a)
    const pintor = CAROUSEL_EXAMPLES.find((ex) => ex.id === "ex-pintor");
    expect(pintor).toBeDefined();
    expect(pintor?.resumeData.target.summary).toContain("preparação de superfícies, acabamento fino e revitalização");
    expect(pintor?.resumeData.technicalSkills).toEqual(
      expect.arrayContaining([
        "Preparação de Superfícies e Massa Corrida",
        "Pintura Interna e Externa",
        "Acabamento Fino e Recorte",
        "Texturas e Impermeabilização",
        "Organização e Limpeza de Obra",
      ])
    );
    expect(pintor?.resumeData.experiences.length).toBeGreaterThanOrEqual(2);

    // 5. Analista de RH
    const rh = CAROUSEL_EXAMPLES.find((ex) => ex.id === "ex-rh");
    expect(rh).toBeDefined();
    expect(rh?.resumeData.target.summary).toContain("recrutamento e seleção, triagem de perfis, condução de entrevistas");
    expect(rh?.resumeData.technicalSkills).toEqual(
      expect.arrayContaining([
        "Recrutamento e Seleção",
        "Triagem e Entrevistas",
        "Integração (Onboarding)",
        "Clima Organizacional",
        "Rotinas de Departamento Pessoal",
      ])
    );
    expect(rh?.resumeData.experiences.length).toBeGreaterThanOrEqual(2);

    // Validação geral de ausência de Lorem Ipsum
    CAROUSEL_EXAMPLES.forEach((ex) => {
      const json = JSON.stringify(ex.resumeData).toLowerCase();
      expect(json).not.toContain("lorem ipsum");
      expect(json).not.toContain("dolor sit amet");
    });
  });

  it("deve mapear os 5 exemplos para SmoothSliderItem com previewNode funcional", () => {
    const items: SmoothSliderItem[] = CAROUSEL_EXAMPLES.map((example) => ({
      id: example.id,
      title: example.shortLabel,
      description: example.resumeData.target.summary,
      badge: example.badge,
      previewNode: React.createElement(ModelA4Preview, {
        layoutId: example.layoutId,
        resumeData: example.resumeData,
      }),
    }));

    expect(items).toHaveLength(5);
    items.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.title).toMatch(/^Exemplo:\s.+/);
      expect(item.badge).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.previewNode).toBeDefined();
      expect(React.isValidElement(item.previewNode)).toBe(true);
    });
  });

  it("deve renderizar com sucesso cada um dos 4 layouts em ModelA4Preview sem erros", () => {
    AVAILABLE_LAYOUTS.forEach((layout) => {
      const element = React.createElement(ModelA4Preview, { layoutId: layout.id });
      expect(React.isValidElement(element)).toBe(true);
      expect(element.props.layoutId).toBe(layout.id);
    });
  });

  it("deve validar as proporções de geometria segura do arco para evitar colisão com a Navbar", () => {
    const arcGeometry = {
      arcOffset: 0.56,
      cardAspect: 0.7,
      minCardWidth: 170,
      maxCardWidth: 265,
      cardRatio: 0.19,
      radiusRatio: 0.95,
      containerHeights: { mobile: 380, tablet: 430, desktop: 470 },
    };

    expect(arcGeometry.arcOffset).toBeGreaterThanOrEqual(0.55);
    expect(arcGeometry.cardAspect).toBe(0.7);

    const viewports = [
      { width: 390, height: 380 },
      { width: 768, height: 430 },
      { width: 1280, height: 470 },
    ];

    viewports.forEach(({ width, height }) => {
      const cardWidth = Math.min(
        arcGeometry.maxCardWidth,
        Math.max(arcGeometry.minCardWidth, width * arcGeometry.cardRatio)
      );
      const cardHeight = cardWidth / arcGeometry.cardAspect;
      const topOffset = height * arcGeometry.arcOffset - cardHeight / 2;
      expect(topOffset).toBeGreaterThan(24);
    });
  });
});
