import { IAIService, AISuggestSummaryParams, AIImproveTextParams } from "./types";
import { ResumeData, CreationMode } from "@/types/resume";

export function normalizeJobTitle(raw: string): string {
  if (!raw) return "";
  const clean = raw.trim();

  const acronyms: Record<string, string> = {
    soc: "SOC",
    ti: "TI",
    rh: "RH",
    erp: "ERP",
    crm: "CRM",
    sql: "SQL",
    aws: "AWS",
    bi: "BI",
    qa: "QA",
    sdr: "SDR",
    b2b: "B2B",
    b2c: "B2C",
    dre: "DRE",
    n1: "N1",
    n2: "N2",
    tma: "TMA",
    tms: "TMS",
    wms: "WMS",
    ui: "UI",
    ux: "UX",
    nr: "NR",
    cnh: "CNH",
    front: "Front-end",
    frontend: "Frontend",
    "front-end": "Front-end",
    back: "Back-end",
    backend: "Backend",
    "back-end": "Back-end",
    fullstack: "Full Stack",
    "full-stack": "Full Stack",
    jr: "Júnior",
    "jr.": "Júnior",
    junior: "Júnior",
    pl: "Pleno",
    "pl.": "Pleno",
    pleno: "Pleno",
    sr: "Sênior",
    "sr.": "Sênior",
    senior: "Sênior",
    estagio: "Estágio",
    estagiario: "Estagiário",
  };

  const words = clean.split(/\s+/);
  const normalizedWords = words.map((w) => {
    const lower = w.toLowerCase().replace(/[,.:;]/g, "");
    if (acronyms[lower]) {
      return acronyms[lower];
    }
    if (["de", "da", "do", "das", "dos", "em", "e", "para", "no", "na"].includes(lower)) {
      return lower;
    }
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });

  return normalizedWords.join(" ");
}

function fixSpellingAndGrammar(text: string): string {
  return text
    .replace(/\bmanunten[çc][aã]o\b/gi, "manutenção")
    .replace(/\bmanutencao\b/gi, "manutenção")
    .replace(/\bhadware\b/gi, "hardware")
    .replace(/\bhardwere\b/gi, "hardware")
    .replace(/\bsofware\b/gi, "software")
    .replace(/\bsoftwere\b/gi, "software")
    .replace(/\bexcelen[çc]ia\b/gi, "excelência")
    .replace(/\bconhecimento\s+em\b/gi, "conhecimento em")
    .replace(/\busuarios\b/gi, "usuários")
    .replace(/\bclientes\b/gi, "clientes")
    .replace(/\bproducao\b/gi, "produção")
    .replace(/\bconstrucao\b/gi, "construção")
    .replace(/\blogistica\b/gi, "logística")
    .replace(/\beletrica\b/gi, "elétrica")
    .replace(/\bmecanica\b/gi, "mecânica")
    .replace(/\borcamento\b/gi, "orçamento")
    .replace(/\bgestao\b/gi, "gestão")
    .replace(/\boperacao\b/gi, "operação")
    .replace(/\borganizacao\b/gi, "organização")
    .replace(/\batendia\b/gi, "Atendimento e suporte a")
    .replace(/\bfazia\s+manuten[çc][aã]o\b/gi, "Realização de manutenção")
    .replace(/\bfazia\b/gi, "Execução de")
    .replace(/\bajudava\s+em\b/gi, "Auxílio direto em")
    .replace(/\bajudava\s+na\b/gi, "Auxílio direto na")
    .replace(/\bajudava\s+no\b/gi, "Auxílio direto no")
    .replace(/\btrabalhava\s+com\b/gi, "Atuação prática com")
    .replace(/\btrabalhava\s+na\b/gi, "Atuação na")
    .replace(/\btrabalhava\s+no\b/gi, "Atuação no")
    .replace(/\bcuidava\s+de\b/gi, "Responsável por")
    .replace(/\b[eé]\s+respons[aá]vel\s+por\b/gi, "Responsável por")
    .replace(/^(eu\s+)/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export class MockAIService implements IAIService {
  public providerName = "Fast Local (Reescrita Baseada nos Dados do Usuário)";

  async suggestSummary(params: AISuggestSummaryParams): Promise<string> {
    await new Promise((r) => setTimeout(r, 150));

    const rawTitle = params.jobTitle?.trim() || "";
    const title = normalizeJobTitle(rawTitle) || "Profissional";
    const rawField = params.field?.trim() || "";
    const field = rawField ? normalizeJobTitle(rawField) : "";

    const validExps = (params.experiences || []).filter(
      (e) => (e.role && e.role.trim()) || (e.company && e.company.trim())
    );
    const validSkills = (params.skills || []).filter((s) => s && s.trim());
    const validSoftSkills = (params.softSkills || []).filter((s) => s && s.trim());
    const validCourses = (params.courses || []).filter((c) => c.name && c.name.trim());
    const validCerts = (params.certifications || []).filter((c) => c && c.trim());

    // Se o candidato já forneceu um rascunho autoral com mais de 10 caracteres, preserva sua essência
    const hasCurrentSummary = Boolean(params.currentSummary && params.currentSummary.trim().length > 10);
    const baseSummary = hasCurrentSummary ? fixSpellingAndGrammar(params.currentSummary!.trim()) : "";

    // Suporte conciso quando explicitamente requisitado em Modo Simples
    if (params.mode === "simple") {
      const simpleParts: string[] = [];
      if (hasCurrentSummary) {
        simpleParts.push(baseSummary.endsWith(".") ? baseSummary : `${baseSummary}.`);
      } else {
        if (field && field.toLowerCase() !== title.toLowerCase()) {
          simpleParts.push(`Objetivo: ${title} no segmento de ${field}.`);
        } else {
          simpleParts.push(`Objetivo: atuar como ${title}.`);
        }
      }

      if (validExps.length > 0) {
        const roles = Array.from(new Set(validExps.map((e) => normalizeJobTitle(e.role)).filter(Boolean)));
        if (roles.length > 0) simpleParts.push(`Atuação prévia como ${roles.slice(0, 1).join("")}.`);
      }
      if (validSkills.length > 0) {
        simpleParts.push(`Domínio em ${validSkills.slice(0, 3).join(", ")}.`);
      }
      return simpleParts.join(" ");
    }

    // Modo Completo / Padrão: Monta o resumo articulando rascunho, experiências, habilidades e qualificações
    // Adaptação semântica baseada no Momento de Carreira (careerStage)
    const stage = params.careerStage || "experienced";
    const parts: string[] = [];

    if (hasCurrentSummary) {
      parts.push(baseSummary.endsWith(".") ? baseSummary : `${baseSummary}.`);
    } else {
      if (stage === "career_transition") {
        parts.push(
          `Profissional em transição de carreira para ${title}, mobilizando sólida bagagem prévia e competências transferíveis em comunicação assertiva, resolução prática de problemas, organização de processos e rápida adaptabilidade.`
        );
      } else if (stage === "entry_level") {
        parts.push(
          `Objetivo de início profissional em ${title}, demonstrando facilidade para aprendizado contínuo, iniciativa, pontualidade rigorosa e dedicação aos padrões de qualidade da equipe.`
        );
      } else {
        if (field && field.toLowerCase() !== title.toLowerCase()) {
          parts.push(`Atuação com foco técnico e resultados em ${title} (${field}).`);
        } else {
          parts.push(`Atuação profissional consolidada na função de ${title}.`);
        }
      }
    }

    if (params.careerContext && params.careerContext.trim()) {
      parts.push(`Foco direcionado: ${params.careerContext.trim()}.`);
    }

    if (validExps.length > 0) {
      const roles = Array.from(
        new Set(validExps.map((e) => normalizeJobTitle(e.role)).filter(Boolean))
      );
      const companies = Array.from(
        new Set(validExps.map((e) => e.company.trim()).filter(Boolean))
      );

      if (roles.length > 0 && companies.length > 0) {
        if (stage === "career_transition") {
          parts.push(
            `Histórico prático prévio atuando como ${roles.slice(0, 2).join(" e ")} (${companies.slice(0, 2).join(", ")}), com desenvolvimento de soft skills e visão de processos aplicáveis à nova área.`
          );
        } else {
          parts.push(
            `Experiência prática como ${roles.slice(0, 2).join(" e ")} (${companies.slice(0, 2).join(", ")}).`
          );
        }
      } else if (roles.length > 0) {
        parts.push(`Vivência prática anterior na função de ${roles.slice(0, 2).join(" e ")}.`);
      }

      // Extrai palavras reais da descrição da primeira experiência se existir
      const firstDesc = validExps[0]?.description?.trim();
      if (firstDesc && firstDesc.length > 10) {
        const cleanedDesc = fixSpellingAndGrammar(firstDesc)
          .replace(/^[•\-*]\s*/, "")
          .replace(/\.$/, "");
        parts.push(`Atividades desempenhadas envolvendo ${cleanedDesc.charAt(0).toLowerCase() + cleanedDesc.slice(1)}.`);
      }
    }

    if (validSkills.length > 0) {
      parts.push(`Domínio prático em ${validSkills.slice(0, 5).join(", ")}.`);
    }

    if (validSoftSkills.length > 0) {
      parts.push(`Competências comportamentais: ${validSoftSkills.slice(0, 3).join(", ")}.`);
    }

    if (validCourses.length > 0) {
      parts.push(`Capacitação complementar em ${validCourses.map((c) => c.name).slice(0, 2).join(" e ")}.`);
    }

    if (validCerts.length > 0) {
      parts.push(`Certificações profissionais: ${validCerts.slice(0, 2).join(", ")}.`);
    }

    if (validExps.length === 0 && !hasCurrentSummary && stage !== "career_transition" && stage !== "entry_level") {
      parts.push(
        `Disposição para aprendizado prático contínuo, rápida curva de aprendizado, cumprimento de normas, organização e segurança no trabalho.`
      );
    }

    return parts.join(" ");
  }

  async improveText(params: AIImproveTextParams): Promise<string> {
    await new Promise((r) => setTimeout(r, 150));

    const raw = params.rawText.trim();
    if (!raw) return "";

    const corrected = fixSpellingAndGrammar(raw);

    if (params.context === "summary") {
      const capitalized = corrected.charAt(0).toUpperCase() + corrected.slice(1);
      return capitalized.endsWith(".") ? capitalized : `${capitalized}.`;
    }

    // Contexto de Experiência: preserva exatamente os fatos do usuário, corrige erros e separa em tópicos limpos
    let segments = corrected
      .split(/\n|;|•/)
      .map((s) => s.replace(/^[\-•*]\s*/, "").trim())
      .filter((s) => s.length > 0);

    // Se digitou uma frase única ligando duas tarefas distintas
    if (segments.length === 1 && /\s+e\s+(manuten[çc][aã]o|execu[çc][aã]o|controle|organiza[çc][aã]o|suporte|atendimento|preparo|instala[çc][aã]o|limpeza|confer[êe]ncia)/i.test(segments[0])) {
      const splitIndex = segments[0].search(/\s+e\s+(manuten[çc][aã]o|execu[çc][aã]o|controle|organiza[çc][aã]o|suporte|atendimento|preparo|instala[çc][aã]o|limpeza|confer[êe]ncia)/i);
      if (splitIndex > 10) {
        const firstPart = segments[0].slice(0, splitIndex).trim();
        const secondPart = segments[0].slice(splitIndex).replace(/^\s+e\s+/i, "").trim();
        segments = [firstPart, secondPart];
      }
    }

    const formattedBullets = segments.map((seg) => {
      let item = fixSpellingAndGrammar(seg);

      if (/^manuten[çc][aã]o\b/i.test(item)) {
        item = `Realização de ${item.charAt(0).toLowerCase() + item.slice(1)}`;
      }

      item = item.charAt(0).toUpperCase() + item.slice(1);
      if (!item.endsWith(".")) item += ".";
      return `• ${item}`;
    });

    if (params.achievements && params.achievements.trim()) {
      const cleanAch = fixSpellingAndGrammar(params.achievements.trim());
      const achBullet = cleanAch.startsWith("Destaque:") ? cleanAch : `Destaque: ${cleanAch}`;
      formattedBullets.push(`• ${achBullet.endsWith(".") ? achBullet : `${achBullet}.`}`);
    }

    return formattedBullets.join("\n");
  }

  async improveFullResume(
    resumeData: ResumeData,
    mode?: CreationMode,
    _correlationId?: string,
    options?: { preserveSummary?: boolean }
  ): Promise<ResumeData> {
    const activeMode = mode || resumeData.creationMode || "simple";
    const updated = JSON.parse(JSON.stringify(resumeData)) as ResumeData;
    updated.creationMode = activeMode;

    if (updated.target.jobTitle) {
      updated.target.jobTitle = normalizeJobTitle(updated.target.jobTitle);
    }

    const effectiveJobTitle = updated.target.jobTitle || updated.experiences[0]?.role || "Profissional";
    const effectiveField = updated.target.field || effectiveJobTitle;

    // Aprimora ou gera o resumo usando todo o histórico das etapas anteriores
    if (!options?.preserveSummary) {
      updated.target.summary = await this.suggestSummary({
        jobTitle: effectiveJobTitle,
        field: effectiveField,
        careerStage: updated.target.careerStage,
        careerContext: updated.target.careerContext,
        currentSummary: updated.target.summary && updated.target.summary.trim().length > 10 ? updated.target.summary.trim() : undefined,
        experiences: updated.experiences,
        skills: updated.technicalSkills,
        softSkills: updated.softSkills,
        education: updated.education,
        courses: updated.courses,
        certifications: updated.certifications,
        mode: activeMode,
      });
    }

    for (const exp of updated.experiences) {
      if (exp.role) {
        exp.role = normalizeJobTitle(exp.role);
      }
      if (exp.description) {
        exp.description = await this.improveText({
          rawText: exp.description,
          context: "experience",
          jobTitle: exp.role || effectiveJobTitle,
          careerStage: updated.target.careerStage,
          careerContext: updated.target.careerContext,
          company: exp.company,
          achievements: exp.achievements,
          mode: activeMode,
        });
      }
    }

    return updated;
  }
}
