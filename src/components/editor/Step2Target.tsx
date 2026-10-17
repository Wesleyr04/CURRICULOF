"use client";

import React, { useState } from "react";
import { TargetInfo, ResumeData, CreationMode } from "@/types/resume";
import { Sparkles, Loader2, ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";

interface Step2Props {
  data: TargetInfo;
  fullData: ResumeData;
  mode?: CreationMode;
  onChange: (data: TargetInfo) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step2Target({ data, fullData, mode = "simple", onChange, onNext, onPrev }: Step2Props) {
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const activeMode = fullData.creationMode || mode;

  const updateField = (field: keyof TargetInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleRequestAiSuggestion = async () => {
    if (!data.jobTitle.trim() || !data.field.trim()) {
      alert("Por favor, preencha o Cargo Desejado e a Área Profissional antes de solicitar a sugestão do Fast.");
      return;
    }

    setLoadingAi(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/suggest-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: data.jobTitle,
          field: data.field,
          mode: activeMode,
          experiences: fullData.experiences.map((e) => ({
            role: e.role,
            company: e.company,
            description: e.description,
          })),
          skills: fullData.technicalSkills,
          education: fullData.education.map((ed) => ({
            course: ed.course,
            institution: ed.institution,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Falha ao comunicar com o serviço Fast.");
      }

      const result = await res.json();
      if (result.summary) {
        updateField("summary", result.summary);
      }
    } catch (err: any) {
      setAiError(err?.message || "Não foi possível gerar a sugestão do Fast no momento.");
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.jobTitle.trim() || !data.field.trim()) {
      alert("Preencha o cargo desejado e a área profissional para continuar.");
      return;
    }
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Etapa 2 — Cargo Pretendido & Objetivo</h2>
        <p className="text-xs text-slate-500 mt-1">
          Defina o foco da sua candidatura. O resumo profissional é opcional: se você preferir não preencher, o FastCurrículo ajusta a estrutura para valorizar suas qualificações.
        </p>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cargo Desejado */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Cargo Pretendido <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={data.jobTitle}
            onChange={(e) => updateField("jobTitle", e.target.value)}
            placeholder="Ex: Analista Financeiro Júnior"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
          />
        </div>

        {/* Área Profissional */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Área de Atuação <span className="text-rose-600">*</span>
          </label>
          <input
            type="text"
            required
            value={data.field}
            onChange={(e) => updateField("field", e.target.value)}
            placeholder="Ex: Controladoria & Finanças"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
          />
        </div>
      </div>

      {/* Resumo ou Objetivo Profissional */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Resumo / Perfil Profissional{" "}
            {activeMode === "simple" ? (
              <span className="text-slate-400 font-normal">(Opcional no Modo Simples)</span>
            ) : (
              <span className="text-slate-400 font-normal">(Recomendado)</span>
            )}
          </label>
          {/* Botão de Sugestão Fast */}
          <button
            type="button"
            disabled={loadingAi}
            onClick={handleRequestAiSuggestion}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-md bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
          >
            {loadingAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />
                <span>Fast gerando síntese objetiva...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                <span>Sugestão do Fast</span>
              </>
            )}
          </button>
        </div>

        <textarea
          rows={activeMode === "simple" ? 3 : 5}
          value={data.summary}
          onChange={(e) => updateField("summary", e.target.value)}
          placeholder={
            activeMode === "simple"
              ? "Ex: Profissional focado em suporte técnico com vivência em atendimento e sustentação de sistemas. (Ou use 'Sugestão do Fast' para resumo direto)"
              : "Escreva brevemente seu perfil ou clique em 'Sugestão do Fast' para estruturar uma apresentação focada sem inventar fatos..."
          }
          className="w-full p-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900 leading-relaxed"
        />

        {aiError && (
          <p className="mt-1.5 text-xs text-rose-600 font-medium">
            {aiError}
          </p>
        )}

        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            {activeMode === "simple"
              ? "Modo Simples ativo: o Fast produz sínteses curtas e diretas, sem adjetivos vazios."
              : "Modo Completo ativo: apresentação estruturada detalhadamente com base nas suas informações."}
          </span>
        </div>
      </div>

      <div className="pt-4 flex justify-between items-center">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Dados Pessoais</span>
        </button>

        <button
          type="submit"
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-all flex items-center gap-1"
        >
          <span>Avançar para Experiências</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
