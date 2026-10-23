"use client";

import React, { useState } from "react";
import { CAROUSEL_EXAMPLES, CarouselExample } from "@/config/carousel-examples";
import ArcFlowCarousel, { SmoothSliderItem } from "@/components/ui/arc-flow-carousel";
import { ModelA4Preview } from "@/components/landing/ModelA4Preview";
import { CompactExampleModal } from "@/components/landing/CompactExampleModal";
import { MoveHorizontal } from "lucide-react";

export function ModelsPreviewSection() {
  const [selectedExample, setSelectedExample] = useState<CarouselExample | null>(null);

  const carouselItems: SmoothSliderItem[] = CAROUSEL_EXAMPLES.map((example) => ({
    id: example.id,
    title: example.shortLabel,
    description: example.resumeData.target.summary,
    badge: example.badge,
    previewNode: (
      <ModelA4Preview
        layoutId={example.layoutId}
        resumeData={example.resumeData}
      />
    ),
  }));

  const handleSelectModel = (item: SmoothSliderItem) => {
    const found = CAROUSEL_EXAMPLES.find((ex) => ex.id === item.id);
    if (found) {
      setSelectedExample(found);
    }
  };

  return (
    <section id="conheca-os-modelos" className="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho Editorial */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-2xs">
            Vitrine Editorial Interativa
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-4">
            Exemplos reais e modelos verdadeiramente distintos
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Cada modelo foi projetado para um momento específico de carreira. Arraste e explore exemplos reais com fidelidade tipográfica e visual impecável.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/80 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            <MoveHorizontal className="w-3.5 h-3.5 text-blue-800 animate-pulse" />
            <span>Arraste ou use o scroll horizontal • Clique em qualquer modelo para ver o exemplo</span>
          </div>
        </div>

        {/* Vitrine Interativa em Arco (ArcFlowCarousel) */}
        <div className="mt-8 sm:mt-12 w-full">
          <ArcFlowCarousel
            items={carouselItems}
            radiusRatio={0.95}
            cardRatio={0.22}
            minCardWidth={210}
            maxCardWidth={290}
            cardAspect={0.71}
            overlap={-0.08}
            arcOffset={0.44}
            smoothing={5.5}
            dragSensitivity={1.3}
            autoRotateSpeed={0.06}
            pauseOnHover={true}
            onSelectCard={handleSelectModel}
            className="rounded-2xl"
          />
        </div>
      </div>

      {/* Modal/Popover Compacto de Visualização (Sem tela cheia) */}
      <CompactExampleModal
        example={selectedExample}
        onClose={() => setSelectedExample(null)}
      />
    </section>
  );
}
