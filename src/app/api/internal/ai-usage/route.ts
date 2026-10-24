import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { aiTelemetryService } from "@/lib/ai/telemetry/service";
import { AIOperationType, UsageFilter } from "@/lib/ai/telemetry/types";

function safeCompareAdminToken(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  try {
    const hashProvided = crypto.createHash("sha256").update(provided.trim()).digest();
    const hashExpected = crypto.createHash("sha256").update(expected.trim()).digest();
    return crypto.timingSafeEqual(hashProvided, hashExpected);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Verificação de Segurança e Autenticação Administrativa Timing-Safe
    const adminToken = process.env.ADMIN_METRICS_TOKEN;
    if (!adminToken || adminToken.trim() === "") {
      return NextResponse.json(
        {
          error:
            "Acesso negado. A variável ADMIN_METRICS_TOKEN não está configurada no ambiente do servidor.",
        },
        { status: 403 }
      );
    }

    const authHeader = req.headers.get("authorization") || "";
    const customHeader = req.headers.get("x-admin-token") || "";

    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const providedToken = bearerToken || customHeader.trim();

    if (!providedToken || !safeCompareAdminToken(providedToken, adminToken)) {
      return NextResponse.json(
        { error: "Não autorizado. Token administrativo ausente ou inválido." },
        { status: 401 }
      );
    }

    // 2. Extração e Validação dos Filtros da URL
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const filter: UsageFilter = {};

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const model = searchParams.get("model");
    const operationType = searchParams.get("operationType") as AIOperationType | null;
    const correlationId = searchParams.get("correlationId");
    const sourceParam = searchParams.get("source");
    const includeRecords = searchParams.get("includeRecords") === "true";

    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;
    if (model) filter.model = model;
    if (operationType) filter.operationType = operationType;
    if (correlationId) filter.correlationId = correlationId;
    if (
      sourceParam &&
      ["production", "synthetic_test", "fallback", "error", "all"].includes(sourceParam)
    ) {
      filter.source = sourceParam as UsageFilter["source"];
    }

    // 3. Consulta Agregada de Métricas
    const metrics = await aiTelemetryService.getMetrics(filter);
    const storageInfo = aiTelemetryService.getStorageInfo();

    let records = undefined;
    if (includeRecords) {
      records = await aiTelemetryService.listRecords(filter);
    }

    return NextResponse.json(
      {
        success: true,
        storage: storageInfo,
        period: {
          startDate: filter.startDate || "all",
          endDate: filter.endDate || "all",
          earliestRecord: metrics.period.earliestTimestamp,
          latestRecord: metrics.period.latestTimestamp,
        },
        integrity: {
          hasIncompleteCalls: metrics.incompleteCalls > 0,
          incompleteCallsCount: metrics.incompleteCalls,
          legacyIncompleteCount: metrics.legacyIncompleteCount,
          productionCallsCount: metrics.productionCallsCount,
          syntheticCallsCount: metrics.syntheticCallsCount,
          hasPartialCosts: metrics.hasPartialCosts,
          warningMessage: metrics.hasPartialCosts
            ? "Aviso: Existem chamadas com custos parciais ou indisponíveis (dados incompletos ou modelos não mapeados). O custo exibido reflete estritamente as operações com precificação confirmada."
            : null,
        },
        filterApplied: filter,
        metrics,
        records,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest?: string }).digest === "NEXT_PRERENDER_INTERRUPTED"
    ) {
      throw error;
    }
    console.error("[Internal AI Usage Metrics Error]", error);
    return NextResponse.json(
      { error: "Erro interno ao processar relatório de métricas." },
      { status: 500 }
    );
  }
}
