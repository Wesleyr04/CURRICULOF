import { IPaymentGateway } from "./types";
import { MockPixGateway } from "./mock-gateway";
import { PushinPayGateway } from "./pushinpay-gateway";

export const FIXED_PRICE_IN_CENTS = 299; // R$ 2,99 fixado no servidor

/**
 * Retorna o provedor de pagamento ativo no sistema.
 * Suporta 'pushinpay' (oficial), 'mock' (testes) ou 'none' (falha controlada 501).
 */
export function getPaymentGateway(explicitGateway?: string): IPaymentGateway {
  const gateway = (
    explicitGateway ||
    process.env.PAYMENT_GATEWAY ||
    "none"
  )
    .replace(/[\r\n"']/g, "")
    .toLowerCase()
    .trim();

  if (gateway === "pushinpay") {
    return new PushinPayGateway();
  }

  if (gateway === "mock") {
    return new MockPixGateway();
  }

  throw new Error("501 Not Implemented: Provedor de pagamento pendente.");
}

