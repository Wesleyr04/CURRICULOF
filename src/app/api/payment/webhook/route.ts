import { NextRequest, NextResponse } from "next/server";
import { getPaymentGateway } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || req.headers.get("asaas-access-token") || "";

    const gateway = getPaymentGateway();
    let body: Record<string, unknown> | null = null;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    // Se estiver usando Asaas ou Mercado Pago com secret, valida assinatura
    if (!gateway.isMock && !gateway.verifyWebhookSignature(signature, body)) {
      console.warn("[Webhook Security] Assinatura do webhook inválida.");
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    // Identifica o ID do pagamento conforme o provedor
    const nestedPayment = body?.payment as Record<string, unknown> | undefined;
    const nestedData = body?.data as Record<string, unknown> | undefined;
    const paymentId = nestedPayment?.id || body?.id || nestedData?.id;
    const eventStatus = String(body?.event || body?.action || body?.type || "");

    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    const strPaymentId = String(paymentId);
    const order = orderStore.getOrderByPaymentId(strPaymentId);

    // Se o evento confirmar pagamento
    if (
      eventStatus === "PAYMENT_RECEIVED" ||
      eventStatus === "PAYMENT_CONFIRMED" ||
      eventStatus === "payment.created" ||
      eventStatus === "payment.updated"
    ) {
      const currentStatus = await gateway.checkStatus(strPaymentId);
      if (currentStatus === "paid") {
        if (order) {
          orderStore.markAsPaid(order.orderId);
        } else {
          // Fallback serverless: ressincroniza a ordem aprovada com R$ 5,00
          orderStore.syncApprovedOrder(strPaymentId);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[Webhook Error]", errorMsg);
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 500 });
  }
}
