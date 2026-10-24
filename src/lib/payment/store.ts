import crypto from "crypto";
import { PaymentStatus } from "./types";
import { FIXED_PRICE_IN_CENTS } from "./factory";
export { FIXED_PRICE_IN_CENTS };

export interface EphemeralOrder {
  orderId: string;
  paymentId: string;
  amountInCents: number;
  status: PaymentStatus;
  downloadToken?: string;
  createdAt: number;
  expiresAt: number;
  paidAt?: number;
}

/**
 * Armazenamento Híbrido de Ordens de Pagamento:
 * - Em memória local com limpeza automática por TTL (Map volátil para desenvolvimento e testes unitários).
 * - Persistência Remota em Nuvem (Upstash Redis REST API) quando KV_REST_API_URL e KV_REST_API_TOKEN estiverem configurados,
 *   garantindo total resiliência entre instâncias e reciclagens Serverless na Netlify.
 */
export class EphemeralOrderStore {
  private orders: Map<string, EphemeralOrder> = new Map();
  private kvUrl: string;
  private kvToken: string;

  constructor() {
    this.kvUrl = (
      process.env.KV_REST_API_URL ||
      process.env.UPSTASH_REDIS_REST_URL ||
      ""
    ).trim().replace(/\/+$/, "");

    this.kvToken = (
      process.env.KV_REST_API_TOKEN ||
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      ""
    ).trim();

    // Limpeza de registros expirados no Map local a cada 5 minutos
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  public isKvConfigured(): boolean {
    return Boolean(this.kvUrl && this.kvToken);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, order] of this.orders.entries()) {
      if (now > order.expiresAt) {
        this.orders.delete(key);
      }
    }
  }

  /**
   * Executa comandos POST no Upstash Redis KV.
   */
  private async executeKvCommand<T>(command: (string | number)[]): Promise<T | null> {
    if (!this.isKvConfigured()) return null;

    try {
      const res = await fetch(this.kvUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.kvToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(command),
        cache: "no-store",
      });

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      return json.result as T;
    } catch (err) {
      console.error("[EphemeralOrderStore] Erro ao comunicar com Upstash Redis KV:", err);
      return null;
    }
  }

  /**
   * Grava a ordem e seus índices relacionais no KV com TTL automático.
   * TTL: 15 minutos (900s) para ordens pendentes, 24 horas (86400s) para pagas.
   */
  public async persistOrderToKv(order: EphemeralOrder): Promise<void> {
    if (!this.isKvConfigured()) return;

    try {
      const ttlSeconds = order.status === "paid" ? 86400 : 900;
      const orderKey = `fastcurriculo:order:${order.orderId}`;
      const serialized = JSON.stringify(order);

      // Salva a ordem principal
      await this.executeKvCommand(["SET", orderKey, serialized, "EX", ttlSeconds]);

      // Mapeia paymentId -> orderId se disponível
      if (order.paymentId && order.paymentId !== order.orderId) {
        const payKey = `fastcurriculo:order_by_pay:${order.paymentId}`;
        await this.executeKvCommand(["SET", payKey, order.orderId, "EX", ttlSeconds]);
      }

      // Mapeia downloadToken -> orderId com 24h de TTL
      if (order.downloadToken && order.status === "paid") {
        const tokenKey = `fastcurriculo:dl_token:${order.downloadToken}`;
        await this.executeKvCommand(["SET", tokenKey, order.orderId, "EX", 86400]);
      }
    } catch (err) {
      console.warn("[EphemeralOrderStore] Falha não-bloqueante ao sincronizar com KV:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // MÉTODOS SÍNCRONOS (Compatibilidade com Testes e Acesso Imediato)
  // ---------------------------------------------------------------------------

  createOrder(paymentId: string, amountInCents: number): EphemeralOrder {
    const orderId = `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const now = Date.now();
    const order: EphemeralOrder = {
      orderId,
      paymentId,
      amountInCents,
      status: "pending",
      createdAt: now,
      expiresAt: now + 15 * 60 * 1000, // 15 minutos de validade
    };

    this.orders.set(orderId, order);

    // Disparo assíncrono para persistência no KV
    this.persistOrderToKv(order).catch(() => {});

    return order;
  }

  getOrder(orderId: string): EphemeralOrder | undefined {
    this.cleanup();
    return this.orders.get(orderId);
  }

  getOrderByPaymentId(paymentId: string): EphemeralOrder | undefined {
    this.cleanup();
    for (const order of this.orders.values()) {
      if (order.paymentId === paymentId) {
        return order;
      }
    }
    return undefined;
  }

  syncApprovedOrder(
    paymentId: string,
    amountInCents: number = FIXED_PRICE_IN_CENTS
  ): { order: EphemeralOrder; downloadToken: string } {
    let order = this.orders.get(paymentId) || this.getOrderByPaymentId(paymentId);
    if (!order) {
      const orderId = `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const now = Date.now();
      order = {
        orderId,
        paymentId,
        amountInCents,
        status: "paid",
        paidAt: now,
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000, // 24h para re-download no mesmo dia
      };
      this.orders.set(orderId, order);
    }

    if (order.status === "paid" && order.downloadToken) {
      this.persistOrderToKv(order).catch(() => {});
      return { order, downloadToken: order.downloadToken };
    }

    const downloadToken = `dl_${crypto.randomBytes(24).toString("hex")}`;
    order.status = "paid";
    order.paidAt = Date.now();
    order.downloadToken = downloadToken;
    order.expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    this.persistOrderToKv(order).catch(() => {});
    return { order, downloadToken };
  }

  markAsPaid(orderId: string): { order: EphemeralOrder; downloadToken: string } | null {
    let order = this.orders.get(orderId);
    if (!order) {
      order = this.getOrderByPaymentId(orderId);
    }
    if (!order) {
      return this.syncApprovedOrder(orderId);
    }

    if (order.status === "paid" && order.downloadToken) {
      this.persistOrderToKv(order).catch(() => {});
      return { order, downloadToken: order.downloadToken };
    }

    const downloadToken = `dl_${crypto.randomBytes(24).toString("hex")}`;
    order.status = "paid";
    order.paidAt = Date.now();
    order.downloadToken = downloadToken;
    order.expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    this.persistOrderToKv(order).catch(() => {});
    return { order, downloadToken };
  }

  verifyDownloadToken(token: string): boolean {
    this.cleanup();
    for (const order of this.orders.values()) {
      if (order.downloadToken === token && order.status === "paid") {
        return true;
      }
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // MÉTODOS ASSÍNCRONOS RESILIENTES (Para Rotas Serverless Netlify)
  // ---------------------------------------------------------------------------

  async getOrderAsync(orderId: string): Promise<EphemeralOrder | undefined> {
    const local = this.getOrder(orderId);
    if (local) return local;

    if (!this.isKvConfigured()) return undefined;

    const raw = await this.executeKvCommand<string>([
      "GET",
      `fastcurriculo:order:${orderId}`,
    ]);

    if (!raw) return undefined;

    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : (raw as EphemeralOrder);
      if (parsed && parsed.orderId) {
        this.orders.set(parsed.orderId, parsed);
        return parsed;
      }
    } catch {
      return undefined;
    }

    return undefined;
  }

  async getOrderByPaymentIdAsync(paymentId: string): Promise<EphemeralOrder | undefined> {
    const local = this.getOrderByPaymentId(paymentId);
    if (local) return local;

    if (!this.isKvConfigured()) return undefined;

    const resolvedOrderId = await this.executeKvCommand<string>([
      "GET",
      `fastcurriculo:order_by_pay:${paymentId}`,
    ]);

    if (resolvedOrderId) {
      return await this.getOrderAsync(resolvedOrderId);
    }

    return undefined;
  }

  async markAsPaidAsync(
    orderIdOrPaymentId: string
  ): Promise<{ order: EphemeralOrder; downloadToken: string } | null> {
    // 1. Tenta recuperar a ordem da memória ou do KV
    let order =
      (await this.getOrderAsync(orderIdOrPaymentId)) ||
      (await this.getOrderByPaymentIdAsync(orderIdOrPaymentId));

    if (!order) {
      const orderId = `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const now = Date.now();
      order = {
        orderId,
        paymentId: orderIdOrPaymentId,
        amountInCents: FIXED_PRICE_IN_CENTS,
        status: "paid",
        paidAt: now,
        createdAt: now,
        expiresAt: now + 24 * 60 * 60 * 1000,
      };
      this.orders.set(orderId, order);
    }

    if (order.status === "paid" && order.downloadToken) {
      await this.persistOrderToKv(order);
      return { order, downloadToken: order.downloadToken };
    }

    const downloadToken = `dl_${crypto.randomBytes(24).toString("hex")}`;
    order.status = "paid";
    order.paidAt = Date.now();
    order.downloadToken = downloadToken;
    order.expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    this.orders.set(order.orderId, order);
    await this.persistOrderToKv(order);

    return { order, downloadToken };
  }

  async verifyDownloadTokenAsync(token: string): Promise<boolean> {
    if (this.verifyDownloadToken(token)) {
      return true;
    }

    if (!this.isKvConfigured() || !token) {
      return false;
    }

    const associatedOrderId = await this.executeKvCommand<string>([
      "GET",
      `fastcurriculo:dl_token:${token.trim()}`,
    ]);

    if (!associatedOrderId) {
      return false;
    }

    const order = await this.getOrderAsync(associatedOrderId);
    if (order && order.status === "paid" && order.downloadToken === token.trim()) {
      return true;
    }

    return false;
  }

  async updateOrderPaymentId(orderId: string, paymentId: string): Promise<void> {
    const order = await this.getOrderAsync(orderId);
    if (order) {
      order.paymentId = paymentId;
      this.orders.set(orderId, order);
      await this.persistOrderToKv(order);
    }
  }
}

// Instância singleton para uso em todo o backend
export const orderStore = new EphemeralOrderStore();
