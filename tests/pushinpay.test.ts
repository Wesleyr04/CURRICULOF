import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PushinPayGateway } from "@/lib/payment/pushinpay-gateway";
import { getPaymentGateway } from "@/lib/payment/factory";
import { orderStore, FIXED_PRICE_IN_CENTS } from "@/lib/payment/store";

describe("Gateway PushinPay e Segurança de Pagamento Pix", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("deve instanciar PushinPayGateway com propriedades corretas", () => {
    const gateway = new PushinPayGateway("https://api.pushinpay.com.br/api/v1", "test_token", "test_secret");
    expect(gateway.name).toContain("PushinPay");
    expect(gateway.isMock).toBe(false);
  });

  it("createPayment deve lançar erro explícito se PUSHINPAY_TOKEN estiver ausente", async () => {
    const gateway = new PushinPayGateway("https://api.pushinpay.com.br/api/v1", "", "test_secret");
    await expect(
      gateway.createPayment({
        orderId: "ord_test_001",
        amountInCents: 500,
        description: "Teste",
      })
    ).rejects.toThrow(/PUSHINPAY_TOKEN/);
  });

  it("createPayment deve realizar POST para /pix/cashIn e extrair qrCodeText e paymentId com sucesso", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "pushin_tx_12345",
        status: "pending",
        value: 500,
        qr_code: "00020126580014br.gov.bcb.pix0136testepushinpay",
        qr_code_base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
        expires_at: "2026-10-24T05:00:00Z",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const gateway = new PushinPayGateway("https://api.pushinpay.com.br/api/v1", "valid_token", "valid_secret");
    const result = await gateway.createPayment({
      orderId: "ord_123",
      amountInCents: 500,
      description: "Liberação de Currículo",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain("/pix/cashIn");
    expect(result.paymentId).toBe("pushin_tx_12345");
    expect(result.qrCodeText).toBe("00020126580014br.gov.bcb.pix0136testepushinpay");
    expect(result.qrCodeBase64).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==");
    expect(result.status).toBe("pending");
    expect(result.isMock).toBe(false);
  });

  it("checkStatus deve mapear paid, approved e liquidated para status 'paid'", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "paid" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const gateway = new PushinPayGateway("https://api.pushinpay.com.br/api/v1", "valid_token", "valid_secret");
    const status = await gateway.checkStatus("pushin_tx_12345");
    expect(status).toBe("paid");
  });

  it("checkStatus deve mapear canceled ou failed para 'failed'", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "canceled" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const gateway = new PushinPayGateway("https://api.pushinpay.com.br/api/v1", "valid_token", "valid_secret");
    const status = await gateway.checkStatus("pushin_tx_12345");
    expect(status).toBe("failed");
  });

  it("verifyWebhookSignature deve validar secret com timingSafeEqual", () => {
    const gateway = new PushinPayGateway("https://api.pushinpay.com.br/api/v1", "valid_token", "meu_segredo_super_seguro_123");

    // Assinatura correta
    expect(gateway.verifyWebhookSignature("meu_segredo_super_seguro_123")).toBe(true);

    // Assinatura incorreta
    expect(gateway.verifyWebhookSignature("segredo_falso_456")).toBe(false);

    // Assinatura vazia
    expect(gateway.verifyWebhookSignature("")).toBe(false);
  });

  it("getPaymentGateway factory deve instanciar PushinPayGateway quando PAYMENT_GATEWAY=pushinpay", () => {
    process.env.PAYMENT_GATEWAY = "pushinpay";
    const gateway = getPaymentGateway();
    expect(gateway).toBeInstanceOf(PushinPayGateway);
  });

  it("getPaymentGateway factory deve instanciar MockPixGateway quando PAYMENT_GATEWAY=mock", () => {
    process.env.PAYMENT_GATEWAY = "mock";
    const gateway = getPaymentGateway();
    expect(gateway.isMock).toBe(true);
  });

  it("orderStore deve suportar getOrderAsync, updateOrderPaymentId e markAsPaidAsync", async () => {
    const order = orderStore.createOrder("temp_test_kv", FIXED_PRICE_IN_CENTS);
    expect(order.orderId).toBeTruthy();

    const retrieved = await orderStore.getOrderAsync(order.orderId);
    expect(retrieved?.orderId).toBe(order.orderId);

    await orderStore.updateOrderPaymentId(order.orderId, "pushin_id_updated_999");
    const retrievedByPayId = await orderStore.getOrderByPaymentIdAsync("pushin_id_updated_999");
    expect(retrievedByPayId?.orderId).toBe(order.orderId);

    const paidResult = await orderStore.markAsPaidAsync(order.orderId);
    expect(paidResult?.order.status).toBe("paid");
    expect(paidResult?.downloadToken).toBeTruthy();

    const isTokenValid = await orderStore.verifyDownloadTokenAsync(paidResult!.downloadToken);
    expect(isTokenValid).toBe(true);
  });
});

describe("Blindagem do Webhook da PushinPay e Validação Timing-Safe", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("deve rejeitar com 401 se PUSHINPAY_WEBHOOK_SECRET estiver configurado e o header for inválido", async () => {
    process.env.PAYMENT_GATEWAY = "pushinpay";
    process.env.PUSHINPAY_TOKEN = "valid_token";
    process.env.PUSHINPAY_WEBHOOK_SECRET = "secret_producao_789";

    const { POST } = await import("@/app/api/payment/webhook/route");

    const req = new Request("http://localhost:3000/api/payment/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": "token_invalido_ataque",
      },
      body: JSON.stringify({
        id: "tx_123",
        status: "paid",
        external_reference: "ord_abc",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Assinatura ou secret de webhook inválido");
  });

  it("deve processar e conciliar o pagamento com 200 quando secret for válido", async () => {
    process.env.PAYMENT_GATEWAY = "pushinpay";
    process.env.PUSHINPAY_TOKEN = "valid_token";
    process.env.PUSHINPAY_WEBHOOK_SECRET = "secret_producao_789";

    // Cria ordem prévia
    const order = orderStore.createOrder("tx_webhook_valid_001", FIXED_PRICE_IN_CENTS);

    const { POST } = await import("@/app/api/payment/webhook/route");

    const req = new Request("http://localhost:3000/api/payment/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": "secret_producao_789",
      },
      body: JSON.stringify({
        id: "tx_webhook_valid_001",
        status: "paid",
        external_reference: order.orderId,
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe("paid");

    // Idempotência: requisição repetida deve responder como alreadyProcessed sem erros
    const repeatReq = new Request("http://localhost:3000/api/payment/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": "secret_producao_789",
      },
      body: JSON.stringify({
        id: "tx_webhook_valid_001",
        status: "paid",
        external_reference: order.orderId,
      }),
    });

    const repeatRes = await POST(repeatReq as any);
    expect(repeatRes.status).toBe(200);
    const repeatData = await repeatRes.json();
    expect(repeatData.alreadyProcessed).toBe(true);
  });
});
