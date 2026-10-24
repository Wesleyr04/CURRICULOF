import React from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { FileText, HardDrive, Send, Receipt, KeyRound, Mail, ShieldCheck } from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  HardDrive,
  Send,
  Receipt,
  KeyRound,
};

/**
 * Seção "Seus dados e sua segurança".
 * Os textos vêm de SITE_CONFIG.dataSecurity e refletem o comportamento real do código:
 * currículo no localStorage do navegador, IA externa apenas sob demanda,
 * dados técnicos de pagamento com retenção temporária (TTL) no servidor.
 */
export function DataSecuritySection() {
  return (
    <section
      id="seguranca"
      aria-labelledby="seguranca-titulo"
      className="py-16 sm:py-20 bg-white border-b border-slate-200"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Transparência
          </span>
          <h2
            id="seguranca-titulo"
            className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3"
          >
            Seus dados e sua segurança
          </h2>
          <p className="mt-2 text-slate-600 text-sm">
            O que pedimos, onde fica e como o pagamento funciona.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SITE_CONFIG.dataSecurity.map((item) => {
            const Icon = ICONS[item.icon] || ShieldCheck;
            return (
              <div
                key={item.title}
                className="p-5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0">
                  <Icon className="w-5 h-5 text-blue-800" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.text}</p>
                </div>
              </div>
            );
          })}

          <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white border border-blue-200 shrink-0">
              <Mail className="w-5 h-5 text-blue-800" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">Dúvidas ou suporte</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Fale com a gente pelo canal oficial:{" "}
                <a
                  href={`mailto:${SITE_CONFIG.contactEmail}`}
                  className="font-semibold text-blue-900 underline break-all"
                >
                  {SITE_CONFIG.contactEmail}
                </a>
                . Detalhes na{" "}
                <Link href="/privacidade" className="font-semibold text-blue-900 underline">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
