/**
 * Módulo de Moderação e Higienização de Conteúdo (Pre-flight & Output Guardrails)
 * Protege contra abusos, conteúdos ilícitos, lixo (gibberish) e recusas de IA.
 * Executa localmente sem custo de tokens da API.
 */

// Blocklist de termos ilícitos, criminosos, rufianismo, pornografia explícita e ofensivos (PT-BR)
const FORBIDDEN_TERMS = [
  "cafetina",
  "cafetão",
  "cafetao",
  "rufianismo",
  "lenocínio",
  "lenocinio",
  "prostituicao",
  "prostituição",
  "prostituta",
  "prostituto",
  "garota de programa",
  "garoto de programa",
  "acompanhante de luxo",
  "agenciador de sexo",
  "casa de prostituicao",
  "casa de prostituição",
  "bordel",
  "putaria",
  "pornografia",
  "porno",
  "pornô",
  "sexo explicito",
  "sexo explícito",
  "traficante",
  "tráfico",
  "trafico",
  "assaltante",
  "golpista",
  "estelionatario",
  "estelionatário",
  "estelionato",
  "pedofilia",
  "pedofilo",
  "pedófilo",
  "estupro",
  "estuprador",
  "matador de aluguel",
  "pistoleiro",
  "hacker criminoso",
  "venda de drogas",
  "drogas ilicitas",
  "drogas ilícitas",
  "cocaina",
  "cocaína",
  "crack",
  "heroina",
  "heroína",
  "lança perfume",
  "lavagem de dinheiro",
  "contrabando",
  "armas ilegais",
  "pistola raspada",
  "miliciano",
  "milicia",
  "milícia",
  "boquete",
  "puta",
  "arrombado",
  "foda-se",
  "caralho",
  "vagabunda",
  "sexo",
  "sexual",
  "sexuais",
  "servicos sexuais",
  "serviços sexuais",
  "entretenimento adulto",
];

// Padrões de Recusa conhecidos de Modelos de Linguagem
const AI_REFUSAL_PATTERNS = [
  "[RECUSA_CONTEUDO_INVALIDO]",
  "não posso elaborar",
  "nao posso elaborar",
  "não posso criar",
  "nao posso criar",
  "não posso ajudar",
  "nao posso ajudar",
  "não posso atender",
  "nao posso atender",
  "desculpe, mas não",
  "desculpe, mas nao",
  "como um modelo de ia",
  "como uma ia",
  "como um modelo de linguagem",
  "atividade tipificada como crime",
  "tipificada como crime",
  "código penal",
  "codigo penal",
  "i cannot",
  "i apologize",
  "as an ai",
  "as a language model",
  "conteúdo inadequado",
  "conteudo inadequado",
  "não posso gerar",
  "nao posso gerar",
  "não posso cumprir",
  "nao posso cumprir",
];

// Padrões comuns de repetição de teclado (lixo / gibberish)
const KEYBOARD_MASH_PATTERNS = [
  "asdf",
  "asdfg",
  "qwerty",
  "zxcv",
  "hjkl",
  "12345",
  "abcde",
  "qwert",
];

// Siglas corporativas permitidas mesmo sem vogais ou muito curtas
const ALLOWED_ACRONYMS = new Set([
  "rh",
  "ti",
  "ti/ti",
  "qa",
  "pr",
  "dev",
  "ops",
  "ceo",
  "cto",
  "cfo",
  "cmo",
  "coo",
  "crm",
  "erp",
  "ats",
  "sql",
  "aws",
  "gcp",
  "soc",
  "n1",
  "n2",
  "n3",
  "bpf",
  "dre",
  "kpi",
  "okr",
  "pdca",
  "5s",
  "clt",
  "pj",
]);

/**
 * Normaliza o texto removendo acentos e convertendo caracteres comumente usados
 * para burlar filtros (leetspeak).
 */
export function normalizeSecurityText(text: string): string {
  if (!text) return "";
  let normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove diacríticos

  // Substituição de leetspeak
  normalized = normalized
    .replace(/[@4]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[$5]/g, "s");

  return normalized;
}

/**
 * Camada 1: Validação prévia de formato, ruído (gibberish) e termos proibidos.
 * Roda antes de qualquer requisição à IA, com custo ZERO de tokens.
 */
export function validateContentSafety(input: string): {
  allowed: boolean;
  reason?: string;
} {
  if (!input || typeof input !== "string") {
    return {
      allowed: false,
      reason: "O campo não pode estar vazio.",
    };
  }

  const trimmed = input.trim();
  if (trimmed.length < 2) {
    return {
      allowed: false,
      reason: "O texto informado é excessivamente curto.",
    };
  }

  // 1. Verificação prévia na string bruta: se só contém dígitos, pontuação e símbolos (sem nenhuma letra)
  if (!/[a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/.test(trimmed)) {
    return {
      allowed: false,
      reason: "O campo deve conter palavras legíveis e não apenas números ou símbolos.",
    };
  }

  const normalized = normalizeSecurityText(trimmed);

  // Caracteres idênticos repetidos consecutivamente 4 ou mais vezes (ex: 'aaaaa', '77777')
  if (/(.)\1{3,}/.test(normalized)) {
    return {
      allowed: false,
      reason: "O texto informado contém repetições excessivas de caracteres inválidas.",
    };
  }

  // Sequências de teclado comuns
  for (const mash of KEYBOARD_MASH_PATTERNS) {
    if (normalized.includes(mash)) {
      return {
        allowed: false,
        reason: "O texto informado parece conter digitação aleatória ou incompleta.",
      };
    }
  }

  // Verificação de palavras sem nenhuma vogal (exceto siglas autorizadas)
  const words = normalized.split(/[\s/\\,._-]+/).filter((w) => w.length > 0);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-z0-9]/gi, "");
    if (cleanWord.length >= 3 && !ALLOWED_ACRONYMS.has(cleanWord)) {
      if (!/[aeiouy]/.test(cleanWord)) {
        return {
          allowed: false,
          reason: `O termo "${word}" não aparenta ser uma palavra ou cargo válido na língua portuguesa.`,
        };
      }
    }
  }

  // 2. Blocklist de Termos Ilícitos, Explícitos ou Ofensivos
  for (const term of FORBIDDEN_TERMS) {
    const normalizedTerm = normalizeSecurityText(term);
    // Busca por termo exato com separadores de palavras não-alfanuméricos (ex: sexo/entretenimento)
    const regex = new RegExp(`(^|[^a-z0-9])${normalizedTerm}([^a-z0-9]|$)`, "i");
    if (regex.test(normalized) || (normalizedTerm.includes(" ") && normalized.includes(normalizedTerm))) {
      return {
        allowed: false,
        reason: "Os termos informados não são permitidos para geração profissional. Verifique o cargo e a área de atuação.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Camada 2: Detecção de Recusa da IA (Output Guardrail).
 * Identifica se o texto gerado por um modelo de linguagem é na verdade uma recusa ou alerta.
 */
export function isAiRefusal(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const normalized = normalizeSecurityText(text.trim());

  if (normalized.includes("[recusa_conteudo_invalido]")) {
    return true;
  }

  for (const pattern of AI_REFUSAL_PATTERNS) {
    const normalizedPattern = normalizeSecurityText(pattern);
    if (normalized.includes(normalizedPattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Validação de integridade do currículo antes de avançar de etapa ou gerar PDF/Preview.
 * Garante segurança de conteúdo e preenchimento mínimo dos dados pessoais obrigatórios.
 */
export function validateResumeForExport(
  resume: {
    target?: { jobTitle?: string; field?: string; summary?: string };
    personal?: { fullName?: string; email?: string; phone?: string };
  },
  options?: { requirePersonalInfo?: boolean }
): {
  valid: boolean;
  message?: string;
  missingField?: "fullName" | "contact" | "jobTitle" | "field" | "summary";
  targetStep?: number;
} {
  // Validação obrigatória de dados pessoais (Nome Completo e Contato)
  if (options?.requirePersonalInfo) {
    const fullName = (resume.personal?.fullName || "").trim();
    // Exige ao menos 3 caracteres alfabéticos para evitar strings vazias ou caracteres isolados
    const lettersCount = (fullName.match(/[a-zA-ZáéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ]/g) || []).length;
    if (!fullName || lettersCount < 3) {
      return {
        valid: false,
        message: "Por favor, preencha seu Nome Completo na Etapa 1 antes de baixar seu currículo.",
        missingField: "fullName",
        targetStep: 1,
      };
    }

    const email = (resume.personal?.email || "").trim();
    const phone = (resume.personal?.phone || "").trim();
    if (!email && !phone) {
      return {
        valid: false,
        message: "Informe ao menos um meio de contato válido (E-mail ou Telefone/WhatsApp) na Etapa 1.",
        missingField: "contact",
        targetStep: 1,
      };
    }
  }

  const jobTitle = resume.target?.jobTitle || "";
  const field = resume.target?.field || "";
  const summary = resume.target?.summary || "";

  if (jobTitle) {
    const checkJob = validateContentSafety(jobTitle);
    if (!checkJob.allowed) {
      return {
        valid: false,
        message: `Cargo pretendido inválido: ${checkJob.reason}`,
        missingField: "jobTitle",
        targetStep: 2,
      };
    }
  }

  if (field) {
    const checkField = validateContentSafety(field);
    if (!checkField.allowed) {
      return {
        valid: false,
        message: `Área de atuação inválida: ${checkField.reason}`,
        missingField: "field",
        targetStep: 2,
      };
    }
  }

  if (summary) {
    if (isAiRefusal(summary)) {
      return {
        valid: false,
        message:
          "O Resumo Profissional contém uma mensagem de recusa da IA. Corrija o campo com seu resumo real para continuar.",
        missingField: "summary",
        targetStep: 2,
      };
    }

    const checkSummary = validateContentSafety(summary);
    if (!checkSummary.allowed) {
      return {
        valid: false,
        message: `Resumo profissional inválido: ${checkSummary.reason}`,
        missingField: "summary",
        targetStep: 2,
      };
    }
  }

  return { valid: true };
}

