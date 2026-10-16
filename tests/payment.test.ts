import { describe, it, expect } from "vitest";
import { FIXED_PRICE_IN_CENTS, getPaymentGateway } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";
import { MockPixGateway } from "@/lib/payment/mock-gateway";

describe("Segurança Financeira e Camada de Pagamentos (R$ 0,50)", () => {
  it("o preço unitário no backend deve ser estritamente fixado em 50 centavos (R$ 0,50)", () => {
    expect(FIXED_PRICE_IN_CENTS).toBe(50);
  });

  it("deve criar uma ordem efêmera sem vincular conteúdo ou dados pessoais do currículo", async () => {
    const gateway = getPaymentGateway();
    const tempPaymentId = `test_pay_${Date.now()}`;
    const order = orderStore.createOrder(tempPaymentId, FIXED_PRICE_IN_CENTS);

    expect(order.orderId).toBeTruthy();
    expect(order.amountInCents).toBe(50);
    expect(order.status).toBe("pending");

    const paymentResult = await gateway.createPayment({
      orderId: order.orderId,
      amountInCents: FIXED_PRICE_IN_CENTS,
      description: "Teste Unitário",
    });

    expect(paymentResult.amountInCents).toBe(50);
    expect(paymentResult.qrCodeText).toBeTruthy();
  });

  it("deve transicionar status para paid e emitir downloadToken autêntico", () => {
    const order = orderStore.createOrder("test_pay_2", FIXED_PRICE_IN_CENTS);
    expect(order.status).toBe("pending");

    const paidResult = orderStore.markAsPaid(order.orderId);
    expect(paidResult).not.toBeNull();
    expect(paidResult?.downloadToken).toBeTruthy();
    expect(paidResult?.order.status).toBe("paid");

    // Valida token
    const isValid = orderStore.verifyDownloadToken(paidResult!.downloadToken);
    expect(isValid).toBe(true);

    // Token falso deve falhar
    const isFakeValid = orderStore.verifyDownloadToken("token_falso_inexistente");
    expect(isFakeValid).toBe(false);
  });

  it("não deve permitir simulação de pagamento se estiver em produção sem autorização", () => {
    const mockGateway = new MockPixGateway();
    const oldEnv = process.env.NODE_ENV;
    const oldAllow = process.env.ALLOW_MOCK_PAYMENT;

    try {
      // Simula produção com mock desativado
      (process.env as any).NODE_ENV = "production";
      process.env.ALLOW_MOCK_PAYMENT = "false";

      expect(() => {
        mockGateway.simulateApproval("pay_123");
      }).toThrowError(/bloqueada em ambiente de produção/);
    } finally {
      (process.env as any).NODE_ENV = oldEnv;
      process.env.ALLOW_MOCK_PAYMENT = oldAllow;
    }
  });
});
