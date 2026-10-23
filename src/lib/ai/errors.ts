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
 * Trata erros da camada de IA e devolve resposta HTTP segura em português do Brasil
 * sem vazar chaves de API, prompts internos ou dados sensíveis.
 */
export function handleAIRouteError(error: unknown): NextResponse {
  const errObj = error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const status = typeof errObj?.status === "number" ? errObj.status : 0;
  const errorName = typeof errObj?.name === "string" ? errObj.name : "";
  const rawMsg = typeof errObj?.message === "string" ? errObj.message : String(error);

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
        error: "O serviço de inteligência artificial não foi configurado no servidor. Contate o administrador.",
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
        diagnostic: rawMsg,
      },
      { status: 403 }
    );
  }

  // Limite de taxa (Rate Limit)
  if (status === 429 || error instanceof AIRateLimitError || errorName === "RateLimitError") {
    return NextResponse.json(
      {
        error: "Limite de requisições excedido. Por favor, aguarde alguns segundos e tente novamente.",
        diagnostic: rawMsg,
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
        diagnostic: rawMsg,
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
      error: "Não foi possível concluir a operação de assistência por IA no momento.",
      diagnostic: rawMsg,
    },
    { status: 500 }
  );
}
