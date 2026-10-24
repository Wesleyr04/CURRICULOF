import React from "react";
import { Info } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

/**
 * Aviso pré-pagamento sobre o nome exibido no Pix.
 * Não exibe nome de beneficiário: o gateway atual (PushinPay) não retorna esse dado
 * na criação da cobrança, então não há como garanti-lo.
 */
export function PixPayeeNotice() {
  return (
    <section
      aria-labelledby="pix-payee-notice-title"
      className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-left"
    >
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1.5 text-[12px] leading-relaxed text-slate-700">
          <h4 id="pix-payee-notice-title" className="text-xs font-bold text-slate-900">
            Uma informação importante sobre o pagamento
          </h4>
          <p>
            O FastCurrículo é o serviço que você está contratando. O pagamento é processado pela
            plataforma de pagamentos utilizada pelo site e o nome exibido na confirmação do Pix pode
            ser diferente de &quot;FastCurrículo&quot;.
          </p>
          <p>
            Como o recebimento pode ocorrer em uma conta de pessoa física, o aplicativo do seu banco
            poderá mostrar o nome civil do recebedor, em vez do nome do serviço.
          </p>
          <p>
            Isso, por si só, não significa que o pagamento seja fraudulento. Antes de confirmar,
            confira o nome do beneficiário e o valor. Se os dados apresentados não corresponderem às
            informações fornecidas, não conclua o pagamento até esclarecer a divergência.
          </p>
          <p>
            Em caso de dúvidas, entre em contato pelo canal oficial de suporte do FastCurrículo:{" "}
            <a
              href={`mailto:${SITE_CONFIG.contactEmail}`}
              className="font-semibold text-blue-900 underline break-all"
            >
              {SITE_CONFIG.contactEmail}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
