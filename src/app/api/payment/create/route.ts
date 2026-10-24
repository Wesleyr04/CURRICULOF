import { NextRequest, NextResponse } from "next/server";
import { getPaymentGateway, FIXED_PRICE_IN_CENTS } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";
import { SITE_CONFIG } from "@/config/site";

export async function POST(_req: NextRequest) {
  try {
    const gateway = getPaymentGateway();

    // Cria a ordem efêmera no servidor com o valor estritamente fixado em 299 centavos (R$ 2,99)
    const tempPaymentId = `temp_${Date.now()}`;
    const order = orderStore.createOrder(tempPaymentId, FIXED_PRICE_IN_CENTS);

    const result = await gateway.createPayment({
      orderId: order.orderId,
      amountInCents: FIXED_PRICE_IN_CENTS,
      description: "Geração de Currículo Profissional - FastCurrículo",
    });

    // Atualiza com o paymentId real retornado pelo provedor e sincroniza no KV
    order.paymentId = result.paymentId;
    await orderStore.updateOrderPaymentId(order.orderId, result.paymentId);

    return NextResponse.json(
      {
        orderId: order.orderId,
        paymentId: result.paymentId,
        amountInCents: FIXED_PRICE_IN_CENTS,
        formattedAmount: SITE_CONFIG.pricing.formatted,
        qrCodeText: result.qrCodeText,
        qrCodeBase64: result.qrCodeBase64,
        expiresAt: result.expiresAt,
        status: result.status,
        isMock: result.isMock,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[Payment Create Error]", errorMsg);

    const is501 = errorMsg.includes("501");
    return NextResponse.json(
      { error: errorMsg },
      { status: is501 ? 501 : 500 }
    );
  }
}
