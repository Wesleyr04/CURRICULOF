import React from "react";
import { HeroSection } from "@/components/landing/HeroSection";
import { StepsSection } from "@/components/landing/StepsSection";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { ModelsPreviewSection } from "@/components/landing/ModelsPreviewSection";
import { FaqSection } from "@/components/landing/FaqSection";
import Link from "next/link";
import { ArrowRight, ShieldCheck, FileText } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Unificada com Vitrine no Topo (ArcFlowCarousel) */}
      <HeroSection />

      {/* 2. Como funciona em 3 passos */}
      <StepsSection />

      {/* 3. Benefícios */}
      <BenefitsSection />

      {/* 4. Conheça os Modelos (Vitrine Editorial Fiel ao PDF) */}
      <ModelsPreviewSection />

      {/* 5. Perguntas Frequentes */}
      <FaqSection />

      {/* 5. CTA Final */}
      <section className="py-16 bg-blue-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Pronto para transformar sua apresentação profissional?
          </h2>
          <p className="mt-4 text-blue-100 text-base sm:text-lg max-w-2xl mx-auto">
            Por apenas {SITE_CONFIG.pricing.formatted}, sem necessidade de cadastro.
            Preencha seus dados agora e baixe seu currículo profissional formatado em PDF.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/editor?mode=simple"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-blue-900 bg-white hover:bg-blue-50 rounded-xl shadow-lg transition-all"
            >
              <FileText className="w-5 h-5 text-blue-800" />
              <span>Começar meu currículo agora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-blue-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Seus dados nunca são armazenados permanentemente em nossos servidores.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
