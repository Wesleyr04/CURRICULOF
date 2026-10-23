"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Phone, Mail, MapPin } from "lucide-react";
import { calculateSmartLayout } from "@/lib/smart-layout";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function FirstJobLayout({ data, isPdfView = false }: LayoutProps) {
  const { personal, target, experiences, education, courses, technicalSkills, softSkills, customization } = data;

  const metrics = calculateSmartLayout(data);
  const primaryColor = customization.primaryColor || "#0f172a";

  const isUserProvided = Boolean(personal.fullName?.trim() || personal.email?.trim() || isPdfView);

  // Fallbacks elegantes fiéis ao modelo validado de exemplo apenas se formulário não preenchido
  const displayName = personal.fullName?.trim() || (isUserProvided ? "" : "Felipe Mesquita");
  const displaySubtitle = target.jobTitle?.trim() || (isUserProvided ? "" : "Jovem Aprendiz | Primeiro Emprego");
  const displayPhone = personal.phone?.trim() || (isUserProvided ? "" : "(12) 3456-7890");
  const displayEmail = personal.email?.trim() || (isUserProvided ? "" : "ola@grandesite.com.br");
  const displayLocation = personal.city && personal.state
    ? `${personal.city}, ${personal.state}`
    : (isUserProvided ? "" : "Rua Alegre, 123 - Cidade Brasileira");

  const fullSummary = target.summary?.trim() || (isUserProvided ? "" : "Busco oportunidade como Jovem Aprendiz para desenvolver habilidades práticas em rotinas administrativas e atendimento. Comprometido com aprendizado rápido, pontualidade e dedicação para contribuir positivamente com a equipe.");
  const displaySummary = fullSummary;

  const displayedTechSkills = technicalSkills.filter((s) => s && s.trim());
  const displayedSoftSkills = softSkills.filter((s) => s && s.trim());

  const showSummary = Boolean(displaySummary);
  const showEducation = education.length > 0 || !isUserProvided;
  const showCourses = courses.length > 0 || (!isUserProvided && !metrics.hasExperiences);
  const showSkills = displayedTechSkills.length > 0 || displayedSoftSkills.length > 0 || !isUserProvided;
  const showExperiences = experiences.length > 0 || (!isUserProvided && metrics.hasExperiences);

  return (
    <div
      className="w-full bg-white text-slate-900 leading-normal p-8 sm:p-10 select-text"
      style={{
        fontSize: metrics.fontSizePx,
      }}
    >
      {/* Cabeçalho Literal Modelo 1: Esquerda Nome/Subtítulo, Direita Contatos com Ícones */}
      <header
        className="flex flex-row justify-between items-start gap-4 pb-4 border-b-2"
        style={{ borderColor: primaryColor }}
      >
        <div className="space-y-0.5">
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase"
            style={{ color: primaryColor }}
          >
            {displayName || "Seu Nome Completo"}
          </h1>
          {displaySubtitle && (
            <p className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide">
              {displaySubtitle}
            </p>
          )}
        </div>

        {/* Lista vertical compacta de contatos com ícones discretos */}
        <div className="text-[11px] sm:text-xs text-slate-700 space-y-1 sm:text-right shrink-0">
          {displayPhone && (
            <div className="flex items-center sm:justify-end gap-1.5">
              <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: primaryColor }} />
              <span>{displayPhone}</span>
            </div>
          )}
          {displayEmail && (
            <div className="flex items-center sm:justify-end gap-1.5">
              <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: primaryColor }} />
              <span>{displayEmail}</span>
            </div>
          )}
          {displayLocation && (
            <div className="flex items-center sm:justify-end gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: primaryColor }} />
              <span>{displayLocation}</span>
            </div>
          )}
          {personal.linkedin && (
            <div className="text-[10px] text-slate-500">
              {personal.linkedin.replace(/^https?:\/\/(www\.)?/, "")}
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo em 1 Coluna Enxuta com auto-adaptação */}
      <div className={`pt-4 ${metrics.density === "compact" ? "space-y-3.5" : "space-y-5"}`}>
        {/* 1. Objetivo Profissional */}
        {showSummary && (
          <section>
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: primaryColor, borderColor: "#cbd5e1" }}
            >
              Objetivo Profissional
            </h2>
            <p className="mt-1.5 text-xs text-slate-700 leading-relaxed text-justify">
              {displaySummary}
            </p>
          </section>
        )}

        {/* 2. Formação Acadêmica */}
        {showEducation && (
          <section>
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: primaryColor, borderColor: "#cbd5e1" }}
            >
              Formação Acadêmica
            </h2>
            <div className="mt-2 space-y-2">
              {education.length > 0 ? (
                education.map((edu) => (
                  <div key={edu.id} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900">{edu.course || edu.degree || "Ensino Médio"}</span>
                      <span className="text-slate-600 text-[11px]">
                        {edu.endDate ? `Conclusão: ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <div className="text-slate-700 text-[11px]">
                      {edu.institution || "Instituição de Ensino"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">Ensino Médio</span>
                    <span className="text-slate-600 text-[11px]">Conclusão: Dez/2025</span>
                  </div>
                  <div className="text-slate-700 text-[11px]">Colégio Estadual Presidente Kennedy</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3. Cursos Complementares (2 subcolunas limpas) */}
        {showCourses && (
          <section>
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: primaryColor, borderColor: "#cbd5e1" }}
            >
              Cursos Complementares
            </h2>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <div key={course.id} className="bg-slate-50/60 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-900 block">{course.name}</span>
                    <span className="text-slate-600 text-[11px]">
                      {course.institution} {course.year ? `• ${course.year}` : ""} {course.hours ? `(${course.hours})` : ""}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-slate-50/60 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-900 block">Informática Básica e Pacote Office</span>
                    <span className="text-slate-600 text-[11px]">Fundação Bradesco • 2024 (40h)</span>
                  </div>
                  <div className="bg-slate-50/60 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-900 block">Atendimento ao Cliente & Comunicação</span>
                    <span className="text-slate-600 text-[11px]">SEBRAE • 2024 (20h)</span>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* 4. Habilidades e Competências */}
        {showSkills && (
          <section>
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: primaryColor, borderColor: "#cbd5e1" }}
            >
              Habilidades e Competências
            </h2>
            <div className="mt-2 space-y-1.5 text-xs text-slate-800">
              {displayedTechSkills.length > 0 && (
                <div>
                  <strong className="text-slate-950">• Técnicas:</strong>{" "}
                  <span className="text-slate-700">
                    {displayedTechSkills.join(", ")}
                  </span>
                </div>
              )}
              {displayedSoftSkills.length > 0 && (
                <div>
                  <strong className="text-slate-950">• Comportamentais:</strong>{" "}
                  <span className="text-slate-700">
                    {displayedSoftSkills.join(", ")}
                  </span>
                </div>
              )}
              {!isUserProvided && displayedTechSkills.length === 0 && displayedSoftSkills.length === 0 && (
                <>
                  <div>
                    <strong className="text-slate-950">• Técnicas:</strong>{" "}
                    <span className="text-slate-700">Word, Excel básico, digitação rápida e organização de arquivos digitais.</span>
                  </div>
                  <div>
                    <strong className="text-slate-950">• Comportamentais:</strong>{" "}
                    <span className="text-slate-700">Pontualidade, vontade de aprender, boa comunicação interpessoal e trabalho em equipe.</span>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* 5. Atividades Extracurriculares e Voluntariado */}
        {showExperiences && (
          <section>
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: primaryColor, borderColor: "#cbd5e1" }}
            >
              Atividades Extracurriculares e Voluntariado
            </h2>
            <div className="mt-2 space-y-2 text-xs">
              {experiences.length > 0 ? (
                experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline font-bold text-slate-900">
                      <span>{exp.role} | {exp.company}</span>
                      <span className="text-slate-500 font-normal text-[11px]">
                        {exp.startDate} {exp.endDate ? `— ${exp.endDate}` : ""}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div>
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span>Voluntário em Arrecadação de Alimentos | Ação Social Comunitária</span>
                    <span className="text-slate-500 font-normal text-[11px]">2023 — 2024</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    Apoio na recepção de doações, triagem e controle de itens para entrega a famílias do bairro.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
