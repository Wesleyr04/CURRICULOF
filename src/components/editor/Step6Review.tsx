"use client";

import React, { useState } from "react";
import { ResumeData, CustomizationSettings, LayoutType, CreationMode } from "@/types/resume";
import { AVAILABLE_LAYOUTS, COLOR_PALETTES } from "@/config/layouts";
import {
  Sparkles,
  Download,
  Loader2,
  CheckCircle2,
  Eye,
  Settings2,
  Palette,
  Type,
  Maximize2,
  Trash2,
  ArrowLeft,
  Check,
  ShieldCheck,
  FileText,
  SlidersHorizontal,
  Zap,
} from "lucide-react";

import { SITE_CONFIG } from "@/config/site";

interface Step6Props {
  resumeData: ResumeData;
  onUpdateCustomization: (settings: CustomizationSettings) => void;
  onApplyAiImprovement: (improvedData: ResumeData) => void;
  onOpenCheckout: () => void;
  onNavigateToStep: (stepNumber: number) => void;
  onResetData: () => void;
  onChangeMode?: (mode: CreationMode) => void;
}

export function Step6Review({
  resumeData,
  onUpdateCustomization,
  onApplyAiImprovement,
  onOpenCheckout,
  onNavigateToStep,
  onResetData,
  onChangeMode,
}: Step6Props) {
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  const { customization } = resumeData;

  const DEFAULT_LAYOUT_COLORS: Record<string, string> = {
    "first-job": "#334155",
    "classic-ats": "#0f172a",
    "modern": "#6e5034",
    "minimalist": "#1e3a8a",
    "tech-specialist": "#0f766e",
  };

  const setLayout = (layoutId: LayoutType) => {
    const modelDefaultColor = DEFAULT_LAYOUT_COLORS[layoutId] || "#1e3a8a";
    onUpdateCustomization({
      ...customization,
      layoutId,
      primaryColor: modelDefaultColor,
    });
  };

  const setColor = (primaryColor: string) => {
    onUpdateCustomization({ ...customization, primaryColor });
  };

  const setFont = (fontFamily: "sans" | "serif" | "mono") => {
    onUpdateCustomization({ ...customization, fontFamily });
  };

  const handleFullAiImprovement = async () => {
    setLoadingAi(true);
    setAiSuccessMessage(null);

    try {
      const res = await fetch("/api/ai/improve-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });

      if (!res.ok) {
        throw new Error("Erro na comunicação com a IA.");
      }

      const result = await res.json();
      if (result.resume) {
        onApplyAiImprovement(result.resume);
        setAiSuccessMessage("Redação aprimorada com sucesso pelo Fast, preservando 100% dos seus dados reais!");
        setTimeout(() => setAiSuccessMessage(null), 6000);
      }
    } catch {
      alert("Não foi possível aprimorar a redação no momento. Tente novamente.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Etapa 6 */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Etapa 6 — Revisão e Personalização</h2>
        <p className="text-xs text-slate-500 mt-1">
          A plataforma adapta e estrutura seu currículo automaticamente. Escolha sua referência visual, cor de destaque e tipografia.
        </p>
      </div>

      {/* Banner de Adaptação Inteligente Ativa */}
      <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start sm:items-center gap-3 text-xs text-blue-950 shadow-2xs">
        <Sparkles className="w-5 h-5 text-blue-700 shrink-0 mt-0.5 sm:mt-0" />
        <div>
          <span className="font-bold">Adaptação Inteligente Ativa:</span> O FastCurrículo calcula e ajusta automaticamente os espaçamentos e a densidade de texto para que suas informações fiquem harmônicas e perfeitamente equilibradas em 1 página A4.
        </div>
      </div>

      {/* Alerta de Sucesso da IA */}
      {aiSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{aiSuccessMessage}</span>
        </div>
      )}

      {/* 1. Escolha de Layout (Os 4 Modelos Pré-definidos) */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div>
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">1. Referência Visual de Layout</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Escolha uma referência visual. O FastCurrículo adapta automaticamente as seções de acordo com as informações que você preencheu.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {AVAILABLE_LAYOUTS.map((layout) => {
            const isSelected = customization.layoutId === layout.id;
            return (
              <button
                key={layout.id}
                type="button"
                onClick={() => setLayout(layout.id)}
                className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-900 bg-blue-50/50 ring-2 ring-blue-900/10 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs text-slate-900">{layout.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-blue-900" />}
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {layout.description}
                  </p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-blue-800 font-semibold">{layout.badge}</span>
                  <span className="text-slate-400">A4 PDF</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cores e Tipografia (Foco nos Controles Essenciais) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Cores de Destaque (Incluindo Amarelo) */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">2. Cor Principal de Destaque</h3>
          </div>
          <p className="text-[11px] text-slate-500">
            Aplica-se imediatamente a títulos, linhas divisórias e barras laterais.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {COLOR_PALETTES.map((palette) => {
              const isSelected = customization.primaryColor === palette.value;
              return (
                <button
                  key={palette.value}
                  type="button"
                  onClick={() => setColor(palette.value)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? "ring-3 ring-blue-500 ring-offset-2 scale-110 shadow-xs" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: palette.value }}
                  title={palette.name}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tipografia */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">3. Família de Fonte</h3>
          </div>
          <p className="text-[11px] text-slate-500">
            Tipografia profissional otimizada para sistemas de triagem ATS e leitura humana.
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setFont("sans")}
              className={`py-2 px-3 text-xs font-sans rounded-lg border text-center transition-all ${
                customization.fontFamily === "sans"
                  ? "border-blue-900 bg-blue-50 text-blue-950 font-bold"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              Sans (Moderna)
            </button>
            <button
              type="button"
              onClick={() => setFont("serif")}
              className={`py-2 px-3 text-xs font-serif rounded-lg border text-center transition-all ${
                customization.fontFamily === "serif"
                  ? "border-blue-900 bg-blue-50 text-blue-950 font-bold"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              Serif (Clássica)
            </button>
            <button
              type="button"
              onClick={() => setFont("mono")}
              className={`py-2 px-3 text-xs font-mono rounded-lg border text-center transition-all ${
                customization.fontFamily === "mono"
                  ? "border-blue-900 bg-blue-50 text-blue-950 font-bold"
                  : "border-slate-200 hover:bg-slate-50 text-slate-700"
              }`}
            >
              Mono (Técnica)
            </button>
          </div>
        </div>
      </div>

      {/* 3. Aprimoramento com IA */}
      <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>ESPECIALISTA FAST — ESTRUTURAÇÃO INTELIGENTE</span>
          </div>
          <h4 className="font-extrabold text-base">
            Revisar e Profissionalizar Toda a Redação
          </h4>
          <p className="text-xs text-blue-100 max-w-xl mt-1 leading-relaxed">
            O Fast ajusta e profissionaliza sua redação automaticamente para o formato ideal de recrutamento, destacando suas conquistas e preservando 100% dos seus dados reais.
          </p>
        </div>

        <button
          type="button"
          disabled={loadingAi}
          onClick={handleFullAiImprovement}
          className="px-5 py-2.5 text-xs font-bold text-blue-950 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2 disabled:opacity-50"
        >
          {loadingAi ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-900" />
              <span>Aprimorando com o Fast...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-blue-900" />
              <span>Aprimore com o Fast</span>
            </>
          )}
        </button>
      </div>



      {/* 5. Ação de Checkout Pix e Download */}
      <div className="p-6 bg-emerald-50/70 border border-emerald-300 rounded-2xl text-center space-y-4">
        <div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
            Pronto para baixar
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
            Gere seu currículo profissional por apenas {SITE_CONFIG.pricing.formatted}
          </h3>
          <p className="text-xs text-slate-600 max-w-lg mx-auto mt-1">
            Pagamento único via Pix. Sem mensalidade, sem cadastro e download liberado instantaneamente em formato A4 de alta definição.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCheckout}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
        >
          <Download className="w-5 h-5 text-emerald-200" />
          <span>Finalizar e Baixar PDF ({SITE_CONFIG.pricing.formatted})</span>
        </button>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Privacidade total: Seus dados não ficam salvos em banco de dados.</span>
        </div>
      </div>

      {/* Rodapé com atalho de exclusão total de dados */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
        <button
          type="button"
          onClick={() => onNavigateToStep(1)}
          className="text-xs text-blue-900 hover:underline flex items-center gap-1 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar e editar Dados Pessoais</span>
        </button>

        <button
          type="button"
          onClick={onResetData}
          className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Limpar todos os dados da memória (Descarte LGPD)</span>
        </button>
      </div>
    </div>
  );
}
