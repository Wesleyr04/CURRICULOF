import { NextResponse } from "next/server";

export class AIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigurationError";
  }
}

export class AIAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIAuthenticationError";
  }
}

export class AIRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIRateLimitError";
  }
}

export class AIServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIServiceUnavailableError";
  }
}

export class AIContentRefusalError extends Error {
  constructor(message: string = "Não foi possível gerar uma sugestão para os termos informados. Por favor, utilize uma nomenclatura corporativa ou profissional válida.") {
    super(message);
    this.name = "AIContentRefusalError";
  }
}

/**
 * Sanitiza mensagens de erro vindas de provedores de IA, gateways ou infraestrutura.
 * Garante que NENHUM payload HTML (como páginas de erro 404/502/504 de proxies/OpenRouter/Cloudflare),
 * dumps de stack trace ou strings técnicas ilegíveis sejam exibidos ao usuário final.
 */
export function sanitizeAiErrorMessage(rawError: unknown): string {
  if (!rawError) {
    return "Serviço de IA temporariamente indisponível. Você pode editar seu texto manualmente e baixar seu currículo normalmente.";
  }

  // Extrai mensagem interna de erros de SDKs (Anthropic, OpenRouter, etc.)
  const errObj = typeof rawError === "object" && rawError !== null ? (rawError as Record<string, unknown>) : null;
  const nestedError = errObj && typeof errObj.error === "object" && errObj.error !== null ? (errObj.error as Record<string, unknown>) : null;
  const innerMsg = typeof nestedError?.message === "string" ? nestedError.message : undefined;

  const msg =
    innerMsg ||
    (typeof rawError === "string"
      ? rawError
      : rawError instanceof Error
      ? rawError.message
      : typeof errObj?.message === "string"
      ? errObj.message
      : String(rawError));

  const clean = msg.trim();

  // 1. Detecção rigorosa de HTML ou páginas de erro de proxies/Cloudflare/OpenRouter
  const hasHtml =
    clean.includes("<!DOCTYPE") ||
    clean.includes("<html") ||
    clean.includes("<body") ||
    clean.includes("<head") ||
    clean.includes("<meta") ||
    clean.includes("</div>") ||
    clean.includes("</span>") ||
    clean.includes("<title>");

  if (hasHtml) {
    return "Serviço de IA temporariamente indisponível ou em manutenção no provedor. Você pode preencher seu texto manualmente e prosseguir normalmente com o download do currículo.";
  }

  // 1.1 Falta de créditos ou saldo esgotado na conta do provedor
  if (
    clean.includes("credit_balance_too_low") ||
    clean.includes("balance is too low") ||
    clean.includes("credit balance")
  ) {
    return "A conta do provedor de inteligência artificial está com saldo de créditos zerado ou insuficiente. Recarregue seus créditos no console da Anthropic.";
  }

  // 1.2 Modelo inexistente ou não disponível no workspace
  if (
    (clean.includes("model") || clean.includes("not_found")) &&
    (clean.includes("not found") || clean.includes("not_found") || clean.includes("does not exist") || clean.includes("NotFoundError"))
  ) {
    return "O modelo de inteligência artificial solicitado não está ativo ou não foi localizado no workspace da Anthropic.";
  }

  // 1.3 Sobrecarga de capacidade no cluster do provedor (HTTP 529 / Overloaded)
  if (
    clean.includes("529") ||
    clean.includes("Overloaded") ||
    clean.includes("overloaded_error")
  ) {
    return "O provedor de inteligência artificial está temporariamente sobrecarregado (HTTP 529). Tente novamente em alguns segundos ou edite seu texto diretamente no campo.";
  }

  // 2. Erros de rede, conexão ou gateways HTTP
  const hasNetworkError =
    clean.includes("502") ||
    clean.includes("503") ||
    clean.includes("504") ||
    clean.includes("ECONNREFUSED") ||
    clean.includes("ETIMEDOUT") ||
    clean.includes("fetch failed") ||
    clean.includes("Internal Server Error") ||
    clean.includes("Connection refused") ||
    clean.includes("connection refused") ||
    clean.includes("OpenRouter") ||
    clean.includes("Cloudflare");

  if (hasNetworkError) {
    return "Instabilidade temporária na conexão com a inteligência artificial. Tente novamente em instantes ou edite seu texto diretamente no campo.";
  }

  // 3. Recusa de termos inadequados (preserva a mensagem educativa)
  if (
    clean.includes("nomenclatura corporativa") ||
    clean.includes("termos informados") ||
    clean.includes("não permitidos")
  ) {
    return clean;
  }

  // 4. Se for dump técnico extenso (JSON bruto ou erro não sanitizado > 180 chars)
  if (clean.length > 180 || clean.startsWith("{") || clean.startsWith("[")) {
    return "Não foi possível concluir o aprimoramento por inteligência artificial no momento. Você pode editar seu texto manualmente e baixar seu currículo normalmente.";
  }

  return clean;
}

/**
 * Trata erros da camada de IA e devolve resposta HTTP segura em português do Brasil
 * sem vazar chaves de API, prompts internos, páginas HTML ou dados sensíveis.
 */
export function handleAIRouteError(error: unknown): NextResponse {
  const errObj = error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const status = typeof errObj?.status === "number" ? errObj.status : 0;
  const errorName = typeof errObj?.name === "string" ? errObj.name : "";
  const rawMsg = typeof errObj?.message === "string" ? errObj.message : String(error);
  const safeMessage = sanitizeAiErrorMessage(rawMsg);

  // Registro forense incondicional de erro no servidor (Zero-PII de secrets)
  console.error("[AI Route Error]", {
    name: errorName || "UnknownError",
    status,
    message: rawMsg ? rawMsg.slice(0, 300) : "Erro não detalhado",
    isConfigError: error instanceof AIConfigurationError,
    isAuthError: error instanceof AIAuthenticationError || status === 401,
    isRateLimit: error instanceof AIRateLimitError || status === 429,
    isUnavailable: error instanceof AIServiceUnavailableError || status === 503,
  });

  // Recusa de conteúdo ou termos não corporativos (HTTP 422)
  if (error instanceof AIContentRefusalError || errorName === "AIContentRefusalError" || status === 422) {
    return NextResponse.json(
      {
        error:
          (typeof errObj?.message === "string" ? errObj.message : null) ||
          "Não foi possível gerar uma sugestão para os termos informados. Por favor, utilize uma nomenclatura corporativa ou profissional válida.",
        code: "CONTENT_REFUSAL",
      },
      { status: 422 }
    );
  }

  // 1. Erro de configuração no servidor (Chave de API ausente ou modelo inválido)
  if (error instanceof AIConfigurationError) {
    return NextResponse.json(
      {
        error: "O serviço de inteligência artificial não foi configurado no servidor. Você pode preencher manualmente.",
        code: "CONFIG_ERROR",
      },
      { status: 503 }
    );
  }

// Helper seguro para obter fingerprint de runtime sem vazar secrets completos
function getRuntimeAuthDiagnostics(errObj?: Record<string, unknown> | null): Record<string, unknown> {
  if (errObj && typeof errObj.authDiagnostics === "object" && errObj.authDiagnostics !== null) {
    return errObj.authDiagnostics as Record<string, unknown>;
  }

  const envProvider = (process.env.AI_PROVIDER || "").replace(/[\r\n"']/g, "").trim().toLowerCase();
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim());
  const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim());

  const isOpenRouter = envProvider === "openrouter";
  const sourceEnv = isOpenRouter
    ? (hasOpenRouter ? "OPENROUTER_API_KEY" : "nenhuma")
    : (hasAnthropic ? "ANTHROPIC_API_KEY" : "nenhuma");

  const rawKey = (
    isOpenRouter
      ? process.env.OPENROUTER_API_KEY || ""
      : process.env.ANTHROPIC_API_KEY || ""
  ).replace(/[\r\n"']/g, "").trim();

  return {
    providerMode: isOpenRouter ? "OpenRouter (Claude Compatibility)" : "Anthropic Claude (Oficial)",
    sourceEnv,
    targetUrl: isOpenRouter ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.anthropic.com/v1/messages",
    keyPrefix: rawKey ? rawKey.slice(0, 10) : "",
    keySuffix: rawKey ? rawKey.slice(-4) : "",
    keyLength: rawKey.length,
    hasAnthropicKeyEnv: hasAnthropic,
    hasOpenRouterKeyEnv: hasOpenRouter,
    aiProviderEnv: envProvider || "não definido",
    model: isOpenRouter
      ? process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-haiku"
      : process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022",
  };
}

  // Autenticação (Chave inválida ou expirada - HTTP 401)
  if (status === 401 || error instanceof AIAuthenticationError || errorName === "AuthenticationError") {
    const diag = getRuntimeAuthDiagnostics(errObj);

    const headers: Record<string, string> = {
      "x-ai-source-env": String(diag.sourceEnv || "unknown"),
      "x-ai-provider-mode": String(diag.providerMode || "unknown"),
      "x-ai-target-url": String(diag.targetUrl || "unknown"),
      "x-ai-key-prefix": String(diag.keyPrefix || ""),
      "x-ai-key-suffix": String(diag.keySuffix || ""),
      "x-ai-key-length": String(diag.keyLength || 0),
    };

    return NextResponse.json(
      {
        error: "Falha de autenticação com o provedor de IA. Credenciais inválidas ou revogadas.",
        code: "AUTH_ERROR",
        authDiagnostics: diag,
      },
      {
        status: 401,
        headers,
      }
    );
  }

  // Permissão negada (HTTP 403)
  if (status === 403 || errorName === "PermissionDeniedError") {
    return NextResponse.json(
      {
        error: "Acesso não autorizado ao modelo de inteligência artificial.",
        code: "FORBIDDEN",
      },
      { status: 403 }
    );
  }

  // Limite de taxa (Rate Limit - HTTP 429)
  if (status === 429 || error instanceof AIRateLimitError || errorName === "RateLimitError") {
    return NextResponse.json(
      {
        error: "Limite de requisições excedido. Por favor, aguarde alguns segundos e tente novamente.",
        code: "RATE_LIMIT_ERROR",
      },
      { status: 429 }
    );
  }

  // Requisição inválida ao provedor ou modelo não encontrado (HTTP 400 / 404)
  if (status === 400 || status === 404 || errorName === "BadRequestError" || errorName === "NotFoundError") {
    return NextResponse.json(
      {
        error: safeMessage || "Requisição inválida enviada ao provedor de IA. Verifique os parâmetros informados.",
        code: "BAD_REQUEST_ERROR",
      },
      { status: 400 }
    );
  }

  // Indisponibilidade do provedor ou falha de conexão (HTTP 503 / 529)
  if (
    status === 503 ||
    status === 502 ||
    status === 500 ||
    status === 529 ||
    error instanceof AIServiceUnavailableError ||
    errorName === "APIConnectionError" ||
    errorName === "InternalServerError"
  ) {
    const upstreamStatus = typeof errObj?.upstreamStatus === "number" ? errObj.upstreamStatus : status || 503;
    const upstreamModel =
      typeof errObj?.upstreamModel === "string"
        ? errObj.upstreamModel
        : process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-20241022";

    const headers: Record<string, string> = {
      "x-ai-error-status": String(upstreamStatus),
      "x-ai-error-name": String(errorName || "AIServiceUnavailableError"),
      "x-ai-model": String(upstreamModel),
    };

    return NextResponse.json(
      {
        error: "O serviço de inteligência artificial está temporariamente indisponível. Tente novamente em instantes.",
        code: "SERVICE_UNAVAILABLE",
        upstreamStatus,
        upstreamModel,
        upstreamReason: safeMessage,
      },
      {
        status: 503,
        headers,
      }
    );
  }

  // Erro genérico seguro (HTTP 500)
  return NextResponse.json(
    {
      error: safeMessage || "Não foi possível concluir a operação de assistência por IA no momento.",
      code: "INTERNAL_ERROR",
    },
    { status: 500 }
  );
}

