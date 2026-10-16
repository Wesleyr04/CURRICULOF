import { NextRequest, NextResponse } from "next/server";
import { orderStore } from "@/lib/payment/store";
import { MockPixGateway } from "@/lib/payment/mock-gateway";
import { getPaymentGateway } from "@/lib/payment/factory";

export async function POST(req: NextRequest) {
  // Proteção contra ativação em produção
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_MOCK_PAYMENT !== "true") {
    return NextResponse.json(
      { error: "A simulação de pagamento é estritamente proibida em ambiente de produção." },
      { status: 403 }
    );
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId obrigatório." }, { status: 400 });
    }

    const order = orderStore.getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Ordem não encontrada." }, { status: 404 });
    }

    const gateway = getPaymentGateway();
    if (gateway instanceof MockPixGateway) {
      gateway.simulateApproval(order.paymentId);
    }

    const paidResult = orderStore.markAsPaid(order.orderId);

    return NextResponse.json({
      success: true,
      message: "Pagamento simulado com sucesso (modo de testes/desenvolvimento).",
      status: "paid",
      downloadToken: paidResult?.downloadToken,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro na simulação" }, { status: 500 });
  }
}
