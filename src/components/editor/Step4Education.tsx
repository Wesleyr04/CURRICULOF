"use client";

import React from "react";
import { EducationItem, EducationStatus } from "@/types/resume";
import { Plus, Trash2, ArrowLeft, ArrowRight, GraduationCap } from "lucide-react";

interface Step4Props {
  education: EducationItem[];
  onChange: (education: EducationItem[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step4Education({ education, onChange, onNext, onPrev }: Step4Props) {
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
    onChange(education.filter((e) => e.id !== id));
  };

  const updateEducation = (id: string, field: keyof EducationItem, value: any) => {
    onChange(
      education.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Etapa 4 — Formação Acadêmica</h2>
          <p className="text-xs text-slate-500 mt-1">
            Informe sua escolaridade, graduações, cursos técnicos ou pós-graduações.
          </p>
        </div>

        <button
          type="button"
          onClick={addEducation}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Formação</span>
        </button>
      </div>

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
                  className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 p-1 hover:bg-rose-50 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Curso */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Curso / Formação <span className="text-rose-600">*</span>
                  </label>
                  <input
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instituição de Ensino <span className="text-rose-600">*</span>
                  </label>
                  <input
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Grau / Modalidade
                  </label>
                  <select
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Situação Atual
                  </label>
                  <select
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ano / Data de Início
                  </label>
                  <input
                    type="text"
                    value={edu.startDate}
                    onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                    placeholder="Ex: 2021"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                  />
                </div>

                {/* Data Fim */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Previsão ou Ano de Conclusão
                  </label>
                  <input
                    type="text"
                    value={edu.endDate}
                    onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                    placeholder="Ex: 2024"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
                  />
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
          onClick={onNext}
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-all flex items-center gap-1"
        >
          <span>Avançar para Habilidades & Cursos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
