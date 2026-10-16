"use client";

import React from "react";
import { LayoutType } from "@/types/resume";

interface ModelA4PreviewProps {
  layoutId: LayoutType;
}

export function ModelA4Preview({ layoutId }: ModelA4PreviewProps) {
  switch (layoutId) {
    case "classic-ats":
      return (
        <div className="w-full h-full bg-white p-4 sm:p-5 flex flex-col justify-between text-slate-800 font-sans shadow-inner overflow-hidden select-none">
          {/* Header Clássico Centralizado */}
          <div className="text-center pb-2.5 border-b border-slate-900/80">
            <h4 className="text-[13px] font-extrabold uppercase tracking-wider text-slate-900">
              Carlos Eduardo Silva
            </h4>
            <p className="text-[9px] text-slate-700 font-medium mt-0.5">
              Analista de Suporte e Sistemas • São Paulo, SP
            </p>
            <p className="text-[7.5px] text-slate-500 mt-0.5">
              carlos.silva@email.com • (11) 98765-4321 • linkedin.com/in/carlos-silva
            </p>
          </div>

          {/* Seção Resumo */}
          <div className="py-2 border-b border-slate-200">
            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-900 block mb-1">
              Resumo Profissional
            </span>
            <div className="space-y-1">
              <div className="h-1 bg-slate-300 w-full rounded-xs"></div>
              <div className="h-1 bg-slate-200 w-11/12 rounded-xs"></div>
              <div className="h-1 bg-slate-200 w-4/5 rounded-xs"></div>
            </div>
          </div>

          {/* Experiência Profissional Linear */}
          <div className="py-2 border-b border-slate-200 flex-1 space-y-2">
            <span className="text-[8px] font-bold uppercase tracking-wider text-slate-900 block">
              Experiência Profissional
            </span>
            <div className="space-y-1">
              <div className="flex justify-between text-[7.5px] font-bold text-slate-800">
                <span>TechServ Soluções Digitais</span>
                <span className="text-slate-500 font-normal">2023 - Presente</span>
              </div>
              <p className="text-[7px] text-slate-600 font-medium">Analista de Suporte Pleno</p>
              <div className="space-y-0.5 pt-0.5 pl-1.5 border-l border-slate-300">
                <div className="h-1 bg-slate-300 w-full rounded-xs"></div>
                <div className="h-1 bg-slate-200 w-5/6 rounded-xs"></div>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[7.5px] font-bold text-slate-800">
                <span>Inovare Distribuidora</span>
                <span className="text-slate-500 font-normal">2021 - 2023</span>
              </div>
              <p className="text-[7px] text-slate-600 font-medium">Assistente de TI</p>
              <div className="space-y-0.5 pt-0.5 pl-1.5 border-l border-slate-300">
                <div className="h-1 bg-slate-200 w-11/12 rounded-xs"></div>
              </div>
            </div>
          </div>

          {/* Rodapé ATS */}
          <div className="pt-2 flex justify-between items-center text-[7px] text-slate-500">
            <span className="inline-flex items-center gap-1 font-semibold text-blue-900">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-700"></span>
              Padrão Otimizado para Robôs ATS
            </span>
            <span>Folha A4</span>
          </div>
        </div>
      );

    case "modern":
      return (
        <div className="w-full h-full bg-white flex flex-col font-sans shadow-inner overflow-hidden select-none">
          {/* Header Moderno Azul Profundo */}
          <div className="bg-blue-900 text-white p-3.5 sm:p-4">
            <h4 className="text-[13px] font-extrabold tracking-tight">
              Carlos Eduardo Silva
            </h4>
            <p className="text-[9px] text-blue-200 font-medium mt-0.5">
              Analista de Suporte e Sistemas
            </p>
            <div className="flex gap-2 text-[7px] text-blue-100/80 mt-1">
              <span>carlos.silva@email.com</span>
              <span>•</span>
              <span>São Paulo, SP</span>
            </div>
          </div>

          {/* Duas Colunas */}
          <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
            {/* Coluna Esquerda Lateral */}
            <div className="col-span-4 bg-slate-100/90 p-2.5 sm:p-3 border-r border-slate-200 space-y-2.5">
              <div>
                <span className="text-[7.5px] font-bold uppercase tracking-wider text-blue-950 block mb-1">
                  Competências
                </span>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[6.5px] px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-700">SQL</span>
                  <span className="text-[6.5px] px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-700">Linux</span>
                  <span className="text-[6.5px] px-1 py-0.5 bg-white border border-slate-200 rounded text-slate-700">Cloud</span>
                </div>
              </div>

              <div>
                <span className="text-[7.5px] font-bold uppercase tracking-wider text-blue-950 block mb-1">
                  Idiomas
                </span>
                <p className="text-[7px] text-slate-700 font-medium">Inglês • Interm.</p>
                <p className="text-[7px] text-slate-700 font-medium">Espanhol • Básico</p>
              </div>

              <div>
                <span className="text-[7.5px] font-bold uppercase tracking-wider text-blue-950 block mb-1">
                  Certificações
                </span>
                <p className="text-[6.5px] text-slate-600">ITIL v4 Foundation</p>
              </div>
            </div>

            {/* Coluna Direita Conteúdo Principal */}
            <div className="col-span-8 p-3 space-y-2">
              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-blue-900 block mb-1">
                  Perfil Profissional
                </span>
                <div className="space-y-0.5">
                  <div className="h-1 bg-slate-300 w-full rounded-xs"></div>
                  <div className="h-1 bg-slate-200 w-5/6 rounded-xs"></div>
                </div>
              </div>

              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-blue-900 block mb-1">
                  Experiências
                </span>
                <div className="space-y-1">
                  <p className="text-[7.5px] font-bold text-slate-800">TechServ Soluções</p>
                  <div className="h-1 bg-slate-200 w-full rounded-xs"></div>
                  <div className="h-1 bg-slate-200 w-4/5 rounded-xs"></div>
                </div>
              </div>

              <div>
                <span className="text-[8px] font-bold uppercase tracking-wider text-blue-900 block mb-1">
                  Formação
                </span>
                <p className="text-[7px] text-slate-700 font-semibold">Análise de Sistemas</p>
                <p className="text-[6.5px] text-slate-500">Universidade Nove de Julho</p>
              </div>
            </div>
          </div>
        </div>
      );

    case "minimalist":
      return (
        <div className="w-full h-full bg-[#fdfdfc] p-5 flex flex-col justify-between font-serif text-slate-900 shadow-inner overflow-hidden select-none">
          {/* Header Minimalista Editorial */}
          <div className="space-y-1 border-b border-slate-300 pb-3">
            <span className="text-[7px] uppercase tracking-widest text-slate-500 font-sans block">
              Curriculum Vitae
            </span>
            <h4 className="text-[14px] font-normal tracking-wide text-slate-950">
              Carlos Eduardo Silva
            </h4>
            <div className="flex justify-between items-center text-[7.5px] text-slate-600 font-sans pt-1">
              <span>Analista de Suporte & Sistemas</span>
              <span>São Paulo, Brasil</span>
            </div>
          </div>

          {/* Linhas Editoriais Elegantes */}
          <div className="py-2.5 flex-1 space-y-3 font-sans">
            <div>
              <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                01 / Síntese
              </span>
              <p className="text-[7.5px] text-slate-700 leading-relaxed font-serif italic">
                Especialista em atendimento técnico e sustentação com foco em eficiência e automação.
              </p>
            </div>

            <div>
              <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                02 / Histórico
              </span>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[7.5px] font-medium">
                  <span className="font-semibold text-slate-900">TechServ Soluções Digitais</span>
                  <span className="text-slate-500">2023 - 2026</span>
                </div>
                <div className="h-0.5 bg-slate-200 w-full"></div>
                <div className="flex justify-between text-[7.5px] font-medium">
                  <span className="font-semibold text-slate-900">Inovare Distribuidora</span>
                  <span className="text-slate-500">2021 - 2023</span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[7px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
                03 / Formação
              </span>
              <p className="text-[7.5px] text-slate-800 font-medium">Análise e Desenvolvimento de Sistemas</p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 text-right text-[6.5px] text-slate-400 font-sans uppercase tracking-widest">
            Estética Editorial • A4
          </div>
        </div>
      );

    case "first-job":
      return (
        <div className="w-full h-full bg-white flex flex-col font-sans shadow-inner overflow-hidden select-none">
          {/* Header Primeiro Emprego Verde Esmeralda */}
          <div className="p-3.5 bg-emerald-700 text-white">
            <span className="text-[7px] uppercase font-bold tracking-widest text-emerald-200 block">
              Início de Carreira & Potencial
            </span>
            <h4 className="text-[13px] font-extrabold tracking-tight mt-0.5">
              Carlos Eduardo Silva
            </h4>
            <p className="text-[8px] text-emerald-100 font-medium mt-0.5">
              Estudante de Análise e Desenvolvimento de Sistemas
            </p>
          </div>

          {/* Destaque para Objetivo */}
          <div className="p-3 bg-emerald-50/70 border-b border-emerald-100 space-y-1">
            <span className="text-[7.5px] font-bold uppercase tracking-wider text-emerald-900 block">
              Objetivo Profissional
            </span>
            <div className="h-1 bg-emerald-200 w-full rounded-xs"></div>
            <div className="h-1 bg-emerald-100 w-4/5 rounded-xs"></div>
          </div>

          {/* Destaque Principal: Formação e Cursos */}
          <div className="p-3 flex-1 space-y-2.5">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-900 block mb-1">
                Formação Acadêmica
              </span>
              <p className="text-[7.5px] font-bold text-slate-800">Tecnólogo em Análise de Sistemas</p>
              <p className="text-[7px] text-slate-500">Universidade Nove de Julho • Concluído em 2022</p>
            </div>

            <div>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-900 block mb-1">
                Cursos de Aperfeiçoamento
              </span>
              <div className="space-y-0.5 text-[7px] text-slate-700">
                <p>• Redes e Cloud Computing (40h)</p>
                <p>• SQL Avançado e Banco de Dados (30h)</p>
              </div>
            </div>

            <div>
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-900 block mb-1">
                Competências
              </span>
              <div className="flex flex-wrap gap-1">
                <span className="text-[6.5px] px-1 py-0.5 bg-emerald-100 text-emerald-900 font-semibold rounded">
                  Proatividade
                </span>
                <span className="text-[6.5px] px-1 py-0.5 bg-emerald-100 text-emerald-900 font-semibold rounded">
                  Comunicação
                </span>
                <span className="text-[6.5px] px-1 py-0.5 bg-emerald-100 text-emerald-900 font-semibold rounded">
                  Organização
                </span>
              </div>
            </div>
          </div>
        </div>
      );

    case "tech-specialist":
      return (
        <div className="w-full h-full bg-slate-950 text-slate-100 flex flex-col font-mono shadow-inner overflow-hidden select-none">
          {/* Header Dark Tech */}
          <div className="p-3.5 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[7px] text-slate-400 ml-1">terminal://resume.md</span>
            </div>
            <h4 className="text-[12px] font-bold text-cyan-400">
              carlos.silva@tech ~ $
            </h4>
            <p className="text-[8px] text-slate-300 font-sans">
              Analista de Suporte & Sustentação de Sistemas
            </p>
          </div>

          {/* Stack Tecnológico em Tags */}
          <div className="p-3 bg-slate-900/60 border-b border-slate-800 space-y-1">
            <span className="text-[7px] uppercase font-bold text-cyan-500 block">
              &gt; Core Stack
            </span>
            <div className="flex flex-wrap gap-1 font-sans">
              <span className="text-[6.5px] px-1.5 py-0.5 bg-slate-800 border border-cyan-800 text-cyan-300 rounded">
                Linux
              </span>
              <span className="text-[6.5px] px-1.5 py-0.5 bg-slate-800 border border-cyan-800 text-cyan-300 rounded">
                PostgreSQL
              </span>
              <span className="text-[6.5px] px-1.5 py-0.5 bg-slate-800 border border-cyan-800 text-cyan-300 rounded">
                AWS
              </span>
              <span className="text-[6.5px] px-1.5 py-0.5 bg-slate-800 border border-cyan-800 text-cyan-300 rounded">
                Git
              </span>
            </div>
          </div>

          {/* Experiência com Métricas */}
          <div className="p-3 flex-1 space-y-2 font-sans text-[7px]">
            <div>
              <span className="text-[7px] font-bold uppercase text-slate-400 block mb-0.5 font-mono">
                &gt; Work History
              </span>
              <p className="font-bold text-white">TechServ Soluções Digitais</p>
              <p className="text-slate-400 text-[6.5px]">Redução de TMA em 25% via automação de chamados.</p>
            </div>

            <div>
              <p className="font-bold text-white">Inovare Distribuidora</p>
              <p className="text-slate-400 text-[6.5px]">Backup automatizado com 90% menos incidentes.</p>
            </div>

            <div className="pt-1 border-t border-slate-800/80">
              <span className="text-[6.5px] text-cyan-400 block font-mono">github.com/carlossilva-exemplo</span>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
