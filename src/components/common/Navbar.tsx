"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, ShieldCheck, ArrowRight, Download, Menu, X, LayoutTemplate, FileCheck2 } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { useEditor } from "@/context/EditorContext";

export function Navbar() {
  const pathname = usePathname();
  const isEditorView = pathname?.startsWith("/editor");
  const { currentStep: editorStep, triggerDownloadModal } = useEditor();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fecha o menu mobile ao navegar para outra rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleTriggerDownload = () => {
    setIsMobileMenuOpen(false);
    triggerDownloadModal();
  };

  return (
    <header className="site-header no-print sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/90 backdrop-blur-md transition-all">
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

        {/* Links de Navegação Desktop */}
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

          {/* Botão de Ação Principal: No editor, o botão de Download só aparece na Etapa 6 */}
          {isEditorView ? (
            editorStep === 6 ? (
              <button
                type="button"
                onClick={handleTriggerDownload}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs hover:shadow transition-all cursor-pointer animate-pulse"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Currículo</span>
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Etapa {editorStep} de 6</span>
              </div>
            )
          ) : (
            <Link
              href="/editor?mode=simple"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs hover:shadow transition-all"
            >
              <span>Criar meu currículo</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-80" />
            </Link>
          )}

          {/* Botão Hambúrguer Mobile */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            className="sm:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
      </div>

      {/* Dropdown Menu Responsivo Mobile */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2.5 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/modelos"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-50 transition-colors"
          >
            <LayoutTemplate className="w-4 h-4 text-blue-800" />
            <span>Modelos de Currículo</span>
          </Link>

          <Link
            href="/privacidade"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-50 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Política de Privacidade (LGPD)</span>
          </Link>

          <Link
            href="/termos"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-900 hover:bg-slate-50 transition-colors"
          >
            <FileCheck2 className="w-4 h-4 text-slate-500" />
            <span>Termos de Uso</span>
          </Link>

          <div className="pt-2 border-t border-slate-100">
            {!isEditorView ? (
              <Link
                href="/editor?mode=simple"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 text-center text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Criar meu currículo ({SITE_CONFIG.pricing.formatted})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="font-semibold">Modo de Edição</span>
                <span className="font-bold text-blue-900">Etapa {editorStep} de 6</span>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
