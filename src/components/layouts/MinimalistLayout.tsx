"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { Phone, Mail, MapPin, User } from "lucide-react";

interface LayoutProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function MinimalistLayout({ data }: LayoutProps) {
  const { personal, target, experiences, education, courses, technicalSkills, softSkills, languages, customization } = data;

  const isHidden = (sec: string) => customization.hiddenSections?.includes(sec);

  // Fallbacks de exemplo baseados na persona Paulo Ferreira
  const displayName = personal.fullName || "Paulo Ferreira";
  const displayRole = target.jobTitle || "Coordenador de Operações & Logística";
  const displayPhone = personal.phone || "(11) 98123-4567";
  const displayEmail = personal.email || "paulo.ferreira@email.com";
  const displayLocation = personal.city && personal.state
    ? `${personal.city}, ${personal.state}`
    : "Campinas, SP";

  const allSkills = [...technicalSkills, ...softSkills];

  return (
    <div
      className="w-full bg-white text-slate-900 leading-normal p-6 sm:p-8 select-text"
      style={{
        fontSize: customization.fontSize === "sm" ? "12px" : customization.fontSize === "lg" ? "14px" : "13px",
      }}
    >
      {/* Cabeçalho Modelo 4: Fundo Branco, Foto Circular opcional à esquerda, Nome em Azul Marinho #1E3A5F */}
      <header className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-5 border-b-2" style={{ borderColor: "#1E3A5F" }}>
        {personal.photoUrl ? (
          <img
            src={personal.photoUrl}
            alt={displayName}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 shrink-0"
            style={{ borderColor: "#1E3A5F" }}
          />
        ) : (
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-bold text-lg text-white shrink-0"
            style={{ backgroundColor: "#1E3A5F" }}
          >
            {displayName.split(" ").map(n => n[0]).slice(0, 2).join("") || <User className="w-8 h-8" />}
          </div>
        )}

        <div className="flex-1 text-center sm:text-left space-y-1">
          <h1
            className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight"
            style={{ color: "#1E3A5F" }}
          >
            {displayName}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-700 tracking-wide">
            {displayRole}
          </p>

          <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" style={{ color: "#1E3A5F" }} />
              {displayLocation}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" style={{ color: "#1E3A5F" }} />
              {displayPhone}
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" style={{ color: "#1E3A5F" }} />
              {displayEmail}
            </span>
          </div>
        </div>
      </header>

      {/* Corpo em 2 Colunas: Ambas com Fundo Branco, Linhas e Títulos em Azul Marinho #1E3A5F */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5">
        {/* Coluna Esquerda (~38% da largura - 5 cols) */}
        <div className="md:col-span-5 space-y-5">
          {/* SOBRE MIM */}
          {!isHidden("summary") && (
            <section className="space-y-1.5">
              <div className="border-t-2 pt-1" style={{ borderColor: "#1E3A5F" }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#1E3A5F" }}>
                  SOBRE MIM
                </h2>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed text-justify">
                {target.summary ||
                  "Profissional com mais de 7 anos em gestão de supply chain, estoques e liderança de frentes logísticas. Foco em otimização de rotas, redução de perdas e aumento de produtividade."}
              </p>
            </section>
          )}

          {/* HABILIDADES E PROFICIÊNCIAS */}
          {(!isHidden("technicalSkills") || !isHidden("softSkills")) && (
            <section className="space-y-1.5">
              <div className="border-t-2 pt-1" style={{ borderColor: "#1E3A5F" }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#1E3A5F" }}>
                  HABILIDADES E PROFICIÊNCIAS
                </h2>
              </div>
              <ul className="space-y-1 text-xs text-slate-800 list-disc list-inside">
                {allSkills.length > 0 ? (
                  allSkills.map((skill, index) => (
                    <li key={index} className="leading-snug">{skill}</li>
                  ))
                ) : (
                  <>
                    <li>Gestão de Cadeia de Suprimentos (SCM)</li>
                    <li>Sistemas WMS e TMS</li>
                    <li>Metodologias 5S e Kaizen</li>
                    <li>Indicadores OTIF e Giro de Estoque</li>
                    <li>Liderança e Gestão de Pessoas</li>
                  </>
                )}
              </ul>
            </section>
          )}

          {/* CURSOS E TRABALHO VOLUNTÁRIO */}
          {(!isHidden("courses") || !isHidden("languages")) && (
            <section className="space-y-1.5">
              <div className="border-t-2 pt-1" style={{ borderColor: "#1E3A5F" }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#1E3A5F" }}>
                  CURSOS E QUALIFICAÇÕES
                </h2>
              </div>
              <div className="space-y-1 text-xs text-slate-800">
                {courses.length > 0 ? (
                  courses.map((c) => (
                    <p key={c.id}>
                      • <strong>{c.name}</strong> ({c.institution} - {c.year || "2023"})
                    </p>
                  ))
                ) : (
                  <>
                    <p>• Lean Logistics & Six Sigma Yellow Belt (2023)</p>
                    <p>• Gestão de Frotas e Roteirização Inteligente (2022)</p>
                    <p>• Inglês Intermediário para Negócios</p>
                  </>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Coluna Direita (~62% da largura - 7 cols) */}
        <div className="md:col-span-7 space-y-5">
          {/* CARREIRA */}
          {!isHidden("experience") && (
            <section className="space-y-2">
              <div className="border-t-2 pt-1" style={{ borderColor: "#1E3A5F" }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#1E3A5F" }}>
                  CARREIRA
                </h2>
              </div>
              <div className="space-y-3.5 text-xs">
                {experiences.length > 0 ? (
                  experiences.map((exp) => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <strong className="text-sm text-slate-950 font-bold">{exp.role}</strong>
                        <span className="text-slate-500 font-medium text-[11px]">
                          {exp.startDate} {exp.endDate ? `— ${exp.endDate}` : "2021 — 2025"}
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
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <strong className="text-sm text-slate-950 font-bold">Coordenador de Logística</strong>
                        <span className="text-slate-500 font-medium text-[11px]">2021 — 2025</span>
                      </div>
                      <div className="text-slate-700 font-semibold text-[11px]">LogExpress Transportes & Distribuição</div>
                      <p className="text-slate-700 leading-relaxed text-justify">
                        Supervisão das operações de cross-docking, frota de 45 veículos e gestão de equipe de 30 colaboradores, alcançando índice de entrega no prazo (OTIF) de 98,2%.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <strong className="text-sm text-slate-950 font-bold">Supervisor de Expedição</strong>
                        <span className="text-slate-500 font-medium text-[11px]">2018 — 2021</span>
                      </div>
                      <div className="text-slate-700 font-semibold text-[11px]">Centro de Distribuição Aliança</div>
                      <p className="text-slate-700 leading-relaxed text-justify">
                        Controle de inventário cíclico, redução de perdas de carga em 35% e implementação de endereçamento por código de barras.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* ESCOLARIDADE */}
          {!isHidden("education") && (
            <section className="space-y-2">
              <div className="border-t-2 pt-1" style={{ borderColor: "#1E3A5F" }}>
                <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#1E3A5F" }}>
                  ESCOLARIDADE
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
                      <span className="text-slate-600 font-medium text-[11px]">{edu.endDate || "2018"}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex justify-between items-baseline">
                      <div>
                        <strong className="text-slate-900 block text-sm">Tecnólogo em Logística e Gestão Portuária</strong>
                        <span className="text-slate-600 text-[11px]">FATEC — Faculdade de Tecnologia</span>
                      </div>
                      <span className="text-slate-600 font-medium text-[11px]">2016 — 2018</span>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
