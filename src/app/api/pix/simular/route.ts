import { NextRequest, NextResponse } from "next/server";
import { orderStore } from "@/lib/payment/store";
import { FIXED_PRICE_IN_CENTS } from "@/lib/payment/factory";

export async function POST(req: NextRequest) {
  // Bloqueio de simulação em ambiente de produção estrito ou sem autorização explícita
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_MOCK_PAYMENT !== "true") {
    return NextResponse.json(
      { error: "A simulação de pagamento é desativada em produção ou quando ALLOW_MOCK_PAYMENT não for 'true'." },
      { status: 403 }
    );
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Parâmetro 'id' da ordem é obrigatório." },
        { status: 400 }
      );
    }

    let order = orderStore.getOrder(id) || orderStore.getOrderByPaymentId(id);
    if (!order) {
      // Se não encontrada, cria na memória para permitir o teste
      order = orderStore.createOrder(id, FIXED_PRICE_IN_CENTS);
    }

    const paidResult = orderStore.markAsPaid(order.orderId);

    return NextResponse.json({
      success: true,
      pago: true,
      status: "processed",
      downloadToken: paidResult?.downloadToken,
      message: "Pagamento aprovado em modo de simulação/desenvolvimento.",
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erro ao simular pagamento.";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
