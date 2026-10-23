import { NextRequest, NextResponse } from "next/server";
import { getPaymentGateway, FIXED_PRICE_IN_CENTS } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "Identificador da ordem ausente." }, { status: 400 });
    }

    const order = orderStore.getOrder(orderId) || orderStore.getOrderByPaymentId(orderId);
    
    // Se a ordem não estiver em memória na Lambda atual, tenta consulta de resiliência direta no Gateway
    if (!order) {
      try {
        const gateway = getPaymentGateway();
        const directStatus = await gateway.checkStatus(orderId);

        if (directStatus === "paid") {
          const synced = orderStore.syncApprovedOrder(orderId, FIXED_PRICE_IN_CENTS);
          return NextResponse.json({
            status: "paid",
            orderId: synced.order.orderId,
            downloadToken: synced.downloadToken,
          });
        }
      } catch (gwErr) {
        console.warn("[Payment Status Gateway Check Warning]", gwErr);
      }

      return NextResponse.json(
        { error: "Ordem expirada ou não encontrada. Inicie uma nova cobrança." },
        { status: 404 }
      );
    }

    // Se já estiver como paga, retorna o token existente
    if (order.status === "paid" && order.downloadToken) {
      return NextResponse.json({
        status: "paid",
        orderId: order.orderId,
        downloadToken: order.downloadToken,
      });
    }

    // Verifica com o gateway
    const gateway = getPaymentGateway();
    const currentStatus = await gateway.checkStatus(order.paymentId);

    if (currentStatus === "paid") {
      const paidResult = orderStore.syncApprovedOrder(order.paymentId, FIXED_PRICE_IN_CENTS);
      return NextResponse.json({
        status: "paid",
        orderId: order.orderId,
        downloadToken: paidResult.downloadToken,
      });
    }

    return NextResponse.json({
      status: currentStatus,
      orderId: order.orderId,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[Payment Status Error]", errorMsg);
    return NextResponse.json(
      { error: "Erro ao consultar o status do pagamento." },
      { status: 500 }
    );
  }
}

