/**
 * Utilitários de normalização e formatação de títulos de cargos e profissões.
 * Função pura e determinística sem dependências externas.
 */

const LOWERCASE_WORDS = new Set([
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "em",
  "para",
  "com",
  "por",
  "a",
  "o",
  "as",
  "os",
]);

const ACRONYMS = new Set([
  "ti",
  "rh",
  "ceo",
  "cto",
  "cfo",
  "cmo",
  "coo",
  "cio",
  "cpo",
  "qa",
  "dev",
  "ui",
  "ux",
  "pmo",
  "bi",
  "dba",
  "erp",
  "crm",
  "seo",
  "sem",
  "clt",
  "pj",
  "me",
  "epp",
  "ltda",
  "sa",
  "ead",
  "mec",
  "cnh",
  "crea",
  "oab",
  "crm",
  "cro",
  "coren",
  "cra",
  "crc",
  "crq",
  "crf",
  "creci",
  "soc",
  "noc",
  "ccna",
  "ccnp",
  "aws",
  "gcp",
  "azure",
  "cissp",
  "cisa",
  "ceh",
  "comptia",
]);

/**
 * Normaliza a capitalização de um cargo profissional seguindo o padrão da língua portuguesa.
 * - Preserva siglas comuns em maiúsculas (TI, RH, CEO, SOC, NOC, CCNA, QA, UX, UI, etc.)
 * - Mantém preposições em minúsculas (de, da, do, e, em, para)
 * - Capitaliza a primeira letra das demais palavras
 */
export function normalizeJobTitle(raw: string): string {
  if (!raw || !raw.trim()) return "";

  const trimmed = raw.trim();
  const words = trimmed.split(/\s+/);

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();

      // Siglas conhecidas ficam em caixa alta
      if (ACRONYMS.has(lower)) {
        return lower.toUpperCase();
      }

      // Preposições ficam em minúsculas (a menos que seja a primeira palavra)
      if (index > 0 && LOWERCASE_WORDS.has(lower)) {
        return lower;
      }

      // Palavras normais: Primeira letra maiúscula, restante minúscula
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}
