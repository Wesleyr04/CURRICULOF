import { IAIService, AISuggestSummaryParams, AIImproveTextParams } from "./types";
import { ResumeData, CreationMode } from "@/types/resume";

export class MockAIService implements IAIService {
  public providerName = "Mock IA (Modo Desenvolvimento / Testes Offline)";

  async suggestSummary(params: AISuggestSummaryParams): Promise<string> {
    await new Promise((r) => setTimeout(r, 200));

    const title = params.jobTitle.trim() || "Profissional";
    const field = params.field.trim() || "área de atuação";
    const isSimple = params.mode === "simple";
    const hasExp = params.experiences && params.experiences.length > 0;
    const skills = (params.skills || []).slice(0, 3).join(", ");

    if (isSimple) {
      // Modo Simples: enxuto, direto e sem adjetivos vazios
      if (!hasExp) {
        return `Profissional em formação na área de ${field}, com objetivo de atuar como ${title}.`;
      }
      const firstRole = params.experiences![0].role;
      return `Atuação como ${firstRole} na área de ${field}, com foco no cargo de ${title}${skills ? ` e conhecimentos em ${skills}` : ""}.`;
    }

    // Modo Completo: desenvolvido, articulado e contextualizado
    if (!hasExp) {
      return `Profissional motivado e focado em ingressar na área de ${field} como ${title}. Possui formação sólida e interesse contínuo no aprimoramento de competências${
        skills ? ` como ${skills}` : ""
      }, com perfil colaborativo, rápida curva de aprendizado e dedicação a resultados.`;
    }

    const firstRole = params.experiences![0].role;
    const firstCompany = params.experiences![0].company;

    return `Profissional com trajetória em ${field}, atuando com foco no cargo de ${title}. Experiência prática acumulada como ${firstRole} na ${firstCompany}, com destaque em organização, execução de processos e trabalho em equipe${
      skills ? `, aplicando conhecimentos em ${skills}` : ""
    }. Foco em agregar valor aos projetos da organização.`;
  }

  async improveText(params: AIImproveTextParams): Promise<string> {
    await new Promise((r) => setTimeout(r, 150));

    let clean = params.rawText.trim();
    if (!clean) return "";

    // Higienização básica
    clean = clean.replace(/^(eu\s+fazia|trabalhava\s+com|ajudava\s+em)\s+/i, "");
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);

    if (!clean.endsWith(".")) {
      clean += ".";
    }

    const isSimple = params.mode === "simple";

    if (isSimple) {
      // No modo simples: mantém em frase única contínua, sem subtópicos excessivos
      return clean.replace(/\n+/g, " ");
    }

    // No modo completo: formata em tópicos estruturados
    const lines = clean
      .split(/\n|;/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length > 1) {
      return lines
        .map((l) => {
          let item = l.charAt(0).toUpperCase() + l.slice(1);
          if (!item.endsWith(".")) item += ".";
          return `• ${item}`;
        })
        .join("\n");
    }

    return clean;
  }

  async improveFullResume(resumeData: ResumeData, mode?: CreationMode): Promise<ResumeData> {
    const activeMode = mode || resumeData.creationMode || "simple";
    const updated = JSON.parse(JSON.stringify(resumeData)) as ResumeData;
    updated.creationMode = activeMode;

    // Melhora o resumo se houver
    if (updated.target.summary) {
      updated.target.summary = await this.improveText({
        rawText: updated.target.summary,
        context: "summary",
        jobTitle: updated.target.jobTitle,
        mode: activeMode,
      });
    } else {
      updated.target.summary = await this.suggestSummary({
        jobTitle: updated.target.jobTitle,
        field: updated.target.field,
        experiences: updated.experiences,
        skills: updated.technicalSkills,
        mode: activeMode,
      });
    }

    // Melhora cada experiência
    for (const exp of updated.experiences) {
      if (exp.description) {
        exp.description = await this.improveText({
          rawText: exp.description,
          context: "experience",
          jobTitle: exp.role,
          mode: activeMode,
        });
      }
    }

    return updated;
  }
}
