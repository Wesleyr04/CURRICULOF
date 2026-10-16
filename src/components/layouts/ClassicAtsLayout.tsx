"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Mail, Phone, MapPin, Globe } from "lucide-react";
import { LinkedinIcon } from "@/components/common/Icons";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function ClassicAtsLayout({ data }: LayoutProps) {
  const { personal, target, experiences, education, courses, certifications, technicalSkills, softSkills, languages, customization } = data;
  const primaryColor = customization.primaryColor || "#1e3a8a";

  const isHidden = (sec: string) => customization.hiddenSections?.includes(sec);

  return (
    <div
      className="w-full bg-white text-slate-900 leading-relaxed font-sans"
      style={{
        fontSize: customization.fontSize === "sm" ? "13px" : customization.fontSize === "lg" ? "16px" : "14px",
      }}
    >
      {/* Cabeçalho Tradicional ATS: Alinhamento central, hierarquia clara, sem colunas complexas */}
      <header className="border-b-2 pb-4 text-center" style={{ borderColor: primaryColor }}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
          {personal.fullName || "Seu Nome Completo"}
        </h1>
        {target.jobTitle && (
          <p className="text-base font-semibold mt-1" style={{ color: primaryColor }}>
            {target.jobTitle} {target.field ? `• ${target.field}` : ""}
          </p>
        )}

        <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1 text-xs text-slate-700 mt-2">
          {personal.city && personal.state && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              {personal.city}, {personal.state}
            </span>
          )}
          {personal.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-500" />
              {personal.phone}
            </span>
          )}
          {personal.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-500" />
              <a href={`mailto:${personal.email}`} className="hover:underline">
                {personal.email}
              </a>
            </span>
          )}
          {personal.linkedin && (
            <span className="flex items-center gap-1">
              <LinkedinIcon className="w-3 h-3 text-slate-500" />
              <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline">
                LinkedIn
              </a>
            </span>
          )}
          {personal.portfolio && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-500" />
              <a href={personal.portfolio} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Portfólio / Site
              </a>
            </span>
          )}
        </div>
      </header>

      {/* Conteúdo em Fluxo Linear de Coluna Única (Melhor padrão para ATS) */}
      <div className="py-4 space-y-4">
        {/* Resumo / Objetivo Profissional */}
        {!isHidden("summary") && target.summary && (
          <section>
            <h2
              className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-slate-300"
              style={{ color: primaryColor }}
            >
              Resumo Profissional
            </h2>
            <p className="mt-2 text-slate-800 text-justify text-xs/normal whitespace-pre-line">
              {target.summary}
            </p>
          </section>
        )}

        {/* Experiência Profissional */}
        {!isHidden("experience") && experiences.length > 0 && (
          <section>
            <h2
              className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-slate-300"
              style={{ color: primaryColor }}
            >
              Experiência Profissional
            </h2>
            <div className="mt-2 space-y-3">
              {experiences.map((exp) => (
                <div key={exp.id} className="text-xs">
                  <div className="flex justify-between items-baseline font-semibold text-slate-900">
                    <span className="text-sm text-slate-900">{exp.role}</span>
                    <span className="text-slate-600 font-normal">
                      {exp.startDate} — {exp.current ? "Presente" : exp.endDate}
                    </span>
                  </div>
                  <div className="font-medium text-slate-700 mb-1">{exp.company}</div>
                  {exp.description && (
                    <p className="text-slate-800 whitespace-pre-line leading-relaxed">{exp.description}</p>
                  )}
                  {exp.achievements && (
                    <p className="mt-1 text-slate-700 italic">
                      <strong className="not-italic text-slate-900">Resultados / Conquistas:</strong> {exp.achievements}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Formação Acadêmica */}
        {!isHidden("education") && education.length > 0 && (
          <section>
            <h2
              className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-slate-300"
              style={{ color: primaryColor }}
            >
              Formação Acadêmica
            </h2>
            <div className="mt-2 space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className="text-xs flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-slate-900">{edu.course}</span> — {edu.institution}
                    <div className="text-slate-600">
                      Grau: {edu.degree} • Status: {edu.status === "concluido" ? "Concluído" : edu.status === "cursando" ? "Em andamento" : "Incompleto"}
                    </div>
                  </div>
                  {(edu.startDate || edu.endDate) && (
                    <span className="text-slate-600 whitespace-nowrap">
                      {edu.startDate} {edu.endDate ? `— ${edu.endDate}` : ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Competências e Habilidades (Texto limpo sem gráficos, ideal para robôs) */}
        {!isHidden("technicalSkills") && (technicalSkills.length > 0 || softSkills.length > 0) && (
          <section>
            <h2
              className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-slate-300"
              style={{ color: primaryColor }}
            >
              Competências e Habilidades
            </h2>
            <div className="mt-2 text-xs space-y-1">
              {technicalSkills.length > 0 && (
                <p>
                  <strong className="text-slate-900">Competências Técnicas:</strong>{" "}
                  <span className="text-slate-800">{technicalSkills.join(" • ")}</span>
                </p>
              )}
              {softSkills.length > 0 && (
                <p>
                  <strong className="text-slate-900">Competências Interpessoais:</strong>{" "}
                  <span className="text-slate-800">{softSkills.join(" • ")}</span>
                </p>
              )}
            </div>
          </section>
        )}

        {/* Cursos e Certificações */}
        {((!isHidden("courses") && courses.length > 0) || (!isHidden("certifications") && certifications.length > 0)) && (
          <section>
            <h2
              className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-slate-300"
              style={{ color: primaryColor }}
            >
              Cursos e Certificações
            </h2>
            <div className="mt-2 text-xs space-y-1">
              {certifications.map((cert, i) => (
                <div key={`cert-${i}`} className="text-slate-800">
                  • <strong>Certificação:</strong> {cert}
                </div>
              ))}
              {courses.map((course) => (
                <div key={course.id} className="text-slate-800">
                  • <strong>{course.name}</strong> — {course.institution}{" "}
                  {course.hours ? `(${course.hours})` : ""} {course.year ? `— ${course.year}` : ""}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Idiomas */}
        {!isHidden("languages") && languages.length > 0 && (
          <section>
            <h2
              className="text-sm font-bold uppercase tracking-wider pb-1 border-b border-slate-300"
              style={{ color: primaryColor }}
            >
              Idiomas
            </h2>
            <p className="mt-2 text-xs text-slate-800">
              {languages.map((l) => `${l.name}: ${l.level}`).join(" • ")}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
