export type PaymentStatus = "pending" | "paid" | "failed" | "expired";

export interface CreatePaymentParams {
  orderId: string;
  amountInCents: number; // Forçado em 500 pelo servidor (R$ 5,00)
  description: string;
}

export interface PaymentCreationResult {
  paymentId: string;
  orderId: string;
  amountInCents: number;
  qrCodeText: string;
  qrCodeBase64?: string;
  expiresAt: string;
  status: PaymentStatus;
  isMock: boolean;
}

export interface IPaymentGateway {
  name: string;
  isMock: boolean;
  createPayment(params: CreatePaymentParams): Promise<PaymentCreationResult>;
  checkStatus(paymentId: string): Promise<PaymentStatus>;
  verifyWebhookSignature(signature: string, payload: unknown): boolean;
}
