import { AISuggestSummaryParams, AIImproveTextParams } from "./types";

export const AI_SYSTEM_INSTRUCTIONS = `Você é um Recrutador Especialista em Sistemas de Rastreamento de Candidatos (ATS) e Redação Corporativa do FastCurrículo.
Seu idioma de resposta é OBRIGATORIAMENTE o Português do Brasil (pt-BR).

DIRETRIZES DE RECRUTAMENTO E OTIMIZAÇÃO PARA ATS:
1. NORMALIZAÇÃO DE CARGOS E NOMENCLATURAS: Converta termos informais, abreviações e siglas para o padrão corporativo ideal (ex: "analista de soc jr" -> "Analista de SOC Júnior", "dev front end pl" -> "Desenvolvedor Front-end Pleno", "assist adm" -> "Assistente Administrativo"). Preserve siglas técnicas em maiúsculas (ex: SOC, TI, ERP, CRM, SQL, AWS, ATS, DRE, RH, N1/N2).
2. REVISÃO ORTOGRÁFICA E TÉCNICA RÍGIDA: Garanta 100% de correção em acentuação, termos técnicos em inglês/português (ex: "manutenção de hardware", "atendimento", "softwares") e concordância.
3. ALTO IMPACTO COM VERBOS DE AÇÃO: Utilize verbos fortes no infinitivo ou pretérito (ex: "Gerenciar", "Executar", "Administrar", "Monitorar", "Desenvolver", "Prestar suporte").
4. RESUMO PROFISSIONAL COESO (EM PARÁGRAFO CORRIDO): Deve articular o Cargo Pretendido e a Área com competências técnicas essenciais, boas práticas da função e foco em eficiência e resultados. NUNCA use bullet points em resumos profissionais.
5. ATIVIDADES EM BULLET POINTS ESTRUTURADOS: Para experiências profissionais, converta anotações e frases informais em tópicos estruturados (• ) de alto padrão profissional, expandindo descrições sucintas para o contexto técnico real da atividade sem inventar empresas ou números falsos.
6. ZERO ALUCINAÇÕES (NÃO INVENTAR FATOS): Jamais invente empresas, certificações ou formações que não foram fornecidas. Trate os dados como estritamente baseados na realidade do candidato.
7. RECUSA DE CONTEÚDO ILÍCITO OU NÃO CORPORATIVO: Se o cargo, atividade ou conteúdo solicitado for manifestamente criminoso, ilícito, de exploração sexual/rufianismo ou explicitamente ofensivo, responda APENAS e EXATAMENTE com a flag [RECUSA_CONTEUDO_INVALIDO] sem explicações longas e sem desculpas.`;

export function buildSuggestSummaryPrompt(params: AISuggestSummaryParams): string {
  const isSimple = params.mode === "simple";
  const hasCurrentSummary = Boolean(params.currentSummary && params.currentSummary.trim().length > 0);
  const hasExperiences = (params.experiences || []).length > 0;
  const stage = params.careerStage || "experienced";

  const experiencesList = (params.experiences || [])
    .filter((e) => Boolean((e.role || "").trim() || (e.company || "").trim() || (e.description || "").trim()))
    .map((e) => {
      const role = (e.role || "").trim() || "Atuação Profissional";
      const company = (e.company || "").trim() ? ` na ${(e.company || "").trim()}` : "";
      const desc = (e.description || "").trim() ? `: ${(e.description || "").trim()}` : "";
      const parts = [`- ${role}${company}${desc}`];
      if (e.achievements && e.achievements.trim()) {
        parts.push(`  (Conquistas informadas: ${e.achievements.trim()})`);
      }
      return parts.join("\n");
    })
    .join("\n");

  const skillsList = (params.skills || []).filter(Boolean).map((s) => String(s).trim()).filter(Boolean).join(", ");
  const softSkillsList = (params.softSkills || []).filter(Boolean).map((s) => String(s).trim()).filter(Boolean).join(", ");
  const educationList = (params.education || [])
    .filter((ed) => Boolean((ed.course || "").trim() || (ed.institution || "").trim()))
    .map((ed) => {
      const course = (ed.course || "").trim() || "Formação";
      const inst = (ed.institution || "").trim() ? ` em ${(ed.institution || "").trim()}` : "";
      return `- ${course}${inst}`;
    })
    .join("\n");
  const coursesList = (params.courses || [])
    .filter((c) => Boolean((c.name || "").trim()))
    .map((c) => {
      const name = (c.name || "").trim();
      const inst = (c.institution || "").trim() ? ` (${(c.institution || "").trim()})` : "";
      return `- ${name}${inst}`;
    })
    .join("\n");
  const certsList = (params.certifications || []).filter(Boolean).map((c) => String(c).trim()).filter(Boolean).join(", ");

  const targetLengthGuideline = isSimple
    ? "MODO SIMPLES: Elabore um Resumo / Objetivo Profissional direto, conciso e objetivo em parágrafo único de 2 a 3 linhas (entre 180 e 280 caracteres), com leitura rápida e foco nas competências centrais da candidatura."
    : "MODO COMPLETO: Elabore um Resumo Profissional sólido, estruturado e atrativo para triagem ATS em parágrafo único de 3 a 4 linhas (entre 280 e 450 caracteres), conectando qualificações, histórico e diferencial profissional com alto impacto.";

  let careerStageGuideline = "";
  if (stage === "experienced") {
    careerStageGuideline = `DIRETRIZ DE CARREIRA (CANDIDATO JÁ ATUA NA ÁREA / EXPERIENTE):
- Destaque o domínio técnico, consistência prática, domínio de ferramentas/rotinas da função e entrega de resultados e eficiência no cargo alvo.
- Transmita segurança, maturidade profissional e prontidão operacional para o cargo "${params.jobTitle}".`;
  } else if (stage === "career_transition") {
    careerStageGuideline = `DIRETRIZ DE CARREIRA (TRANSIÇÃO DE CARREIRA):
- O candidato está vindo de outra área profissional. JAMAIS enfatize falta de experiência ou use tom de desculpa.
- Foco MANDATÓRIO: Extraia e valorize HABILIDADES TRANSFERÍVEIS (soft skills, comunicação com clientes, resolução de problemas, liderança, organização de processos, adaptabilidade e cumprimento de metas) de suas experiências anteriores.
- Conecte essas competências transferíveis de forma estratégica e persuasiva para demonstrar como sua bagagem agrega valor único ao novo cargo pretendido ("${params.jobTitle}").`;
  } else if (stage === "entry_level") {
    careerStageGuideline = `DIRETRIZ DE CARREIRA (PRIMEIRO EMPREGO / ESTÁGIO):
- O candidato está ingressando no mercado ou buscando estágio na área pretendida.
- Destaque motivação genuína, facilidade de aprendizado, comprometimento com normas, iniciativa, pontualidade, formação acadêmica, cursos e habilidades transferíveis.
- NÃO invente empresas fictícias e NÃO use expressões autodepreciativas como "embora sem experiência".`;
  }

  let promptTask = "";
  if (hasCurrentSummary) {
    promptTask = `TAREFA:
O candidato já redigiu ou aprovou um resumo profissional estratégico. Sua missão é APRIMORAR e PROFISSIONALIZAR o texto fornecido pelo candidato, preservando rigorosamente as experiências, preferências, área de interesse e fatos reais que ele descreveu.
${targetLengthGuideline}
${careerStageGuideline}
SOBERANIA DA INTENÇÃO DO CANDIDATO: Se o rascunho do candidato expressar um objetivo, área ou carreira desejada específica (mesmo que diferente do cargo inicial ou do contexto preliminar de etapas anteriores), DÊ PRIORIDADE MÁXIMA à intenção expressa no rascunho. Estruture uma apresentação corporativa impecável centrada exatamente no objetivo que o candidato escreveu.
Elimine informalidades ou erros de gramática, normalize termos técnicos e adeque o tom para o padrão corporativo de recrutamento, sem descaracterizar a essência ou a estrutura estratégica do resumo já definido pelo usuário.`;
  } else if (hasExperiences) {
    promptTask = `TAREFA:
Como recrutador sênior, elabore um Resumo Profissional que conecte harmoniosamente o Cargo Pretendido com o histórico prático informado pelo candidato, aplicando estritamente a diretriz do seu momento de carreira.
${targetLengthGuideline}
${careerStageGuideline}`;
  } else {
    promptTask = `TAREFA:
Como não há experiências prévias informadas ainda, elabore um Resumo / Perfil Profissional atraente, direto e centrado 100% no Cargo Pretendido informado. Destaque competências essenciais da função, boas práticas, ética de trabalho e compromisso com excelência, aplicando a diretriz de carreira.
${targetLengthGuideline}
${careerStageGuideline}`;
  }

  return `${promptTask}

DADOS FORNECIDOS PELO CANDIDATO:
<user_untrusted_data>
Cargo Pretendido: ${params.jobTitle}
${params.field ? `Área de Atuação: ${params.field}` : ""}
Momento de Carreira: ${stage === "experienced" ? "Já atua na área (Experiente)" : stage === "career_transition" ? "Em transição de carreira" : "Primeiro emprego / Estágio"}
${params.careerContext ? `Contexto / Foco adicional informado pelo candidato:\n"${params.careerContext}"` : ""}
Modo de Redação: ${isSimple ? "Simples (Conciso)" : "Completo (Aprofundado)"}
${hasCurrentSummary ? `Rascunho/Resumo fornecido pelo candidato:\n"${params.currentSummary}"` : ""}
${
  hasExperiences
    ? `Experiências informadas:\n${experiencesList}`
    : "Experiências informadas:\nNenhuma experiência anterior informada ainda nesta etapa."
}
Habilidades Técnicas:
${skillsList || "Nenhuma informada"}
${softSkillsList ? `Competências Comportamentais:\n${softSkillsList}\n` : ""}${
    educationList ? `Formação informada:\n${educationList}\n` : ""
  }${coursesList ? `Cursos complementares:\n${coursesList}\n` : ""}${
    certsList ? `Certificações:\n${certsList}\n` : ""
  }</user_untrusted_data>

Retorne APENAS o parágrafo do resumo profissional em texto puro, sem aspas, sem bullet points e sem introduções ou comentários adicionais.`;
}

export function buildImproveTextPrompt(params: AIImproveTextParams): string {
  const isSimple = params.mode === "simple";
  const isSummary = params.context === "summary";
  const stage = params.careerStage || "experienced";

  if (isSummary) {
    return `TAREFA:
Aprimore, corrija e profissionalize o Resumo / Perfil Profissional abaixo para um currículo de alto impacto para ATS.
${params.jobTitle ? `Cargo de referência: ${params.jobTitle}` : ""}
${stage === "career_transition" ? "Diretriz: Candidato em transição de carreira — valorize habilidades transferíveis conectando ao cargo pretendido." : ""}
${stage === "entry_level" ? "Diretriz: Primeiro emprego / estágio — destaque iniciativa, facilidade de aprendizado e base acadêmica/cursos." : ""}
${params.careerContext ? `Contexto adicional: ${params.careerContext}` : ""}

REGRAS DE FORMATAÇÃO PARA RESUMO PROFISSIONAL:
1. O texto deve ser OBRIGATORIAMENTE em parágrafo único corrido e fluido (NUNCA utilize tópicos, marcadores ou bullet points).
2. Corrija 100% da ortografia, pontuação e gramática.
3. Mantenha os fatos, conquistas e experiências reais informados pelo candidato, elevando o vocabulário para o padrão corporativo moderno.
4. ${
      isSimple
        ? "MODO SIMPLES: Mantenha a redação enxuta e direta em 2 a 3 linhas (entre 180 e 280 caracteres)."
        : "MODO COMPLETO: Estruture um parágrafo consistente de 3 a 4 linhas (entre 280 e 450 caracteres), valorizando o perfil profissional."
    }

TEXTO ORIGINAL DO USUÁRIO:
<user_untrusted_data>
${params.rawText}
</user_untrusted_data>

Retorne APENAS o parágrafo do resumo profissional aprimorado em texto puro, sem aspas, sem bullet points e sem comentários adicionais.`;
  }

  // Contexto de Atividades de Experiência Profissional
  let expCareerGuideline = "";
  if (stage === "career_transition") {
    expCareerGuideline = `DIRETRIZ DE TRANSIÇÃO DE CARREIRA:
O candidato está migrando para o cargo de "${params.jobTitle || "novo cargo"}". Ao aprimorar os tópicos de atividades da experiência anterior, destaque verbos de ação e competências transferíveis (como liderança, atendimento a clientes, negociação, organização de rotinas, resolução de conflitos e melhoria de processos) que demonstrem aptidão para a nova área.`;
  } else if (stage === "entry_level") {
    expCareerGuideline = `DIRETRIZ DE INÍCIO DE CARREIRA:
Estruture as atividades valorizando proatividade, responsabilidade com rotinas, suporte à equipe e atenção aos detalhes.`;
  }

  return `TAREFA:
Aprimore, corrija e profissionalize a descrição das atividades e realizações da experiência profissional informada abaixo para um currículo de alto impacto para ATS.
${params.jobTitle ? `Cargo alvo / referência: ${params.jobTitle}` : ""}
${params.company ? `Empresa: ${params.company}` : ""}
${params.achievements ? `Conquistas/Resultados informados: ${params.achievements}` : ""}
${params.careerContext ? `Contexto / Foco adicional informado pelo candidato: ${params.careerContext}` : ""}
${expCareerGuideline}

REGRAS DE FORMATAÇÃO PARA ATIVIDADES DE EXPERIÊNCIA:
1. Corrija 100% da ortografia e erros de digitação (ex: "manuntenção de hadware" -> "manutenção de hardware").
2. Reestruture em bullet points profissionais (• ), iniciando cada item com verbos de ação assertivos no infinitivo ou pretérito (ex: "Gerenciar", "Executar", "Prestar suporte", "Desenvolver").
3. Preserve com precisão o escopo real informado pelo candidato, incorporando as atividades técnicas e eventuais conquistas citadas sem inventar números fictícios.
4. ${
    isSimple
      ? "MODO SIMPLES: Estruture de 2 a 3 tópicos diretos, claros e objetivos."
      : "MODO COMPLETO: Estruture tópicos enriquecidos e profissionais, destacando responsabilidades e impacto das entregas."
  }

TEXTO ORIGINAL DO USUÁRIO:
<user_untrusted_data>
${params.rawText}
</user_untrusted_data>

Retorne APENAS os bullet points (• ) aprimorados em texto puro, sem comentários e sem aspas.`;
}
