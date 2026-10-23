import { ModelPricingTier } from "./types";

/**
 * Tabela Oficial de Preços da Anthropic (valores em USD por 1 milhão de tokens - MTok).
 * Referência: https://www.anthropic.com/pricing
 *
 * NOTA: Esta tabela é puramente local e desacoplada de rede em runtime.
 */
export const ANTHROPIC_PRICING_TABLE: ModelPricingTier[] = [
  // 1. Família Claude 3.7 Sonnet
  {
    modelPattern: "claude-3-7-sonnet",
    friendlyName: "Claude 3.7 Sonnet",
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    cacheWritePricePerMillion: 3.75,
    cacheReadPricePerMillion: 0.3,
  },
  // 2. Família Claude 3.5 Sonnet
  {
    modelPattern: "claude-3-5-sonnet",
    friendlyName: "Claude 3.5 Sonnet",
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    cacheWritePricePerMillion: 3.75,
    cacheReadPricePerMillion: 0.3,
  },
  // 3. Família Claude 3 Sonnet (legado oficial)
  {
    modelPattern: "claude-3-sonnet",
    friendlyName: "Claude 3 Sonnet",
    inputPricePerMillion: 3.0,
    outputPricePerMillion: 15.0,
    cacheWritePricePerMillion: 3.75,
    cacheReadPricePerMillion: 0.3,
  },
  // 4. Família Claude 3.5 Haiku
  {
    modelPattern: "claude-3-5-haiku",
    friendlyName: "Claude 3.5 Haiku",
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4.0,
    cacheWritePricePerMillion: 1.0,
    cacheReadPricePerMillion: 0.08,
  },
  // 5. Família Claude 3 Haiku (legado)
  {
    modelPattern: "claude-3-haiku",
    friendlyName: "Claude 3 Haiku",
    inputPricePerMillion: 0.25,
    outputPricePerMillion: 1.25,
    cacheWritePricePerMillion: 0.3,
    cacheReadPricePerMillion: 0.03,
  },
  // 6. Família Claude 3 Opus
  {
    modelPattern: "claude-3-opus",
    friendlyName: "Claude 3 Opus",
    inputPricePerMillion: 15.0,
    outputPricePerMillion: 75.0,
    cacheWritePricePerMillion: 18.75,
    cacheReadPricePerMillion: 1.5,
  },
  // 7. Família Claude 2.1 & 2.0
  {
    modelPattern: "claude-2",
    friendlyName: "Claude 2",
    inputPricePerMillion: 8.0,
    outputPricePerMillion: 24.0,
    cacheWritePricePerMillion: 10.0,
    cacheReadPricePerMillion: 0.8,
  },
  // 8. Família Claude Instant
  {
    modelPattern: "claude-instant",
    friendlyName: "Claude Instant",
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 2.4,
    cacheWritePricePerMillion: 1.0,
    cacheReadPricePerMillion: 0.08,
  },
];

/**
 * Localiza a faixa de preço correspondente ao identificador de modelo retornado pela Anthropic.
 * Utiliza correspondência case-insensitive, limpeza estrita de aspas e quebras, busca por prefixo
 * e correspondência resiliente por família para garantir que nenhuma variação oficial válida
 * seja marcada erroneamente como unmapped_model.
 */
export function findModelPricing(model: string): ModelPricingTier | null {
  if (!model || typeof model !== "string") {
    return null;
  }

  const cleanModel = model.toLowerCase().replace(/[\r\n"']/g, "").trim();
  if (!cleanModel) return null;

  // 1. Busca direta por substring do padrão do modelo
  for (const tier of ANTHROPIC_PRICING_TABLE) {
    if (cleanModel.includes(tier.modelPattern.toLowerCase())) {
      return tier;
    }
  }

  // 2. Correspondência flexível e resiliente por família
  if (cleanModel.includes("haiku")) {
    if (cleanModel.includes("3.5") || cleanModel.includes("3-5")) {
      return ANTHROPIC_PRICING_TABLE.find((t) => t.modelPattern === "claude-3-5-haiku") || null;
    }
    return ANTHROPIC_PRICING_TABLE.find((t) => t.modelPattern === "claude-3-haiku") || null;
  }

  if (cleanModel.includes("sonnet")) {
    if (cleanModel.includes("3.7") || cleanModel.includes("3-7")) {
      return ANTHROPIC_PRICING_TABLE.find((t) => t.modelPattern === "claude-3-7-sonnet") || null;
    }
    if (cleanModel.includes("3.5") || cleanModel.includes("3-5")) {
      return ANTHROPIC_PRICING_TABLE.find((t) => t.modelPattern === "claude-3-5-sonnet") || null;
    }
    return ANTHROPIC_PRICING_TABLE.find((t) => t.modelPattern === "claude-3-sonnet") || null;
  }

  if (cleanModel.includes("opus")) {
    return ANTHROPIC_PRICING_TABLE.find((t) => t.modelPattern === "claude-3-opus") || null;
  }

  return null;
}
