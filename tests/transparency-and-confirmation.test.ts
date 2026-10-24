import { describe, it, expect } from "vitest";
import { SITE_CONFIG } from "@/config/site";
import { orderStore, FIXED_PRICE_IN_CENTS } from "@/lib/payment/store";

describe("Transparência, Aviso Pré-Pagamento e Confirmação Visual", () => {
  it("SITE_CONFIG deve incluir todas as 5 dimensões da seção 'Seus dados e sua segurança'", () => {
    expect(SITE_CONFIG.dataSecurity).toBeDefined();
    expect(SITE_CONFIG.dataSecurity).toHaveLength(5);

    const titles = SITE_CONFIG.dataSecurity.map((d) => d.title);
    expect(titles).toContain("Quais dados pedimos");
    expect(titles).toContain("Onde ficam os dados do currículo");
    expect(titles).toContain("Quando algo sai do seu navegador");
    expect(titles).toContain("Dados técnicos do pagamento");
    expect(titles).toContain("Como o pagamento é feito");
  });

  it("dados de segurança devem deixar explícito que nunca pedem senha bancária", () => {
    const paymentItem = SITE_CONFIG.dataSecurity.find((d) => d.title.includes("Como o pagamento"));
    expect(paymentItem).toBeDefined();
    expect(paymentItem?.text).toContain("nunca pede sua senha bancária");
    expect(paymentItem?.text).toContain("app do seu banco");
  });

  it("seção Como funciona deve refletir as 3 etapas reais do sistema sem prometer aprovação", () => {
    expect(SITE_CONFIG.steps).toHaveLength(3);
    expect(SITE_CONFIG.steps[0].title).toBe("Preencha seus dados");
    expect(SITE_CONFIG.steps[0].description).toContain("experiências profissionais");

    expect(SITE_CONFIG.steps[1].title).toBe("Organize seu currículo");
    expect(SITE_CONFIG.steps[1].description).toContain("FastCurrículo organiza");

    expect(SITE_CONFIG.steps[2].title).toBe("Gere e baixe seu PDF");
    expect(SITE_CONFIG.steps[2].description).toContain("condições de pagamento aplicáveis");
  });

  it("FAQs obrigatórias da especificação 2.5 devem estar presentes com respostas fiéis", () => {
    const requiredQuestions = [
      "O que é o FastCurrículo?",
      "Por que aparece outro nome no Pix?",
      "Como sei se meu pagamento foi aprovado?",
      "O que acontece com os dados do meu currículo?",
      "Onde encontro meu comprovante bancário?",
      "E se eu pagar e não receber acesso?",
    ];

    for (const q of requiredQuestions) {
      const found = SITE_CONFIG.faqs.find((f) => f.question === q);
      expect(found, `FAQ ausente: "${q}"`).toBeDefined();
      expect(found?.answer.length).toBeGreaterThan(15);
    }
  });

  it("/api/pix/status deve retornar dados verificados e não sensíveis quando a ordem for aprovada", async () => {
    const oldGateway = process.env.PAYMENT_GATEWAY;
    process.env.PAYMENT_GATEWAY = "mock";

    try {
      const { GET } = await import("@/app/api/pix/status/route");
      const testPaymentId = `test_transp_pay_${Date.now()}`;
      const order = orderStore.createOrder(testPaymentId, FIXED_PRICE_IN_CENTS);

    // Antes de pagar: status pendente sem dados de liberação
    const pendingReq = new Request(`http://localhost:3000/api/pix/status?id=${order.orderId}`);
    const pendingRes = await GET(pendingReq as any);
    const pendingData = await pendingRes.json();

    expect(pendingRes.status).toBe(200);
    expect(pendingData.pago).toBe(false);

    // Marca como pago no servidor
    const paidResult = orderStore.markAsPaid(order.orderId);
    expect(paidResult).not.toBeNull();

    // Consulta novamente: deve retornar pago: true, downloadToken, orderId, amountInCents e paidAt
    const paidReq = new Request(`http://localhost:3000/api/pix/status?id=${order.orderId}`);
    const paidRes = await GET(paidReq as any);
    const paidData = await paidRes.json();

    expect(paidRes.status).toBe(200);
    expect(paidData.pago).toBe(true);
    expect(paidData.status).toBe("approved");
    expect(paidData.downloadToken).toBe(paidResult?.downloadToken);
    expect(paidData.orderId).toBe(order.orderId);
    expect(paidData.amountInCents).toBe(299);
    expect(paidData.paidAt).toBeTypeOf("number");
    } finally {
      process.env.PAYMENT_GATEWAY = oldGateway;
    }
  });

  it("a confirmação de downloadToken deve ser estritamente bloqueada para tokens inexistentes ou forjados", async () => {
    const { POST } = await import("@/app/api/payment/verify-token/route");
    const fakeReq = new Request("http://localhost:3000/api/payment/verify-token", {
      method: "POST",
      body: JSON.stringify({ token: "token_forjado_hacker_123" }),
    });

    const res = await POST(fakeReq as any);
    const data = await res.json();

    expect(data.valid).toBe(false);
  });
});
