import { IPaymentGateway, CreatePaymentParams, PaymentCreationResult, PaymentStatus } from "./types";

export class MockPixGateway implements IPaymentGateway {
  public name = "Pix Simulado (Ambiente de Testes / Desenvolvimento)";
  public isMock = true;

  private mockStatuses: Map<string, PaymentStatus> = new Map();

  async createPayment(params: CreatePaymentParams): Promise<PaymentCreationResult> {
    const paymentId = `mock_pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.mockStatuses.set(paymentId, "pending");

    // Código Pix Copia-e-Cola fictício porém no formato EMV padrão
    const dummyPix = `00020126580014br.gov.bcb.pix0136fastcurriculo-demo-pix-chave-aleatoria52040000530398654045.005802BR5913FASTCURRICULO6009SAO PAULO62140510${params.orderId}6304ABCD`;

    return {
      paymentId,
      orderId: params.orderId,
      amountInCents: params.amountInCents,
      qrCodeText: dummyPix,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "pending",
      isMock: true,
    };
  }

  async checkStatus(paymentId: string): Promise<PaymentStatus> {
    return this.mockStatuses.get(paymentId) || "pending";
  }

  // Método exclusivo para testar aprovação instantânea no ambiente de testes
  simulateApproval(paymentId: string) {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_PAYMENT !== "true") {
      throw new Error("Simulação de pagamento bloqueada em ambiente de produção.");
    }
    this.mockStatuses.set(paymentId, "paid");
  }

  verifyWebhookSignature(_signature: string, _payload: unknown): boolean {
    return Boolean(_signature !== undefined && _payload !== undefined);
  }
}
