"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

export default function TermosPage() {
  return (
    <div className="py-12 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a página inicial</span>
        </Link>

        {/* Cabeçalho */}
        <div className="border-b border-slate-200 pb-6 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">
              <FileText className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Termos de Uso do Serviço
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Serviço provido por {SITE_CONFIG.name} • Versão {SITE_CONFIG.version}
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo dos Termos */}
        <div className="space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">1. Objeto do Serviço</h2>
            <p>
              O <strong>{SITE_CONFIG.name}</strong> disponibiliza uma ferramenta online para estruturação, diagramação visual em layouts pré-definidos e auxílio redacional com o serviço Fast para elaboração de currículos profissionais, com exportação final em formato PDF.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">2. Condições Comerciais e Preço Unitário</h2>
            <p>
              A utilização do editor, preenchimento das etapas e visualização prévia em tela são gratuitas. A exportação e liberação do documento final em alta resolução para download em PDF requer o pagamento unitário de <strong>{SITE_CONFIG.pricing.formatted} ({SITE_CONFIG.pricing.description})</strong> através do método Pix. Não há cobranças recorrentes, planos de fidelidade ou assinaturas automáticas.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">3. Veracidade das Informações</h2>
            <p>
              O usuário declara e garante que todas as informações inseridas na plataforma refletem sua real trajetória acadêmica e profissional. O serviço de aprimoramento Fast atua estritamente como ferramenta de revisão gramatical e sintática, cabendo ao usuário a conferência integral dos dados gerados antes de seu envio a empregadores.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">4. Ausência de Garantia de Contratação</h2>
            <p>
              O {SITE_CONFIG.name} <strong>não promete nem garante contratação, aprovação em entrevistas ou compatibilidade absoluta com todos os sistemas ATS proprietários do mercado</strong>. O produto fornece um modelo de alta qualidade baseado em boas práticas de design e recrutamento, mas o resultado de processos seletivos depende exclusivamente dos critérios dos contratantes e do perfil do candidato.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">5. Propriedade Intelectual e Uso do PDF</h2>
            <p>
              O documento PDF final gerado pertence integralmente ao usuário, que possui plena liberdade para imprimi-lo, distribuí-lo e utilizá-lo livremente em qualquer candidatura ou banco de talentos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-bold text-slate-900 mb-1.5">6. Suporte ao Usuário</h2>
            <p>
              Em caso de dúvidas técnicas ou problemas no download após a confirmação do pagamento Pix, contate nosso canal de atendimento pelo e-mail:{" "}
              <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="text-blue-900 font-semibold underline">
                {SITE_CONFIG.contactEmail}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
