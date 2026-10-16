import { NextRequest, NextResponse } from "next/server";
import { ResumeDataSchema } from "@/lib/schema/resume";
import { getAIService } from "@/lib/ai/factory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResumeDataSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados do currículo inválidos ou incompletos para aprimoramento geral." },
        { status: 400 }
      );
    }

    const ai = getAIService();
    const improvedResume = await ai.improveFullResume(parsed.data, parsed.data.creationMode);

    // Valida a saída gerada pela IA antes de retornar ao cliente
    const validatedOutput = ResumeDataSchema.safeParse(improvedResume);
    if (!validatedOutput.success) {
      return NextResponse.json(
        { error: "A resposta gerada pela IA não atendeu aos critérios de validação do sistema." },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { resume: validatedOutput.data, provider: ai.providerName },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error("[API AI Error]", error?.message || "Erro desconhecido");
    return NextResponse.json(
      { error: "Ocorreu uma falha ao comunicar com o serviço de inteligência artificial." },
      { status: 500 }
    );
  }
}
