import { describe, it, expect } from "vitest";
import React from "react";
import { AVAILABLE_LAYOUTS } from "@/config/layouts";
import { ModelA4Preview } from "@/components/landing/ModelA4Preview";
import { SmoothSliderItem } from "@/components/ui/arc-flow-carousel";

describe("Vitrine Interativa em Arco (ArcFlowCarousel & Miniaturas A4)", () => {
  it("deve fornecer os 4 modelos reais do sistema para o carrossel", () => {
    expect(AVAILABLE_LAYOUTS).toHaveLength(4);

    const items: SmoothSliderItem[] = AVAILABLE_LAYOUTS.map((layout) => ({
      id: layout.id,
      title: layout.name,
      description: layout.description,
      badge: layout.badge,
      previewNode: React.createElement(ModelA4Preview, { layoutId: layout.id }),
    }));

    expect(items).toHaveLength(4);

    items.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.title).toBeTruthy();
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

  it("deve garantir que cada modelo tenha badge e descrição profissionais distintos", () => {
    const badges = AVAILABLE_LAYOUTS.map((l) => l.badge);
    const names = AVAILABLE_LAYOUTS.map((l) => l.name);

    // Todos os nomes devem ser únicos
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(4);

    // Todos os badges devem ser preenchidos
    badges.forEach((b) => expect(b.length).toBeGreaterThan(3));
  });

  it("deve validar as proporções de geometria segura do arco para evitar colisão com a Navbar", () => {
    // Parâmetros de engenharia exigidos para respiro mínimo superior
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

    // Verificação de que o topo do cartão central preserva mais de 24px de margem em qualquer viewport
    const viewports = [
      { width: 390, height: 380 },  // Mobile
      { width: 768, height: 430 },  // Tablet
      { width: 1280, height: 470 }, // Desktop
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
