import { describe, it, expect } from "vitest";
import { FIXED_PRICE_IN_CENTS, getPaymentGateway } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";
import { MockPixGateway } from "@/lib/payment/mock-gateway";

describe("Segurança Financeira e Camada de Pagamentos (R$ 5,00)", () => {
  it("o preço unitário no backend deve ser estritamente fixado em 500 centavos (R$ 5,00)", () => {
    expect(FIXED_PRICE_IN_CENTS).toBe(500);
  });

  it("deve criar uma ordem efêmera sem vincular conteúdo ou dados pessoais do currículo", async () => {
    const gateway = getPaymentGateway();
    const tempPaymentId = `test_pay_${Date.now()}`;
    const order = orderStore.createOrder(tempPaymentId, FIXED_PRICE_IN_CENTS);

    expect(order.orderId).toBeTruthy();
    expect(order.amountInCents).toBe(500);
    expect(order.status).toBe("pending");

    const paymentResult = await gateway.createPayment({
      orderId: order.orderId,
      amountInCents: FIXED_PRICE_IN_CENTS,
      description: "Teste Unitário",
    });

    expect(paymentResult.amountInCents).toBe(500);
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

  it("deve isolar a geração do comprovante em PDF com dados auditáveis e independentes", async () => {
    const { downloadReceiptPdf } = await import("@/lib/pdf/generate-pdf");
    expect(typeof downloadReceiptPdf).toBe("function");

    // Testa geração isolada do comprovante
    const success = await downloadReceiptPdf({
      orderId: "ord_test_isolation_123",
      paymentId: "pay_test_456",
      formattedAmount: "R$ 5,00",
      paidAt: Date.now(),
      downloadToken: "dl_token_valido_xyz",
    });

    expect(success).toBe(true);

    const fs = await import("fs");
    const path = await import("path");
    const testPdfPath = path.join(process.cwd(), "fastcurriculo-comprovante-pix-ord_test_isolation_123.pdf");
    if (fs.existsSync(testPdfPath)) {
      try {
        fs.unlinkSync(testPdfPath);
      } catch {
        // Ignora erro de limpeza transitório
      }
    }
  });

  it("downloadResumePdf deve retornar false de forma segura caso o elemento não exista no DOM", async () => {
    const { downloadResumePdf } = await import("@/lib/pdf/generate-pdf");
    expect(typeof downloadResumePdf).toBe("function");

    // Elemento inexistente no ambiente de teste não deve disparar erro nem travar
    const result = await downloadResumePdf({
      fileName: "teste.pdf",
      elementId: "elemento-inexistente-xyz",
    });

    expect(result).toBe(false);
  });

  it("safeColorToRgb deve sanitizar e eliminar com sucesso funções lab(), oklch() e color()", async () => {
    const { safeColorToRgb } = await import("@/lib/pdf/generate-pdf");

    // Funções modernas devem ser substituídas ou convertidas sem conter lab( ou oklch(
    const sanitizedLab = safeColorToRgb("lab(50% 40 59.5)", "#18181b");
    expect(sanitizedLab).not.toContain("lab(");

    const sanitizedOklch = safeColorToRgb("oklch(0.6 0.25 30)", "#18181b");
    expect(sanitizedOklch).not.toContain("oklch(");

    const sanitizedColor = safeColorToRgb("color(display-p3 1 0.5 0)", "#18181b");
    expect(sanitizedColor).not.toContain("color(");

    // Cores tradicionais hex e transparent permanecem válidas
    expect(safeColorToRgb("#ffffff")).toBe("#ffffff");
    expect(safeColorToRgb("transparent")).toBe("transparent");
  });

  it("sanitizeClonedDocumentForPdf deve purgar regras lab e oklch de tags style no documento clonado", async () => {
    const { sanitizeClonedDocumentForPdf } = await import("@/lib/pdf/generate-pdf");

    // Simula um documento clonado com tag style contendo Tailwind v4 oklch e lab
    const fakeStyle = {
      textContent: `
        :root { --accent: oklch(0.7 0.2 120); }
        .bg-custom { background-color: lab(60% 20 40); color: oklch(0.9 0.1 50); }
      `,
    };

    const fakeDoc = {
      querySelectorAll: (sel: string) => (sel === "style" ? [fakeStyle] : []),
    } as unknown as Document;

    const fakeTarget = {
      style: {
        color: "oklch(0.5 0.1 200)",
        backgroundColor: "lab(50% 10 20)",
        borderColor: "oklch(0.8 0.1 100)",
      },
      querySelectorAll: () => [],
    } as unknown as HTMLElement;

    sanitizeClonedDocumentForPdf(fakeDoc, fakeTarget);

    expect(fakeStyle.textContent).not.toContain("oklch(");
    expect(fakeStyle.textContent).not.toContain("lab(");
    expect(fakeTarget.style.color).not.toContain("oklch(");
    expect(fakeTarget.style.backgroundColor).not.toContain("lab(");
  });

  it("triggerPdfDownload deve gerar Blob com application/pdf, criar tag <a> com download e disparar .click() sem revogação prematura", async () => {
    const { triggerPdfDownload } = await import("@/lib/pdf/generate-pdf");
    const jsPDFModule = await import("jspdf");
    const jsPDF = jsPDFModule.default || jsPDFModule;

    const dummyPdf = new jsPDF();
    dummyPdf.text("Teste de Download", 10, 10);

    // Mocks do ambiente de navegador
    let createdBlobType = "";
    let appendedLink: any = null;
    let clicked = false;
    let revoked = false;

    const originalWindow = global.window;
    const originalDocument = global.document;
    const originalUrl = global.URL;

    try {
      (global as any).window = {};
      (global as any).URL = {
        createObjectURL: (blob: Blob) => {
          createdBlobType = blob.type;
          return "blob:http://localhost:3000/mock-pdf-url";
        },
        revokeObjectURL: () => {
          revoked = true;
        },
      };

      (global as any).document = {
        createElement: (tag: string) => {
          if (tag === "a") {
            const anchor: any = {
              href: "",
              download: "",
              style: {},
              setAttribute: () => {},
              click: () => {
                clicked = true;
              },
              parentNode: null,
            };
            return anchor;
          }
          return {};
        },
        body: {
          appendChild: (el: any) => {
            appendedLink = el;
            el.parentNode = (global as any).document.body;
          },
          removeChild: (el: any) => {
            el.parentNode = null;
          },
        },
      };

      const result = triggerPdfDownload(dummyPdf, "meu-curriculo-teste.pdf");

      expect(result).toBe(true);
      expect(createdBlobType).toBe("application/pdf");
      expect(appendedLink).not.toBeNull();
      expect(appendedLink.download).toBe("meu-curriculo-teste.pdf");
      expect(appendedLink.href).toBe("blob:http://localhost:3000/mock-pdf-url");
      expect(clicked).toBe(true);
      // Confirma que NÃO revogou imediatamente de forma síncrona
      expect(revoked).toBe(false);
    } finally {
      (global as any).window = originalWindow;
      (global as any).document = originalDocument;
      (global as any).URL = originalUrl;
    }
  });

  describe("Integração Pix (/api/pix/*)", () => {
    it("/api/pix/criar deve retornar 401 quando os tokens de acesso não estiverem configurados", async () => {
      const { POST } = await import("@/app/api/pix/criar/route");
      const oldToken = process.env.MP_ACCESS_TOKEN;
      const oldMpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

      try {
        delete process.env.MP_ACCESS_TOKEN;
        delete process.env.MERCADOPAGO_ACCESS_TOKEN;

        const req = new Request("http://localhost:3000/api/pix/criar", { method: "POST" });
        const res = await POST(req as any);

        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data.error).toBe("O token de acesso do Mercado Pago não está configurado nas variáveis de ambiente da Vercel.");
      } finally {
        process.env.MP_ACCESS_TOKEN = oldToken;
        process.env.MERCADOPAGO_ACCESS_TOKEN = oldMpToken;
      }
    });

    it("/api/pix/criar deve chamar https://api.mercadopago.com/v1/payments com payload oficial de Pix e retornar dados completos", async () => {
      const { POST } = await import("@/app/api/pix/criar/route");
      const oldToken = process.env.MP_ACCESS_TOKEN;
      process.env.MP_ACCESS_TOKEN = "APP_USR-TESTE-PROD-TOKEN-12345";

      let capturedUrl = "";
      let capturedMethod = "";
      let capturedHeaders: any = {};
      let capturedBody: any = {};

      const originalFetch = global.fetch;

      try {
        global.fetch = (async (url: string, init: any) => {
          capturedUrl = url;
          capturedMethod = init.method;
          capturedHeaders = init.headers;
          capturedBody = JSON.parse(init.body);

          return {
            ok: true,
            status: 201,
            json: async () => ({
              id: 123456789,
              status: "pending",
              transaction_amount: 5.00,
              point_of_interaction: {
                transaction_data: {
                  qr_code: "00020126...real_pix_copia_e_cola",
                  qr_code_base64: "dGVzdGVfcXJfY29kZV9iYXNlNjQ=",
                  ticket_url: "https://www.mercadopago.com.br/payments/123456789/ticket",
                },
              },
            }),
          } as Response;
        }) as any;

        const req = new Request("http://localhost:3000/api/pix/criar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const res = await POST(req as any);

        expect(res.status).toBe(200);
        const data = await res.json();

        expect(capturedUrl).toBe("https://api.mercadopago.com/v1/payments");
        expect(capturedMethod).toBe("POST");
        expect(capturedHeaders.Authorization).toBe("Bearer APP_USR-TESTE-PROD-TOKEN-12345");
        expect(capturedHeaders["X-Idempotency-Key"]).toBeTruthy();
        expect(capturedBody.transaction_amount).toBe(5.00);
        expect(capturedBody.payment_method_id).toBe("pix");
        expect(capturedBody.payer.email).toBe("cliente@fastcurriculo.com");

        expect(data.success).toBe(true);
        expect(data.id).toBe("123456789");
        expect(data.qr_code).toBe("00020126...real_pix_copia_e_cola");
        expect(data.qr_code_base64).toBe("dGVzdGVfcXJfY29kZV9iYXNlNjQ=");
        expect(data.point_of_interaction?.transaction_data?.qr_code).toBe("00020126...real_pix_copia_e_cola");

        // Confirma registro na store efêmera
        const stored = orderStore.getOrder("123456789") || orderStore.getOrderByPaymentId("123456789");
        expect(stored).not.toBeNull();
      } finally {
        global.fetch = originalFetch;
        process.env.MP_ACCESS_TOKEN = oldToken;
      }
    });

    it("/api/pix/criar deve propagar mensagem de erro quando a API do Mercado Pago retornar falha", async () => {
      const { POST } = await import("@/app/api/pix/criar/route");
      const oldToken = process.env.MP_ACCESS_TOKEN;
      process.env.MP_ACCESS_TOKEN = "APP_USR-TESTE-PROD-TOKEN-12345";

      const originalFetch = global.fetch;

      try {
        global.fetch = (async () => {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              message: "Invalid parameter",
              cause: [{ description: "Chave Pix inválida" }],
            }),
          } as Response;
        }) as any;

        const req = new Request("http://localhost:3000/api/pix/criar", { method: "POST" });
        const res = await POST(req as any);

        expect(res.status).toBe(400);
        const data = await res.json();
        expect(data.error).toContain("Invalid parameter");
        expect(data.error).toContain("Chave Pix inválida");
      } finally {
        global.fetch = originalFetch;
        process.env.MP_ACCESS_TOKEN = oldToken;
      }
    });

    it("/api/pix/status deve retornar 400 se o parâmetro id estiver ausente", async () => {
      const { GET } = await import("@/app/api/pix/status/route");
      const req = new Request("http://localhost:3000/api/pix/status");
      const res = await GET(req as any);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("id");
    });

    it("/api/pix/status deve consultar /v1/payments/{id} e retornar pago: true quando status for approved", async () => {
      const { GET } = await import("@/app/api/pix/status/route");
      const oldToken = process.env.MP_ACCESS_TOKEN;
      process.env.MP_ACCESS_TOKEN = "TEST_PROD_MP_TOKEN_ABC";

      // Cria a ordem para que o markAsPaid emita o downloadToken com sucesso
      orderStore.createOrder("987654321", FIXED_PRICE_IN_CENTS);

      const originalFetch = global.fetch;

      try {
        global.fetch = (async (url: string) => {
          if (url.includes("/v1/payments/987654321")) {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                id: 987654321,
                status: "approved",
              }),
            } as Response;
          }
          return { ok: false, status: 404 } as Response;
        }) as any;

        const req = new Request("http://localhost:3000/api/pix/status?id=987654321");
        const res = await GET(req as any);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.pago).toBe(true);
        expect(data.status).toBe("approved");
        expect(data.downloadToken).toBeTruthy();
      } finally {
        global.fetch = originalFetch;
        process.env.MP_ACCESS_TOKEN = oldToken;
      }
    });

    it("/api/pix/status deve ressincronizar com R$ 5,00 mesmo quando a ordem NÃO existir no orderStore local da Lambda", async () => {
      const { GET } = await import("@/app/api/pix/status/route");
      const oldToken = process.env.MP_ACCESS_TOKEN;
      process.env.MP_ACCESS_TOKEN = "TEST_PROD_MP_TOKEN_ABC";

      const unseededPaymentId = `serverless_unseeded_${Date.now()}`;
      // Não cria a ordem no orderStore (simula requisição caindo em outra Lambda)
      expect(orderStore.getOrderByPaymentId(unseededPaymentId)).toBeUndefined();

      const originalFetch = global.fetch;

      try {
        global.fetch = (async (url: string) => {
          if (url.includes(`/v1/payments/${unseededPaymentId}`)) {
            return {
              ok: true,
              status: 200,
              json: async () => ({
                id: unseededPaymentId,
                status: "approved",
              }),
            } as Response;
          }
          return { ok: false, status: 404 } as Response;
        }) as any;

        const req = new Request(`http://localhost:3000/api/pix/status?id=${unseededPaymentId}`);
        const res = await GET(req as any);

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.pago).toBe(true);
        expect(data.status).toBe("approved");
        expect(data.downloadToken).toBeTruthy();

        // Verifica que a store efêmera agora possui o registro recuperado com R$ 5,00 (500 centavos)
        const restored = orderStore.getOrderByPaymentId(unseededPaymentId);
        expect(restored).toBeDefined();
        expect(restored?.amountInCents).toBe(500);
        expect(restored?.status).toBe("paid");
        expect(restored?.downloadToken).toBe(data.downloadToken);
      } finally {
        global.fetch = originalFetch;
        process.env.MP_ACCESS_TOKEN = oldToken;
      }
    });
  });
});

