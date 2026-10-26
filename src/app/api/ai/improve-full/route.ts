import { NextRequest, NextResponse } from "next/server";
import { ResumeDataSchema } from "@/lib/schema/resume";
import { getAIService } from "@/lib/ai/factory";
import { handleAIRouteError } from "@/lib/ai/errors";
import { validateContentSafety } from "@/lib/security/content-guard";
import { checkAiRateLimit, getClientIp } from "@/lib/security/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // 1. Camada 3: Rate Limit por IP
    const ip = getClientIp(req);
    const rateLimit = checkAiRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: rateLimit.message },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.resetSeconds) },
        }
      );
    }

    const body = await req.json();

    // Sanitização e normalização prévia do payload para máxima resiliência (suporte a primeiro emprego e estágio)
    const rawTarget = typeof body?.target === "object" && body.target ? body.target : {};
    const rawPersonal = typeof body?.personal === "object" && body.personal ? body.personal : {};
    const rawCustomization = typeof body?.customization === "object" && body.customization ? body.customization : {};

    // Remove experiências fantasmas (itens criados vazios sem dados)
    const cleanExperiences = Array.isArray(body?.experiences)
      ? body.experiences.filter(
          (e: unknown) =>
            typeof e === "object" &&
            e !== null &&
            ((typeof (e as { role?: unknown }).role === "string" && (e as { role: string }).role.trim().length > 0) ||
              (typeof (e as { company?: unknown }).company === "string" &&
                (e as { company: string }).company.trim().length > 0) ||
              (typeof (e as { description?: unknown }).description === "string" &&
                (e as { description: string }).description.trim().length > 0))
        )
      : [];

    // Remove formações fantasmas
    const cleanEducation = Array.isArray(body?.education)
      ? body.education.filter(
          (ed: unknown) =>
            typeof ed === "object" &&
            ed !== null &&
            ((typeof (ed as { course?: unknown }).course === "string" &&
              (ed as { course: string }).course.trim().length > 0) ||
              (typeof (ed as { institution?: unknown }).institution === "string" &&
                (ed as { institution: string }).institution.trim().length > 0))
        )
      : [];

    const effectiveJobTitle =
      (typeof rawTarget.jobTitle === "string" && rawTarget.jobTitle.trim()) ||
      (typeof rawTarget.field === "string" && rawTarget.field.trim()) ||
      (cleanExperiences[0]?.role ? String(cleanExperiences[0].role).trim() : "") ||
      "Profissional";

    // Prepara payload compatível garantindo que rascunhos pessoais não impeçam aprimoramento textual
    const candidateData = {
      ...body,
      creationMode: body?.creationMode === "complete" ? "complete" : "simple",
      personal: {
        fullName: typeof rawPersonal.fullName === "string" && rawPersonal.fullName.trim() ? rawPersonal.fullName.trim() : "Candidato",
        email: typeof rawPersonal.email === "string" && rawPersonal.email.includes("@") ? rawPersonal.email.trim() : "contato@fastcurriculo.com.br",
        phone: typeof rawPersonal.phone === "string" && rawPersonal.phone.trim().length >= 8 ? rawPersonal.phone.trim() : "11999999999",
        city: typeof rawPersonal.city === "string" && rawPersonal.city.trim() ? rawPersonal.city.trim() : "São Paulo",
        state: typeof rawPersonal.state === "string" && rawPersonal.state.trim() ? rawPersonal.state.trim() : "SP",
        linkedin: typeof rawPersonal.linkedin === "string" ? rawPersonal.linkedin : "",
        portfolio: typeof rawPersonal.portfolio === "string" ? rawPersonal.portfolio : "",
        photoUrl: typeof rawPersonal.photoUrl === "string" ? rawPersonal.photoUrl : undefined,
      },
      target: {
        jobTitle: effectiveJobTitle,
        field: typeof rawTarget.field === "string" ? rawTarget.field.trim() : effectiveJobTitle,
        careerStage: ["experienced", "entry_level", "career_transition"].includes(rawTarget.careerStage)
          ? rawTarget.careerStage
          : "experienced",
        careerContext: typeof rawTarget.careerContext === "string" ? rawTarget.careerContext.trim() : "",
        summary: typeof rawTarget.summary === "string" ? rawTarget.summary.trim() : "",
      },
      experiences: cleanExperiences,
      education: cleanEducation,
      courses: Array.isArray(body?.courses) ? body.courses : [],
      certifications: Array.isArray(body?.certifications) ? body.certifications : [],
      technicalSkills: Array.isArray(body?.technicalSkills) ? body.technicalSkills : [],
      softSkills: Array.isArray(body?.softSkills) ? body.softSkills : [],
      languages: Array.isArray(body?.languages) ? body.languages : [],
      customization: {
        layoutId: rawCustomization.layoutId || "classic-ats",
        primaryColor: rawCustomization.primaryColor || "#1e3a8a",
        fontFamily: rawCustomization.fontFamily || "sans",
        fontSize: rawCustomization.fontSize || "base",
        sectionOrder: rawCustomization.sectionOrder || [
          "summary",
          "experience",
          "education",
          "technicalSkills",
          "softSkills",
          "courses",
          "certifications",
          "languages",
        ],
        hiddenSections: rawCustomization.hiddenSections || [],
      },
    };

    const parsed = ResumeDataSchema.safeParse(candidateData);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            "Preencha ao menos o cargo pretendido, seu contexto ou sua formação na Etapa 2 para que o Fast possa aprimorar seu currículo.",
        },
        { status: 400 }
      );
    }

    // 2. Camada 1: Pre-flight Moderation de Conteúdo
    if (parsed.data.target?.jobTitle) {
      const checkJob = validateContentSafety(parsed.data.target.jobTitle);
      if (!checkJob.allowed) {
        return NextResponse.json(
          { error: checkJob.reason || "Cargo informado não permitido para geração profissional." },
          { status: 422 }
        );
      }
    }

    if (parsed.data.target?.field) {
      const checkField = validateContentSafety(parsed.data.target.field);
      if (!checkField.allowed) {
        return NextResponse.json(
          { error: checkField.reason || "Área informada não permitida para geração profissional." },
          { status: 422 }
        );
      }
    }

    if (parsed.data.target?.summary) {
      const checkSummary = validateContentSafety(parsed.data.target.summary);
      if (!checkSummary.allowed) {
        return NextResponse.json(
          { error: checkSummary.reason || "Resumo informado contém termos não permitidos." },
          { status: 422 }
        );
      }
    }

    if (Array.isArray(parsed.data.experiences)) {
      for (const exp of parsed.data.experiences) {
        if (exp.role) {
          const checkRole = validateContentSafety(exp.role);
          if (!checkRole.allowed) {
            return NextResponse.json(
              { error: checkRole.reason || `Cargo '${exp.role}' não permitido.` },
              { status: 422 }
            );
          }
        }
        if (exp.description) {
          const checkDesc = validateContentSafety(exp.description);
          if (!checkDesc.allowed) {
            return NextResponse.json(
              { error: checkDesc.reason || "Descrição de experiência não permitida." },
              { status: 422 }
            );
          }
        }
        if (exp.achievements) {
          const checkAch = validateContentSafety(exp.achievements);
          if (!checkAch.allowed) {
            return NextResponse.json(
              { error: checkAch.reason || "Conquistas informadas contêm termos não permitidos." },
              { status: 422 }
            );
          }
        }
      }
    }

    const correlationId =
      req.headers.get("x-correlation-id") ||
      (typeof body === "object" && body && "correlationId" in body && typeof body.correlationId === "string"
        ? body.correlationId
        : undefined);

    const preserveSummary = Boolean(body?.preserveSummary);

    const ai = getAIService();
    const improvedResume = await ai.improveFullResume(
      parsed.data,
      parsed.data.creationMode,
      correlationId,
      { preserveSummary }
    );

    // Preserva os dados pessoais reais originais informados pelo usuário na tela
    const finalResume = {
      ...improvedResume,
      personal: {
        ...rawPersonal,
        fullName: typeof rawPersonal.fullName === "string" && rawPersonal.fullName.trim() ? rawPersonal.fullName : improvedResume.personal.fullName,
      },
      target: {
        ...improvedResume.target,
        summary: preserveSummary ? (rawTarget.summary || parsed.data.target.summary) : improvedResume.target.summary,
      },
      customization: {
        ...rawCustomization,
        layoutId: rawCustomization.layoutId || improvedResume.customization.layoutId,
      },
    };

    return NextResponse.json(
      { resume: finalResume, provider: ai.providerName },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          ...(correlationId ? { "X-Correlation-Id": correlationId } : {}),
        },
      }
    );
  } catch (error: unknown) {
    return handleAIRouteError(error);
  }
}
