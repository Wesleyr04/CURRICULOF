"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, CheckCircle2, Zap, MoveHorizontal } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { AVAILABLE_LAYOUTS } from "@/config/layouts";
import ArcFlowCarousel, { SmoothSliderItem } from "@/components/ui/arc-flow-carousel";
import { ModelA4Preview } from "@/components/landing/ModelA4Preview";

export function HeroSection() {
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
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/40 via-white to-slate-50/70 pt-6 pb-10 md:pt-8 md:pb-12 border-b border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* 1. Badge Superior Compacto */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-900 text-[11px] sm:text-xs font-semibold mb-3 sm:mb-4 shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-blue-700" />
          <span>Apenas {SITE_CONFIG.pricing.formatted} por currículo</span>
          <span className="w-1 h-1 rounded-full bg-blue-600"></span>
          <span className="font-normal text-blue-800">Sem cadastro e sem mensalidade</span>
        </div>

        {/* 2. Título Principal */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-950 max-w-3xl mx-auto leading-tight">
          {SITE_CONFIG.tagline}
        </h1>

        {/* 3. Subtítulo Unificado */}
        <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {SITE_CONFIG.description}
        </p>

        {/* 4. Ação Principal Centralizada (Sem botão redundante de ver modelos) */}
        <div className="mt-5 sm:mt-6 flex justify-center">
          <Link
            href="/editor?mode=simple"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm sm:text-base font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <span>Criar meu currículo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 5. Linha Horizontal Compacta de Confiança */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-y-1.5 gap-x-5 text-[11px] sm:text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Sem cadastro ou login
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Zero armazenamento de dados
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            Pronto em 5 minutos
          </span>
        </div>

        {/* 6. Pílula Sutil de Instrução para o Carrossel */}
        <div className="mt-6 sm:mt-8 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-white/90 px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
          <MoveHorizontal className="w-3.5 h-3.5 text-blue-800 animate-pulse" />
          <span>Arraste ou use o scroll horizontal • Clique em qualquer modelo para começar</span>
        </div>

        {/* 7. Vitrine ArcFlowCarousel Integrada no Topo (Sem colisão com Navbar) */}
        <div className="mt-2 sm:mt-3 w-full">
          <ArcFlowCarousel
            items={carouselItems}
            radiusRatio={0.95}
            cardRatio={0.19}
            minCardWidth={170}
            maxCardWidth={265}
            cardAspect={0.7}
            overlap={-0.05}
            arcOffset={0.56}
            smoothing={5.5}
            dragSensitivity={1.2}
            autoRotateSpeed={0.08}
            pauseOnHover={true}
            onSelectCard={handleSelectModel}
            className="rounded-2xl"
          />
        </div>

        {/* 8. Grade de Acesso Rápido aos 4 Modelos Validados (Abaixo do Carrossel) */}
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-left">
          {AVAILABLE_LAYOUTS.map((layout) => (
            <div
              key={layout.id}
              className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="inline-block text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 mb-1.5 border border-blue-100">
                  {layout.badge}
                </span>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{layout.name}</h3>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {layout.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100">
                <Link
                  href={`/editor?layout=${layout.id}&mode=simple`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 text-[11px] font-bold text-blue-900 hover:text-white bg-blue-50/80 hover:bg-blue-900 rounded-lg transition-colors"
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
