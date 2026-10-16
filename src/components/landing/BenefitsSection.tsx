"use client";

import React from "react";
import { SITE_CONFIG } from "@/config/site";
import { ShieldOff, Lock, Sparkles, FileSpreadsheet, Coins, Download, Zap } from "lucide-react";

export function BenefitsSection() {
  const iconMap: Record<string, React.ReactNode> = {
    ShieldOff: <ShieldOff className="w-5 h-5 text-blue-700" />,
    Lock: <Lock className="w-5 h-5 text-emerald-600" />,
    Zap: <Zap className="w-5 h-5 text-amber-600" />,
    Sparkles: <Sparkles className="w-5 h-5 text-indigo-600" />,
    FileSpreadsheet: <FileSpreadsheet className="w-5 h-5 text-blue-700" />,
    Coins: <Coins className="w-5 h-5 text-amber-600" />,
    Download: <Download className="w-5 h-5 text-blue-700" />,
  };

  return (
    <section className="py-16 sm:py-20 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Diferenciais Exclusivos
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            Por que escolher o {SITE_CONFIG.name}?
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            Construído para quem valoriza seu tempo, seu dinheiro e sua privacidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SITE_CONFIG.features.map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex items-start gap-4"
            >
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs shrink-0">
                {iconMap[feature.icon] || <Sparkles className="w-5 h-5 text-blue-700" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
