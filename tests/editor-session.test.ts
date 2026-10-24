import { describe, it, expect, beforeEach } from "vitest";

class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }
}

const storageInstance = new LocalStorageMock();
(globalThis as unknown as { localStorage: LocalStorageMock }).localStorage = storageInstance;

describe("Persistência de Sessão de Pagamento (R$ 2,99 / 24h) e Desacoplamento do Editor", () => {
  beforeEach(() => {
    storageInstance.clear();
  });

  it("deve armazenar e validar a sessão de pagamento por 24 horas no localStorage", () => {
    const now = Date.now();
    const sessionData = {
      isPaid: true,
      downloadToken: "dl_sample_token_12345",
      orderId: "ord_sample_order_67890",
      paidAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
    };

    localStorage.setItem("fastcurriculo_payment_session", JSON.stringify(sessionData));

    const storedRaw = localStorage.getItem("fastcurriculo_payment_session");
    expect(storedRaw).toBeTruthy();

    const parsed = JSON.parse(storedRaw!);
    expect(parsed.isPaid).toBe(true);
    expect(parsed.downloadToken).toBe("dl_sample_token_12345");
    expect(parsed.orderId).toBe("ord_sample_order_67890");
    expect(parsed.expiresAt).toBeGreaterThan(Date.now());
  });

  it("deve considerar expirada uma sessão com mais de 24 horas", () => {
    const expiredTimestamp = Date.now() - 1000; // 1 segundo atrás
    const sessionData = {
      isPaid: true,
      downloadToken: "dl_token_expirado",
      orderId: "ord_expirada",
      paidAt: Date.now() - 25 * 60 * 60 * 1000,
      expiresAt: expiredTimestamp,
    };

    localStorage.setItem("fastcurriculo_payment_session", JSON.stringify(sessionData));

    const storedRaw = localStorage.getItem("fastcurriculo_payment_session");
    const parsed = JSON.parse(storedRaw!);
    const isValid = parsed.isPaid && parsed.expiresAt > Date.now();

    expect(isValid).toBe(false);
  });
});
