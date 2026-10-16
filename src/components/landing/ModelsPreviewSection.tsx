"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AVAILABLE_LAYOUTS } from "@/config/layouts";
import ArcFlowCarousel, { SmoothSliderItem } from "@/components/ui/arc-flow-carousel";
import { ModelA4Preview } from "@/components/landing/ModelA4Preview";
import { ArrowRight, MoveHorizontal, Check, Eye } from "lucide-react";

export function ModelsPreviewSection() {
  const router = useRouter();

  const carouselItems: SmoothSliderItem[] = AVAILABLE_LAYOUTS.map((layout) => ({
    id: layout.id,
    title: layout.name,
    description: layout.description,
    badge: layout.badge,
    previewNode: <ModelA4Preview layoutId={layout.id} />,
  }));

  const handleSelectModel = (item: SmoothSliderItem) => {
    if (item.id) {
      router.push(`/editor?layout=${item.id}&mode=simple`);
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50/50 to-white border-b border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho Editorial */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-2xs">
            Vitrine Editorial Interativa
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-4">
            Cinco layouts verdadeiramente distintos
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Cada modelo foi projetado para um momento específico de carreira. Arraste e explore as folhas em formato A4 com fidelidade tipográfica e visual impecável.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/80 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
            <MoveHorizontal className="w-3.5 h-3.5 text-blue-800 animate-pulse" />
            <span>Arraste ou use o scroll horizontal • Clique em qualquer modelo para começar</span>
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

        {/* Grade de Ações Rápidas por Modelo */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {AVAILABLE_LAYOUTS.map((layout) => (
            <div
              key={layout.id}
              className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-500 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 mb-2 border border-blue-100">
                  {layout.badge}
                </span>
                <h3 className="font-bold text-slate-900 text-sm">{layout.name}</h3>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {layout.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/editor?layout=${layout.id}&mode=simple`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-bold text-blue-900 hover:text-white bg-blue-50/70 hover:bg-blue-900 rounded-lg transition-colors"
                >
                  <span>Usar modelo</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
