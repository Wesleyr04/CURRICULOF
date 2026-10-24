import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getPaymentGateway } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";

/**
 * Comparação em tempo constante (Timing-Safe) para validação de tokens e assinaturas de Webhook.
 * Utiliza hash SHA-256 para assegurar igualdade de tamanho de buffer antes de chamar timingSafeEqual.
 */
function safeCompareTokens(provided: string, secret: string): boolean {
  if (!provided || !secret) return false;
  try {
    const hashProvided = crypto.createHash("sha256").update(provided.trim()).digest();
    const hashSecret = crypto.createHash("sha256").update(secret.trim()).digest();
    return crypto.timingSafeEqual(hashProvided, hashSecret);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Obtém o gateway de pagamento configurado (lança 501 se 'none' ou ausente)
    getPaymentGateway();

    // 2. Validação de Assinatura Criptográfica Timing-Safe
    const webhookSecret = process.env.PUSHINPAY_WEBHOOK_SECRET || "";
    const authHeader = req.headers.get("authorization") || "";
    const tokenHeader =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("x-signature") ||
      req.headers.get("x-pushinpay-token") ||
      (authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader);

    // Se o webhookSecret estiver configurado, a validação é estritamente mandatória
    if (webhookSecret) {
      const isValid = safeCompareTokens(tokenHeader, webhookSecret);
      if (!isValid) {
        console.warn("[Webhook Payment] Assinatura ou secret de webhook inválido.");
        return NextResponse.json(
          { error: "Assinatura ou secret de webhook inválido." },
          { status: 401 }
        );
      }
    }

    // 3. Leitura e conciliação do payload da PushinPay
    const body = await req.json().catch(() => ({}));

    const paymentId = String(body?.id || body?.txid || body?.paymentId || "");
    const externalReference = String(body?.external_reference || body?.orderId || "");
    const rawStatus = String(body?.status || "").toLowerCase().trim();

    const targetIdentifier = externalReference || paymentId;

    if (!targetIdentifier) {
      return NextResponse.json(
        { error: "Payload do webhook sem identificador da ordem (id ou external_reference)." },
        { status: 400 }
      );
    }

    // 4. Verificação de status e Idempotência
    const isApproved =
      rawStatus === "paid" ||
      rawStatus === "approved" ||
      rawStatus === "completed" ||
      rawStatus === "liquidated";

    if (isApproved) {
      // Idempotência: verifica se a ordem já está marcada como paga
      const existingOrder =
        (await orderStore.getOrderAsync(targetIdentifier)) ||
        (await orderStore.getOrderByPaymentIdAsync(targetIdentifier));

      if (existingOrder && existingOrder.status === "paid" && existingOrder.downloadToken) {
        return NextResponse.json({
          success: true,
          received: true,
          alreadyProcessed: true,
          orderId: existingOrder.orderId,
        });
      }

      // Concilia a ordem, emite o downloadToken seguro e persiste no KV/Memória
      const paidResult = await orderStore.markAsPaidAsync(targetIdentifier);

      return NextResponse.json({
        success: true,
        received: true,
        status: "paid",
        orderId: paidResult?.order.orderId,
      });
    }

    return NextResponse.json({
      success: true,
      received: true,
      status: rawStatus || "pending",
    });
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Provedor de pagamento pendente.";

    const is501 = errorMsg.includes("501");
    return NextResponse.json(
      { error: errorMsg },
      { status: is501 ? 501 : 500 }
    );
  }
}
