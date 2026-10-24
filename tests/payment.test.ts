import { describe, it, expect } from "vitest";
import { FIXED_PRICE_IN_CENTS, getPaymentGateway } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";
import { MockPixGateway } from "@/lib/payment/mock-gateway";

describe("Segurança Financeira e Camada de Pagamentos (R$ 2,99)", () => {
  it("o preço unitário no backend deve ser estritamente fixado em 299 centavos (R$ 2,99)", () => {
    expect(FIXED_PRICE_IN_CENTS).toBe(299);
  });

  it("deve criar uma ordem efêmera sem vincular conteúdo ou dados pessoais do currículo", () => {
    const tempPaymentId = `test_pay_${Date.now()}`;
    const order = orderStore.createOrder(tempPaymentId, FIXED_PRICE_IN_CENTS);

    expect(order.orderId).toBeTruthy();
    expect(order.amountInCents).toBe(299);
    expect(order.status).toBe("pending");
  });

  it("getPaymentGateway deve lançar exclusivamente '501 Not Implemented: Provedor de pagamento pendente.'", () => {
    expect(() => getPaymentGateway()).toThrow("501 Not Implemented: Provedor de pagamento pendente.");
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
      formattedAmount: "R$ 2,99",
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

  describe("Integração Pix Desacoplada e Falha Controlada (/api/pix/* e /api/payment/*)", () => {
    it("/api/pix/criar deve capturar o erro da factory e responder com HTTP 501 Not Implemented", async () => {
      const { POST } = await import("@/app/api/pix/criar/route");
      const req = new Request("http://localhost:3000/api/pix/criar", { method: "POST" });
      const res = await POST(req as any);

      expect(res.status).toBe(501);
      const data = await res.json();
      expect(data.error).toContain("501 Not Implemented: Provedor de pagamento pendente.");
    });

    it("/api/pix/status deve retornar 400 se o parâmetro id estiver ausente", async () => {
      const { GET } = await import("@/app/api/pix/status/route");
      const req = new Request("http://localhost:3000/api/pix/status");
      const res = await GET(req as any);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("id");
    });

    it("/api/pix/status deve retornar 501 Not Implemented quando o pagamento não estiver em memória", async () => {
      const { GET } = await import("@/app/api/pix/status/route");
      const req = new Request("http://localhost:3000/api/pix/status?id=ord_inexistente_123");
      const res = await GET(req as any);

      expect(res.status).toBe(501);
      const data = await res.json();
      expect(data.error).toContain("501 Not Implemented");
    });

    it("/api/pix/status deve retornar pago: true se a ordem já estiver paga no orderStore em memória", async () => {
      const { GET } = await import("@/app/api/pix/status/route");
      const testPaymentId = `mem_paid_${Date.now()}`;
      const order = orderStore.createOrder(testPaymentId, FIXED_PRICE_IN_CENTS);
      const paidResult = orderStore.markAsPaid(order.orderId);

      const req = new Request(`http://localhost:3000/api/pix/status?id=${order.orderId}`);
      const res = await GET(req as any);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.pago).toBe(true);
      expect(data.status).toBe("approved");
      expect(data.downloadToken).toBe(paidResult?.downloadToken);
    });

    it("/api/payment/create deve responder com HTTP 501 Not Implemented", async () => {
      const { POST } = await import("@/app/api/payment/create/route");
      const req = new Request("http://localhost:3000/api/payment/create", { method: "POST" });
      const res = await POST(req as any);

      expect(res.status).toBe(501);
      const data = await res.json();
      expect(data.error).toContain("501 Not Implemented: Provedor de pagamento pendente.");
    });

    it("/api/payment/webhook deve responder com HTTP 501 Not Implemented", async () => {
      const { POST } = await import("@/app/api/payment/webhook/route");
      const req = new Request("http://localhost:3000/api/payment/webhook", {
        method: "POST",
        body: JSON.stringify({ event: "PAYMENT_RECEIVED" }),
      });
      const res = await POST(req as any);

      expect(res.status).toBe(501);
      const data = await res.json();
      expect(data.error).toContain("501 Not Implemented: Provedor de pagamento pendente.");
    });
  });
});

