"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { CarouselExample } from "@/config/carousel-examples";
import { STORAGE_KEYS, DEFAULT_LAYOUT_COLORS } from "@/config/layouts";
import { ResumeRenderer } from "@/components/layouts/ResumeRenderer";
import { X, ArrowRight, Sparkles } from "lucide-react";

interface CompactExampleModalProps {
  example: CarouselExample | null;
  onClose: () => void;
}

export function CompactExampleModal({ example, onClose }: CompactExampleModalProps) {
  useEffect(() => {
    if (!example) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Bloqueia scroll no body enquanto o modal estiver aberto
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [example, onClose]);

  if (!example) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-preview-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      {/* Container Centralizado Compacto (w-[90vw] max-w-lg max-h-[80vh]) */}
      <div
        className="w-[90vw] max-w-lg max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden relative transform transition-all duration-200 my-auto"
      >
        {/* Cabeçalho Sticky com Título e Botão ✕ Fechar */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200">
                <Sparkles className="w-2.5 h-2.5 text-blue-700" />
                <span>{example.badge}</span>
              </span>
            </div>
            <h3
              id="modal-preview-title"
              className="text-xs sm:text-sm font-bold text-slate-900 truncate"
              title={`${example.layoutName} — ${example.shortLabel}`}
            >
              <span className="font-semibold text-slate-700">{example.layoutName}</span>
              <span className="mx-1 text-slate-400">•</span>
              <span className="text-blue-900 font-extrabold">{example.shortLabel}</span>
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors cursor-pointer active:scale-95 border border-slate-200"
            aria-label="Fechar visualização de exemplo"
          >
            <X className="w-4 h-4 text-slate-600" />
            <span>Fechar</span>
          </button>
        </div>

        {/* Corpo com Scroll Suave e Leitura Confortável dos Textos Reais */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-100/70 scrollbar-thin">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 overflow-hidden">
            <ResumeRenderer
              data={example.resumeData}
              rootId={`compact-preview-sheet-${example.id}`}
              isPdfView={false}
            />
          </div>
        </div>

        {/* Rodapé Fixo com Ação Rápida */}
        <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 sm:px-5 flex items-center justify-between gap-3 shadow-2xs">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1.5 px-2"
          >
            ✕ Voltar
          </button>

          <Link
            href={`/editor?layout=${example.layoutId}&mode=simple`}
            onClick={() => {
              if (typeof window !== "undefined") {
                try {
                  localStorage.setItem(STORAGE_KEYS.SELECTED_LAYOUT, example.layoutId);
                  const defaultColor =
                    example.resumeData.customization?.primaryColor ||
                    DEFAULT_LAYOUT_COLORS[example.layoutId] ||
                    "#1e3a8a";
                  localStorage.setItem("fastcurriculo_selected_color_v1", defaultColor);
                } catch (e) {
                  console.error("Erro ao persistir layout selecionado:", e);
                }
              }
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 transition-colors shadow-xs active:scale-98"
          >
            <span>Usar este modelo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
