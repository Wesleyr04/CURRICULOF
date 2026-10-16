"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, FileText, ShieldCheck, ArrowRight } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

export function Navbar() {
  return (
    <header className="site-header no-print sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/85 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo / Marca */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-blue-900 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-800 transition-colors">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-slate-900 tracking-tight">
                {SITE_CONFIG.name}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 hidden sm:block">
              {SITE_CONFIG.pricing.formatted} por currículo
            </p>
          </div>
        </Link>

        {/* Links de Navegação */}
        <nav className="flex items-center gap-2 sm:gap-6">
          <Link
            href="/modelos"
            className="text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors hidden sm:block"
          >
            Modelos de Currículo
          </Link>
          <Link
            href="/privacidade"
            className="text-sm font-medium text-slate-600 hover:text-blue-900 transition-colors hidden md:flex items-center gap-1"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Privacidade
          </Link>

          {/* Botão de Ação Principal */}
          <Link
            href="/editor?mode=simple"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs hover:shadow transition-all"
          >
            <span>Criar meu currículo</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-80" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
