import React from "react";
import type { Metadata } from "next";
import { ModelosCatalog } from "@/components/landing/ModelosCatalog";
import { SITE_CONFIG } from "@/config/site";

export const metadata: Metadata = {
  title: `Modelos de Currículo Profissional | ${SITE_CONFIG.name}`,
  description: `Conheça os 4 modelos de currículo desenvolvidos por especialistas em recrutamento. Padrão A4, otimizados para triagem automatizada (ATS/Gupy) por apenas ${SITE_CONFIG.pricing.formatted}.`,
};

export default function ModelosPage() {
  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Página */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
            Catálogo de Modelos
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Escolha o modelo ideal para seu momento profissional
          </h1>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Todos os 4 modelos foram criados seguindo rigorosos padrões de recrutamento, legibilidade e compatibilidade com leitores automatizados de RH.
          </p>
        </div>

        {/* Catálogo Interativo com Prévia Ampliada */}
        <ModelosCatalog />
      </div>
    </div>
  );
}
