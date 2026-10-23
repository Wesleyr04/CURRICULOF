import crypto from "crypto";
import { PaymentStatus } from "./types";
export { FIXED_PRICE_IN_CENTS } from "./factory";

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

// Armazenamento em memória volátil com limpeza automática (Zero persistência em disco ou BD)
class EphemeralOrderStore {
  private orders: Map<string, EphemeralOrder> = new Map();

  constructor() {
    // Limpeza a cada 5 minutos
    if (typeof setInterval !== "undefined") {
      setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, order] of this.orders.entries()) {
      if (now > order.expiresAt) {
        this.orders.delete(key);
      }
    }
  }

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
    amountInCents: number = 500
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
      return { order, downloadToken: order.downloadToken };
    }

    const downloadToken = `dl_${crypto.randomBytes(24).toString("hex")}`;
    order.status = "paid";
    order.paidAt = Date.now();
    order.downloadToken = downloadToken;
    order.expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    return { order, downloadToken };
  }

  markAsPaid(orderId: string): { order: EphemeralOrder; downloadToken: string } | null {
    let order = this.orders.get(orderId);
    if (!order) {
      order = this.getOrderByPaymentId(orderId);
    }
    if (!order) {
      // Fallback serverless: se não existia na instância atual, sincroniza diretamente
      return this.syncApprovedOrder(orderId);
    }

    if (order.status === "paid" && order.downloadToken) {
      return { order, downloadToken: order.downloadToken };
    }

    const downloadToken = `dl_${crypto.randomBytes(24).toString("hex")}`;
    order.status = "paid";
    order.paidAt = Date.now();
    order.downloadToken = downloadToken;
    // Permite download por 24 horas após o pagamento para garantir re-download seguro
    order.expiresAt = Date.now() + 24 * 60 * 60 * 1000;

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
}

// Instância singleton no processo Node.js
export const orderStore = new EphemeralOrderStore();
