"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Phone, Mail, MapPin, User } from "lucide-react";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

import { calculateSmartLayout } from "@/lib/smart-layout";

export function MinimalistLayout({ data }: LayoutProps) {
  const { personal, target, experiences, education, courses, technicalSkills, softSkills, languages, customization } = data;

  const metrics = calculateSmartLayout(data);
  const primaryColor = customization.primaryColor || "#1E3A5F";

  const isUserProvided = Boolean(personal.fullName?.trim() || personal.email?.trim());

  // Fallbacks de demonstração apenas quando o usuário ainda não começou a preencher
  const displayName = personal.fullName?.trim() || (isUserProvided ? "" : "Paulo Ferreira");
  const displayRole = target.jobTitle?.trim() || (isUserProvided ? "" : "Coordenador de Operações & Logística");
  const displayPhone = personal.phone?.trim() || (isUserProvided ? "" : "(11) 98123-4567");
  const displayEmail = personal.email?.trim() || (isUserProvided ? "" : "paulo.ferreira@email.com");
  const displayLocation = personal.city && personal.state
    ? `${personal.city}, ${personal.state}`
    : (isUserProvided ? "" : "Campinas, SP");

  const allSkills = [...technicalSkills, ...softSkills].filter((s) => s && s.trim());
  const displayedSkills = metrics.density === "compact" ? allSkills.slice(0, 6) : allSkills;

  const displaySummary = target.summary?.trim() || (isUserProvided ? "" : "Profissional com sólida atuação em gestão de supply chain, estoques e liderança de frentes logísticas. Foco em otimização de rotas e produtividade.");

  const showSummary = Boolean(displaySummary);
  const showSkills = allSkills.length > 0 || !isUserProvided;
  const showCourses = courses.length > 0 || (!isUserProvided && !metrics.hasExperiences);
  const showExperiences = experiences.length > 0 || (!isUserProvided && metrics.hasExperiences);
  const showEducation = education.length > 0 || !isUserProvided;
  const showLanguages = languages.length > 0;

  return (
    <div
      className="w-full bg-white text-slate-900 leading-normal p-6 sm:p-8 select-text"
      style={{
        fontSize: metrics.fontSizePx,
      }}
    >
      {/* Cabeçalho Modelo 4: Fundo Branco, Linha e Título na cor de destaque ativa */}
      <header
        className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b-2"
        style={{ borderColor: primaryColor }}
      >
        {personal.photoUrl ? (
          <img
            src={personal.photoUrl}
            alt={displayName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 shrink-0 shadow-xs"
            style={{ borderColor: primaryColor }}
          />
        ) : (
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-bold text-lg text-white shrink-0 shadow-xs"
            style={{ backgroundColor: primaryColor }}
          >
            {displayName ? displayName.split(" ").map((n) => n[0]).slice(0, 2).join("") : <User className="w-8 h-8" />}
          </div>
        )}

        <div className="flex-1 text-center sm:text-left space-y-1">
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
            style={{ color: primaryColor }}
          >
            {displayName || "Seu Nome Completo"}
          </h1>
          {displayRole && (
            <p className="text-sm sm:text-base font-semibold text-slate-700 tracking-wide">
              {displayRole}
            </p>
          )}

          <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
            {displayLocation && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                {displayLocation}
              </span>
            )}
            {displayPhone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                {displayPhone}
              </span>
            )}
            {displayEmail && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" style={{ color: primaryColor }} />
                {displayEmail}
              </span>
            )}
            {personal.linkedin && (
              <span className="flex items-center gap-1 text-slate-700">
                • {personal.linkedin.replace(/^https?:\/\/(www\.)?/, "")}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Corpo em 2 Colunas com auto-adaptação */}
      <div className={`grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 ${metrics.spacingClass}`}>
        {/* Coluna Esquerda (~38% da largura - 5 cols) */}
        <div className={`md:col-span-5 ${metrics.density === "compact" ? "space-y-4" : "space-y-5"}`}>
          {/* SOBRE MIM */}
          {showSummary && (
            <section className="space-y-1.5">
              <div className="border-t-2 pt-1" style={{ borderColor: primaryColor }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  SOBRE MIM
                </h2>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {displaySummary}
              </p>
            </section>
          )}

          {/* HABILIDADES E PROFICIÊNCIAS */}
          {showSkills && (
            <section className="space-y-1.5">
              <div className="border-t-2 pt-1" style={{ borderColor: primaryColor }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  HABILIDADES E PROFICIÊNCIAS
                </h2>
              </div>
              <ul className="space-y-1 text-xs text-slate-800 list-disc list-inside">
                {displayedSkills.length > 0 ? (
                  displayedSkills.map((skill, index) => (
                    <li key={index} className="leading-snug">{skill}</li>
                  ))
                ) : (
                  <>
                    <li>Gestão de Processos e Operações</li>
                    <li>Sistemas Integrados (ERP / Planilhas)</li>
                    <li>Comunicação Assertiva e Foco em Metas</li>
                    <li>Resolução de Problemas e Organização</li>
                  </>
                )}
              </ul>
            </section>
          )}

          {/* CURSOS E QUALIFICAÇÕES */}
          {showCourses && (
            <section className="space-y-1.5">
              <div className="border-t-2 pt-1" style={{ borderColor: primaryColor }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  CURSOS E QUALIFICAÇÕES
                </h2>
              </div>
              <div className="space-y-1 text-xs text-slate-800">
                {courses.length > 0 ? (
                  courses.map((c) => (
                    <p key={c.id}>
                      • <strong>{c.name}</strong> — {c.institution} {c.year ? `(${c.year})` : ""}
                      {c.hours ? ` • ${c.hours}` : ""}
                    </p>
                  ))
                ) : (
                  <>
                    <p>• Lean Logistics & Métodos Ágeis (2023)</p>
                    <p>• Gestão Inteligente e Ferramentas Digitais (2022)</p>
                  </>
                )}
              </div>
            </section>
          )}

          {/* IDIOMAS */}
          {showLanguages && (
            <section className="space-y-1.5">
              <div className="border-t-2 pt-1" style={{ borderColor: primaryColor }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  IDIOMAS
                </h2>
              </div>
              <div className="space-y-1 text-xs text-slate-800">
                {languages.map((l) => (
                  <p key={l.id}>• <strong>{l.name}:</strong> {l.level}</p>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Coluna Direita (~62% da largura - 7 cols) */}
        <div className={`md:col-span-7 ${metrics.density === "compact" ? "space-y-4" : "space-y-5"}`}>
          {/* CARREIRA / EXPERIÊNCIA (Omitida se não houver experiências) */}
          {showExperiences && (
            <section className="space-y-2">
              <div className="border-t-2 pt-1" style={{ borderColor: primaryColor }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  CARREIRA & EXPERIÊNCIA
                </h2>
              </div>
              <div className="space-y-3.5 text-xs">
                {experiences.length > 0 ? (
                  experiences.map((exp) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <strong className="text-sm text-slate-950 font-bold">{exp.role}</strong>
                        <span className="text-slate-500 font-medium text-[11px]">
                          {exp.startDate} {exp.endDate ? `— ${exp.endDate}` : ""}
                        </span>
                      </div>
                      <div className="text-slate-700 font-semibold text-[11px]">{exp.company}</div>
                      {exp.description && (
                        <p className="text-slate-700 leading-relaxed text-justify">{exp.description}</p>
                      )}
                      {exp.achievements && (
                        <p className="text-slate-600 text-[11px]">
                          <strong className="text-slate-800">Destaque:</strong> {exp.achievements}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <strong className="text-sm text-slate-950 font-bold">Coordenador de Operações</strong>
                      <span className="text-slate-500 font-medium text-[11px]">2021 — Atual</span>
                    </div>
                    <div className="text-slate-700 font-semibold text-[11px]">LogExpress Distribuição</div>
                    <p className="text-slate-700 leading-relaxed text-justify">
                      Supervisão de processos operacionais e gestão de equipe multidisciplinar com alcance de 98% em metas.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ESCOLARIDADE */}
          {showEducation && (
            <section className="space-y-2">
              <div className="border-t-2 pt-1" style={{ borderColor: primaryColor }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: primaryColor }}>
                  FORMAÇÃO ACADÊMICA
                </h2>
              </div>
              <div className="space-y-2 text-xs">
                {education.length > 0 ? (
                  education.map((edu) => (
                    <div key={edu.id} className="flex justify-between items-baseline">
                      <div>
                        <strong className="text-slate-900 block text-sm">{edu.course || edu.degree}</strong>
                        <span className="text-slate-600 text-[11px]">{edu.institution}</span>
                      </div>
                      <span className="text-slate-600 font-medium text-[11px]">{edu.endDate || ""}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-baseline">
                    <div>
                      <strong className="text-slate-900 block text-sm">Graduação / Curso Superior</strong>
                      <span className="text-slate-600 text-[11px]">Faculdade / Instituição de Ensino</span>
                    </div>
                    <span className="text-slate-600 font-medium text-[11px]">Concluído</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
