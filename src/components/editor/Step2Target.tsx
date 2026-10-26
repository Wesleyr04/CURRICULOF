"use client";

import React, { useState } from "react";
import { TargetInfo, ResumeData, CreationMode, CareerStage } from "@/types/resume";
import { ArrowLeft, ArrowRight, Lightbulb, AlertTriangle, Briefcase, GraduationCap, RefreshCw, CheckCircle2 } from "lucide-react";
import { validateContentSafety } from "@/lib/security/content-guard";

interface Step2Props {
  data: TargetInfo;
  fullData: ResumeData;
  mode?: CreationMode;
  onChange: (data: TargetInfo) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CAREER_STAGE_OPTIONS: Array<{
  id: CareerStage;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "experienced",
    label: "Já atuo / tenho experiência nesta área",
    description: "Foco em domínio técnico, ferramentas, resultados e maturidade profissional.",
    icon: Briefcase,
  },
  {
    id: "entry_level",
    label: "Buscando primeiro emprego / estágio nesta área",
    description: "Foco em iniciativa, facilidade de aprendizado e base educacional/cursos.",
    icon: GraduationCap,
  },
  {
    id: "career_transition",
    label: "Estou em transição de carreira (vim de outra área)",
    description: "Foco em habilidades transferíveis das suas experiências anteriores para o novo cargo.",
    icon: RefreshCw,
  },
];

export function Step2Target({ data, onChange, onNext, onPrev }: Step2Props) {
  const [formError, setFormError] = useState<string | null>(null);

  const selectedCareerStage: CareerStage = data.careerStage || "experienced";

  const updateField = <K extends keyof TargetInfo>(field: K, value: TargetInfo[K]) => {
    setFormError(null);
    onChange({ ...data, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanJob = data.jobTitle.trim();

    if (!cleanJob) {
      setFormError("Informe o cargo ou área que você está buscando agora.");
      return;
    }

    // Camada de Validação Estrita de Conteúdo (Custo Zero de Tokens)
    const checkJob = validateContentSafety(cleanJob);
    if (!checkJob.allowed) {
      setFormError(`Cargo pretendido inválido: ${checkJob.reason}`);
      return;
    }

    if (data.careerContext && data.careerContext.trim()) {
      const checkContext = validateContentSafety(data.careerContext.trim());
      if (!checkContext.allowed) {
        setFormError(`Contexto informado inválido: ${checkContext.reason}`);
        return;
      }
    }

    // Garante que field esteja preenchido por compatibilidade
    if (!data.field || !data.field.trim()) {
      onChange({ ...data, field: cleanJob, careerStage: selectedCareerStage });
    }

    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Etapa 2 — Cargo Pretendido & Objetivo</h2>
        <p className="text-xs text-slate-500 mt-1">
          Defina o foco da sua candidatura. Essas informações guiam o alinhamento e o direcionamento profissional de todo o seu currículo.
        </p>
      </div>

      {/* 1. Cargo / Vaga Desejada (Objetivo) */}
      <div>
        <label htmlFor="targetJobTitle" className="block text-xs font-bold text-slate-700 mb-1">
          Qual cargo ou área você está buscando agora? <span className="text-rose-600">*</span>
        </label>
        <input
          id="targetJobTitle"
          type="text"
          required
          aria-required="true"
          aria-invalid={Boolean(formError)}
          aria-describedby={formError ? "target-error" : undefined}
          value={data.jobTitle}
          onChange={(e) => updateField("jobTitle", e.target.value)}
          placeholder="Ex: Analista Financeiro Júnior, Desenvolvedor React, Vendedor"
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900 shadow-2xs"
        />
        <p className="mt-1 text-[11px] text-slate-500">
          Esse título aparecerá no topo do seu currículo como seu objetivo profissional.
        </p>
      </div>

      {/* 2. Momento de Carreira neste Cargo */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Seu momento de carreira neste cargo: <span className="text-rose-600">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {CAREER_STAGE_OPTIONS.map((option) => {
            const isSelected = selectedCareerStage === option.id;
            const IconComponent = option.icon;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => updateField("careerStage", option.id)}
                className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-blue-900 bg-blue-50/60 ring-2 ring-blue-900/20 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className={`p-1.5 rounded-lg ${isSelected ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-900" />}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug">
                    {option.label}
                  </h4>
                  <p className="mt-1 text-[10px] text-slate-600 leading-relaxed">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Como essa informação é utilizada & Contexto Adicional (Gasto ZERO de tokens nesta etapa) */}
      <div className="space-y-3">
        {/* Card Informativo: Como essa informação é utilizada: */}
        <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-950 text-xs">
          <Lightbulb className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-blue-900 block mb-0.5">Como essa informação é utilizada:</span>
            Adapta a apresentação do seu perfil e destaca suas experiências anteriores em total alinhamento com o cargo pretendido. A seção <strong>Sobre você</strong> oficial será estruturada na <strong>Etapa 6</strong>, conectando com precisão todo o histórico que você preencher a seguir.
          </div>
        </div>

        {/* Input: Contexto ou foco adicional (Opcional) */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label htmlFor="targetCareerContext" className="block text-xs font-bold text-slate-700">
              Contexto ou foco adicional <span className="text-slate-400 font-normal">(Opcional)</span>
            </label>
            <span className="text-[10px] text-slate-400">
              {(data.careerContext || "").length}/500
            </span>
          </div>
          <textarea
            id="targetCareerContext"
            rows={3}
            maxLength={500}
            value={data.careerContext || ""}
            onChange={(e) => updateField("careerContext", e.target.value)}
            placeholder="Ex: Foco em gestão de projetos remotos; transição vindo de vendas para desenvolvimento front-end; ênfase em processos de qualidade e segurança."
            className="w-full p-3 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900 leading-relaxed shadow-2xs"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Destaque qualquer nuance ou ponto forte para considerar ao estruturar sua apresentação profissional e refinar suas atividades na etapa final.
          </p>
        </div>
      </div>

      {formError && (
        <div id="target-error" role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Navegação */}
      <div className="pt-4 flex justify-between items-center">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Dados Pessoais</span>
        </button>

        <button
          type="submit"
          className="px-6 py-2.5 text-sm font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
        >
          <span>Avançar para Experiências</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
