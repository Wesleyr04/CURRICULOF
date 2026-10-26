"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Phone, Mail, MapPin, User } from "lucide-react";
import { calculateSmartLayout } from "@/lib/smart-layout";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function ClassicAtsLayout({ data, isPdfView = false }: LayoutProps) {
  const { personal, target, experiences, education, courses, languages, customization } = data;

  const metrics = calculateSmartLayout(data);
  const primaryColor = customization.primaryColor || "#0f172a";

  const isUserProvided = Boolean(personal.fullName?.trim() || personal.email?.trim() || isPdfView);

  // Fallbacks literais de exemplo baseados na persona Cíntia Campos apenas se usuário não preencheu dados
  const displayName = personal.fullName?.trim() || (isUserProvided ? "" : "Cíntia Campos");
  const displayJobTitle = target.jobTitle?.trim() || (isUserProvided ? "" : "Vendedora / Atendente Comercial");
  const displayPhone = personal.phone?.trim() || (isUserProvided ? "" : "(11) 97654-3210");
  const displayEmail = personal.email?.trim() || (isUserProvided ? "" : "cintia.campos@email.com");
  const displayLocation = personal.city && personal.state
    ? `${personal.city}, ${personal.state}`
    : (isUserProvided ? "" : "São Paulo, SP");

  const fullSummary = target.summary?.trim() || (isUserProvided ? "" : "Profissional com sólida vivência em atendimento presencial, organização de ponto de venda, caixa e suporte comercial. Facilidade em comunicação, pontualidade rigorosa e agilidade em resolução de dúvidas de clientes.");
  const displaySummary = fullSummary;

  const showJobTitle = Boolean(displayJobTitle);
  const showSummary = Boolean(displaySummary);
  const showExperiences = experiences.length > 0 || (!isUserProvided && metrics.hasExperiences);
  const showEducation = education.length > 0 || !isUserProvided;
  const showCourses = courses.length > 0 || (!isUserProvided && !metrics.hasExperiences);
  const showLanguages = languages.length > 0;

  return (
    <div
      className="w-full bg-white text-slate-900 leading-normal relative select-text"
      style={{
        fontSize: metrics.fontSizePx,
      }}
    >
      {/* Detalhe Geométrico Diagonal no Canto Superior Esquerdo na cor de destaque ativa */}
      <div
        className="absolute top-0 left-0 w-32 h-16 pointer-events-none transition-colors"
        style={{
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
          backgroundColor: primaryColor,
        }}
        aria-hidden="true"
      />

      {/* Cabeçalho: Foto/Avatar à Esquerda + Nome e Contatos com Ícones Circulares */}
      <header className="p-8 sm:p-10 pb-5 flex flex-row items-start gap-5 border-b border-slate-300">
        {personal.photoUrl ? (
          <img
            src={personal.photoUrl}
            alt={displayName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 shadow-xs shrink-0"
            style={{ borderColor: primaryColor }}
          />
        ) : !isUserProvided ? (
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 border-2 flex items-center justify-center text-slate-800 font-bold text-lg shrink-0 shadow-xs"
            style={{ borderColor: primaryColor }}
          >
            {displayName.split(" ").map((n) => n[0]).slice(0, 2).join("") || <User className="w-8 h-8 text-slate-500" />}
          </div>
        ) : displayName ? (
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 border-2 flex items-center justify-center text-slate-800 font-bold text-lg shrink-0 shadow-xs"
            style={{ borderColor: primaryColor }}
          >
            {displayName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
        ) : null}

        <div className="flex-1 text-left space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase" style={{ color: primaryColor }}>
            {displayName || "Seu Nome Completo"}
          </h1>

          {/* Contatos com Ícones Circulares na cor de destaque ativa */}
          <div className="flex flex-wrap justify-start items-center gap-x-4 gap-y-1.5 text-xs text-slate-700 pt-1">
            {displayPhone && (
              <div className="flex items-center gap-1.5">
                <span
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Phone className="w-2.5 h-2.5" />
                </span>
                <span>{displayPhone}</span>
              </div>
            )}

            {displayEmail && (
              <div className="flex items-center gap-1.5">
                <span
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Mail className="w-2.5 h-2.5" />
                </span>
                <span>{displayEmail}</span>
              </div>
            )}

            {displayLocation && (
              <div className="flex items-center gap-1.5">
                <span
                  className="w-5 h-5 rounded-full text-white flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MapPin className="w-2.5 h-2.5" />
                </span>
                <span>{displayLocation}</span>
              </div>
            )}

            {personal.linkedin && (
              <span className="text-[11px] text-slate-600">
                • {personal.linkedin.replace(/^https?:\/\/(www\.)?/, "")}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Seções em Fluxo Direto com espaçamento adaptado */}
      <div className={`p-8 sm:p-10 pt-4 ${metrics.density === "compact" ? "space-y-3.5" : "space-y-5"}`}>
        {/* 1. Objetivo (Direto ao ponto) */}
        {showJobTitle && (
          <section>
            <h2
              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider pb-1 border-b-2"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              Objetivo
            </h2>
            <p className="mt-1.5 text-xs text-slate-800 font-medium">
              Atuação na área de <strong style={{ color: primaryColor }}>{displayJobTitle}</strong>, com foco em excelência no atendimento ao cliente, negociação e alcance de metas.
            </p>
          </section>
        )}

        {/* 2. Sobre Você */}
        {showSummary && (
          <section>
            <h2
              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider pb-1 border-b-2"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              Sobre Você
            </h2>
            <p className="mt-1.5 text-xs text-slate-700 leading-relaxed text-justify">
              {displaySummary}
            </p>
          </section>
        )}

        {/* 3. Experiência Profissional */}
        {showExperiences && (
          <section>
            <h2
              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider pb-1 border-b-2"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              Experiência Profissional
            </h2>
            <div className="mt-2 space-y-2.5">
              {experiences.length > 0 ? (
                experiences.map((exp) => (
                  <div key={exp.id} className="text-xs">
                    <div className="flex justify-between items-baseline font-bold text-slate-900">
                      <span>{exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span></span>
                      <span className="text-slate-500 font-normal text-[11px]">
                        {exp.startDate} {exp.endDate ? `— ${exp.endDate}` : ""}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-slate-700 text-[11px] mt-0.5 leading-relaxed">• {exp.description}</p>
                    )}
                    {exp.achievements && (
                      <p className="text-slate-600 text-[11px] mt-0.5">• <strong>Resultado:</strong> {exp.achievements}</p>
                    )}
                  </div>
                ))
              ) : (
                <>
                  <div className="text-xs">
                    <div className="flex justify-between items-baseline font-bold text-slate-900">
                      <span>Atendente Comercial — Magazine Central</span>
                      <span className="text-slate-500 font-normal text-[11px]">2022 — 2024</span>
                    </div>
                    <p className="text-slate-700 text-[11px] mt-0.5 leading-relaxed">
                      • Atendimento ao público, demonstração de produtos e fechamento de vendas no balcão.
                    </p>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      • <strong>Resultado:</strong> Reconhecimento de 100% de pontualidade e assiduidade no trimestre.
                    </p>
                  </div>
                  <div className="text-xs">
                    <div className="flex justify-between items-baseline font-bold text-slate-900">
                      <span>Operadora de Caixa — Supermercados União</span>
                      <span className="text-slate-500 font-normal text-[11px]">2020 — 2022</span>
                    </div>
                    <p className="text-slate-700 text-[11px] mt-0.5 leading-relaxed">
                      • Abertura e fechamento de caixa, registro de mercadorias e conferência de notas fiscais.
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* 4. Formação */}
        {showEducation && (
          <section>
            <h2
              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider pb-1 border-b-2"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              Formação
            </h2>
            <div className="mt-2 space-y-1.5 text-xs">
              {education.length > 0 ? (
                education.map((edu) => (
                  <div key={edu.id} className="flex justify-between items-baseline">
                    <div>
                      <strong className="text-slate-900">{edu.course || edu.degree}</strong>
                      <span className="text-slate-600 text-[11px]"> — {edu.institution}</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      {edu.status === "concluido" ? "Concluído" : "Em andamento"} ({edu.endDate || ""})
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-baseline">
                  <div>
                    <strong className="text-slate-900">Ensino Médio Completo</strong>
                    <span className="text-slate-600 text-[11px]"> — Escola Estadual Castro Alves</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">Concluído em 2019</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. Cursos adicionais */}
        {showCourses && (
          <section>
            <h2
              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider pb-1 border-b-2"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              Cursos adicionais
            </h2>
            <div className="mt-2 space-y-1 text-xs text-slate-800">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <p key={course.id}>
                    • {course.year ? `${course.year} - ` : ""}{course.name} ({course.institution})
                  </p>
                ))
              ) : (
                <>
                  <p>• 2024 - Técnicas de Vendas e Negociação (SEBRAE)</p>
                  <p>• 2023 - Atendimento ao Cliente e Comunicação Assertiva (SENAC)</p>
                  <p>• 2022 - Operador de Caixa e Rotinas Comerciais (Instituto Profissionalizante)</p>
                </>
              )}
            </div>
          </section>
        )}

        {/* 6. Idiomas */}
        {showLanguages && (
          <section>
            <h2
              className="text-xs sm:text-sm font-extrabold uppercase tracking-wider pb-1 border-b-2"
              style={{ color: primaryColor, borderColor: primaryColor }}
            >
              Idiomas
            </h2>
            <div className="mt-2 text-xs text-slate-800">
              {languages.length > 0 ? (
                <p>• {languages.map((l) => `${l.name} (${l.level})`).join(" • ")}</p>
              ) : (
                <p>• Português (Nativo) • Inglês básico • Espanhol básico</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
