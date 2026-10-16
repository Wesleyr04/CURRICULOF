"use client";

import React, { useState } from "react";
import { CourseItem, LanguageItem, LanguageLevel, CreationMode } from "@/types/resume";
import { Plus, Trash2, X, ArrowLeft, ArrowRight, BookOpen, Award, Languages, Cpu, HeartHandshake, ChevronDown, ChevronUp } from "lucide-react";

interface Step5Props {
  technicalSkills: string[];
  softSkills: string[];
  courses: CourseItem[];
  certifications: string[];
  languages: LanguageItem[];
  mode?: CreationMode;
  onChangeSkills: (tech: string[], soft: string[]) => void;
  onChangeCourses: (courses: CourseItem[]) => void;
  onChangeCertifications: (certs: string[]) => void;
  onChangeLanguages: (langs: LanguageItem[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step5Skills({
  technicalSkills,
  softSkills,
  courses,
  certifications,
  languages,
  mode = "simple",
  onChangeSkills,
  onChangeCourses,
  onChangeCertifications,
  onChangeLanguages,
  onNext,
  onPrev,
}: Step5Props) {
  const [newTech, setNewTech] = useState("");
  const [newSoft, setNewSoft] = useState("");
  const [newCert, setNewCert] = useState("");
  const [showOptionalCerts, setShowOptionalCerts] = useState(certifications.length > 0 || mode === "complete");
  const [showOptionalLangs, setShowOptionalLangs] = useState(languages.length > 0 || mode === "complete");

  // Adição de Skills Técnicas
  const handleAddTech = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newTech.trim() && !technicalSkills.includes(newTech.trim())) {
      onChangeSkills([...technicalSkills, newTech.trim()], softSkills);
      setNewTech("");
    }
  };

  const removeTech = (item: string) => {
    onChangeSkills(technicalSkills.filter((t) => t !== item), softSkills);
  };

  // Adição de Soft Skills
  const handleAddSoft = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newSoft.trim() && !softSkills.includes(newSoft.trim())) {
      onChangeSkills(technicalSkills, [...softSkills, newSoft.trim()]);
      setNewSoft("");
    }
  };

  const removeSoft = (item: string) => {
    onChangeSkills(technicalSkills, softSkills.filter((s) => s !== item));
  };

  // Adição de Certificações
  const handleAddCert = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      onChangeCertifications([...certifications, newCert.trim()]);
      setNewCert("");
    }
  };

  const removeCert = (cert: string) => {
    onChangeCertifications(certifications.filter((c) => c !== cert));
  };

  // Cursos Livres
  const addCourse = () => {
    const newCourse: CourseItem = {
      id: `course-${Date.now()}`,
      name: "",
      institution: "",
      hours: "",
      year: "",
    };
    onChangeCourses([...courses, newCourse]);
  };

  const updateCourse = (id: string, field: keyof CourseItem, value: string) => {
    onChangeCourses(
      courses.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const removeCourse = (id: string) => {
    onChangeCourses(courses.filter((c) => c.id !== id));
  };

  // Idiomas
  const addLanguage = () => {
    const newLang: LanguageItem = {
      id: `lang-${Date.now()}`,
      name: "",
      level: "Intermediário",
    };
    onChangeLanguages([...languages, newLang]);
  };

  const updateLanguage = (id: string, field: keyof LanguageItem, value: any) => {
    onChangeLanguages(
      languages.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  };

  const removeLanguage = (id: string) => {
    onChangeLanguages(languages.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Etapa 5 — Habilidades, Cursos & Idiomas</h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === "simple"
              ? "Destaque suas ferramentas e cursos essenciais de forma direta."
              : "Destaque suas ferramentas de trabalho, certificações e outros conhecimentos relevantes."}
          </p>
        </div>
        <span
          className={`self-start sm:self-auto text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            mode === "simple"
              ? "bg-blue-50 text-blue-900 border-blue-200"
              : "bg-slate-100 text-slate-800 border-slate-300"
          }`}
        >
          {mode === "simple" ? "Modo Simples (Objetivo)" : "Modo Completo (Avançado)"}
        </span>
      </div>

      {/* 1. Competências Técnicas */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-800" />
          <h3 className="text-sm font-bold text-slate-900">Competências Técnicas / Ferramentas</h3>
        </div>
        <p className="text-xs text-slate-500">
          Softwares, linguagens ou métodos que você domina (Ex: Excel Avançado, CRM, Python, Atendimento ao Cliente).
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTech}
            onChange={(e) => setNewTech(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTech(e)}
            placeholder="Digite uma competência e aperte Enter..."
            className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
          />
          <button
            type="button"
            onClick={handleAddTech}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors"
          >
            Adicionar
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {technicalSkills.map((tech) => (
            <span
              key={tech}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 text-xs font-medium border border-blue-200"
            >
              <span>{tech}</span>
              <button
                type="button"
                onClick={() => removeTech(tech)}
                className="hover:text-rose-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 2. Competências Interpessoais (Soft Skills) */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">Competências Interpessoais (Soft Skills)</h3>
        </div>
        <p className="text-xs text-slate-500">
          Atitudes e habilidades comportamentais (Ex: Liderança, Comunicação Clara, Resolução de Conflitos, Organização).
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSoft}
            onChange={(e) => setNewSoft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddSoft(e)}
            placeholder="Digite uma soft skill..."
            className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
          />
          <button
            type="button"
            onClick={handleAddSoft}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Adicionar
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {softSkills.map((soft) => (
            <span
              key={soft}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 text-xs font-medium border border-emerald-200"
            >
              <span>{soft}</span>
              <button
                type="button"
                onClick={() => removeSoft(soft)}
                className="hover:text-rose-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* 3. Cursos Livres e Extracurriculares */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">Cursos Livres e Aperfeiçoamento (Opcional)</h3>
          </div>
          <button
            type="button"
            onClick={addCourse}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Curso</span>
          </button>
        </div>

        {courses.length === 0 && (
          <p className="text-xs text-slate-400 italic">Nenhum curso complementar adicionado (opcional).</p>
        )}

        {courses.map((course) => (
          <div
            key={course.id}
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-2 text-xs relative"
          >
            <div className="md:col-span-2">
              <input
                type="text"
                value={course.name}
                onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                placeholder="Nome do curso (Ex: Gestão de Projetos)"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div>
              <input
                type="text"
                value={course.institution}
                onChange={(e) => updateCourse(course.id, "institution", e.target.value)}
                placeholder="Instituição (Ex: Senac)"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={course.hours || ""}
                onChange={(e) => updateCourse(course.id, "hours", e.target.value)}
                placeholder="Carga (Ex: 40h)"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
              />
              <button
                type="button"
                onClick={() => removeCourse(course.id)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Certificações (Opcional - recolhível no modo simples) */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Certificações Profissionais {mode === "simple" && "(Opcional)"}
            </h3>
          </div>
          {mode === "simple" && !showOptionalCerts && certifications.length === 0 && (
            <button
              type="button"
              onClick={() => setShowOptionalCerts(true)}
              className="text-xs font-semibold text-blue-900 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Certificações</span>
            </button>
          )}
          {mode === "simple" && showOptionalCerts && certifications.length === 0 && (
            <button
              type="button"
              onClick={() => setShowOptionalCerts(false)}
              className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Recolher</span>
            </button>
          )}
        </div>

        {(showOptionalCerts || certifications.length > 0) && (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCert}
                onChange={(e) => setNewCert(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCert(e)}
                placeholder="Ex: Scrum Master PSM I, ITIL v4, CPA-20..."
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddCert}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-600 rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
            <div className="space-y-1.5 pt-1">
              {certifications.map((cert) => (
                <div
                  key={cert}
                  className="flex justify-between items-center px-3 py-1.5 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs text-amber-950"
                >
                  <span>• {cert}</span>
                  <button
                    type="button"
                    onClick={() => removeCert(cert)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 5. Idiomas (Opcional - recolhível no modo simples) */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">
              Idiomas {mode === "simple" && "(Opcional)"}
            </h3>
          </div>
          {mode === "simple" && !showOptionalLangs && languages.length === 0 ? (
            <button
              type="button"
              onClick={() => setShowOptionalLangs(true)}
              className="text-xs font-semibold text-blue-900 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Idiomas</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addLanguage}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Idioma</span>
              </button>
              {mode === "simple" && languages.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowOptionalLangs(false)}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {(showOptionalLangs || languages.length > 0) && (
          <div className="space-y-2">
            {languages.length === 0 && (
              <p className="text-xs text-slate-400 italic">Nenhum idioma informado ainda.</p>
            )}
            {languages.map((lang) => (
              <div
                key={lang.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3 text-xs"
              >
                <input
                  type="text"
                  value={lang.name}
                  onChange={(e) => updateLanguage(lang.id, "name", e.target.value)}
                  placeholder="Ex: Inglês ou Espanhol"
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                />
                <select
                  value={lang.level}
                  onChange={(e) => updateLanguage(lang.id, "level", e.target.value as LanguageLevel)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-slate-900"
                >
                  <option value="Básico">Básico</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                  <option value="Fluente">Fluente</option>
                  <option value="Nativo">Nativo</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeLanguage(lang.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navegação */}
      <div className="pt-4 flex justify-between items-center">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Formação</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-all flex items-center gap-1"
        >
          <span>Avançar para Revisão & Layout</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
