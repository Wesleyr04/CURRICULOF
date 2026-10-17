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

  const setLayout = (layoutId: LayoutType) => {
    onUpdateCustomization({ ...customization, layoutId });
  };

  const setColor = (primaryColor: string) => {
    onUpdateCustomization({ ...customization, primaryColor });
  };

  const setFont = (fontFamily: "sans" | "serif" | "mono") => {
    onUpdateCustomization({ ...customization, fontFamily });
  };

  const setFontSize = (fontSize: "sm" | "base" | "lg") => {
    onUpdateCustomization({ ...customization, fontSize });
  };

  const toggleSectionVisibility = (secKey: string) => {
    const currentHidden = customization.hiddenSections || [];
    const isHidden = currentHidden.includes(secKey);
    const updated = isHidden
      ? currentHidden.filter((s) => s !== secKey)
      : [...currentHidden, secKey];
    onUpdateCustomization({ ...customization, hiddenSections: updated });
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

  const sectionsList = [
    { key: "summary", label: "Resumo Profissional" },
    { key: "experience", label: "Experiências Profissionais" },
    { key: "education", label: "Formação Acadêmica" },
    { key: "technicalSkills", label: "Competências Técnicas" },
    { key: "softSkills", label: "Competências Interpessoais" },
    { key: "certifications", label: "Certificações" },
    { key: "courses", label: "Cursos Livres" },
    { key: "languages", label: "Idiomas" },
  ];

  const currentMode: CreationMode = resumeData.creationMode || "simple";

  return (
    <div className="space-y-8">
      {/* Cabeçalho com Seletor Rápido de Modo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Etapa 6 — Revisão e Personalização</h2>
          <p className="text-xs text-slate-500 mt-1">
            Ajuste o layout, cores e fontes em tempo real. Você pode alternar os modelos sem perder nenhum dado.
          </p>
        </div>

        {onChangeMode && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-300 rounded-lg shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-600" />
              <span>Modo:</span>
            </span>
            <button
              type="button"
              onClick={() => onChangeMode("simple")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                currentMode === "simple"
                  ? "bg-white text-blue-900 shadow-xs border border-blue-200 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Simples
            </button>
            <button
              type="button"
              onClick={() => onChangeMode("complete")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                currentMode === "complete"
                  ? "bg-white text-blue-900 shadow-xs border border-blue-200 font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Completo
            </button>
          </div>
        )}
      </div>

      {/* Alerta de Sucesso da IA */}
      {aiSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-900">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{aiSuccessMessage}</span>
        </div>
      )}

      {/* 1. Escolha de Layout (Os 5 modelos) */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-blue-900" />
          <h3 className="text-sm font-bold text-slate-900">Escolha o Modelo Visual</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

      {/* 2. Cores, Fontes e Tamanhos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cores */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">Cor Principal de Destaque</h3>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-1">
            {COLOR_PALETTES.map((palette) => {
              const isSelected = customization.primaryColor === palette.value;
              return (
                <button
                  key={palette.value}
                  type="button"
                  onClick={() => setColor(palette.value)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isSelected ? "ring-3 ring-blue-500 ring-offset-2 scale-110" : "hover:scale-105"
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
            <h3 className="text-sm font-bold text-slate-900">Família de Fonte</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
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

          <div className="pt-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Tamanho do Texto (Densidade de Página)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFontSize("sm")}
                className={`py-1.5 text-xs rounded border text-center ${
                  customization.fontSize === "sm"
                    ? "border-blue-900 bg-blue-50 font-bold text-blue-950"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                Compacto
              </button>
              <button
                type="button"
                onClick={() => setFontSize("base")}
                className={`py-1.5 text-xs rounded border text-center ${
                  customization.fontSize === "base"
                    ? "border-blue-900 bg-blue-50 font-bold text-blue-950"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                Padrão (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setFontSize("lg")}
                className={`py-1.5 text-xs rounded border text-center ${
                  customization.fontSize === "lg"
                    ? "border-blue-900 bg-blue-50 font-bold text-blue-950"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                Expandido
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visibilidade das Seções */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Seções Visíveis no Currículo</h3>
        <p className="text-xs text-slate-500">
          Você pode desmarcar seções que não deseja exibir no documento final.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {sectionsList.map((sec) => {
            const isVisible = !customization.hiddenSections?.includes(sec.key);
            return (
              <label
                key={sec.key}
                className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggleSectionVisibility(sec.key)}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-800"
                />
                <span className={isVisible ? "text-slate-900 font-medium" : "text-slate-400"}>
                  {sec.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Aprimoramento Geral com IA */}
      <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-1.5 text-blue-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{currentMode === "simple" ? "APRIMORAMENTO PROFISSIONAL FAST — MODO SIMPLES" : "APRIMORAMENTO PROFISSIONAL FAST — MODO COMPLETO"}</span>
          </div>
          <h4 className="font-extrabold text-base">Revisar e Profissionalizar Toda a Redação</h4>
          <p className="text-xs text-blue-100 max-w-xl mt-1 leading-relaxed">
            {currentMode === "simple"
              ? "No Modo Simples, o Fast estrutura frases curtas, objetivas e de leitura rápida, preservando 100% dos seus dados reais sem textos inflados."
              : "No Modo Completo, o Fast estrutura detalhadamente suas atividades, responsabilidades e realizações com alta densidade profissional."}
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
