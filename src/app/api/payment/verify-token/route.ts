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
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error?.message }, { status: 500 });
  }
}
