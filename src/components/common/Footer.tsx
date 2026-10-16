"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Lock } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

export function Footer() {
  return (
    <footer className="no-print bg-white border-t border-slate-200 mt-auto text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Coluna 1: Sobre */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-900 tracking-tight">
                {SITE_CONFIG.name}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Privacidade Garantida
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              Plataforma brasileira para criação rápida e acessível de currículos profissionais com assistência de IA.
              Apenas {SITE_CONFIG.pricing.formatted} por currículo. Sem contas, sem senhas e com exclusão imediata dos dados após o uso.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Arquitetura sem armazenamento de currículos em banco de dados</span>
            </div>
          </div>

          {/* Coluna 2: Navegação */}
          <div>
            <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider mb-3">
              Navegação
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-blue-900 transition-colors">
                  Página Inicial
                </Link>
              </li>
              <li>
                <Link href="/editor" className="hover:text-blue-900 transition-colors">
                  Criar Currículo
                </Link>
              </li>
              <li>
                <Link href="/modelos" className="hover:text-blue-900 transition-colors">
                  Conhecer os 5 Modelos
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Legal & Contato */}
          <div>
            <h4 className="font-semibold text-xs text-slate-900 uppercase tracking-wider mb-3">
              Privacidade & Suporte
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacidade" className="hover:text-blue-900 transition-colors flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Política de Privacidade (LGPD)
                </Link>
              </li>
              <li>
                <Link href="/termos" className="hover:text-blue-900 transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li className="pt-1 flex items-center gap-1.5 text-slate-500">
                <Mail className="w-3.5 h-3.5" />
                <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="hover:underline">
                  {SITE_CONFIG.contactEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Linha Inferior com Aviso Legal e Direitos */}
        <div className="border-t border-slate-100 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>
            © 2026 {SITE_CONFIG.name}. Todos os direitos reservados.
          </p>
          <p className="text-[11px] text-slate-400 text-center sm:text-right">
            Nota: Este serviço auxilia na redação e diagramação profissional de currículos. Não garantimos contratação ou aprovação em processos seletivos.
          </p>
        </div>
      </div>
    </footer>
  );
}
