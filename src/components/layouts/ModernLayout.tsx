"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Phone, Mail, MapPin, User } from "lucide-react";
import { LinkedinIcon } from "@/components/common/Icons";
import { calculateSmartLayout, isColorLight } from "@/lib/smart-layout";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function ModernLayout({ data, isPdfView = false }: LayoutProps) {
  const { personal, target, experiences, education, courses, technicalSkills, softSkills, languages, customization } = data;

  const metrics = calculateSmartLayout(data);
  const primaryColor = customization.primaryColor || "#6E5034";
  const isLight = isColorLight(primaryColor);

  const isUserProvided = Boolean(personal.fullName?.trim() || personal.email?.trim() || isPdfView);

  // Fallbacks de exemplo baseados na persona executiva Juliana Silva apenas se formulário não preenchido
  const displayName = personal.fullName?.trim() || (isUserProvided ? "" : "JULIANA SILVA");
  const displayRole = target.jobTitle?.trim() || (isUserProvided ? "" : "Analista Financeiro");
  const displayPhone = personal.phone?.trim() || (isUserProvided ? "" : "(11) 98765-4321");
  const displayEmail = personal.email?.trim() || (isUserProvided ? "" : "juliana.silva@email.com");
  const displayLocation = personal.city && personal.state
    ? `${personal.city}, ${personal.state}`
    : (isUserProvided ? "" : "São Paulo, SP");

  const allSkills = [...technicalSkills, ...softSkills].filter((s) => s && s.trim());
  const displayedSkills = metrics.density === "compact" ? allSkills.slice(0, 6) : allSkills;

  const displaySummary = target.summary?.trim() || (isUserProvided ? "" : "Profissional com mais de 5 anos de atuação em controladoria, conciliação e planejamento orçamentário. Foco em redução de custos, relatórios de DRE e conformidade financeira.");

  const showSummary = Boolean(displaySummary);
  const showSkills = allSkills.length > 0 || !isUserProvided;
  const showLanguages = languages.length > 0 || (!isUserProvided && !metrics.hasExperiences);
  const showExperiences = experiences.length > 0 || (!isUserProvided && metrics.hasExperiences);
  const showEducation = education.length > 0 || !isUserProvided;
  const showCourses = courses.length > 0;

  // Classes de texto e bordas da sidebar adaptadas para cores claras (ex: amarelo #d97706) ou escuras
  const sidebarTextColor = isLight ? "text-slate-950" : "text-white";
  const sidebarMutedTextColor = isLight ? "text-slate-800" : "text-white/90";
  const sidebarBorderColor = isLight ? "border-slate-950/20" : "border-white/30";
  const sidebarIconColor = isLight ? "text-slate-900" : "text-white/80";

  return (
    <div
      className="w-full bg-white text-slate-800 leading-normal flex flex-row min-h-[297mm] select-text"
      style={{
        fontSize: metrics.fontSizePx,
      }}
    >
      {/* Coluna Lateral Esquerda (~35% da largura): Fundo com cor de destaque ativa */}
      <aside
        className={`w-[35%] p-6 sm:p-7 ${sidebarTextColor} space-y-5 shrink-0 transition-colors`}
        style={{ backgroundColor: primaryColor }}
      >
        {/* Topo da sidebar: Foto ou Iniciais estilizadas */}
        {(personal.photoUrl || !isUserProvided) && (
          <div className="pt-2 flex justify-center">
            {personal.photoUrl ? (
              <div className="relative p-1">
                <div
                  className={`absolute inset-0 border ${sidebarBorderColor} translate-x-1 translate-y-1 rounded-sm pointer-events-none`}
                />
                <img
                  src={personal.photoUrl}
                  alt={displayName}
                  className="relative w-28 h-28 object-cover rounded-sm shadow-md"
                />
              </div>
            ) : (
              <div className="relative p-1">
                <div
                  className={`absolute inset-0 border ${sidebarBorderColor} translate-x-1 translate-y-1 rounded-sm pointer-events-none`}
                />
                <div className={`relative w-24 h-24 ${isLight ? "bg-black/10 border-black/20 text-slate-950" : "bg-black/20 border-white/30 text-white"} border rounded-sm flex items-center justify-center font-bold text-xl shadow-inner`}>
                  {displayName ? (
                    displayName.split(" ").map((n) => n[0]).slice(0, 2).join("")
                  ) : (
                    <User className={`w-10 h-10 ${isLight ? "text-slate-900" : "text-white/70"}`} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1. CONTATO */}
        <div className="space-y-2">
          <h3 className={`text-xs font-bold uppercase tracking-widest ${sidebarTextColor} pb-1 border-b ${sidebarBorderColor}`}>
            CONTATO
          </h3>
          <div className={`space-y-2 text-[11px] ${sidebarMutedTextColor} leading-tight`}>
            {displayPhone && (
              <div className="flex items-center gap-2">
                <Phone className={`w-3.5 h-3.5 ${sidebarIconColor} shrink-0`} />
                <span>{displayPhone}</span>
              </div>
            )}
            {displayEmail && (
              <div className="flex items-center gap-2">
                <Mail className={`w-3.5 h-3.5 ${sidebarIconColor} shrink-0`} />
                <span className="truncate">{displayEmail}</span>
              </div>
            )}
            {displayLocation && (
              <div className="flex items-center gap-2">
                <MapPin className={`w-3.5 h-3.5 ${sidebarIconColor} shrink-0`} />
                <span>{displayLocation}</span>
              </div>
            )}
            {personal.linkedin && (
              <div className="flex items-center gap-2">
                <LinkedinIcon className={`w-3.5 h-3.5 ${sidebarIconColor} shrink-0`} />
                <span className="truncate">{personal.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. SOBRE MIM */}
        {showSummary && (
          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${sidebarTextColor} pb-1 border-b ${sidebarBorderColor}`}>
              SOBRE MIM
            </h3>
            <p className={`text-[11px] ${sidebarMutedTextColor} leading-relaxed text-justify`}>
              {displaySummary}
            </p>
          </div>
        )}

        {/* 3. HABILIDADES (Lista vertical com bullets) */}
        {showSkills && (
          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${sidebarTextColor} pb-1 border-b ${sidebarBorderColor}`}>
              HABILIDADES
            </h3>
            <ul className={`space-y-1 text-[11px] ${sidebarMutedTextColor} list-disc list-inside`}>
              {displayedSkills.length > 0 ? (
                displayedSkills.map((skill, index) => (
                  <li key={index} className="leading-snug">{skill}</li>
                ))
              ) : (
                <>
                  <li>Planejamento Orçamentário</li>
                  <li>DRE & Fluxo de Caixa</li>
                  <li>Excel Avançado & Power BI</li>
                  <li>ERP SAP / Protheus</li>
                  <li>Análise de Custos & Margens</li>
                  <li>Liderança & Negociação</li>
                </>
              )}
            </ul>
          </div>
        )}

        {/* 4. IDIOMAS */}
        {showLanguages && (
          <div className="space-y-2">
            <h3 className={`text-xs font-bold uppercase tracking-widest ${sidebarTextColor} pb-1 border-b ${sidebarBorderColor}`}>
              IDIOMAS
            </h3>
            <div className={`space-y-1 text-[11px] ${sidebarMutedTextColor}`}>
              {languages.length > 0 ? (
                languages.map((l) => (
                  <p key={l.id}>{l.name}: <span className={`${sidebarTextColor} font-semibold`}>{l.level}</span></p>
                ))
              ) : (
                <>
                  <p>Português: <span className={`${sidebarTextColor} font-semibold`}>Nativo</span></p>
                  <p>Inglês: <span className={`${sidebarTextColor} font-semibold`}>Intermediário</span></p>
                  <p>Espanhol: <span className={`${sidebarTextColor} font-semibold`}>Básico</span></p>
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Coluna Principal Direita (~65% da largura): Fundo Branco, Textos Escuros, Títulos na cor ativa */}
      <main className={`w-[65%] p-6 sm:p-8 shrink-0 flex-1 ${metrics.density === "compact" ? "space-y-4" : "space-y-6"}`}>
        {/* Topo Direito: Nome em CAIXA ALTA grande + Cargo + Linha Curta */}
        <header className="space-y-1 pt-1 pb-2">
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide"
            style={{ color: primaryColor }}
          >
            {displayName || "Seu Nome Completo"}
          </h1>
          {displayRole && (
            <p className="text-sm sm:text-base font-semibold text-slate-700 tracking-wider">
              {displayRole}
            </p>
          )}
          <div
            className="w-16 h-1 mt-2"
            style={{ backgroundColor: primaryColor }}
          />
        </header>

        {/* Seção EXPERIÊNCIA: Títulos na cor ativa com linha divisória */}
        {showExperiences && (
          <section className="space-y-3">
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              EXPERIÊNCIA
            </h2>
            <div className="space-y-3 text-xs">
              {experiences.length > 0 ? (
                experiences.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-sm">{exp.company}</span>
                      <span className="text-slate-600 font-semibold text-[11px]">
                        {exp.startDate} {exp.endDate ? `— ${exp.endDate}` : ""}
                      </span>
                    </div>
                    <div className="italic text-slate-700 font-medium text-[11px]">{exp.role}</div>
                    {exp.description && (
                      <p className="text-slate-700 leading-relaxed text-justify">{exp.description}</p>
                    )}
                    {exp.achievements && (
                      <p className="text-slate-600 text-[11px]">
                        <strong>Realização:</strong> {exp.achievements}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-sm">Grupo Mantiqueira de Investimentos</span>
                      <span className="text-slate-600 font-semibold text-[11px]">2022 — 2025</span>
                    </div>
                    <div className="italic text-slate-700 font-medium text-[11px]">Analista Financeiro Pleno</div>
                    <p className="text-slate-700 leading-relaxed text-justify">
                      Coordenação de conciliação bancária, fechamento de DRE gerencial, acompanhamento de KPIs de inadimplência e apoio direto à diretoria executiva na tomada de decisões estratégicas.
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-sm">FinCorp Serviços Corporativos</span>
                      <span className="text-slate-600 font-semibold text-[11px]">2020 — 2022</span>
                    </div>
                    <div className="italic text-slate-700 font-medium text-[11px]">Assistente Financeiro</div>
                    <p className="text-slate-700 leading-relaxed text-justify">
                      Gestão de contas a pagar e receber, emissão de boletos, conferência fiscal de notas e contato com fornecedores e instituições bancárias.
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Seção FORMAÇÃO */}
        {showEducation && (
          <section className="space-y-3">
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              FORMAÇÃO
            </h2>
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
                <>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <strong className="text-slate-900 block text-sm">Bacharelado em Ciências Contábeis</strong>
                      <span className="text-slate-600 text-[11px]">Universidade Presbiteriana Mackenzie</span>
                    </div>
                    <span className="text-slate-600 font-medium text-[11px]">2017 — 2021</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div>
                      <strong className="text-slate-900 block text-sm">Pós-Graduação em Controladoria & Finanças</strong>
                      <span className="text-slate-600 text-[11px]">Fundação Getulio Vargas (FGV)</span>
                    </div>
                    <span className="text-slate-600 font-medium text-[11px]">2022 — 2023</span>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* Cursos / Especializações */}
        {showCourses && (
          <section className="space-y-2">
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              CURSOS & CERTIFICAÇÕES
            </h2>
            <div className="space-y-1 text-xs text-slate-800">
              {courses.map((c) => (
                <p key={c.id}>
                  • <strong>{c.name}</strong> — {c.institution} {c.year ? `(${c.year})` : ""}
                  {c.hours ? ` (${c.hours})` : ""}
                </p>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
