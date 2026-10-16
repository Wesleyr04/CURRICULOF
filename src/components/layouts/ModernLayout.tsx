"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Mail, Phone, MapPin, Globe, Briefcase, GraduationCap, Award, CheckCircle2 } from "lucide-react";
import { LinkedinIcon } from "@/components/common/Icons";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function ModernLayout({ data }: LayoutProps) {
  const { personal, target, experiences, education, courses, certifications, technicalSkills, softSkills, languages, customization } = data;
  const primaryColor = customization.primaryColor || "#1e3a8a";

  const isHidden = (sec: string) => customization.hiddenSections?.includes(sec);

  return (
    <div
      className="w-full bg-white text-slate-800 leading-relaxed font-sans"
      style={{
        fontSize: customization.fontSize === "sm" ? "13px" : customization.fontSize === "lg" ? "16px" : "14px",
      }}
    >
      {/* Cabeçalho Moderno com faixa sutil de cor */}
      <header
        className="p-6 text-white rounded-t-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        style={{ backgroundColor: primaryColor }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight uppercase">
            {personal.fullName || "Seu Nome Completo"}
          </h1>
          {target.jobTitle && (
            <p className="text-base font-medium opacity-90 mt-0.5">
              {target.jobTitle} {target.field ? `• ${target.field}` : ""}
            </p>
          )}
        </div>

        {/* Contatos Rápidos no cabeçalho ou lateral */}
        <div className="text-xs space-y-1 opacity-95">
          {personal.city && personal.state && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{personal.city}, {personal.state}</span>
            </div>
          )}
          {personal.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{personal.phone}</span>
            </div>
          )}
          {personal.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <a href={`mailto:${personal.email}`} className="hover:underline">
                {personal.email}
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Grid de 2 Colunas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6">
        {/* Coluna Principal (8 colunas) */}
        <div className="md:col-span-8 space-y-5">
          {/* Resumo Profissional */}
          {!isHidden("summary") && target.summary && (
            <section>
              <div className="flex items-center gap-2 border-b pb-1.5" style={{ borderColor: primaryColor }}>
                <span className="p-1 rounded text-white" style={{ backgroundColor: primaryColor }}>
                  <Briefcase className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Resumo Profissional
                </h2>
              </div>
              <p className="mt-2 text-xs text-slate-700 text-justify leading-relaxed whitespace-pre-line">
                {target.summary}
              </p>
            </section>
          )}

          {/* Experiência Profissional */}
          {!isHidden("experience") && experiences.length > 0 && (
            <section>
              <div className="flex items-center gap-2 border-b pb-1.5" style={{ borderColor: primaryColor }}>
                <span className="p-1 rounded text-white" style={{ backgroundColor: primaryColor }}>
                  <Briefcase className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Experiência Profissional
                </h2>
              </div>
              <div className="mt-3 space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="relative pl-3 border-l-2 text-xs" style={{ borderColor: primaryColor }}>
                    <div className="flex justify-between items-baseline font-bold text-slate-900">
                      <span className="text-sm">{exp.role}</span>
                      <span className="text-slate-500 font-medium text-[11px]">
                        {exp.startDate} — {exp.current ? "Presente" : exp.endDate}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-600 mb-1">{exp.company}</div>
                    {exp.description && (
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">{exp.description}</p>
                    )}
                    {exp.achievements && (
                      <div className="mt-1.5 p-2 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        <strong className="text-slate-900">Destaque:</strong> {exp.achievements}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Formação Acadêmica */}
          {!isHidden("education") && education.length > 0 && (
            <section>
              <div className="flex items-center gap-2 border-b pb-1.5" style={{ borderColor: primaryColor }}>
                <span className="p-1 rounded text-white" style={{ backgroundColor: primaryColor }}>
                  <GraduationCap className="w-3.5 h-3.5" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Formação Acadêmica
                </h2>
              </div>
              <div className="mt-3 space-y-2.5">
                {education.map((edu) => (
                  <div key={edu.id} className="text-xs">
                    <div className="flex justify-between items-baseline font-bold text-slate-900">
                      <span>{edu.course}</span>
                      <span className="text-slate-500 font-normal text-[11px]">
                        {edu.startDate} {edu.endDate ? `— ${edu.endDate}` : ""}
                      </span>
                    </div>
                    <div className="text-slate-700">{edu.institution}</div>
                    <div className="text-[11px] text-slate-500">
                      {edu.degree} • {edu.status === "concluido" ? "Concluído" : edu.status === "cursando" ? "Em andamento" : "Incompleto"}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Coluna Lateral (4 colunas) */}
        <div className="md:col-span-4 space-y-5 bg-slate-50/70 p-4 rounded-md border border-slate-100">
          {/* Links e Redes */}
          {(personal.linkedin || personal.portfolio) && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider pb-1 border-b border-slate-200 text-slate-900 mb-2">
                Conexões
              </h3>
              <div className="space-y-1.5 text-xs">
                {personal.linkedin && (
                  <a
                    href={personal.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-700 hover:underline break-all"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {personal.portfolio && (
                  <a
                    href={personal.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-700 hover:underline break-all"
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span>Portfólio</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Habilidades Técnicas */}
          {!isHidden("technicalSkills") && technicalSkills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider pb-1 border-b border-slate-200 text-slate-900 mb-2">
                Habilidades Técnicas
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {technicalSkills.map((s, idx) => (
                  <span
                    key={`tech-${idx}`}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-800 shadow-xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Habilidades Interpessoais */}
          {!isHidden("softSkills") && softSkills.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider pb-1 border-b border-slate-200 text-slate-900 mb-2">
                Habilidades Interpessoais
              </h3>
              <div className="space-y-1 text-xs">
                {softSkills.map((s, idx) => (
                  <div key={`soft-${idx}`} className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificações */}
          {!isHidden("certifications") && certifications.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider pb-1 border-b border-slate-200 text-slate-900 mb-2">
                Certificações
              </h3>
              <div className="space-y-1.5 text-xs">
                {certifications.map((cert, idx) => (
                  <div key={`cert-${idx}`} className="flex items-start gap-1.5 text-slate-700">
                    <Award className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Idiomas */}
          {!isHidden("languages") && languages.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider pb-1 border-b border-slate-200 text-slate-900 mb-2">
                Idiomas
              </h3>
              <div className="space-y-1.5 text-xs">
                {languages.map((l) => (
                  <div key={l.id} className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-[11px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {l.level}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cursos Livres */}
          {!isHidden("courses") && courses.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider pb-1 border-b border-slate-200 text-slate-900 mb-2">
                Cursos Complementares
              </h3>
              <div className="space-y-2 text-xs">
                {courses.map((c) => (
                  <div key={c.id}>
                    <div className="font-semibold text-slate-800">{c.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {c.institution} {c.hours ? `• ${c.hours}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
