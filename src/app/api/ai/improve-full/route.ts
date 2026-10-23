import { NextRequest, NextResponse } from "next/server";
import { ResumeDataSchema } from "@/lib/schema/resume";
import { getAIService } from "@/lib/ai/factory";
import { handleAIRouteError } from "@/lib/ai/errors";
import { validateContentSafety } from "@/lib/security/content-guard";
import { checkAiRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Camada 3: Rate Limit por IP
    const ip = getClientIp(req);
    const rateLimit = checkAiRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.message },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.resetSeconds) },
        }
      );
    }

    const body = await req.json();
    const parsed = ResumeDataSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados do currículo inválidos ou incompletos para aprimoramento geral." },
        { status: 400 }
      );
    }

    // 2. Camada 1: Pre-flight Moderation de Conteúdo
    if (parsed.data.target?.jobTitle) {
      const checkJob = validateContentSafety(parsed.data.target.jobTitle);
      if (!checkJob.allowed) {
        return NextResponse.json(
          { error: checkJob.reason || "Cargo informado não permitido para geração profissional." },
          { status: 422 }
        );
      }
    }

    if (parsed.data.target?.field) {
      const checkField = validateContentSafety(parsed.data.target.field);
      if (!checkField.allowed) {
        return NextResponse.json(
          { error: checkField.reason || "Área informada não permitida para geração profissional." },
          { status: 422 }
        );
      }
    }

    if (parsed.data.target?.summary) {
      const checkSummary = validateContentSafety(parsed.data.target.summary);
      if (!checkSummary.allowed) {
        return NextResponse.json(
          { error: checkSummary.reason || "Resumo informado contém termos não permitidos." },
          { status: 422 }
        );
      }
    }

    if (Array.isArray(parsed.data.experiences)) {
      for (const exp of parsed.data.experiences) {
        if (exp.role) {
          const checkRole = validateContentSafety(exp.role);
          if (!checkRole.allowed) {
            return NextResponse.json(
              { error: checkRole.reason || `Cargo '${exp.role}' não permitido.` },
              { status: 422 }
            );
          }
        }
        if (exp.description) {
          const checkDesc = validateContentSafety(exp.description);
          if (!checkDesc.allowed) {
            return NextResponse.json(
              { error: checkDesc.reason || "Descrição de experiência não permitida." },
              { status: 422 }
            );
          }
        }
        if (exp.achievements) {
          const checkAch = validateContentSafety(exp.achievements);
          if (!checkAch.allowed) {
            return NextResponse.json(
              { error: checkAch.reason || "Conquistas informadas contêm termos não permitidos." },
              { status: 422 }
            );
          }
        }
      }
    }

    const correlationId =
      req.headers.get("x-correlation-id") ||
      (typeof body === "object" && body && "correlationId" in body && typeof body.correlationId === "string"
        ? body.correlationId
        : undefined);

    const ai = getAIService();
    const improvedResume = await ai.improveFullResume(
      parsed.data,
      parsed.data.creationMode,
      correlationId
    );

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
          ...(correlationId ? { "X-Correlation-Id": correlationId } : {}),
        },
      }
    );
  } catch (error: unknown) {
    return handleAIRouteError(error);
  }
}
