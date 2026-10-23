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
            <h2 className="text-lg font-bold text-slate-900 mb-2">1. Dados Coletados e Finalidade</h2>
            <p>
              Os dados inseridos no formulário (nome, e-mail, telefone, histórico de trabalho e formação) são processados exclusivamente na memória volátil do seu navegador para a composição visual do seu currículo e geração do documento em formato PDF.
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-600">
              <li>Não solicitamos CPF, RG, número de documentos públicos, estado civil ou endereço residencial completo.</li>
              <li>Não gravamos formulários em bancos de dados relacionais ou NoSQL.</li>
              <li>Não criamos perfis de rastreamento comportamental de candidatos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">2. Processamento do Serviço de Aprimoramento Fast</h2>
            <p>
              Quando você clica voluntariamente no botão de aprimoramento do Fast, as informações textuais do seu currículo são transmitidas de forma segura e criptografada (HTTPS) ao nosso serviço de processamento exclusivamente para correção gramatical, reestruturação de frases e adaptação de vocabulário.
            </p>
            <p className="mt-2 text-xs text-slate-600">
              O serviço opera sob diretrizes estritas de não-retenção e a requisição é descartada após a resposta ser entregue ao seu navegador.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">3. Processamento de Pagamento (Pix)</h2>
            <p>
              A cobrança de {SITE_CONFIG.pricing.formatted} é intermediada por gateway de pagamentos autorizado pelo Banco Central do Brasil (Pix). Para proteger sua privacidade:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-600">
              <li>O conteúdo do seu currículo NUNCA é enviado ao gateway de pagamento.</li>
              <li>A cobrança registra apenas um identificador anônimo de transação e o valor de {SITE_CONFIG.pricing.formatted}.</li>
              <li>A confirmação do pagamento gera um token efêmero de liberação que expira após o download.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-2">4. Descarte Imediato e Seus Direitos (LGPD)</h2>
            <p>
              Em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você possui o controle total sobre seus dados. Como não mantemos base de dados centralizada, o encerramento da aba ou clique no botão de limpar dados apaga permanentemente qualquer rascunho.
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
