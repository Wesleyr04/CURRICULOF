import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIService } from "@/lib/ai/factory";

const RequestSchema = z.object({
  jobTitle: z.string().min(1).max(100),
  field: z.string().min(1).max(100),
  experiences: z
    .array(
      z.object({
        role: z.string().max(100),
        company: z.string().max(100),
        description: z.string().max(1000),
      })
    )
    .optional(),
  skills: z.array(z.string().max(50)).optional(),
  education: z
    .array(
      z.object({
        course: z.string().max(100),
        institution: z.string().max(100),
      })
    )
    .optional(),
  mode: z.enum(["simple", "complete"]).optional().default("simple"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos fornecidos para a sugestão de resumo.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const ai = getAIService();
    const summary = await ai.suggestSummary(parsed.data);

    return NextResponse.json(
      { summary, provider: ai.providerName },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[API AI Error]", error?.message || "Erro desconhecido");
    return NextResponse.json(
      { error: "Não foi possível gerar a sugestão com a IA no momento. Tente novamente." },
      { status: 500 }
    );
  }
}
