import { IPaymentGateway } from "./types";
import { MockPixGateway } from "./mock-gateway";
import { PushinPayGateway } from "./pushinpay-gateway";

export const FIXED_PRICE_IN_CENTS = 299; // R$ 2,99 fixado no servidor

/**
 * Retorna o provedor de pagamento ativo no sistema.
 * Suporta 'pushinpay' (oficial), 'mock' (testes) ou 'none' (falha controlada 501).
 */
export function getPaymentGateway(explicitGateway?: string): IPaymentGateway {
  const rawGateway =
    explicitGateway ||
    process.env.PAYMENT_GATEWAY ||
    process.env.PAYMENT_PROVIDER ||
    process.env["PROVEDOR_PAGAMENTO"] ||
    process.env["PROVEDOR_DE_PAGAMENTO"] ||
    "";

  let gateway = rawGateway
    .replace(/[\r\n"']/g, "")
    .toLowerCase()
    .trim();

  // Se nenhuma flag for definida e houver token PushinPay configurado no ambiente,
  // assume pushinpay como padrão (idêntico ao padrão adotado na factory de IA).
  if (!gateway) {
    const hasPushinPayKey = Boolean(
      (
        process.env.PUSHINPAY_TOKEN ||
        process.env.PUSHINPAY_API_KEY ||
        process.env.PUSHIN_PAY_TOKEN ||
        ""
      ).trim()
    );
    if (hasPushinPayKey) {
      gateway = "pushinpay";
    } else {
      gateway = "none";
    }
  }

  if (gateway === "pushinpay") {
    return new PushinPayGateway();
  }

  if (gateway === "mock") {
    return new MockPixGateway();
  }

  throw new Error("501 Not Implemented: Provedor de pagamento pendente.");
}

