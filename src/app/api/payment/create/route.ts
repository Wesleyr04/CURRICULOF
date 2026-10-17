import { NextRequest, NextResponse } from "next/server";
import { getPaymentGateway, FIXED_PRICE_IN_CENTS } from "@/lib/payment/factory";
import { orderStore } from "@/lib/payment/store";

export async function POST(_req: NextRequest) {
  try {
    const gateway = getPaymentGateway();

    // Cria a ordem efêmera no servidor com o valor estritamente fixado em 50 centavos
    const tempPaymentId = `temp_${Date.now()}`;
    const order = orderStore.createOrder(tempPaymentId, FIXED_PRICE_IN_CENTS);

    const result = await gateway.createPayment({
      orderId: order.orderId,
      amountInCents: FIXED_PRICE_IN_CENTS,
      description: "Geração de Currículo Profissional - FastCurrículo",
    });

    // Atualiza com o paymentId real retornado pelo provedor
    order.paymentId = result.paymentId;

    return NextResponse.json(
      {
        orderId: order.orderId,
        paymentId: result.paymentId,
        amountInCents: FIXED_PRICE_IN_CENTS,
        formattedAmount: "R$ 0,50",
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
  } catch (error: any) {
    console.error("[Payment Create Error]", error?.message || "Erro desconhecido");
    return NextResponse.json(
      { error: "Não foi possível gerar a cobrança Pix no momento. Tente novamente." },
      { status: 500 }
    );
  }
}
