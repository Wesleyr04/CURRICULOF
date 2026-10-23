import { IPaymentGateway, CreatePaymentParams, PaymentCreationResult, PaymentStatus } from "./types";
import crypto from "crypto";

export class MercadoPagoGateway implements IPaymentGateway {
  public name = "Mercado Pago Pix";
  public isMock = false;

  private accessToken: string;
  private webhookSecret: string;

  constructor() {
    this.accessToken =
      (process.env.MP_ACCESS_TOKEN ||
        process.env.MERCADOPAGO_ACCESS_TOKEN ||
        process.env.NEXT_PUBLIC_MP_ACCESS_TOKEN ||
        "").trim();
    this.webhookSecret = (process.env.MERCADOPAGO_WEBHOOK_SECRET || process.env.MP_WEBHOOK_SECRET || "").trim();
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentCreationResult> {
    if (!this.accessToken) {
      throw new Error(
        "Token de acesso do Mercado Pago (MP_ACCESS_TOKEN ou MERCADOPAGO_ACCESS_TOKEN) não configurado no servidor."
      );
    }

    const valueInReais = params.amountInCents / 100;

    const res = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
        "X-Idempotency-Key": params.orderId,
      },
      body: JSON.stringify({
        transaction_amount: valueInReais,
        description: params.description,
        payment_method_id: "pix",
        payer: {
          email: "anonimo@fastcurriculo.com.br", // sem persistir e sem vincular dado sensível do usuário
        },
        external_reference: params.orderId,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erro Mercado Pago (${res.status}): ${errText.slice(0, 150)}`);
    }

    const payment = await res.json();
    const poi = payment.point_of_interaction?.transaction_data;

    return {
      paymentId: String(payment.id),
      orderId: params.orderId,
      amountInCents: params.amountInCents,
      qrCodeText: poi?.qr_code || "",
      qrCodeBase64: poi?.qr_code_base64,
      expiresAt: payment.date_of_expiration || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "pending",
      isMock: false,
    };
  }

  async checkStatus(paymentId: string): Promise<PaymentStatus> {
    if (!this.accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada.");

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    if (!res.ok) return "failed";

    const payment = await res.json();
    if (payment.status === "approved") return "paid";
    if (payment.status === "cancelled" || payment.status === "rejected") return "failed";
    return "pending";
  }

  verifyWebhookSignature(signature: string, payload: unknown): boolean {
    if (!this.webhookSecret) return false;
    const computed = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  }
}
