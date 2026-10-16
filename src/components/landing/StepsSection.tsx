"use client";

import React from "react";
import { SITE_CONFIG } from "@/config/site";
import { FileEdit, Palette, DownloadCloud } from "lucide-react";

export function StepsSection() {
  const icons = [FileEdit, Palette, DownloadCloud];

  return (
    <section className="py-16 sm:py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-100/70 px-3 py-1 rounded-full border border-blue-200">
            Simples e Rápido
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Como funciona em 3 passos
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            Sem processos complicados ou formulários intermináveis.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SITE_CONFIG.steps.map((item, index) => {
            const Icon = icons[index] || FileEdit;
            return (
              <div
                key={item.step}
                className="relative bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center text-center group hover:border-blue-300 transition-all"
              >
                {/* Indicador Numérico */}
                <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-lg mb-4 shadow-sm group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 text-blue-200" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1">
                  Passo 0{item.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
