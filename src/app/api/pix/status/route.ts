export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { orderStore, FIXED_PRICE_IN_CENTS } from "@/lib/payment/store";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl ? req.nextUrl.searchParams.get("id") : new URL(req.url).searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Parâmetro 'id' do pagamento ausente na requisição." },
        { status: 400 }
      );
    }

    const token = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;

    // 1. Verifica se já está registrado e marcado como pago na orderStore em memória
    const storedOrder = orderStore.getOrder(id) || orderStore.getOrderByPaymentId(id);
    if (storedOrder && storedOrder.status === "paid" && storedOrder.downloadToken) {
      return NextResponse.json({
        pago: true,
        status: "approved",
        downloadToken: storedOrder.downloadToken,
      });
    }

    if (!token) {
      return NextResponse.json(
        { error: "MP_ACCESS_TOKEN não configurada no servidor." },
        { status: 500 }
      );
    }

    // 2. Consulta à API do Mercado Pago
    // Primeiro tenta via /v1/payments/{id}
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const status = data.status;

      if (status === "approved") {
        // Garante ressincronização serverless da ordem com valor de R$ 5,00 (500 centavos)
        const paidResult = orderStore.syncApprovedOrder(id, FIXED_PRICE_IN_CENTS);
        return NextResponse.json({
          pago: true,
          status: "approved",
          downloadToken: paidResult.downloadToken,
        });
      }

      return NextResponse.json({
        pago: false,
        status: status || "pending",
      });
    }

    // Fallback: se o ID for de uma Order (v1/orders/{id})
    const orderRes = await fetch(`https://api.mercadopago.com/v1/orders/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (orderRes.ok) {
      const orderData = await orderRes.json();
      const orderStatus = orderData.status;
      const firstPaymentStatus = orderData.transactions?.payments?.[0]?.status;

      const isPaid =
        orderStatus === "processed" ||
        firstPaymentStatus === "processed" ||
        firstPaymentStatus === "approved";

      if (isPaid) {
        const paidResult = orderStore.syncApprovedOrder(id, FIXED_PRICE_IN_CENTS);
        return NextResponse.json({
          pago: true,
          status: "approved",
          downloadToken: paidResult.downloadToken,
        });
      }

      return NextResponse.json({
        pago: false,
        status: orderStatus || firstPaymentStatus || "pending",
      });
    }

    // Se a consulta falhou no Mercado Pago
    return NextResponse.json({
      pago: false,
      status: "pending",
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
