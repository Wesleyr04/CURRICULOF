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

  const msg =
    typeof rawError === "string"
      ? rawError
      : rawError instanceof Error
      ? rawError.message
      : typeof rawError === "object" && rawError && "message" in rawError && typeof (rawError as { message: unknown }).message === "string"
      ? (rawError as { message: string }).message
      : String(rawError);

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

  // 2. Erros de rede, conexão ou gateways HTTP
  const hasNetworkError =
    clean.includes("404") ||
    clean.includes("502") ||
    clean.includes("503") ||
    clean.includes("504") ||
    clean.includes("ECONNREFUSED") ||
    clean.includes("ETIMEDOUT") ||
    clean.includes("fetch failed") ||
    clean.includes("Internal Server Error") ||
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

  // Recusa de conteúdo ou termos não corporativos (HTTP 422)
  if (error instanceof AIContentRefusalError || errorName === "AIContentRefusalError" || status === 422) {
    return NextResponse.json(
      {
        error:
          (typeof errObj?.message === "string" ? errObj.message : null) ||
          "Não foi possível gerar uma sugestão para os termos informados. Por favor, utilize uma nomenclatura corporativa ou profissional válida.",
      },
      { status: 422 }
    );
  }

  // 1. Erro de configuração no servidor (Chave de API ausente ou modelo inválido)
  if (error instanceof AIConfigurationError) {
    return NextResponse.json(
      {
        error: "O serviço de inteligência artificial não foi configurado no servidor. Você pode preencher manualmente.",
      },
      { status: 503 }
    );
  }

  // Autenticação (Chave inválida ou expirada)
  if (status === 401 || error instanceof AIAuthenticationError || errorName === "AuthenticationError") {
    return NextResponse.json(
      {
        error: "Falha de autenticação com o provedor de IA. Credenciais inválidas ou revogadas.",
      },
      { status: 401 }
    );
  }

  // Permissão negada
  if (status === 403 || errorName === "PermissionDeniedError") {
    return NextResponse.json(
      {
        error: "Acesso não autorizado ao modelo de inteligência artificial.",
      },
      { status: 403 }
    );
  }

  // Limite de taxa (Rate Limit)
  if (status === 429 || error instanceof AIRateLimitError || errorName === "RateLimitError") {
    return NextResponse.json(
      {
        error: "Limite de requisições excedido. Por favor, aguarde alguns segundos e tente novamente.",
      },
      { status: 429 }
    );
  }

  // Indisponibilidade do provedor ou falha de conexão
  if (
    status === 503 ||
    status === 502 ||
    status === 500 ||
    error instanceof AIServiceUnavailableError ||
    errorName === "APIConnectionError" ||
    errorName === "InternalServerError"
  ) {
    return NextResponse.json(
      {
        error: "O serviço de inteligência artificial está temporariamente indisponível. Tente novamente em instantes.",
      },
      { status: 503 }
    );
  }

  // Erro genérico seguro
  console.error("[AI Route Error]", {
    name: errorName || "UnknownError",
    status,
    message: rawMsg ? rawMsg.slice(0, 150) : "Erro não detalhado",
  });

  return NextResponse.json(
    {
      error: safeMessage || "Não foi possível concluir a operação de assistência por IA no momento.",
    },
    { status: 500 }
  );
}

