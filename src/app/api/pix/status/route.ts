export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { orderStore, EphemeralOrder } from "@/lib/payment/store";
import { getPaymentGateway } from "@/lib/payment/factory";

/**
 * Dados não sensíveis do pedido confirmado, lidos exclusivamente do registro do servidor.
 */
function confirmedOrderDetails(order: EphemeralOrder) {
  return {
    orderId: order.orderId,
    amountInCents: order.amountInCents,
    paidAt: order.paidAt ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl ? req.nextUrl.searchParams.get("id") : new URL(req.url).searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Parâmetro 'id' do pagamento ausente na requisição." },
        { status: 400 }
      );
    }

    // 1. Verifica se já está registrado e marcado como pago na orderStore (Memória ou KV)
    const storedOrder =
      (await orderStore.getOrderAsync(id)) ||
      (await orderStore.getOrderByPaymentIdAsync(id));

    if (storedOrder && storedOrder.status === "paid" && storedOrder.downloadToken) {
      return NextResponse.json({
        pago: true,
        status: "approved",
        downloadToken: storedOrder.downloadToken,
        ...confirmedOrderDetails(storedOrder),
      });
    }

    // 2. Consulta o gateway configurado
    let gateway;
    try {
      gateway = getPaymentGateway();
    } catch (configErr) {
      const msg =
        configErr instanceof Error
          ? configErr.message
          : "501 Not Implemented: Provedor de pagamento pendente.";

      const is501 = msg.includes("501");
      return NextResponse.json(
        {
          error: msg,
        },
        { status: is501 ? 501 : 503 }
      );
    }

    const currentStatus = await gateway.checkStatus(id);

    if (currentStatus === "paid") {
      const paidResult = await orderStore.markAsPaidAsync(id);
      return NextResponse.json({
        pago: true,
        status: "approved",
        downloadToken: paidResult?.downloadToken,
        ...(paidResult ? confirmedOrderDetails(paidResult.order) : {}),
      });
    }

    return NextResponse.json({
      pago: false,
      status: currentStatus || "pending",
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[API /api/pix/status Error]", errorMsg);
    return NextResponse.json(
      { error: "Erro ao consultar status da transação Pix." },
      { status: 500 }
    );
  }
}
