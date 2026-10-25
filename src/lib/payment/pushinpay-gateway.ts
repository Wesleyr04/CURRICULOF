import crypto from "crypto";
import {
  IPaymentGateway,
  CreatePaymentParams,
  PaymentCreationResult,
  PaymentStatus,
} from "./types";

export interface PushinPayCashInResponse {
  id?: string | number;
  txid?: string;
  status?: string;
  value?: number;
  qr_code?: string;
  qr_code_base64?: string;
  pix_link?: string;
  expires_at?: string;
  [key: string]: unknown;
}

export class PushinPayGateway implements IPaymentGateway {
  public name = "PushinPay (Pix Transparente)";
  public isMock = false;

  private apiUrl: string;
  private token: string;
  private webhookSecret: string;

  constructor(apiUrl?: string, token?: string, webhookSecret?: string) {
    const rawUrl =
      apiUrl ||
      process.env.PUSHINPAY_API_URL ||
      "https://api.pushinpay.com.br/api";

    // Normaliza a URL base: remove barras finais e remove /v1 se for a API oficial da PushinPay
    let cleaned = rawUrl.replace(/\/+$/, "");
    if (cleaned.includes("api.pushinpay.com.br")) {
      cleaned = cleaned.replace(/\/v1$/, "");
      if (!cleaned.endsWith("/api")) {
        cleaned = `${cleaned}/api`;
      }
    }
    this.apiUrl = cleaned;

    this.token = (
      token ||
      process.env.PUSHINPAY_TOKEN ||
      ""
    ).replace(/[\r\n"']/g, "").trim();

    this.webhookSecret = (
      webhookSecret ||
      process.env.PUSHINPAY_WEBHOOK_SECRET ||
      ""
    ).replace(/[\r\n"']/g, "").trim();
  }

  /**
   * Gera uma cobrança Pix transparente de valor fixo (R$ 2,99 / 299 centavos) na PushinPay.
   */
  async createPayment(params: CreatePaymentParams): Promise<PaymentCreationResult> {
    if (!this.token) {
      throw new Error(
        "PushinPay: Chave PUSHINPAY_TOKEN não configurada no ambiente do servidor."
      );
    }

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
    const defaultWebhookUrl = appUrl ? `${appUrl}/api/payment/webhook` : undefined;
    const effectiveWebhookUrl = params.webhookUrl || defaultWebhookUrl;

    // A PushinPay utiliza o endpoint /pix/cashIn para emissão de Pix
    const targetEndpoint = this.apiUrl.endsWith("/pix/cashIn")
      ? this.apiUrl
      : `${this.apiUrl}/pix/cashIn`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const res = await fetch(targetEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          value: params.amountInCents, // 299 centavos = R$ 2,99
          webhook_url: effectiveWebhookUrl,
          external_reference: params.orderId,
          description: params.description || "Geração de Currículo Profissional - FastCurrículo",
        }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        console.error(
          `[PushinPay API Error] HTTP ${res.status}: ${errorText.slice(0, 300)}`
        );
        throw new Error(
          `Falha ao comunicar com a PushinPay (${res.status}). Verifique o token e as credenciais cadastradas.`
        );
      }

      const data = (await res.json()) as PushinPayCashInResponse;

      const paymentId = String(data.id || data.txid || params.orderId);
      const qrCodeText =
        data.qr_code || data.pix_link || "";
      let qrCodeBase64 = data.qr_code_base64 || "";
      if (qrCodeBase64 && !qrCodeBase64.startsWith("data:")) {
        qrCodeBase64 = `data:image/png;base64,${qrCodeBase64}`;
      }

      if (!qrCodeText && !qrCodeBase64) {
        console.error("[PushinPay API] Resposta sem dados válidos de Pix:", data);
        throw new Error("A PushinPay não retornou dados de QRCode Pix válidos.");
      }

      // Validade padrão de 15 minutos se não especificada pela API
      const expiresAt =
        data.expires_at || new Date(Date.now() + 15 * 60 * 1000).toISOString();

      return {
        paymentId,
        orderId: params.orderId,
        amountInCents: params.amountInCents,
        qrCodeText,
        qrCodeBase64,
        expiresAt,
        status: "pending",
        isMock: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Consulta o status da cobrança Pix na PushinPay.
   * Utiliza prioritariamente o endpoint oficial /transactions/{id}.
   */
  async checkStatus(paymentId: string): Promise<PaymentStatus> {
    if (!this.token || !paymentId) {
      return "pending";
    }

    // Endpoint oficial documentado pela PushinPay para consulta de transação Pix
    const primaryEndpoint = `${this.apiUrl}/transactions/${encodeURIComponent(paymentId)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      let res = await fetch(primaryEndpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      // Fallback resiliente caso o gateway utilize /transaction/{id} ou /pix/cashIn/{id}
      if (res.status === 404) {
        const fallbackEndpoint = `${this.apiUrl}/pix/cashIn/${encodeURIComponent(paymentId)}`;
        const fallbackRes = await fetch(fallbackEndpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/json",
          },
          signal: controller.signal,
          cache: "no-store",
        }).catch(() => null);

        if (fallbackRes && fallbackRes.ok) {
          res = fallbackRes;
        }
      }

      if (!res.ok) {
        console.warn(
          `[PushinPay Status Check Warning] HTTP ${res.status} para paymentId: ${paymentId}`
        );
        return "pending";
      }

      const data = (await res.json()) as PushinPayCashInResponse;
      const rawStatus = String(data.status || "").toLowerCase().trim();

      if (
        rawStatus === "paid" ||
        rawStatus === "approved" ||
        rawStatus === "completed" ||
        rawStatus === "liquidated"
      ) {
        return "paid";
      }

      if (rawStatus === "expired") {
        return "expired";
      }

      if (
        rawStatus === "failed" ||
        rawStatus === "canceled" ||
        rawStatus === "cancelled" ||
        rawStatus === "rejected"
      ) {
        return "failed";
      }

      return "pending";
    } catch (err) {
      console.error("[PushinPay Status Error]", err);
      return "pending";
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Valida a assinatura ou token do webhook da PushinPay em tempo constante (Timing-Safe).
   */
  verifyWebhookSignature(signatureOrSecret: string, _payload?: unknown): boolean {
    if (!this.webhookSecret || !signatureOrSecret) {
      return false;
    }

    try {
      const expectedHash = crypto
        .createHash("sha256")
        .update(this.webhookSecret.trim())
        .digest();

      const receivedHash = crypto
        .createHash("sha256")
        .update(signatureOrSecret.trim())
        .digest();

      return crypto.timingSafeEqual(expectedHash, receivedHash);
    } catch {
      return false;
    }
  }
}
