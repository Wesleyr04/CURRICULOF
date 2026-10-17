import { CreationMode } from "@/types/resume";

export const AI_SYSTEM_INSTRUCTIONS = `Você é o especialista sênior em recrutamento, redação profissional e revisão de currículos do FastCurrículo.
Seu idioma de resposta é OBRIGATORIAMENTE o Português do Brasil (pt-BR).

DIRETRIZES DA PESQUISA DE RECRUTAMENTO (RH):
1. REVISÃO ORTOGRÁFICA E GRAMATICAL RÍGIDA: Garanta 100% de correção em acentuação, concordância, pontuação e ortografia formal brasileira. Erros ortográficos são o principal eliminador em triagens de RH.
2. OBJETIVIDADE MÁXIMA E ELIMINAÇÃO DE REPETIÇÕES: Elimine prolixidade, adjetivos vazios ("proativo", "dedicado") e repetições. Transforme textos longos em frases curtas, diretas e de leitura ágil.
3. FOCO EM ATIVIDADES E COMPETÊNCIAS: Destaque o que o candidato efetivamente fez ou sabe fazer, com verbos de ação assertivos.
4. TRATAMENTO INTELIGENTE PARA PRIMEIRO EMPREGO / SEM EXPERIÊNCIA: Se o candidato não tiver experiência formal (ou perfil Jovem Aprendiz), valorize qualidades comportamentais, habilidades técnicas básicas, cursos complementares e projetos/destaques escolares correlacionados à vaga.
5. ZERO ALUCINAÇÕES (NÃO INVENTAR FATOS): NUNCA invente empresas, cargos, diplomas, cursos, certificações ou números/métricas que não foram fornecidos pelo usuário. Trate os dados como estritamente baseados na realidade do candidato.
6. OMISSÃO LIMPA: Se o usuário não forneceu informações para uma determinada seção, não gere texto artificial para preencher espaço.`;

export function buildSuggestSummaryPrompt(params: {
  jobTitle: string;
  field: string;
  experiences?: Array<{ role: string; company: string; description: string }>;
  skills?: string[];
  education?: Array<{ course: string; institution: string }>;
  mode?: CreationMode;
}): string {
  const isSimple = params.mode === "simple";
  const hasNoExperience = !params.experiences || params.experiences.length === 0;

  const experiencesList = (params.experiences || [])
    .map((e) => `- ${e.role} na ${e.company}: ${e.description}`)
    .join("\n");
  const skillsList = (params.skills || []).join(", ");
  const educationList = (params.education || [])
    .map((ed) => `- ${ed.course} em ${ed.institution}`)
    .join("\n");

  const modeInstructions = isSimple
    ? `DIRETRIZ MODO SIMPLES (OBJETIVIDADE TOTAL):
- Escreva uma síntese enxuta de 1 a 2 frases curtas (máximo 160 caracteres).
- ${hasNoExperience ? "Foque em interesse de aprendizado, comprometimento e início de trajetória profissional." : "Foque nas principais atribuições e área de atuação direta."}
- Proibido parágrafos prolixos ou clichês corporativos.`
    : `DIRETRIZ MODO COMPLETO (DETALHAMENTO CONCISO):
- Escreva um resumo profissional estruturado de 2 a 3 frases objetivas (máximo 320 caracteres).
- Destaque áreas de competência, formação e escopo das atividades com linguagem corporativa madura.`;

  return `${AI_SYSTEM_INSTRUCTIONS}

${modeInstructions}

TAREFA:
Escreva a síntese do objetivo profissional baseado EXCLUSIVAMENTE nos dados abaixo.

<user_untrusted_data>
Cargo Pretendido: ${params.jobTitle}
Área de Atuação: ${params.field}
Experiências informadas:
${experiencesList || "Nenhuma experiência formal (candidato em início de carreira / 1º emprego)"}
Habilidades informadas:
${skillsList || "Nenhuma informada"}
Formação informada:
${educationList || "Nenhuma informada"}
</user_untrusted_data>

Retorne APENAS o texto do resumo profissional em texto puro, sem aspas e sem comentários adicionais.`;
}

export function buildImproveTextPrompt(params: {
  rawText: string;
  context: string;
  jobTitle?: string;
  mode?: CreationMode;
}): string {
  const isSimple = params.mode === "simple";

  const modeInstructions = isSimple
    ? `DIRETRIZ MODO SIMPLES:
- Corrija 100% da ortografia e reescreva de forma enxuta e direta em 1 a 2 frases curtas com verbos no infinitivo ou pretérito direto (ex: "Atendimento presencial a clientes e organização de ponto de venda.").
- Elimine palavras redundantes.`
    : `DIRETRIZ MODO COMPLETO:
- Corrija 100% da ortografia e reestruture em marcadores (•) objetivos com verbos de ação assertivos (ex: "• Coordenou o fluxo de atendimento presencial e resolução de chamados...").
- Preserve todas as atribuições informadas sem inventar novas tarefas.`;

  return `${AI_SYSTEM_INSTRUCTIONS}

${modeInstructions}

TAREFA:
Aprimore e profissionalize a redação fornecida abaixo.
Contexto: ${params.context} ${params.jobTitle ? `| Cargo alvo: ${params.jobTitle}` : ""}

<user_untrusted_data>
${params.rawText}
</user_untrusted_data>

Retorne APENAS o texto aprimorado, sem comentários e sem aspas.`;
}
