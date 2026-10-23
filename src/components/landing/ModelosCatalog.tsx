"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AVAILABLE_LAYOUTS, INITIAL_RESUME_DATA, STORAGE_KEYS } from "@/config/layouts";
import { ResumeRenderer } from "@/components/layouts/ResumeRenderer";
import { ModelA4Preview } from "@/components/landing/ModelA4Preview";
import { LayoutType } from "@/types/resume";
import { ArrowRight, Eye, CheckCircle2, X } from "lucide-react";

export function ModelosCatalog() {
  const [previewLayout, setPreviewLayout] = useState<LayoutType | null>(null);

  return (
    <>
      {/* Grade com os 4 Modelos Validados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {AVAILABLE_LAYOUTS.map((layout) => (
          <div
            key={layout.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between overflow-hidden"
          >
            <div>
              {/* Miniatura A4 realista do layout */}
              <div className="p-4 sm:p-5 bg-slate-100/70 border-b border-slate-200 relative group">
                <div className="w-full aspect-[794/1123] bg-white rounded-lg shadow-sm border border-slate-200/90 overflow-hidden select-none">
                  <ModelA4Preview layoutId={layout.id} />
                </div>

                {/* Botão de Pré-visualização Ampliada */}
                <button
                  type="button"
                  onClick={() => setPreviewLayout(layout.id)}
                  className="absolute inset-0 bg-blue-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-semibold text-sm transition-opacity backdrop-blur-2xs rounded-t-2xl cursor-pointer"
                >
                  <Eye className="w-5 h-5" />
                  <span>Ver prévia ampliada</span>
                </button>
              </div>

              {/* Conteúdo Informativo */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                    {layout.badge}
                  </span>
                  {layout.atsFriendly && (
                    <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Compatível com ATS
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-slate-900">{layout.name}</h2>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  {layout.description}
                </p>

                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] text-slate-700">
                  <strong className="text-slate-900">Recomendado para:</strong> {layout.recommendedFor}
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="p-6 pt-0 flex gap-2">
              <button
                type="button"
                onClick={() => setPreviewLayout(layout.id)}
                className="flex-1 py-2.5 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Prévia</span>
              </button>
              <Link
                href={`/editor?layout=${layout.id}`}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    try {
                      localStorage.setItem(STORAGE_KEYS.SELECTED_LAYOUT, layout.id);
                    } catch (e) {
                      console.error("Erro ao persistir layout selecionado:", e);
                    }
                  }
                }}
                className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <span>Escolher</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Pré-visualização Ampliada */}
      {previewLayout && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Barra de Título do Modal */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">
                  Pré-visualização do Modelo: {AVAILABLE_LAYOUTS.find((l) => l.id === previewLayout)?.name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-medium">
                  {AVAILABLE_LAYOUTS.find((l) => l.id === previewLayout)?.badge}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/editor?layout=${previewLayout}`}
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      try {
                        localStorage.setItem(STORAGE_KEYS.SELECTED_LAYOUT, previewLayout);
                      } catch (e) {
                        console.error("Erro ao persistir layout selecionado:", e);
                      }
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
                >
                  Usar este modelo
                </Link>
                <button
                  type="button"
                  onClick={() => setPreviewLayout(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Renderização em Tempo Real do Modelo com Dados Exemplo */}
            <div className="p-6 overflow-y-auto bg-slate-200/40 flex justify-center">
              <div className="w-full max-w-[210mm] bg-white shadow-xl rounded p-6">
                <ResumeRenderer
                  data={{
                    ...INITIAL_RESUME_DATA,
                    customization: {
                      ...INITIAL_RESUME_DATA.customization,
                      layoutId: previewLayout,
                    },
                  }}
                  isPdfView={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
