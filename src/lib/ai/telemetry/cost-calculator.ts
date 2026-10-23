import { TokenUsage, CostCalculation, PricingSnapshot } from "./types";
import { findModelPricing } from "./pricing-table";

/**
 * Taxa padrão de fallback para conversão USD -> BRL caso a variável USD_BRL_EXCHANGE_RATE não esteja configurada.
 */
export const DEFAULT_USD_BRL_EXCHANGE_RATE = 5.8;

/**
 * Obtém a taxa de câmbio USD -> BRL configurada no ambiente com fallback seguro e auditável.
 */
export function getExchangeRate(): number {
  const envRate = process.env.USD_BRL_EXCHANGE_RATE;
  if (!envRate) {
    return DEFAULT_USD_BRL_EXCHANGE_RATE;
  }

  const parsed = parseFloat(envRate.replace(/,/g, "."));
  if (isNaN(parsed) || parsed <= 0) {
    return DEFAULT_USD_BRL_EXCHANGE_RATE;
  }

  return parsed;
}

/**
 * Motor isolado de cálculo financeiro de consumo de tokens da Anthropic.
 * Totalmente determinístico, sem chamadas externas de rede e com auditoria de snapshot.
 *
 * AVISO LEGAL/CONCEITUAL: Os valores calculados são estimativas baseadas no volume real de tokens
 * retornado pela API e tarifas de referência vigentes. Não substituem faturas contábeis oficiais.
 */
export function calculateAnthropicCost(
  model: string,
  usage: TokenUsage,
  customExchangeRate?: number
): CostCalculation {
  const exchangeRate =
    typeof customExchangeRate === "number" && customExchangeRate > 0
      ? customExchangeRate
      : getExchangeRate();

  const cleanModel = (typeof model === "string" ? model : "").replace(/[\r\n"']/g, "").trim();
  const pricing = findModelPricing(cleanModel);

  if (!pricing) {
    console.warn(
      `[AI Cost Calculator] Modelo desconhecido ou não mapeado na tabela de preços: '${cleanModel || model}'. Custo definido como nulo.`
    );

    const unmappedSnapshot: PricingSnapshot = {
      model: cleanModel || model,
      inputPricePerMillion: null,
      outputPricePerMillion: null,
      cacheWritePricePerMillion: null,
      cacheReadPricePerMillion: null,
      pricingStatus: "unmapped_model",
      appliedAt: new Date().toISOString(),
    };

    return {
      usd: null,
      brl: null,
      exchangeRate,
      pricingSnapshot: unmappedSnapshot,
      isEstimated: true,
    };
  }

  // Se tokens de entrada ou saída não foram fornecidos (ex: erro antes da resposta ou payload incompleto),
  // registrar indisponibilidade explícita de custos (null) em vez de forçar zero silencioso.
  if (usage.inputTokens === null || usage.outputTokens === null) {
    const tokensUnavailableSnapshot: PricingSnapshot = {
      model,
      inputPricePerMillion: pricing.inputPricePerMillion,
      outputPricePerMillion: pricing.outputPricePerMillion,
      cacheWritePricePerMillion: pricing.cacheWritePricePerMillion,
      cacheReadPricePerMillion: pricing.cacheReadPricePerMillion,
      pricingStatus: "tokens_unavailable",
      appliedAt: new Date().toISOString(),
    };

    return {
      usd: null,
      brl: null,
      exchangeRate,
      pricingSnapshot: tokensUnavailableSnapshot,
      isEstimated: true,
    };
  }

  const snapshot: PricingSnapshot = {
    model,
    inputPricePerMillion: pricing.inputPricePerMillion,
    outputPricePerMillion: pricing.outputPricePerMillion,
    cacheWritePricePerMillion: pricing.cacheWritePricePerMillion,
    cacheReadPricePerMillion: pricing.cacheReadPricePerMillion,
    pricingStatus: "matched",
    appliedAt: new Date().toISOString(),
  };

  const inputCost = (usage.inputTokens * pricing.inputPricePerMillion) / 1_000_000;
  const outputCost = (usage.outputTokens * pricing.outputPricePerMillion) / 1_000_000;
  const cacheCreationCost =
    ((usage.cacheCreationInputTokens ?? 0) * pricing.cacheWritePricePerMillion) / 1_000_000;
  const cacheReadCost =
    ((usage.cacheReadInputTokens ?? 0) * pricing.cacheReadPricePerMillion) / 1_000_000;

  const totalUsd = inputCost + outputCost + cacheCreationCost + cacheReadCost;
  const totalBrl = totalUsd * exchangeRate;

  // Precisão de 6 casas decimais para USD e 4 para BRL (evita problemas de arredondamento em frações de centavos)
  const roundedUsd = Number(totalUsd.toFixed(6));
  const roundedBrl = Number(totalBrl.toFixed(4));

  return {
    usd: roundedUsd,
    brl: roundedBrl,
    exchangeRate,
    pricingSnapshot: snapshot,
    isEstimated: true,
  };
}
