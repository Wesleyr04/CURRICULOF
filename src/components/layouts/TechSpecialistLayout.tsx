"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Mail, Phone, MapPin, Globe, Terminal, Code2, Cpu, Award, ExternalLink } from "lucide-react";
import { LinkedinIcon } from "@/components/common/Icons";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function TechSpecialistLayout({ data }: LayoutProps) {
  const { personal, target, experiences, education, courses, certifications, technicalSkills, softSkills, languages, customization } = data;
  const primaryColor = customization.primaryColor || "#1e293b"; // Dark slate técnico

  const isHidden = (sec: string) => customization.hiddenSections?.includes(sec);

  return (
    <div
      className="w-full bg-white text-slate-800 leading-relaxed font-sans"
      style={{
        fontSize: customization.fontSize === "sm" ? "13px" : customization.fontSize === "lg" ? "16px" : "14px",
      }}
    >
      {/* Header Dark Técnico */}
      <header className="p-6 bg-slate-900 text-slate-100 border-b-4" style={{ borderColor: primaryColor === "#1e293b" ? "#3b82f6" : primaryColor }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-blue-400 mb-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>// EXPERT_PROFILE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
              {personal.fullName || "Seu Nome Completo"}
            </h1>
            {target.jobTitle && (
              <p className="text-base font-medium text-slate-300 mt-0.5">
                {target.jobTitle} {target.field ? `• ${target.field}` : ""}
              </p>
            )}
          </div>

          {/* Links Técnicos / Contatos */}
          <div className="text-xs font-mono space-y-1 text-slate-300">
            {personal.email && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <a href={`mailto:${personal.email}`} className="text-blue-300 hover:underline">
                  {personal.email}
                </a>
              </div>
            )}
            {personal.phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>{personal.phone}</span>
              </div>
            )}
            {personal.portfolio && (
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <a href={personal.portfolio} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:underline flex items-center gap-1">
                  GitHub / Repositórios <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
            {personal.linkedin && (
              <div className="flex items-center gap-1.5">
                <LinkedinIcon className="w-3.5 h-3.5 text-sky-400" />
                <a href={personal.linkedin} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline flex items-center gap-1">
                  LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
            {personal.city && personal.state && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{personal.city}, {personal.state}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="p-6 space-y-5">
        {/* Stack Tecnológica em Destaque no Topo */}
        {!isHidden("technicalSkills") && technicalSkills.length > 0 && (
          <section className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 mb-2.5">
              <Cpu className="w-4 h-4 text-blue-600" />
              Stack Tecnológica & Ferramentas
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {technicalSkills.map((tech, idx) => (
                <span
                  key={`tech-${idx}`}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded font-mono text-xs font-medium text-slate-800 shadow-2xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Resumo Técnico / Bio */}
        {!isHidden("summary") && target.summary && (
          <section>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
              Sobre o Especialista
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify whitespace-pre-line">
              {target.summary}
            </p>
          </section>
        )}

        {/* Experiência Profissional e Projetos */}
        {!isHidden("experience") && experiences.length > 0 && (
          <section>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-3">
              Projetos & Experiência Profissional
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => (
                <div key={exp.id} className="text-xs border-l-2 border-slate-800 pl-3.5">
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span className="text-sm">{exp.role}</span>
                    <span className="font-mono text-slate-500 font-normal text-[11px]">
                      {exp.startDate} — {exp.current ? "Presente" : exp.endDate}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-700 mb-1">{exp.company}</div>
                  {exp.description && (
                    <p className="text-slate-700 whitespace-pre-line leading-relaxed">{exp.description}</p>
                  )}
                  {exp.achievements && (
                    <div className="mt-1.5 p-2 bg-emerald-50/70 border border-emerald-200 rounded text-emerald-950 font-sans">
                      <strong className="text-emerald-900">Impacto / Entregas Técnicas:</strong> {exp.achievements}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Grid de Formação, Certificações e Idiomas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Formação Acadêmica */}
          {!isHidden("education") && education.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2.5">
                Educação Formal
              </h2>
              <div className="space-y-2 text-xs">
                {education.map((edu) => (
                  <div key={edu.id}>
                    <div className="font-bold text-slate-900">{edu.course}</div>
                    <div className="text-slate-600">{edu.institution}</div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {edu.degree} • {edu.startDate} {edu.endDate ? `— ${edu.endDate}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificações Técnicas */}
          {!isHidden("certifications") && certifications.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2.5">
                Certificações Oficiais
              </h2>
              <div className="space-y-1.5 text-xs">
                {certifications.map((cert, idx) => (
                  <div key={`cert-${idx}`} className="flex items-start gap-1.5 text-slate-800">
                    <Award className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Idiomas & Soft Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {!isHidden("languages") && languages.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                Idiomas
              </h2>
              <div className="text-xs space-y-1">
                {languages.map((l) => (
                  <div key={l.id} className="text-slate-700">
                    <span className="font-semibold">{l.name}:</span> {l.level}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isHidden("softSkills") && softSkills.length > 0 && (
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 mb-2">
                Metodologias & Postura
              </h2>
              <div className="text-xs text-slate-700">
                {softSkills.join(" • ")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
