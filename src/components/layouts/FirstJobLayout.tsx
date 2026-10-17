"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Phone, Mail, MapPin } from "lucide-react";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function FirstJobLayout({ data }: LayoutProps) {
  const { personal, target, experiences, education, courses, technicalSkills, softSkills, customization } = data;

  const isHidden = (sec: string) => customization.hiddenSections?.includes(sec);

  // Fallbacks elegantes fiéis ao modelo validado de exemplo
  const displayName = personal.fullName || "Felipe Mesquita";
  const displaySubtitle = target.jobTitle || "Jovem Aprendiz | Primeiro Emprego";
  const displayPhone = personal.phone || "(12) 3456-7890";
  const displayEmail = personal.email || "ola@grandesite.com.br";
  const displayLocation = personal.city && personal.state
    ? `${personal.city}, ${personal.state}`
    : "Rua Alegre, 123 - Cidade Brasileira";

  return (
    <div
      className="w-full bg-white text-slate-900 leading-normal p-8 sm:p-10 select-text"
      style={{
        fontSize: customization.fontSize === "sm" ? "12px" : customization.fontSize === "lg" ? "14px" : "13px",
      }}
    >
      {/* Cabeçalho Literal Modelo 1: Esquerda Nome/Subtítulo, Direita Contatos com Ícones */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b-2 border-slate-900">
        <div className="space-y-0.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 uppercase">
            {displayName}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide">
            {displaySubtitle}
          </p>
        </div>

        {/* Lista vertical compacta de contatos com ícones discretos */}
        <div className="text-[11px] sm:text-xs text-slate-700 space-y-1 sm:text-right shrink-0">
          <div className="flex items-center sm:justify-end gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-800 shrink-0" />
            <span>{displayPhone}</span>
          </div>
          <div className="flex items-center sm:justify-end gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-800 shrink-0" />
            <span>{displayEmail}</span>
          </div>
          <div className="flex items-center sm:justify-end gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-800 shrink-0" />
            <span>{displayLocation}</span>
          </div>
        </div>
      </header>

      {/* Conteúdo em 1 Coluna Enxuta */}
      <div className="pt-4 space-y-4">
        {/* 1. Objetivo Profissional */}
        {!isHidden("summary") && (
          <section>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-950 pb-1 border-b border-slate-300">
              Objetivo Profissional
            </h2>
            <p className="mt-1.5 text-xs text-slate-700 leading-relaxed text-justify">
              {target.summary ||
                "Busco oportunidade como Jovem Aprendiz para desenvolver habilidades práticas em rotinas administrativas e atendimento. Comprometido com aprendizado rápido, pontualidade e dedicação para contribuir positivamente com a equipe."}
            </p>
          </section>
        )}

        {/* 2. Formação Acadêmica */}
        {!isHidden("education") && (
          <section>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-950 pb-1 border-b border-slate-300">
              Formação Acadêmica
            </h2>
            <div className="mt-2 space-y-2">
              {education.length > 0 ? (
                education.map((edu) => (
                  <div key={edu.id} className="text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-slate-900">{edu.course || edu.degree || "Ensino Médio"}</span>
                      <span className="text-slate-600 text-[11px]">
                        Conclusão: {edu.endDate || "Dez/2025"}
                      </span>
                    </div>
                    <div className="text-slate-700 text-[11px]">
                      {edu.institution || "Escola Estadual Brasileira"}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      <strong className="text-slate-800">Destaque:</strong> Participação ativa em feira de ciências e representação de turma com foco em trabalho em equipe.
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-slate-900">Ensino Médio</span>
                    <span className="text-slate-600 text-[11px]">Conclusão: Dez/2025</span>
                  </div>
                  <div className="text-slate-700 text-[11px]">Colégio Estadual Presidente Kennedy</div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    <strong className="text-slate-800">Destaque:</strong> Monitoria de matemática e representação de turma.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 3. Cursos Complementares (2 subcolunas limpas) */}
        {!isHidden("courses") && (
          <section>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-950 pb-1 border-b border-slate-300">
              Cursos Complementares
            </h2>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <div key={course.id} className="bg-slate-50/60 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-900 block">{course.name}</span>
                    <span className="text-slate-600 text-[11px]">
                      {course.institution} {course.year ? `• ${course.year}` : ""} {course.hours ? `(${course.hours})` : ""}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-slate-50/60 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-900 block">Informática Básica e Pacote Office</span>
                    <span className="text-slate-600 text-[11px]">Fundação Bradesco • 2024 (40h)</span>
                  </div>
                  <div className="bg-slate-50/60 p-2 rounded border border-slate-200">
                    <span className="font-bold text-slate-900 block">Atendimento ao Cliente & Comunicação</span>
                    <span className="text-slate-600 text-[11px]">SEBRAE • 2024 (20h)</span>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* 4. Habilidades e Competências (Técnicas e Comportamentais) */}
        {(!isHidden("technicalSkills") || !isHidden("softSkills")) && (
          <section>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-950 pb-1 border-b border-slate-300">
              Habilidades e Competências
            </h2>
            <div className="mt-2 space-y-1.5 text-xs text-slate-800">
              <div>
                <strong className="text-slate-950">• Técnicas:</strong>{" "}
                <span className="text-slate-700">
                  {technicalSkills.length > 0
                    ? technicalSkills.join(", ")
                    : "Word, Excel básico, digitação rápida, navegação na internet e organização de arquivos digitais."}
                </span>
              </div>
              <div>
                <strong className="text-slate-950">• Comportamentais:</strong>{" "}
                <span className="text-slate-700">
                  {softSkills.length > 0
                    ? softSkills.join(", ")
                    : "Pontualidade, vontade de aprender, boa comunicação interpessoal, facilidade para trabalhar em equipe e empatia."}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 5. Atividades Extracurriculares e Voluntariado */}
        {(!isHidden("experience") || experiences.length > 0) && (
          <section>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-950 pb-1 border-b border-slate-300">
              Atividades Extracurriculares e Voluntariado
            </h2>
            <div className="mt-2 space-y-2 text-xs">
              {experiences.length > 0 ? (
                experiences.map((exp) => (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline font-bold text-slate-900">
                      <span>{exp.role} | {exp.company}</span>
                      <span className="text-slate-500 font-normal text-[11px]">
                        {exp.startDate} {exp.endDate ? `— ${exp.endDate}` : ""}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <div>
                  <div className="flex justify-between items-baseline font-bold text-slate-900">
                    <span>Voluntário em Arrecadação de Alimentos | Ação Social Comunitária</span>
                    <span className="text-slate-500 font-normal text-[11px]">2023 — 2024</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                    Apoio na recepção de doações, triagem e controle de itens para entrega a famílias do bairro.
                  </p>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
