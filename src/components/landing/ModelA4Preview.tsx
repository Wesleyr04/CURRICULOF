"use client";

import React from "react";
import { LayoutType } from "@/types/resume";
import { Phone, Mail, MapPin } from "lucide-react";

interface ModelA4PreviewProps {
  layoutId: LayoutType;
}

export function ModelA4Preview({ layoutId }: ModelA4PreviewProps) {
  switch (layoutId) {
    /* =========================================================================
       MODELO 1: Jovem Aprendiz / Primeiro Emprego (Felipe Mesquita)
       Preto, Branco e Simples — 1 Coluna Enxuta
       ========================================================================= */
    case "first-job":
      return (
        <div className="w-full h-full bg-white p-3.5 sm:p-4 flex flex-col justify-between font-sans text-slate-900 shadow-inner overflow-hidden select-none">
          {/* Cabeçalho */}
          <div className="flex justify-between items-start pb-2 border-b-2 border-slate-900">
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-tight text-slate-950">
                Felipe Mesquita
              </h4>
              <p className="text-[7.5px] font-semibold text-slate-700">
                Jovem Aprendiz | Primeiro Emprego
              </p>
            </div>
            <div className="text-[6px] text-slate-600 text-right space-y-0.5 shrink-0">
              <p>(12) 3456-7890</p>
              <p>ola@grandesite.com.br</p>
              <p>Rua Alegre, 123</p>
            </div>
          </div>

          {/* Seções em 1 Coluna */}
          <div className="py-1.5 flex-1 space-y-2 text-[6.5px]">
            {/* 1. Objetivo Profissional */}
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-900 block pb-0.5 border-b border-slate-200">
                Objetivo Profissional
              </span>
              <p className="text-slate-600 text-[6px] leading-tight mt-0.5">
                Busco oportunidade como Jovem Aprendiz para desenvolver rotinas administrativas e atendimento com dedicação.
              </p>
            </div>

            {/* 2. Formação Acadêmica */}
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-900 block pb-0.5 border-b border-slate-200">
                Formação Acadêmica
              </span>
              <div className="flex justify-between mt-0.5 font-bold text-slate-900">
                <span>Ensino Médio</span>
                <span className="text-slate-500 font-normal">Dez/2025</span>
              </div>
              <p className="text-slate-600">Colégio Estadual Presidente Kennedy</p>
              <p className="text-slate-500 text-[5.5px]">
                <strong>Destaque:</strong> Representação de turma e monitoria.
              </p>
            </div>

            {/* 3. Cursos Complementares (2 subcolunas) */}
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-900 block pb-0.5 border-b border-slate-200">
                Cursos Complementares
              </span>
              <div className="grid grid-cols-2 gap-1 mt-0.5">
                <div className="bg-slate-50 p-1 rounded border border-slate-150">
                  <span className="font-bold text-slate-900 block">Informática & Office</span>
                  <span className="text-slate-500 text-[5.5px]">Fund. Bradesco (40h)</span>
                </div>
                <div className="bg-slate-50 p-1 rounded border border-slate-150">
                  <span className="font-bold text-slate-900 block">Atendimento ao Cliente</span>
                  <span className="text-slate-500 text-[5.5px]">SEBRAE (20h)</span>
                </div>
              </div>
            </div>

            {/* 4. Habilidades */}
            <div>
              <span className="font-bold uppercase tracking-wider text-slate-900 block pb-0.5 border-b border-slate-200">
                Habilidades e Competências
              </span>
              <p className="text-slate-700 text-[6px] mt-0.5">
                <strong>• Técnicas:</strong> Word, Excel básico, digitação rápida e arquivos.
              </p>
              <p className="text-slate-700 text-[6px]">
                <strong>• Comportamentais:</strong> Pontualidade, comunicação e trabalho em equipe.
              </p>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-200 flex justify-between text-[6px] text-slate-400 uppercase tracking-wider">
            <span>Modelo 1 • 1 Coluna P&B</span>
            <span>Folha A4</span>
          </div>
        </div>
      );

    /* =========================================================================
       MODELO 2: Simples e Preto (Cíntia Campos)
       Monocromático com Detalhe Geométrico Preto/Grafite
       ========================================================================= */
    case "classic-ats":
      return (
        <div className="w-full h-full bg-white flex flex-col font-sans text-slate-900 shadow-inner overflow-hidden relative select-none">
          {/* Detalhe Geométrico Diagonal Preto no Canto Superior Esquerdo */}
          <div
            className="absolute top-0 left-0 w-16 h-8 bg-slate-950 pointer-events-none"
            style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
          />

          {/* Cabeçalho com Foto Circular e Ícones Pretos */}
          <div className="p-3.5 pb-2.5 flex items-center gap-2.5 border-b border-slate-300">
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-900 flex items-center justify-center font-bold text-[10px] text-slate-900 shrink-0">
              CC
            </div>
            <div className="flex-1 space-y-0.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-tight text-slate-950">
                Cíntia Campos
              </h4>
              <div className="flex flex-wrap gap-x-2 text-[6px] text-slate-700">
                <span>(11) 97654-3210</span>
                <span>•</span>
                <span>cintia.campos@email.com</span>
                <span>•</span>
                <span>São Paulo, SP</span>
              </div>
            </div>
          </div>

          {/* Seções em Fluxo Direto e Super Objetivo */}
          <div className="p-3.5 py-2 flex-1 space-y-2 text-[6.5px]">
            {/* 1. Objetivo */}
            <div>
              <span className="font-extrabold uppercase tracking-wider text-slate-950 block pb-0.5 border-b border-slate-900">
                Objetivo
              </span>
              <p className="text-slate-800 text-[6px] font-medium mt-0.5">
                Vendedora / Atendimento Comercial
              </p>
            </div>

            {/* 2. Qualificação */}
            <div>
              <span className="font-extrabold uppercase tracking-wider text-slate-950 block pb-0.5 border-b border-slate-900">
                Qualificação Profissional
              </span>
              <p className="text-slate-600 text-[6px] leading-tight mt-0.5">
                Vivência em atendimento presencial, abertura de caixa e organização de ponto de venda com foco em metas.
              </p>
            </div>

            {/* 3. Experiência */}
            <div>
              <span className="font-extrabold uppercase tracking-wider text-slate-950 block pb-0.5 border-b border-slate-900">
                Experiência Profissional
              </span>
              <div className="mt-0.5 space-y-1">
                <div className="flex justify-between font-bold text-slate-900 text-[6px]">
                  <span>Atendente Comercial — Magazine Central</span>
                  <span className="text-slate-500 font-normal">2022-2024</span>
                </div>
                <p className="text-slate-600 text-[5.5px]">• Atendimento no balcão e demonstração de produtos.</p>
                <div className="flex justify-between font-bold text-slate-900 text-[6px]">
                  <span>Operadora de Caixa — Supermercados União</span>
                  <span className="text-slate-500 font-normal">2020-2022</span>
                </div>
              </div>
            </div>

            {/* 4. Formação & Cursos */}
            <div>
              <span className="font-extrabold uppercase tracking-wider text-slate-950 block pb-0.5 border-b border-slate-900">
                Formação & Cursos
              </span>
              <p className="text-slate-700 text-[6px] mt-0.5">
                • Ensino Médio Completo (Concluído em 2019)
              </p>
              <p className="text-slate-600 text-[5.5px]">
                • 2024 - Técnicas de Vendas e Negociação (SEBRAE)
              </p>
            </div>
          </div>

          <div className="p-2 border-t border-slate-200 text-right text-[6px] text-slate-400 font-bold uppercase">
            Modelo 2 • Monocromático ATS
          </div>
        </div>
      );

    /* =========================================================================
       MODELO 3: Marrom, Branco e Moderno (Juliana Silva)
       Executivo / Administrativo — 2 Colunas com Sidebar Marrom #6E5034
       ========================================================================= */
    case "modern":
      return (
        <div className="w-full h-full bg-white flex font-sans shadow-inner overflow-hidden select-none">
          {/* Sidebar Esquerda Marrom (~35%) */}
          <div
            className="w-[35%] p-2.5 text-white flex flex-col justify-between shrink-0"
            style={{ backgroundColor: "#6E5034" }}
          >
            <div className="space-y-2.5">
              {/* Foto quadrada com moldura deslocada */}
              <div className="flex justify-center pt-1">
                <div className="w-12 h-12 bg-amber-950/50 border border-white/30 rounded-xs flex items-center justify-center font-bold text-[10px] text-amber-200">
                  JS
                </div>
              </div>

              {/* CONTATO */}
              <div>
                <span className="text-[6.5px] font-bold uppercase tracking-widest block pb-0.5 border-b border-white/30">
                  CONTATO
                </span>
                <div className="text-[5.5px] text-amber-100/90 space-y-0.5 mt-0.5">
                  <p>(11) 98765-4321</p>
                  <p className="truncate">juliana@email.com</p>
                  <p>São Paulo, SP</p>
                </div>
              </div>

              {/* SOBRE MIM */}
              <div>
                <span className="text-[6.5px] font-bold uppercase tracking-widest block pb-0.5 border-b border-white/30">
                  SOBRE MIM
                </span>
                <p className="text-[5.5px] text-amber-100/90 leading-tight mt-0.5">
                  5+ anos em controladoria, conciliação e DRE gerencial com foco em conformidade e metas.
                </p>
              </div>

              {/* HABILIDADES */}
              <div>
                <span className="text-[6.5px] font-bold uppercase tracking-widest block pb-0.5 border-b border-white/30">
                  HABILIDADES
                </span>
                <ul className="text-[5.5px] text-amber-100/90 space-y-0.5 list-disc list-inside mt-0.5">
                  <li>Planejamento Orçamentário</li>
                  <li>DRE & Fluxo de Caixa</li>
                  <li>Excel & Power BI</li>
                </ul>
              </div>
            </div>

            <span className="text-[5px] text-amber-200/60 uppercase">Sidebar #6E5034</span>
          </div>

          {/* Coluna Direita Branca (~65%) */}
          <div className="w-[65%] p-3 flex flex-col justify-between space-y-2">
            <div>
              {/* Topo Direito */}
              <div className="pb-1.5 border-b border-slate-200">
                <h4 className="text-[12px] font-extrabold uppercase tracking-tight" style={{ color: "#6E5034" }}>
                  Juliana Silva
                </h4>
                <p className="text-[7px] font-semibold text-slate-700">Analista Financeiro</p>
                <div className="w-8 h-0.5 mt-1" style={{ backgroundColor: "#6E5034" }} />
              </div>

              {/* EXPERIÊNCIA */}
              <div className="mt-2 space-y-1">
                <span className="text-[7px] font-bold uppercase tracking-wider block" style={{ color: "#6E5034" }}>
                  EXPERIÊNCIA
                </span>
                <div className="text-[6px]">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Grupo Mantiqueira</span>
                    <span className="text-slate-500 font-normal">2022-2025</span>
                  </div>
                  <p className="italic text-slate-600">Analista Financeiro Pleno</p>
                  <p className="text-slate-600 leading-tight">• DRE gerencial e fluxo de caixa.</p>
                </div>
              </div>

              {/* FORMAÇÃO */}
              <div className="mt-2 space-y-1">
                <span className="text-[7px] font-bold uppercase tracking-wider block" style={{ color: "#6E5034" }}>
                  FORMAÇÃO
                </span>
                <div className="text-[6px]">
                  <p className="font-bold text-slate-900">Ciências Contábeis</p>
                  <p className="text-slate-500">Univ. Presbiteriana Mackenzie • 2021</p>
                </div>
              </div>
            </div>

            <div className="text-right text-[6px] text-slate-400 uppercase font-medium">
              Modelo 3 • Executivo
            </div>
          </div>
        </div>
      );

    /* =========================================================================
       MODELO 4: Azul Linhas Simples (Paulo Ferreira)
       Corporativo / Especialistas — 2 Colunas com Acentos Azul Marinho #1E3A5F
       ========================================================================= */
    case "minimalist":
    case "tech-specialist":
    default:
      return (
        <div className="w-full h-full bg-white p-3 flex flex-col justify-between font-sans shadow-inner overflow-hidden select-none">
          {/* Cabeçalho */}
          <div className="flex items-center gap-2 pb-2 border-b-2" style={{ borderColor: "#1E3A5F" }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-[9px] shrink-0"
              style={{ backgroundColor: "#1E3A5F" }}
            >
              PF
            </div>
            <div className="flex-1 space-y-0.5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-tight" style={{ color: "#1E3A5F" }}>
                Paulo Ferreira
              </h4>
              <p className="text-[7px] font-semibold text-slate-700">Coordenador de Logística</p>
              <div className="flex gap-2 text-[5.5px] text-slate-500">
                <span>(11) 98123-4567</span>
                <span>•</span>
                <span>Campinas, SP</span>
              </div>
            </div>
          </div>

          {/* 2 Colunas Estruturadas (ambas com fundo branco e linha azul no topo de cada seção) */}
          <div className="grid grid-cols-12 gap-2 py-1.5 flex-1 text-[6px]">
            {/* Coluna Esquerda (~38% - 5 cols) */}
            <div className="col-span-5 space-y-2 border-r border-slate-100 pr-1.5">
              <div>
                <span className="font-bold uppercase tracking-wider block border-t-2 pt-0.5" style={{ color: "#1E3A5F", borderColor: "#1E3A5F" }}>
                  SOBRE MIM
                </span>
                <p className="text-slate-600 leading-tight mt-0.5">
                  7+ anos em supply chain, estoque e liderança operacional com foco em OTIF.
                </p>
              </div>

              <div>
                <span className="font-bold uppercase tracking-wider block border-t-2 pt-0.5" style={{ color: "#1E3A5F", borderColor: "#1E3A5F" }}>
                  HABILIDADES
                </span>
                <ul className="text-slate-700 space-y-0.5 list-disc list-inside mt-0.5">
                  <li>WMS & TMS</li>
                  <li>Cadeia de Suprimentos</li>
                  <li>Metodologia 5S</li>
                </ul>
              </div>
            </div>

            {/* Coluna Direita (~62% - 7 cols) */}
            <div className="col-span-7 space-y-2 pl-0.5">
              <div>
                <span className="font-bold uppercase tracking-wider block border-t-2 pt-0.5" style={{ color: "#1E3A5F", borderColor: "#1E3A5F" }}>
                  CARREIRA
                </span>
                <div className="mt-0.5 space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>Coord. de Logística</span>
                    <span className="text-slate-500 font-normal">2021-2025</span>
                  </div>
                  <p className="text-slate-600 text-[5.5px]">LogExpress Transportes • Frota de 45 veículos.</p>
                </div>
              </div>

              <div>
                <span className="font-bold uppercase tracking-wider block border-t-2 pt-0.5" style={{ color: "#1E3A5F", borderColor: "#1E3A5F" }}>
                  ESCOLARIDADE
                </span>
                <div className="mt-0.5">
                  <p className="font-bold text-slate-900">Tecnólogo em Logística</p>
                  <p className="text-slate-500 text-[5.5px]">FATEC • Concluído em 2018</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-200 flex justify-between text-[6px] text-slate-400 uppercase">
            <span>Modelo 4 • Azul #1E3A5F</span>
            <span>Folha A4</span>
          </div>
        </div>
      );
  }
}
