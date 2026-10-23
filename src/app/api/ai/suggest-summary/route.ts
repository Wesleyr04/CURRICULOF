import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIService } from "@/lib/ai/factory";
import { handleAIRouteError } from "@/lib/ai/errors";
import { validateContentSafety } from "@/lib/security/content-guard";
import { checkAiRateLimit, getClientIp } from "@/lib/security/rate-limit";

const RequestSchema = z.object({
  jobTitle: z.string().max(100).optional().default("Profissional"),
  field: z.string().max(100).optional().default(""),
  careerStage: z.enum(["experienced", "entry_level", "career_transition"]).optional().default("experienced"),
  careerContext: z.string().max(500).optional(),
  currentSummary: z.string().max(1200).optional(),
  experiences: z
    .array(
      z.object({
        role: z.string().max(60),
        company: z.string().max(60),
        description: z.string().max(600),
        achievements: z.string().max(400).optional(),
      })
    )
    .max(6)
    .optional(),
  skills: z.array(z.string().max(40)).max(20).optional(),
  softSkills: z.array(z.string().max(40)).max(20).optional(),
  education: z
    .array(
      z.object({
        course: z.string().max(80),
        institution: z.string().max(80),
      })
    )
    .max(4)
    .optional(),
  courses: z
    .array(
      z.object({
        name: z.string().max(80),
        institution: z.string().max(80),
      })
    )
    .max(6)
    .optional(),
  certifications: z.array(z.string().max(80)).max(10).optional(),
  mode: z.enum(["simple", "complete"]).optional().default("simple"),
  correlationId: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Camada 3: Rate Limit por IP (3/min, 8/h)
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
    const effectiveJobTitle =
      (typeof body?.jobTitle === "string" && body.jobTitle.trim()) ||
      (typeof body?.field === "string" && body.field.trim()) ||
      "Profissional";

    const parsed = RequestSchema.safeParse({
      ...body,
      jobTitle: effectiveJobTitle,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos fornecidos para a sugestão de resumo.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // 2. Camada 1: Pre-flight Moderation (Custo Zero de Tokens)
    const checkJob = validateContentSafety(parsed.data.jobTitle);
    if (!checkJob.allowed) {
      return NextResponse.json(
        {
          error:
            checkJob.reason ||
            "Os termos informados não são permitidos para geração profissional. Verifique o cargo pretendido.",
        },
        { status: 422 }
      );
    }

    if (parsed.data.field && parsed.data.field.trim().length > 0) {
      const checkField = validateContentSafety(parsed.data.field);
      if (!checkField.allowed) {
        return NextResponse.json(
          {
            error:
              checkField.reason ||
              "Os termos informados não são permitidos para geração profissional. Verifique a área informada.",
          },
          { status: 422 }
        );
      }
    }

    if (parsed.data.careerContext && parsed.data.careerContext.trim().length > 0) {
      const checkContext = validateContentSafety(parsed.data.careerContext);
      if (!checkContext.allowed) {
        return NextResponse.json(
          {
            error:
              checkContext.reason ||
              "Os termos informados no contexto não são permitidos para geração profissional.",
          },
          { status: 422 }
        );
      }
    }

    if (parsed.data.currentSummary && parsed.data.currentSummary.trim().length > 0) {
      const checkSummary = validateContentSafety(parsed.data.currentSummary.trim());
      if (!checkSummary.allowed) {
        return NextResponse.json(
          {
            error:
              checkSummary.reason ||
              "O resumo preliminar informado contém termos não permitidos. Revise o texto antes de prosseguir.",
          },
          { status: 422 }
        );
      }
    }

    const headerCorrelationId = req.headers.get("x-correlation-id") || undefined;
    const effectiveCorrelationId = parsed.data.correlationId || headerCorrelationId;

    const ai = getAIService();
    const summary = await ai.suggestSummary({
      ...parsed.data,
      correlationId: effectiveCorrelationId,
    });

    return NextResponse.json(
      { summary, provider: ai.providerName },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          ...(effectiveCorrelationId ? { "X-Correlation-Id": effectiveCorrelationId } : {}),
        },
      }
    );
  } catch (error: unknown) {
    return handleAIRouteError(error);
  }
}
