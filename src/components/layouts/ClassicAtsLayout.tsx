"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Phone, Mail, MapPin, User } from "lucide-react";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function ClassicAtsLayout({ data }: LayoutProps) {
  const { personal, target, experiences, education, courses, languages, customization } = data;

  const isHidden = (sec: string) => customization.hiddenSections?.includes(sec);

  // Fallbacks literais de exemplo baseados na persona Cíntia Campos
  const displayName = personal.fullName || "Cíntia Campos";
  const displayJobTitle = target.jobTitle || "Vendedora / Atendente Comercial";
  const displayPhone = personal.phone || "(11) 97654-3210";
  const displayEmail = personal.email || "cintia.campos@email.com";
  const displayLocation = personal.city && personal.state
    ? `${personal.city}, ${personal.state}`
    : "São Paulo, SP";

  return (
    <div
      className="w-full bg-white text-slate-900 leading-normal relative select-text"
      style={{
        fontSize: customization.fontSize === "sm" ? "12px" : customization.fontSize === "lg" ? "14px" : "13px",
      }}
    >
      {/* Detalhe Geométrico Diagonal Preto/Grafite no Canto Superior Esquerdo */}
      <div
        className="absolute top-0 left-0 w-32 h-16 bg-slate-950 pointer-events-none"
        style={{
          clipPath: "polygon(0 0, 100% 0, 0 100%)",
        }}
        aria-hidden="true"
      />

      {/* Cabeçalho: Foto Circular à Esquerda + Nome e Contatos com Ícones Circulares Pretos */}
      <header className="p-8 sm:p-10 pb-5 flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-slate-300">
        {/* Foto circular (se fornecida, ou avatar limpo com iniciais) */}
        {personal.photoUrl ? (
          <img
            src={personal.photoUrl}
            alt={displayName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-slate-900 shadow-xs shrink-0"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 border-2 border-slate-900 flex items-center justify-center text-slate-800 font-bold text-lg shrink-0">
            {displayName.split(" ").map(n => n[0]).slice(0, 2).join("") || <User className="w-8 h-8 text-slate-500" />}
          </div>
        )}

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 uppercase">
            {displayName}
          </h1>

          {/* Contatos com Ícones Circulares Pretos */}
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1.5 text-xs text-slate-700 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center shrink-0">
                <Phone className="w-2.5 h-2.5" />
              </span>
              <span>{displayPhone}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center shrink-0">
                <Mail className="w-2.5 h-2.5" />
              </span>
              <span>{displayEmail}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white flex items-center justify-center shrink-0">
                <MapPin className="w-2.5 h-2.5" />
              </span>
              <span>{displayLocation}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Seções em Fluxo Direto e Super Objetivo */}
      <div className="p-8 sm:p-10 pt-4 space-y-4">
        {/* 1. Objetivo (Direto ao ponto) */}
        {!isHidden("summary") && (
          <section>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 pb-1 border-b-2 border-slate-900">
              Objetivo
            </h2>
            <p className="mt-1.5 text-xs text-slate-800 font-medium">
              Atuação na área de <strong className="text-slate-950">{displayJobTitle}</strong>, com foco em excelência no atendimento ao cliente, negociação e alcance de metas.
            </p>
          </section>
        )}

        {/* 2. Qualificação Profissional (2 a 3 linhas objetivas) */}
        {!isHidden("summary") && (
          <section>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 pb-1 border-b-2 border-slate-900">
              Qualificação Profissional
            </h2>
            <p className="mt-1.5 text-xs text-slate-700 leading-relaxed text-justify">
              {target.summary ||
                "Profissional com sólida vivência em atendimento presencial, organização de ponto de venda, caixa e suporte comercial. Facilidade em comunicação, pontualidade rigorosa e agilidade em resolução de dúvidas de clientes."}
            </p>
          </section>
        )}

        {/* 3. Experiência Profissional (Bullets diretos com tempo de atuação, empresa e resultado) */}
        {!isHidden("experience") && (
          <section>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 pb-1 border-b-2 border-slate-900">
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
        {!isHidden("education") && (
          <section>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 pb-1 border-b-2 border-slate-900">
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
                      {edu.status === "concluido" ? "Concluído" : "Em andamento"} ({edu.endDate || "2023"})
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

        {/* 5. Cursos adicionais (Ano - Nome do curso (Instituição)) */}
        {!isHidden("courses") && (
          <section>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 pb-1 border-b-2 border-slate-900">
              Cursos adicionais
            </h2>
            <div className="mt-2 space-y-1 text-xs text-slate-800">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <p key={course.id}>
                    • {course.year || "2023"} - {course.name} ({course.institution})
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
        {!isHidden("languages") && (
          <section>
            <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 pb-1 border-b-2 border-slate-900">
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
