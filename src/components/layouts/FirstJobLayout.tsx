"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Mail, Phone, MapPin, Globe, Sparkles, GraduationCap, BookOpen, HeartHandshake, Languages } from "lucide-react";
import { LinkedinIcon } from "@/components/common/Icons";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function FirstJobLayout({ data }: LayoutProps) {
  const { personal, target, experiences, education, courses, certifications, technicalSkills, softSkills, languages, customization } = data;
  const primaryColor = customization.primaryColor || "#0f766e"; // tom esmeralda/petróleo fresco e confiável

  const isHidden = (sec: string) => customization.hiddenSections?.includes(sec);

  return (
    <div
      className="w-full bg-white text-slate-800 leading-relaxed font-sans"
      style={{
        fontSize: customization.fontSize === "sm" ? "13px" : customization.fontSize === "lg" ? "16px" : "14px",
      }}
    >
      {/* Cabeçalho Jovem & Profissional */}
      <header className="p-6 bg-slate-50 border-b-2" style={{ borderColor: primaryColor }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white mb-2" style={{ backgroundColor: primaryColor }}>
              <Sparkles className="w-3 h-3" />
              <span>Em busca de oportunidade inicial / Estágio</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {personal.fullName || "Seu Nome Completo"}
            </h1>
            {target.jobTitle && (
              <p className="text-base font-semibold mt-0.5" style={{ color: primaryColor }}>
                Objetivo: {target.jobTitle} {target.field ? `(${target.field})` : ""}
              </p>
            )}
          </div>

          {/* Dados de Contato */}
          <div className="text-xs space-y-1 text-slate-600">
            {personal.city && personal.state && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{personal.city}, {personal.state}</span>
              </div>
            )}
            {personal.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{personal.phone}</span>
              </div>
            )}
            {personal.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <a href={`mailto:${personal.email}`} className="text-blue-700 hover:underline">
                  {personal.email}
                </a>
              </div>
            )}
            {personal.linkedin && (
              <div className="flex items-center gap-1.5">
                <LinkedinIcon className="w-3.5 h-3.5 text-slate-400" />
                <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                  LinkedIn
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="p-6 space-y-5">
        {/* Objetivo / Apresentação do Candidato */}
        {!isHidden("summary") && target.summary && (
          <section className="bg-emerald-50/40 p-3.5 rounded-md border border-emerald-100">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              Perfil & Motivação
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify whitespace-pre-line">
              {target.summary}
            </p>
          </section>
        )}

        {/* Formação Acadêmica em Primeiro Plano para Jovens / Iniciantes */}
        {!isHidden("education") && education.length > 0 && (
          <section>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-1.5 border-b flex items-center gap-1.5"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              <GraduationCap className="w-4 h-4" />
              Formação Acadêmica (Prioridade)
            </h2>
            <div className="mt-3 space-y-2.5">
              {education.map((edu) => (
                <div key={edu.id} className="text-xs bg-white p-2.5 rounded border border-slate-200 shadow-2xs">
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span className="text-sm">{edu.course}</span>
                    <span className="text-slate-500 font-normal text-[11px]">
                      {edu.startDate} {edu.endDate ? `— ${edu.endDate}` : ""}
                    </span>
                  </div>
                  <div className="text-slate-700 font-medium">{edu.institution}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Modalidade: {edu.degree} • Situação:{" "}
                    <span className="font-semibold text-emerald-700">
                      {edu.status === "concluido" ? "Concluído" : edu.status === "cursando" ? "Em andamento" : "Incompleto"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cursos Livres e Capacitações (Muito valorizados para quem busca primeiro emprego) */}
        {!isHidden("courses") && courses.length > 0 && (
          <section>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-1.5 border-b flex items-center gap-1.5"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              <BookOpen className="w-4 h-4" />
              Cursos Extracurriculares e Capacitações
            </h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {courses.map((c) => (
                <div key={c.id} className="p-2 rounded border border-slate-100 bg-slate-50/60">
                  <div className="font-semibold text-slate-900">{c.name}</div>
                  <div className="text-[11px] text-slate-600">
                    {c.institution} {c.hours ? `• Carga: ${c.hours}` : ""} {c.year ? `• ${c.year}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Competências e Habilidades */}
        {!isHidden("technicalSkills") && (technicalSkills.length > 0 || softSkills.length > 0) && (
          <section>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-1.5 border-b flex items-center gap-1.5"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              <HeartHandshake className="w-4 h-4" />
              Competências e Diferenciais
            </h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {technicalSkills.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-[11px] uppercase tracking-wide">
                    Conhecimentos Práticos:
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {technicalSkills.map((s, idx) => (
                      <span key={`t-${idx}`} className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {softSkills.length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-[11px] uppercase tracking-wide">
                    Atitudes & Postura:
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {softSkills.map((s, idx) => (
                      <span key={`s-${idx}`} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[11px]">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Experiências Anteriores (Opcional: Estágios, Projetos Acadêmicos, Trabalhos Voluntários) */}
        {!isHidden("experience") && experiences.length > 0 && (
          <section>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-1.5 border-b flex items-center gap-1.5"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              Experiências Práticas / Atividades Anteriores
            </h2>
            <div className="mt-3 space-y-3 text-xs">
              {experiences.map((exp) => (
                <div key={exp.id} className="border-l-2 pl-3" style={{ borderColor: primaryColor }}>
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{exp.role}</span>
                    <span className="text-slate-500 font-normal text-[11px]">
                      {exp.startDate} — {exp.current ? "Presente" : exp.endDate}
                    </span>
                  </div>
                  <div className="text-slate-600 font-medium">{exp.company}</div>
                  {exp.description && <p className="mt-1 text-slate-700 whitespace-pre-line leading-relaxed">{exp.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Idiomas */}
        {!isHidden("languages") && languages.length > 0 && (
          <section>
            <h2
              className="text-xs font-bold uppercase tracking-wider pb-1.5 border-b flex items-center gap-1.5"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              <Languages className="w-4 h-4" />
              Idiomas
            </h2>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {languages.map((l) => (
                <div key={l.id} className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-slate-800">
                  <span className="font-semibold">{l.name}:</span> <span className="text-slate-600">{l.level}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
