import { NextRequest, NextResponse } from "next/server";
import { getPaymentGateway, FIXED_PRICE_IN_CENTS } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";

export async function POST(req: NextRequest) {
  try {
    await req.json().catch(() => ({}));

    // Tenta obter o provedor de pagamento desacoplado
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

    const priceInReais = Number((FIXED_PRICE_IN_CENTS / 100).toFixed(2));
    const tempPaymentId = `temp_${Date.now()}`;
    const order = orderStore.createOrder(tempPaymentId, FIXED_PRICE_IN_CENTS);

    const result = await gateway.createPayment({
      orderId: order.orderId,
      amountInCents: FIXED_PRICE_IN_CENTS,
      description: "Liberação de Currículo em PDF - FastCurrículo",
    });

    order.paymentId = result.paymentId;
    await orderStore.updateOrderPaymentId(order.orderId, result.paymentId);

    return NextResponse.json(
      {
        success: true,
        id: result.paymentId,
        orderId: order.orderId,
        status: result.status || "pending",
        transaction_amount: priceInReais,
        qr_code: result.qrCodeText,
        qr_code_base64: result.qrCodeBase64 || "",
        ticket_url: "",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : "Erro ao processar pagamento.";
    console.error("[API /api/pix/criar Error]", errorMsg);

    const is501 = errorMsg.includes("501");
    return NextResponse.json(
      { error: errorMsg },
      { status: is501 ? 501 : 500 }
    );
  }
}