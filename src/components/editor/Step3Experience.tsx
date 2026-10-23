"use client";

import React, { useState } from "react";
import { ExperienceItem, CreationMode, CareerStage } from "@/types/resume";
import { Plus, Trash2, Sparkles, Loader2, ArrowLeft, ArrowRight, Briefcase, AlertCircle } from "lucide-react";
import { sanitizeAiErrorMessage } from "@/lib/ai/errors";

interface Step3Props {
  experiences: ExperienceItem[];
  jobTitle?: string;
  careerStage?: CareerStage;
  careerContext?: string;
  mode?: CreationMode;
  onChange: (experiences: ExperienceItem[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step3Experience({
  experiences,
  jobTitle,
  careerStage,
  careerContext,
  mode = "simple",
  onChange,
  onNext,
  onPrev,
}: Step3Props) {
  const [loadingAiId, setLoadingAiId] = useState<string | null>(null);
  const [showAchievementsMap, setShowAchievementsMap] = useState<Record<string, boolean>>({});
  const [aiFeedbackMap, setAiFeedbackMap] = useState<
    Record<string, { type: "error" | "info"; message: string }>
  >({});

  const addExperience = () => {
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
      achievements: "",
    };
    onChange([...experiences, newExp]);
  };

  const removeExperience = (id: string) => {
    onChange(experiences.filter((e) => e.id !== id));
    setAiFeedbackMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateExperience = <K extends keyof ExperienceItem>(
    id: string,
    field: K,
    value: ExperienceItem[K]
  ) => {
    if (field === "description" && aiFeedbackMap[id]) {
      setAiFeedbackMap((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
    onChange(
      experiences.map((exp) => {
        if (exp.id === id) {
          const updated = { ...exp, [field]: value };
          if (field === "current" && value === true) {
            updated.endDate = "Atual";
          }
          return updated;
        }
        return exp;
      })
    );
  };

  const handleImproveWithAi = async (exp: ExperienceItem) => {
    if (!exp.description.trim()) {
      setAiFeedbackMap((prev) => ({
        ...prev,
        [exp.id]: {
          type: "error",
          message: "Escreva ao menos algumas palavras sobre suas atividades para o Fast aprimorar.",
        },
      }));
      return;
    }

    setLoadingAiId(exp.id);
    setAiFeedbackMap((prev) => {
      const next = { ...prev };
      delete next[exp.id];
      return next;
    });

    try {
      const res = await fetch("/api/ai/improve-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: exp.description,
          context: "experience",
          jobTitle: exp.role || jobTitle,
          careerStage,
          careerContext,
          company: exp.company,
          achievements: exp.achievements,
          mode,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Erro no aprimoramento de texto");
      }

      const result = await res.json();
      if (result.improvedText) {
        updateExperience(exp.id, "description", result.improvedText);
      }
    } catch (err: unknown) {
      setAiFeedbackMap((prev) => ({
        ...prev,
        [exp.id]: {
          type: "error",
          message: sanitizeAiErrorMessage(err),
        },
      }));
    } finally {
      setLoadingAiId(null);
    }
  };

  const toggleAchievements = (id: string) => {
    setShowAchievementsMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Etapa 3 — Experiência Profissional</h2>
          <p className="text-xs text-slate-500 mt-1">
            Adicione suas experiências anteriores. Se estiver em busca do 1º emprego ou estágio, avance diretamente: a plataforma adapta o currículo dando destaque total à sua formação.
          </p>
        </div>


        <button
          type="button"
          onClick={addExperience}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Experiência</span>
        </button>
      </div>

      {/* Lista de Experiências */}
      {experiences.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Nenhuma experiência adicionada</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Procurando seu primeiro emprego ou estágio? Não se preocupe! Você pode continuar sem adicionar experiências e valorizar sua formação na próxima etapa.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={addExperience}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-900 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4 text-blue-700" />
              <span>Adicionar uma experiência</span>
            </button>
            <button
              type="button"
              onClick={onNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
            >
              <span>Continuar sem experiência (1º Emprego) →</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {experiences.map((exp, index) => {
            const hasAchievements = Boolean(exp.achievements?.trim());
            const isAchievementsVisible = mode === "complete" || hasAchievements || showAchievementsMap[exp.id];

            return (
              <div
                key={exp.id}
                className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4 relative"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Experiência #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExperience(exp.id)}
                    aria-label={`Remover experiência #${index + 1}`}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 p-1 hover:bg-rose-50 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`exp-company-${exp.id}`} className="block text-xs font-bold text-slate-700 mb-1">
                      Empresa <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id={`exp-company-${exp.id}`}
                      type="text"
                      required
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                      placeholder="Ex: Magazine Luiza ou Freelancer"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                    />
                  </div>

                  <div>
                    <label htmlFor={`exp-role-${exp.id}`} className="block text-xs font-bold text-slate-700 mb-1">
                      Cargo / Função <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id={`exp-role-${exp.id}`}
                      type="text"
                      required
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                      placeholder="Ex: Assistente Comercial"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                    />
                  </div>

                  <div>
                    <label htmlFor={`exp-startDate-${exp.id}`} className="block text-xs font-bold text-slate-700 mb-1">
                      Data de Início <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id={`exp-startDate-${exp.id}`}
                      type="text"
                      value={exp.startDate}
                      onChange={(e) => updateExperience(exp.id, "startDate", e.target.value)}
                      placeholder="Ex: Março 2022 ou 03/2022"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor={`exp-endDate-${exp.id}`} className="block text-xs font-bold text-slate-700">
                        Data de Término
                      </label>
                      <label htmlFor={`exp-current-${exp.id}`} className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          id={`exp-current-${exp.id}`}
                          type="checkbox"
                          checked={exp.current}
                          onChange={(e) => updateExperience(exp.id, "current", e.target.checked)}
                          className="rounded border-slate-300 text-blue-900 focus:ring-blue-800"
                        />
                        <span>Emprego Atual</span>
                      </label>
                    </div>
                    <input
                      id={`exp-endDate-${exp.id}`}
                      type="text"
                      disabled={exp.current}
                      value={exp.current ? "Presente / Atual" : exp.endDate}
                      onChange={(e) => updateExperience(exp.id, "endDate", e.target.value)}
                      placeholder="Ex: Janeiro 2024"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>
                </div>

                {/* Banner de feedback de IA inline */}
                {aiFeedbackMap[exp.id] && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="p-2.5 bg-rose-50 border border-rose-300 rounded-lg flex items-center gap-2 text-xs text-rose-900 shadow-2xs animate-in fade-in duration-150"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{aiFeedbackMap[exp.id].message}</span>
                  </div>
                )}

                {/* Descrição das Atividades com botão de IA */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor={`exp-description-${exp.id}`} className="block text-xs font-bold text-slate-700">
                      Principais Atividades
                    </label>
                    <button
                      type="button"
                      disabled={loadingAiId === exp.id}
                      onClick={() => handleImproveWithAi(exp)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {loadingAiId === exp.id ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-blue-700" />
                          <span>Aprimorando com o Fast...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-blue-700" />
                          <span>Aprimore com o Fast</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    id={`exp-description-${exp.id}`}
                    rows={mode === "simple" ? 2 : 3}
                    value={exp.description}
                    onChange={(e) => updateExperience(exp.id, "description", e.target.value)}
                    placeholder="Descreva suas tarefas. Ex: Atendimento a clientes, conciliação bancária, lançamento de notas..."
                    className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900 leading-relaxed"
                  />
                </div>

                {/* Resultados ou Conquistas (condicional ou expansível no modo simples) */}
                {isAchievementsVisible ? (
                  <div>
                    <label htmlFor={`exp-achievements-${exp.id}`} className="block text-xs font-bold text-slate-700 mb-1">
                      Resultados / Conquistas <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      id={`exp-achievements-${exp.id}`}
                      type="text"
                      value={exp.achievements || ""}
                      onChange={(e) => updateExperience(exp.id, "achievements", e.target.value)}
                      placeholder="Ex: Atingimento de 120% da meta de vendas trimestral ou redução de retrabalho"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                    />
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleAchievements(exp.id)}
                      className="text-[11px] text-blue-900 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Adicionar conquistas/resultados nesta experiência (Opcional)</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Navegação */}
      <div className="pt-4 flex justify-between items-center">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Objetivo</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-all flex items-center gap-1"
        >
          <span>Avançar para Formação</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
