import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { orderStore } from "@/lib/payment/store";
import { FIXED_PRICE_IN_CENTS } from "@/lib/payment/factory";

export async function POST(req: NextRequest) {
  try {
    await req.json().catch(() => ({}));

    // Força a leitura direta da variável de ambiente da Vercel (suporta ambos os nomes)
    const rawToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
    const accessToken = typeof rawToken === "string" ? rawToken.trim() : "";

    // Log seguro de auditoria para diagnóstico nos logs da Vercel
    console.log(
      "[MP Token Check] Token presente:",
      !!accessToken,
      "Tamanho:",
      accessToken.length,
      "Prefixo:",
      accessToken ? accessToken.substring(0, 6) + "..." : "VAZIO"
    );

    if (!accessToken) {
      return NextResponse.json(
        { error: "O token de acesso do Mercado Pago não está configurado nas variáveis de ambiente da Vercel." },
        { status: 401 }
      );
    }

    const idempotencyKey = crypto.randomUUID();
    const priceInReais = Number((FIXED_PRICE_IN_CENTS / 100).toFixed(2));

    // Chamada oficial à API de pagamentos do Mercado Pago para Pix
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        transaction_amount: priceInReais,
        description: "Liberação de Currículo em PDF - FastCurrículo",
        payment_method_id: "pix",
        payer: {
          email: "cliente@fastcurriculo.com",
        },
      }),
      cache: "no-store",
    });

    const data = await mpResponse.json().catch(() => ({}));

    if (!mpResponse.ok) {
      console.error("[Mercado Pago API Error]", mpResponse.status, data);

      const causeMsg = Array.isArray(data.cause)
        ? data.cause
            .map((c: { description?: string; code?: string | number }) => c?.description || String(c?.code || ""))
            .filter(Boolean)
            .join("; ")
        : "";

      const errorMessage = causeMsg
        ? `${data.message || "Erro ao gerar Pix no Mercado Pago"} (${causeMsg})`
        : (data.message || "Erro ao gerar Pix no Mercado Pago.");

      return NextResponse.json(
        { error: errorMessage, details: data },
        { status: mpResponse.status >= 400 && mpResponse.status < 600 ? mpResponse.status : 502 }
      );
    }

    const paymentId = String(data.id);
    const poi = data.point_of_interaction?.transaction_data;
    const qrCode = poi?.qr_code || "";
    const qrCodeBase64 = poi?.qr_code_base64 || "";
    const ticketUrl = poi?.ticket_url || "";

    // Registra na store efêmera para garantir fluxo de verificação de status e download
    const ephemeralOrder = orderStore.createOrder(paymentId, FIXED_PRICE_IN_CENTS);
    ephemeralOrder.paymentId = paymentId;

    return NextResponse.json(
      {
        success: true,
        id: paymentId,
        status: data.status || "pending",
        transaction_amount: data.transaction_amount || priceInReais,
        qr_code: qrCode,
        qr_code_base64: qrCodeBase64,
        ticket_url: ticketUrl,
        point_of_interaction: data.point_of_interaction,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erro de conexão";
    console.error("[API /api/pix/criar Error]", error);
    return NextResponse.json(
      { error: "Erro interno ao processar pagamento: " + errorMsg },
      { status: 500 }
    );
  }
}