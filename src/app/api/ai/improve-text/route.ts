import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAIService } from "@/lib/ai/factory";
import { handleAIRouteError } from "@/lib/ai/errors";
import { validateContentSafety } from "@/lib/security/content-guard";
import { checkAiRateLimit, getClientIp } from "@/lib/security/rate-limit";

const RequestSchema = z.object({
  rawText: z.string().min(1).max(1200),
  context: z.enum(["experience", "summary", "skills"]),
  jobTitle: z.string().max(100).optional(),
  careerStage: z.enum(["experienced", "entry_level", "career_transition"]).optional().default("experienced"),
  careerContext: z.string().max(500).optional(),
  company: z.string().max(60).optional(),
  achievements: z.string().max(400).optional(),
  mode: z.enum(["simple", "complete"]).optional().default("simple"),
  correlationId: z.string().max(100).optional(),
});

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
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos fornecidos para a melhoria de texto." },
        { status: 400 }
      );
    }

    // 2. Camada 1: Pre-flight Moderation
    const checkText = validateContentSafety(parsed.data.rawText);
    if (!checkText.allowed) {
      return NextResponse.json(
        { error: checkText.reason || "O texto informado contém termos ou formato não permitido." },
        { status: 422 }
      );
    }

    if (parsed.data.jobTitle) {
      const checkJob = validateContentSafety(parsed.data.jobTitle);
      if (!checkJob.allowed) {
        return NextResponse.json(
          { error: checkJob.reason || "Cargo informado não permitido." },
          { status: 422 }
        );
      }
    }

    const headerCorrelationId = req.headers.get("x-correlation-id") || undefined;
    const effectiveCorrelationId = parsed.data.correlationId || headerCorrelationId;

    const ai = getAIService();
    const improvedText = await ai.improveText({
      ...parsed.data,
      correlationId: effectiveCorrelationId,
    });

    return NextResponse.json(
      { improvedText, provider: ai.providerName },
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
