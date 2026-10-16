import { IPaymentGateway, CreatePaymentParams, PaymentCreationResult, PaymentStatus } from "./types";
import crypto from "crypto";

export class AsaasGateway implements IPaymentGateway {
  public name = "Asaas Pix";
  public isMock = false;

  private apiKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || "";
    this.webhookSecret = process.env.ASAAS_WEBHOOK_SECRET || "";
    this.baseUrl =
      process.env.ASAAS_ENVIRONMENT === "production"
        ? "https://api.asaas.com/v3"
        : "https://sandbox.asaas.com/v3";
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentCreationResult> {
    if (!this.apiKey) {
      throw new Error("ASAAS_API_KEY não configurada no servidor.");
    }

    const valueInReais = (params.amountInCents / 100).toFixed(2);

    // Cria a cobrança no Asaas
    const res = await fetch(`${this.baseUrl}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: this.apiKey,
      },
      body: JSON.stringify({
        billingType: "PIX",
        value: Number(valueInReais),
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: params.description,
        externalReference: params.orderId,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Erro Asaas ao criar cobrança (${res.status}): ${errText.slice(0, 150)}`);
    }

    const payment = await res.json();

    // Obtém o QR Code Pix estático/dinâmico gerado para a cobrança
    const qrRes = await fetch(`${this.baseUrl}/payments/${payment.id}/pixQrCode`, {
      headers: { access_token: this.apiKey },
    });

    if (!qrRes.ok) {
      throw new Error("Falha ao obter QR code Pix do Asaas.");
    }

    const qrData = await qrRes.json();

    return {
      paymentId: payment.id,
      orderId: params.orderId,
      amountInCents: params.amountInCents,
      qrCodeText: qrData.payload,
      qrCodeBase64: qrData.encodedImage,
      expiresAt: qrData.expirationDate || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: "pending",
      isMock: false,
    };
  }

  async checkStatus(paymentId: string): Promise<PaymentStatus> {
    if (!this.apiKey) throw new Error("ASAAS_API_KEY não configurada.");

    const res = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
      headers: { access_token: this.apiKey },
    });

    if (!res.ok) return "failed";

    const payment = await res.json();
    if (payment.status === "RECEIVED" || payment.status === "CONFIRMED") {
      return "paid";
    }
    if (payment.status === "OVERDUE") {
      return "expired";
    }
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
