"use client";

import React, { useState } from "react";
import { EducationItem, EducationStatus, CreationMode } from "@/types/resume";
import { Plus, Trash2, ArrowLeft, ArrowRight, GraduationCap, AlertCircle } from "lucide-react";

interface Step4Props {
  education: EducationItem[];
  mode?: CreationMode;
  onChange: (education: EducationItem[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step4Education({ education, onChange, onNext, onPrev }: Step4Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);

  const addEducation = () => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: "",
      course: "",
      degree: "Bacharelado",
      status: "concluido",
      startDate: "",
      endDate: "",
    };
    onChange([...education, newEdu]);
  };

  const removeEducation = (id: string) => {
    if (errors[`endDate-${id}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`endDate-${id}`];
        return next;
      });
    }
    onChange(education.filter((e) => e.id !== id));
  };

  const updateEducation = <K extends keyof EducationItem>(
    id: string,
    field: K,
    value: EducationItem[K]
  ) => {
    if (field === "endDate" || field === "status") {
      if (errors[`endDate-${id}`]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[`endDate-${id}`];
          return next;
        });
      }
      if (submitBanner) {
        setSubmitBanner(null);
      }
    }
    onChange(
      education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  const handleNext = () => {
    const newErrors: Record<string, string> = {};
    const currentYear = new Date().getFullYear();

    education.forEach((edu) => {
      if (edu.status === "concluido") {
        const year = (edu.endDate || "").trim();
        if (!year) {
          newErrors[`endDate-${edu.id}`] = "Informe o ano de conclusão para esta formação concluída.";
        } else {
          const isValid = /^\d{4}$/.test(year);
          const num = parseInt(year, 10);
          if (!isValid || num < 1950 || num > currentYear + 1) {
            newErrors[`endDate-${edu.id}`] = "Informe um ano de conclusão válido com 4 dígitos (ex: 2022).";
          }
        }
      } else if (edu.status === "cursando") {
        const year = (edu.endDate || "").trim();
        if (year) {
          const isValid = /^\d{4}$/.test(year);
          const num = parseInt(year, 10);
          if (!isValid || num < 1950 || num > currentYear + 15) {
            newErrors[`endDate-${edu.id}`] = "Previsão de conclusão deve ser um ano válido com 4 dígitos (ex: 2026).";
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmitBanner("Por favor, preencha o ano de conclusão das formações concluídas destacadas abaixo.");
      const firstErrorKey = Object.keys(newErrors)[0];
      const targetId = `edu-${firstErrorKey}`;
      const el = document.getElementById(targetId);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setErrors({});
    setSubmitBanner(null);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Etapa 4 — Formação Acadêmica</h2>
          <p className="text-xs text-slate-500 mt-1">
            Informe sua escolaridade, graduação ou curso técnico em andamento. O FastCurrículo formata sua formação com padrão acadêmico e profissional.
          </p>
        </div>


        <button
          type="button"
          onClick={addEducation}
          aria-label="Adicionar formação acadêmica"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Formação</span>
        </button>
      </div>

      {/* Banner de Erros de Submissão Inline */}
      {submitBanner && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl flex items-center gap-2.5 text-xs text-rose-900 shadow-2xs animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{submitBanner}</span>
        </div>
      )}

      {education.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">Nenhuma formação registrada</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            Adicione ao menos o Ensino Médio, Curso Técnico ou Superior para enriquecer seu perfil.
          </p>
          <button
            type="button"
            onClick={addEducation}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-900 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 text-blue-700" />
            <span>Adicionar formação acadêmica</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {education.map((edu, idx) => (
            <div
              key={edu.id}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Formação #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeEducation(edu.id)}
                  aria-label={`Remover formação #${idx + 1}`}
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 p-1 hover:bg-rose-50 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Curso */}
                <div>
                  <label htmlFor={`edu-course-${edu.id}`} className="block text-xs font-bold text-slate-700 mb-1">
                    Curso / Formação <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id={`edu-course-${edu.id}`}
                    type="text"
                    required
                    value={edu.course}
                    onChange={(e) => updateEducation(edu.id, "course", e.target.value)}
                    placeholder="Ex: Administração ou Ensino Médio"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                  />
                </div>

                {/* Instituição */}
                <div>
                  <label htmlFor={`edu-institution-${edu.id}`} className="block text-xs font-bold text-slate-700 mb-1">
                    Instituição de Ensino <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id={`edu-institution-${edu.id}`}
                    type="text"
                    required
                    value={edu.institution}
                    onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                    placeholder="Ex: Universidade Anhembi Morumbi"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                  />
                </div>

                {/* Grau / Modalidade */}
                <div>
                  <label htmlFor={`edu-degree-${edu.id}`} className="block text-xs font-bold text-slate-700 mb-1">
                    Grau / Modalidade
                  </label>
                  <select
                    id={`edu-degree-${edu.id}`}
                    value={edu.degree}
                    onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                  >
                    <option value="Ensino Médio">Ensino Médio</option>
                    <option value="Técnico">Curso Técnico</option>
                    <option value="Tecnólogo">Graduação (Tecnólogo)</option>
                    <option value="Bacharelado">Graduação (Bacharelado)</option>
                    <option value="Licenciatura">Graduação (Licenciatura)</option>
                    <option value="Pós-Graduação / Especialização">Pós-Graduação / Especialização</option>
                    <option value="Mestrado">Mestrado</option>
                    <option value="Doutorado">Doutorado</option>
                  </select>
                </div>

                {/* Situação */}
                <div>
                  <label htmlFor={`edu-status-${edu.id}`} className="block text-xs font-bold text-slate-700 mb-1">
                    Situação Atual
                  </label>
                  <select
                    id={`edu-status-${edu.id}`}
                    value={edu.status}
                    onChange={(e) => updateEducation(edu.id, "status", e.target.value as EducationStatus)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                  >
                    <option value="concluido">Concluído</option>
                    <option value="cursando">Cursando / Em andamento</option>
                    <option value="incompleto">Incompleto / Trancado</option>
                  </select>
                </div>

                {/* Data Início */}
                <div>
                  <label htmlFor={`edu-startDate-${edu.id}`} className="block text-xs font-bold text-slate-700 mb-1">
                    Ano / Data de Início
                  </label>
                  <input
                    id={`edu-startDate-${edu.id}`}
                    type="text"
                    value={edu.startDate}
                    onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                    placeholder="Ex: 2021"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                  />
                </div>

                {/* Data Fim */}
                <div>
                  <label htmlFor={`edu-endDate-${edu.id}`} className="block text-xs font-bold text-slate-700 mb-1">
                    {edu.status === "concluido" ? (
                      <>
                        Ano de Conclusão <span className="text-rose-600">*</span>
                      </>
                    ) : edu.status === "cursando" ? (
                      <>
                        Previsão de Conclusão <span className="text-slate-400 font-normal">(Opcional)</span>
                      </>
                    ) : (
                      <>
                        Ano de Término / Saída <span className="text-slate-400 font-normal">(Opcional)</span>
                      </>
                    )}
                  </label>
                  <input
                    id={`edu-endDate-${edu.id}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    required={edu.status === "concluido"}
                    aria-required={edu.status === "concluido"}
                    aria-invalid={Boolean(errors[`endDate-${edu.id}`])}
                    aria-describedby={errors[`endDate-${edu.id}`] ? `error-endDate-${edu.id}` : undefined}
                    value={edu.endDate}
                    onChange={(e) => {
                      const numericOnly = e.target.value.replace(/\D/g, "");
                      updateEducation(edu.id, "endDate", numericOnly);
                    }}
                    placeholder={
                      edu.status === "concluido"
                        ? "Ex: 2023"
                        : edu.status === "cursando"
                        ? "Ex: 2026"
                        : "Ex: 2022"
                    }
                    className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 text-slate-900 transition-colors ${
                      errors[`endDate-${edu.id}`]
                        ? "border-rose-400 focus:ring-rose-500 bg-rose-50/20"
                        : "border-slate-300 focus:ring-blue-800"
                    }`}
                  />
                  {errors[`endDate-${edu.id}`] && (
                    <p
                      id={`error-endDate-${edu.id}`}
                      role="alert"
                      className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1"
                    >
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors[`endDate-${edu.id}`]}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
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
          <span>Voltar para Experiências</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-all flex items-center gap-1"
        >
          <span>Avançar para Habilidades & Cursos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
