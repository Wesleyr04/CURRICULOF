import { NextRequest, NextResponse } from "next/server";
import { orderStore } from "@/lib/payment/store";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ valid: false, error: "Token ausente ou inválido." }, { status: 400 });
    }

    const isValid = orderStore.verifyDownloadToken(token);

    return NextResponse.json({
      valid: isValid,
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Erro interno ao validar token";
    return NextResponse.json({ valid: false, error: errorMsg }, { status: 500 });
  }
}
