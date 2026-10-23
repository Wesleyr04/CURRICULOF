import { IPaymentGateway } from "./types";
import { MockPixGateway } from "./mock-gateway";
import { AsaasGateway } from "./asaas-gateway";
import { MercadoPagoGateway } from "./mercadopago-gateway";

export const FIXED_PRICE_IN_CENTS = 500; // R$ 5,00 fixado no servidor

// Singleton para o mock gateway compartilhar status durante testes locais
const sharedMockGateway = new MockPixGateway();

export function getPaymentGateway(): IPaymentGateway {
  const gateway = (process.env.PAYMENT_GATEWAY || "mock").toLowerCase();
  const isProduction = process.env.NODE_ENV === "production";

  if (gateway === "asaas") {
    if (process.env.ASAAS_API_KEY) {
      return new AsaasGateway();
    }
    if (isProduction) {
      throw new Error("Configuração de pagamento incompleta: ASAAS_API_KEY ausente em produção.");
    }
    console.warn("[Pagamento] ASAAS_API_KEY ausente. Alternando para MockPixGateway em desenvolvimento.");
    return sharedMockGateway;
  }

  if (gateway === "mercadopago") {
    if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
      return new MercadoPagoGateway();
    }
    if (isProduction) {
      throw new Error("Configuração de pagamento incompleta: MERCADOPAGO_ACCESS_TOKEN ausente em produção.");
    }
    console.warn("[Pagamento] MERCADOPAGO_ACCESS_TOKEN ausente. Alternando para MockPixGateway em desenvolvimento.");
    return sharedMockGateway;
  }

  if (isProduction && process.env.ALLOW_MOCK_PAYMENT !== "true" && process.env.PAYMENT_GATEWAY && process.env.PAYMENT_GATEWAY !== "mock") {
    throw new Error("Gateway mock proibido em ambiente de produção sem flag explícita.");
  }

  return sharedMockGateway;
}
