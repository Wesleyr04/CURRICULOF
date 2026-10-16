"use client";

import React from "react";
import { CreationMode } from "@/types/resume";
import { Zap, Layers, Check, Info } from "lucide-react";

interface ModeSelectorProps {
  mode: CreationMode;
  onSelectMode: (mode: CreationMode) => void;
  hasDetailedData?: boolean;
}

export function ModeSelector({ mode, onSelectMode, hasDetailedData = false }: ModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Modo Simples */}
        <button
          type="button"
          onClick={() => onSelectMode("simple")}
          className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
            mode === "simple"
              ? "border-blue-900 bg-blue-50/60 ring-2 ring-blue-900/10 shadow-xs"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                <Zap className="w-3 h-3 text-emerald-700" />
                Recomendado • 3 a 5 min
              </span>
              {mode === "simple" && (
                <div className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <h3 className="font-bold text-slate-900 text-base">Modo Simples</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Foco em objetividade e rapidez. Ideal para currículos diretos, estudantes ou primeiro emprego.
            </p>

            <ul className="mt-3 space-y-1 text-[11px] text-slate-500">
              <li>✓ Contatos essenciais e localização</li>
              <li>✓ Cargo pretendido e formação acadêmica</li>
              <li>✓ Experiências diretas (ou currículo sem experiência)</li>
              <li>✓ Habilidades e cursos principais</li>
            </ul>
          </div>
        </button>

        {/* Modo Completo */}
        <button
          type="button"
          onClick={() => onSelectMode("complete")}
          className={`p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
            mode === "complete"
              ? "border-blue-900 bg-blue-50/60 ring-2 ring-blue-900/10 shadow-xs"
              : "border-slate-200 hover:border-slate-300 bg-white"
          }`}
        >
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                <Layers className="w-3 h-3 text-blue-700" />
                Detalhado e Completo
              </span>
              {mode === "complete" && (
                <div className="w-5 h-5 rounded-full bg-blue-900 text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <h3 className="font-bold text-slate-900 text-base">Modo Completo</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Foco em profundidade e controle. Ideal para profissionais experientes e especialistas técnicos.
            </p>

            <ul className="mt-3 space-y-1 text-[11px] text-slate-500">
              <li>✓ Todos os campos do Modo Simples</li>
              <li>✓ Descrições detalhadas de atividades e realizações</li>
              <li>✓ Projetos, links de portfólio e GitHub</li>
              <li>✓ Certificações oficiais e múltiplos idiomas</li>
            </ul>
          </div>
        </button>
      </div>

      {/* Aviso de Transição Segura */}
      {mode === "simple" && hasDetailedData && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            <strong>Seus dados continuam salvos:</strong> As informações detalhadas (certificações, idiomas ou conquistas) preenchidas anteriormente permanecem guardadas na memória e voltarão a ser exibidas caso você retorne ao Modo Completo.
          </span>
        </div>
      )}
    </div>
  );
}
