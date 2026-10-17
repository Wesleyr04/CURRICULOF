"use client";

import React from "react";
import { ResumeData } from "@/types/resume";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function MinimalistLayout({ data }: LayoutProps) {
  const { personal, target, experiences, education, courses, certifications, technicalSkills, softSkills, languages, customization } = data;
  const primaryColor = customization.primaryColor || "#334155";

  const isHidden = (sec: string) => customization.hiddenSections?.includes(sec);

  return (
    <div
      className="w-full bg-white text-neutral-800 leading-relaxed p-8 md:p-12"
      style={{
        fontSize: customization.fontSize === "sm" ? "13px" : customization.fontSize === "lg" ? "16px" : "14px",
      }}
    >
      {/* Cabeçalho Minimalista Editorial */}
      <header className="mb-8">
        <h1 className="text-3xl font-light tracking-tight text-neutral-900">
          {personal.fullName || "Seu Nome Completo"}
        </h1>
        {target.jobTitle && (
          <p className="text-sm tracking-widest uppercase font-medium mt-1 text-neutral-500">
            {target.jobTitle} {target.field ? `— ${target.field}` : ""}
          </p>
        )}

        {/* Linha discreta de contatos */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500 mt-3 border-t border-neutral-200 pt-3">
          {personal.city && personal.state && <span>{personal.city}, {personal.state}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.email && (
            <a href={`mailto:${personal.email}`} className="text-neutral-700 hover:text-black">
              {personal.email}
            </a>
          )}
          {personal.linkedin && (
            <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="text-neutral-700 hover:text-black">
              LinkedIn
            </a>
          )}
          {personal.portfolio && (
            <a href={personal.portfolio} target="_blank" rel="noopener noreferrer" className="text-neutral-700 hover:text-black">
              Portfólio
            </a>
          )}
        </div>
      </header>

      {/* Corpo com Grid de Linha Fina (coluna lateral de títulos de seção) */}
      <div className="space-y-6">
        {/* Resumo */}
        {!isHidden("summary") && target.summary && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Perfil
            </h2>
            <div className="md:col-span-3 text-xs leading-relaxed text-neutral-800 text-justify whitespace-pre-line">
              {target.summary}
            </div>
          </section>
        )}

        {/* Experiências */}
        {!isHidden("experience") && experiences.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-neutral-100 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Trajetória
            </h2>
            <div className="md:col-span-3 space-y-5">
              {experiences.map((exp) => (
                <div key={exp.id} className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-neutral-900 text-sm">{exp.role}</span>
                    <span className="text-neutral-400 text-[11px]">
                      {exp.startDate} — {exp.current ? "Presente" : exp.endDate}
                    </span>
                  </div>
                  <div className="text-neutral-600 mb-1.5 font-medium">{exp.company}</div>
                  {exp.description && (
                    <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{exp.description}</p>
                  )}
                  {exp.achievements && (
                    <p className="mt-1 text-neutral-500 italic">
                      <span className="font-medium not-italic text-neutral-700">Conquista:</span> {exp.achievements}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Formação */}
        {!isHidden("education") && education.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-neutral-100 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Formação
            </h2>
            <div className="md:col-span-3 space-y-3">
              {education.map((edu) => (
                <div key={edu.id} className="text-xs">
                  <div className="flex justify-between items-baseline font-medium text-neutral-900">
                    <span>{edu.course}</span>
                    <span className="text-neutral-400 text-[11px]">
                      {edu.startDate} {edu.endDate ? `— ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <div className="text-neutral-600">{edu.institution}</div>
                  <div className="text-neutral-400 text-[11px]">
                    {edu.degree} • {edu.status === "concluido" ? "Concluído" : edu.status === "cursando" ? "Cursando" : "Incompleto"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Competências */}
        {!isHidden("technicalSkills") && (technicalSkills.length > 0 || softSkills.length > 0) && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-neutral-100 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Habilidades
            </h2>
            <div className="md:col-span-3 text-xs space-y-2">
              {technicalSkills.length > 0 && (
                <div>
                  <span className="font-medium text-neutral-900">Técnicas: </span>
                  <span className="text-neutral-600">{technicalSkills.join(", ")}</span>
                </div>
              )}
              {softSkills.length > 0 && (
                <div>
                  <span className="font-medium text-neutral-900">Comportamentais: </span>
                  <span className="text-neutral-600">{softSkills.join(", ")}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Certificações & Cursos */}
        {((!isHidden("certifications") && certifications.length > 0) || (!isHidden("courses") && courses.length > 0)) && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-neutral-100 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Extensão
            </h2>
            <div className="md:col-span-3 text-xs space-y-1 text-neutral-700">
              {certifications.map((c, idx) => (
                <div key={`c-${idx}`}>• {c}</div>
              ))}
              {courses.map((c) => (
                <div key={c.id}>
                  • {c.name} — {c.institution} {c.year ? `(${c.year})` : ""}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Idiomas */}
        {!isHidden("languages") && languages.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-neutral-100 pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Idiomas
            </h2>
            <div className="md:col-span-3 text-xs text-neutral-700">
              {languages.map((l) => `${l.name} (${l.level})`).join(" • ")}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
