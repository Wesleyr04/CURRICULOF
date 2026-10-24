import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { ClearSessionButton } from "@/components/common/ClearSessionButton";

export const metadata: Metadata = {
  title: `Política de Privacidade e Proteção de Dados (LGPD) | ${SITE_CONFIG.name}`,
  description: `Entenda o modelo de privacidade por design do ${SITE_CONFIG.name}. Zero armazenamento em banco de dados, sem senhas e controle total dos seus dados.`,
};

export default function PrivacidadePage() {

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
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Política de Privacidade e Proteção de Dados (LGPD)
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Última atualização: {SITE_CONFIG.privacy.policyLastUpdated} • Modelo de Arquitetura: Zero Persistência
              </p>
            </div>
          </div>
        </div>

        {/* Destaque Central de Privacidade */}
        <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 mb-8 space-y-3">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
            <Lock className="w-4 h-4 text-emerald-700" />
            <span>Compromisso Fundamental: Não Armazenamos seu Currículo</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
            Diferente de outras plataformas, o <strong>{SITE_CONFIG.name}</strong> foi construído sob o princípio de <em>Privacy by Design</em>. Não criamos contas de usuário, não pedimos senhas e <strong>não mantemos banco de dados com seus dados pessoais, experiências ou documentos gerados</strong>.
          </p>
        </div>

        {/* Conteúdo Detalhado */}
        <div className="space-y-8 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Dados Coletados e Onde Ficam Armazenados</h2>
            <p>
              Os dados inseridos no formulário (nome, e-mail, telefone, histórico de trabalho e formação) são utilizados exclusivamente para a composição visual do seu currículo e geração do documento em formato PDF.
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-600">
              <li>Não solicitamos CPF, RG, número de documentos públicos, estado civil ou endereço residencial completo.</li>
              <li>O FastCurrículo <strong>não mantém banco de dados com seus currículos</strong>. Suas informações ficam armazenadas localmente no armazenamento do seu navegador (localStorage) para sua conveniência durante a edição.</li>
              <li>Não criamos perfis de rastreamento comportamental de candidatos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Processamento do Serviço de Aprimoramento com IA</h2>
            <p>
              Caso você utilize voluntariamente o recurso de aprimoramento de texto ou sugestão de resumo, o conteúdo correspondente é transmitido de forma segura via HTTPS ao nosso servidor e encaminhado à API do provedor de inteligência artificial exclusivamente para gerar a sugestão textual.
            </p>
            <p className="mt-2 text-xs text-slate-600">
              O FastCurrículo não salva o conteúdo do seu currículo em disco durante esse processamento, e os provedores operam sob diretrizes contratuais de processamento de API.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. Processamento de Pagamento (Pix)</h2>
            <p>
              A cobrança de {SITE_CONFIG.pricing.formatted} é intermediada por plataforma de pagamentos via Pix. Para proteger sua privacidade e segurança financeira:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-600">
              <li>O conteúdo do seu currículo <strong>nunca é enviado à plataforma de pagamento</strong>.</li>
              <li>O FastCurrículo <strong>nunca solicita senhas bancárias</strong> ou dados do seu cartão. O pagamento é realizado diretamente no aplicativo do seu banco.</li>
              <li>Os registros de pagamento no servidor contêm apenas dados técnicos da transação (identificador do pedido, valor, situação e horário) com retenção temporária (até 24 horas após a confirmação) para emissão do token e liberação do download.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Controle dos Seus Dados e Exclusão (LGPD)</h2>
            <p>
              Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você possui controle sobre seus dados. Como o rascunho do currículo fica no armazenamento local do seu navegador, você pode apagá-lo a qualquer momento utilizando o botão abaixo ou limpando os dados de navegação.
            </p>
            <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Deseja apagar os dados da sua sessão agora?</span>
                <span className="text-[11px] text-slate-500">Isto limpará imediatamente qualquer rascunho mantido em seu navegador.</span>
              </div>
              <ClearSessionButton />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">5. Contato do Encarregado de Dados</h2>
            <p>
              Para esclarecimentos ou dúvidas sobre a arquitetura de privacidade e conformidade com a LGPD, entre em contato através do e-mail oficial:{" "}
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
