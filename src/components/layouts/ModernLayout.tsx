"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Phone, Mail, MapPin, User } from "lucide-react";
import { LinkedinIcon } from "@/components/common/Icons";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function ModernLayout({ data }: LayoutProps) {
  const { personal, target, experiences, education, courses, technicalSkills, softSkills, languages, customization } = data;

  const isHidden = (sec: string) => customization.hiddenSections?.includes(sec);

  // Fallbacks de exemplo baseados na persona executiva Juliana Silva
  const displayName = personal.fullName || "JULIANA SILVA";
  const displayRole = target.jobTitle || "Analista Financeiro";
  const displayPhone = personal.phone || "(11) 98765-4321";
  const displayEmail = personal.email || "juliana.silva@email.com";
  const displayLocation = personal.city && personal.state
    ? `${personal.city}, ${personal.state}`
    : "São Paulo, SP";

  const allSkills = [...technicalSkills, ...softSkills];

  return (
    <div
      className="w-full bg-white text-slate-800 leading-normal flex flex-col md:flex-row min-h-[297mm] select-text"
      style={{
        fontSize: customization.fontSize === "sm" ? "12px" : customization.fontSize === "lg" ? "14px" : "13px",
      }}
    >
      {/* Coluna Lateral Esquerda (~35% da largura): Fundo Marrom Elegante #6E5034, Texto Branco */}
      <aside
        className="w-full md:w-[35%] p-6 sm:p-7 text-white space-y-6 shrink-0"
        style={{ backgroundColor: "#6E5034" }}
      >
        {/* Topo da sidebar: Foto com moldura fina deslocada */}
        <div className="pt-2 flex justify-center">
          {personal.photoUrl ? (
            <div className="relative p-1">
              <div
                className="absolute inset-0 border border-amber-200/50 translate-x-1 translate-y-1 rounded-sm pointer-events-none"
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
                className="absolute inset-0 border border-amber-200/50 translate-x-1 translate-y-1 rounded-sm pointer-events-none"
              />
              <div className="relative w-24 h-24 bg-amber-950/40 border border-white/20 rounded-sm flex items-center justify-center text-white font-bold text-xl">
                {displayName.split(" ").map(n => n[0]).slice(0, 2).join("") || <User className="w-10 h-10 text-amber-200/70" />}
              </div>
            </div>
          )}
        </div>

        {/* 1. CONTATO */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white pb-1 border-b border-white/30">
            CONTATO
          </h3>
          <div className="space-y-2 text-[11px] text-amber-50/90 leading-tight">
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span>{displayPhone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span className="truncate">{displayEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-amber-200 shrink-0" />
              <span>{displayLocation}</span>
            </div>
            {personal.linkedin && (
              <div className="flex items-center gap-2">
                <LinkedinIcon className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                <span className="truncate">linkedin.com/in/{displayName.toLowerCase().replace(/\s+/g, "")}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. SOBRE MIM */}
        {!isHidden("summary") && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white pb-1 border-b border-white/30">
              SOBRE MIM
            </h3>
            <p className="text-[11px] text-amber-50/90 leading-relaxed text-justify">
              {target.summary ||
                "Profissional com mais de 5 anos de atuação em controladoria, conciliação e planejamento orçamentário. Foco em redução de custos, relatórios de DRE e conformidade financeira."}
            </p>
          </div>
        )}

        {/* 3. HABILIDADES (Lista vertical com bullets) */}
        {(!isHidden("technicalSkills") || !isHidden("softSkills")) && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white pb-1 border-b border-white/30">
              HABILIDADES
            </h3>
            <ul className="space-y-1 text-[11px] text-amber-50/90 list-disc list-inside">
              {allSkills.length > 0 ? (
                allSkills.map((skill, index) => (
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
        {!isHidden("languages") && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white pb-1 border-b border-white/30">
              IDIOMAS
            </h3>
            <div className="space-y-1 text-[11px] text-amber-50/90">
              {languages.length > 0 ? (
                languages.map((l) => (
                  <p key={l.id}>{l.name}: <span className="text-amber-200">{l.level}</span></p>
                ))
              ) : (
                <>
                  <p>Português: <span className="text-amber-200">Nativo</span></p>
                  <p>Inglês: <span className="text-amber-200">Intermediário</span></p>
                  <p>Espanhol: <span className="text-amber-200">Básico</span></p>
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Coluna Principal Direita (~65% da largura): Fundo Branco, Textos Escuros, Títulos em Marrom #6E5034 */}
      <main className="w-full md:w-[65%] p-6 sm:p-8 space-y-6">
        {/* Topo Direito: Nome em CAIXA ALTA grande + Cargo + Linha Curta */}
        <header className="space-y-1 pt-1 pb-2">
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide"
            style={{ color: "#6E5034" }}
          >
            {displayName}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-700 tracking-wider">
            {displayRole}
          </p>
          <div
            className="w-16 h-1 mt-2"
            style={{ backgroundColor: "#6E5034" }}
          />
        </header>

        {/* Seção EXPERIÊNCIA: Títulos em CAIXA ALTA marrom com linha divisória */}
        {!isHidden("experience") && (
          <section className="space-y-3">
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: "#6E5034", borderColor: "#6E5034" }}
            >
              EXPERIÊNCIA
            </h2>
            <div className="space-y-3.5 text-xs">
              {experiences.length > 0 ? (
                experiences.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900 text-sm">{exp.company}</span>
                      <span className="text-slate-600 font-semibold text-[11px]">
                        {exp.startDate} {exp.endDate ? `— ${exp.endDate}` : "2022 — 2025"}
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
        {!isHidden("education") && (
          <section className="space-y-3">
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: "#6E5034", borderColor: "#6E5034" }}
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
                    <span className="text-slate-600 font-medium text-[11px]">{edu.endDate || "2020"}</span>
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
        {!isHidden("courses") && courses.length > 0 && (
          <section className="space-y-2">
            <h2
              className="text-xs sm:text-sm font-bold uppercase tracking-wider pb-1 border-b"
              style={{ color: "#6E5034", borderColor: "#6E5034" }}
            >
              CURSOS & CERTIFICAÇÕES
            </h2>
            <div className="space-y-1 text-xs text-slate-800">
              {courses.map((c) => (
                <p key={c.id}>
                  • <strong>{c.name}</strong> — {c.institution} {c.year ? `(${c.year})` : ""}
                </p>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
