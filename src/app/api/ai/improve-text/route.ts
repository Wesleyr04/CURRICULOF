import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIService } from "@/lib/ai/factory";

const RequestSchema = z.object({
  rawText: z.string().min(1).max(2000),
  context: z.enum(["experience", "summary", "skills"]),
  jobTitle: z.string().max(100).optional(),
  mode: z.enum(["simple", "complete"]).optional().default("simple"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos fornecidos para a melhoria de texto." },
        { status: 400 }
      );
    }

    const ai = getAIService();
    const improvedText = await ai.improveText(parsed.data);

    return NextResponse.json(
      { improvedText, provider: ai.providerName },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[API AI Error]", error?.message || "Erro desconhecido");
    return NextResponse.json(
      { error: "Não foi possível aprimorar o texto com a IA no momento." },
      { status: 500 }
    );
  }
}
