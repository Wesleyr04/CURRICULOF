import { NextRequest, NextResponse } from "next/server";
import { getPaymentGateway } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || req.headers.get("asaas-access-token") || "";

    const gateway = getPaymentGateway();
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }

    // Se estiver usando Asaas ou Mercado Pago com secret, valida assinatura
    if (!gateway.isMock && !gateway.verifyWebhookSignature(signature, body)) {
      console.warn("[Webhook Security] Assinatura do webhook inválida.");
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    // Identifica o ID do pagamento conforme o provedor
    const paymentId = body?.payment?.id || body?.id || body?.data?.id;
    const eventStatus = body?.event || body?.action || body?.type;

    if (!paymentId) {
      return NextResponse.json({ received: true });
    }

    const order = orderStore.getOrderByPaymentId(String(paymentId));
    if (!order) {
      // Ordem já expirada ou inexistente
      return NextResponse.json({ received: true });
    }

    // Se o evento confirmar pagamento
    if (
      eventStatus === "PAYMENT_RECEIVED" ||
      eventStatus === "PAYMENT_CONFIRMED" ||
      eventStatus === "payment.created" ||
      eventStatus === "payment.updated"
    ) {
      const currentStatus = await gateway.checkStatus(order.paymentId);
      if (currentStatus === "paid") {
        orderStore.markAsPaid(order.orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Webhook Error]", error?.message);
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 500 });
  }
}
