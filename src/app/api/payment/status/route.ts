import { NextRequest, NextResponse } from "next/server";
import { getPaymentGateway } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orderId = body?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "Identificador da ordem ausente." }, { status: 400 });
    }

    const order = orderStore.getOrder(orderId);
    if (!order) {
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
      const paidResult = orderStore.markAsPaid(order.orderId);
      return NextResponse.json({
        status: "paid",
        orderId: order.orderId,
        downloadToken: paidResult?.downloadToken,
      });
    }

    return NextResponse.json({
      status: currentStatus,
      orderId: order.orderId,
    });
  } catch (error: any) {
    console.error("[Payment Status Error]", error?.message || "Erro desconhecido");
    return NextResponse.json(
      { error: "Erro ao consultar o status do pagamento." },
      { status: 500 }
    );
  }
}
