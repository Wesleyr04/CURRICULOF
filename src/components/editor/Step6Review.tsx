"use client";

import React, { useState, useRef, useEffect } from "react";
import { ResumeData, CustomizationSettings, LayoutType, CreationMode } from "@/types/resume";
import { AVAILABLE_LAYOUTS, COLOR_PALETTES, DEFAULT_LAYOUT_COLORS } from "@/config/layouts";
import { ResumeRenderer } from "@/components/layouts/ResumeRenderer";
import {
  Sparkles,
  Download,
  Loader2,
  CheckCircle2,
  Settings2,
  Palette,
  Type,
  Trash2,
  Check,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Wand2,
  Eye,
  Lightbulb,
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { validateResumeForExport, isAiRefusal } from "@/lib/security/content-guard";
import { sanitizeAiErrorMessage } from "@/lib/ai/errors";
import { PixPayeeNotice } from "@/components/editor/PixPayeeNotice";

interface Step6Props {
  resumeData: ResumeData;
  onUpdateCustomization: (settings: CustomizationSettings) => void;
  onApplyAiImprovement: (improvedData: ResumeData) => void;
  onOpenCheckout: () => void;
  onNavigateToStep: (stepNumber: number) => void;
  onResetData: () => void;
  onChangeMode?: (mode: CreationMode) => void;
}

export const REVIEW_SLIDES = [
  { id: 0, title: "1. Overview & Estilo", icon: Settings2 },
  { id: 1, title: "2. Sobre você", icon: Sparkles },
  { id: 2, title: "3. Revisão Inteligente Geral", icon: Wand2 },
  { id: 3, title: "4. Finalizar & Baixar", icon: Download },
];

/**
 * MobileA4Overview: Miniatura da folha A4 em tempo real exclusiva para Mobile (Overview Pós-Informações).
 * Renderiza o ResumeRenderer oficial escalado com fidelidade 100% aos dados preenchidos.
 */
function MobileA4Overview({ resumeData }: { resumeData: ResumeData }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.35);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (width > 0) {
        setScale(width / 794);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener("resize", updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-white select-none pointer-events-none rounded-lg shadow-sm"
      style={{
        aspectRatio: "794 / 1123",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          width: "794px",
          minHeight: "1123px",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <ResumeRenderer data={resumeData} isPdfView={false} />
      </div>
    </div>
  );
}

export function Step6Review({
  resumeData,
  onUpdateCustomization,
  onApplyAiImprovement,
  onOpenCheckout,
  onNavigateToStep,
  onResetData,
}: Step6Props) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingSummaryAi, setLoadingSummaryAi] = useState(false);
  const [summaryAiError, setSummaryAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [previousResumeData, setPreviousResumeData] = useState<ResumeData | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [fullAiError, setFullAiError] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement>(null);
  const { customization } = resumeData;

  const hasInitializedFromContextRef = useRef(false);

  // Ponte Automática Etapa 2 -> Etapa 6:
  // Se o usuário preencheu o contexto na Etapa 2 e a seção 'Sobre você' estiver vazia,
  // pré-popula automaticamente com o rascunho de contexto para o usuário não ter que digitar do zero.
  useEffect(() => {
    if (hasInitializedFromContextRef.current) return;
    const currentSummary = (resumeData.target.summary || "").trim();
    const contextFromStep2 = (resumeData.target.careerContext || "").trim();

    if (!currentSummary && contextFromStep2) {
      hasInitializedFromContextRef.current = true;
      onApplyAiImprovement({
        ...resumeData,
        target: {
          ...resumeData.target,
          summary: contextFromStep2,
        },
      });
    }
  }, [onApplyAiImprovement, resumeData]);

  const scrollToSlide = (index: number) => {
    setActiveSlide(index);
    if (carouselRef.current) {
      const child = carouselRef.current.children[index] as HTMLElement;
      if (child) {
        child.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
      }
    }
  };

  const handleNextSlide = () => {
    if (activeSlide < REVIEW_SLIDES.length - 1) {
      scrollToSlide(activeSlide + 1);
    }
  };

  const handlePrevSlide = () => {
    if (activeSlide > 0) {
      scrollToSlide(activeSlide - 1);
    }
  };

  const setLayout = (layoutId: LayoutType) => {
    const modelDefaultColor = DEFAULT_LAYOUT_COLORS[layoutId] || "#1e3a8a";
    onUpdateCustomization({
      ...customization,
      layoutId,
      primaryColor: modelDefaultColor,
    });
  };

  const setColor = (primaryColor: string) => {
    onUpdateCustomization({ ...customization, primaryColor });
  };

  const setFont = (fontFamily: "sans" | "serif" | "mono") => {
    onUpdateCustomization({ ...customization, fontFamily });
  };

  const handleRevert = () => {
    if (!previousResumeData) return;
    onApplyAiImprovement(previousResumeData);
    setPreviousResumeData(null);
    setAiSuccessMessage("Currículo restaurado para a versão anterior ao aprimoramento do Fast.");
    setTimeout(() => setAiSuccessMessage(null), 5000);
  };

  const handleGenerateStrategicSummary = async () => {
    if (loadingSummaryAi) return;
    setLoadingSummaryAi(true);
    setSummaryAiError(null);

    const backup = JSON.parse(JSON.stringify(resumeData)) as ResumeData;
    const cleanJob =
      (resumeData.target.jobTitle || "").trim() ||
      (resumeData.experiences[0]?.role || "").trim() ||
      "Profissional";

    try {
      const cleanExperiences = (resumeData.experiences || [])
        .filter((e) => {
          const role = typeof e?.role === "string" ? e.role.trim() : "";
          const company = typeof e?.company === "string" ? e.company.trim() : "";
          const desc = typeof e?.description === "string" ? e.description.trim() : "";
          return Boolean(role || company || desc);
        })
        .slice(0, 6)
        .map((e) => ({
          role: (typeof e?.role === "string" ? e.role.trim() : "") || "Profissional",
          company: (typeof e?.company === "string" ? e.company.trim() : "") || "Empresa",
          description: typeof e?.description === "string" ? e.description.trim().slice(0, 1000) : "",
          achievements: typeof e?.achievements === "string" ? e.achievements.trim().slice(0, 800) : "",
        }));

      const cleanSkills = (resumeData.technicalSkills || [])
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 50))
        .slice(0, 20);

      const cleanSoftSkills = (resumeData.softSkills || [])
        .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        .map((s) => s.trim().slice(0, 50))
        .slice(0, 20);

      const cleanEducation = (resumeData.education || [])
        .filter((ed) => {
          const c = typeof ed?.course === "string" ? ed.course.trim() : "";
          const inst = typeof ed?.institution === "string" ? ed.institution.trim() : "";
          return Boolean(c || inst);
        })
        .slice(0, 4)
        .map((ed) => ({
          course: (typeof ed?.course === "string" ? ed.course.trim().slice(0, 100) : "") || "Formação",
          institution: (typeof ed?.institution === "string" ? ed.institution.trim().slice(0, 100) : "") || "Instituição",
        }));

      const cleanCourses = (resumeData.courses || [])
        .filter((c) => typeof c?.name === "string" && c.name.trim().length > 0)
        .slice(0, 6)
        .map((c) => ({
          name: c.name.trim().slice(0, 120),
          institution: typeof c?.institution === "string" ? c.institution.trim().slice(0, 100) : "",
        }));

      const cleanCertifications = (resumeData.certifications || [])
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
        .map((c) => c.trim().slice(0, 100))
        .slice(0, 10);

      // Se o campo summary estiver vazio, utiliza o contexto da Etapa 2 como rascunho de partida
      const baseSummaryDraft =
        (typeof resumeData.target?.summary === "string" && resumeData.target.summary.trim().length > 0
          ? resumeData.target.summary.trim().slice(0, 1500)
          : undefined) ||
        (typeof resumeData.target?.careerContext === "string" && resumeData.target.careerContext.trim().length > 0
          ? resumeData.target.careerContext.trim().slice(0, 800)
          : undefined);

      const res = await fetch("/api/ai/suggest-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: cleanJob,
          field: resumeData.target.field?.trim() || cleanJob,
          careerStage: resumeData.target.careerStage || "experienced",
          careerContext: resumeData.target.careerContext?.trim() || undefined,
          currentSummary: baseSummaryDraft,
          mode: resumeData.creationMode || "simple",
          experiences: cleanExperiences,
          skills: cleanSkills,
          softSkills: cleanSoftSkills,
          education: cleanEducation,
          courses: cleanCourses,
          certifications: cleanCertifications,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const detailedMsg =
          errorData?.error ||
          (res.status === 401
            ? "Falha de autenticação com o provedor de IA. Verifique as credenciais no servidor."
            : "Falha ao comunicar com o serviço Fast.");
        throw new Error(detailedMsg);
      }

      const result = await res.json();
      const generatedSummary = (result.summary || "").trim();

      if (!generatedSummary || isAiRefusal(generatedSummary)) {
        throw new Error(
          "Não foi possível estruturar a apresentação com os termos informados. Revise suas informações."
        );
      }

      setPreviousResumeData(backup);
      onApplyAiImprovement({
        ...resumeData,
        target: {
          ...resumeData.target,
          summary: generatedSummary,
        },
      });

      setAiSuccessMessage("Apresentação 'Sobre você' gerada com sucesso pelo Fast, combinando seu histórico completo!");
      setTimeout(() => setAiSuccessMessage(null), 8000);
    } catch (err: unknown) {
      setSummaryAiError(sanitizeAiErrorMessage(err));
    } finally {
      setLoadingSummaryAi(false);
    }
  };

  const handleFullAiImprovement = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    setAiSuccessMessage(null);
    setFullAiError(null);

    const backup = JSON.parse(JSON.stringify(resumeData)) as ResumeData;

    try {
      // Limpa dados vazios para evitar rejeições acidentais no backend
      const sanitizedPayload: ResumeData = {
        ...resumeData,
        target: {
          ...resumeData.target,
          // Se summary ainda estiver vazio, envia o contexto da Etapa 2 para a IA estruturar
          summary:
            (resumeData.target.summary || "").trim() ||
            (resumeData.target.careerContext || "").trim(),
        },
        experiences: (resumeData.experiences || []).filter(
          (e) => (e.role && e.role.trim()) || (e.company && e.company.trim()) || (e.description && e.description.trim())
        ),
        education: (resumeData.education || []).filter(
          (ed) => (ed.course && ed.course.trim()) || (ed.institution && ed.institution.trim())
        ),
      };

      const res = await fetch("/api/ai/improve-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitizedPayload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || "Erro na comunicação com o assistente do Fast.");
      }

      const result = await res.json();
      if (result.resume) {
        setPreviousResumeData(backup);
        onApplyAiImprovement(result.resume);
        setAiSuccessMessage("Redação e perfil profissional aprimorados com sucesso pelo Fast, com termos corporativos e normalização!");
        setTimeout(() => setAiSuccessMessage(null), 8000);
      }
    } catch (err: unknown) {
      setFullAiError(sanitizeAiErrorMessage(err));
    } finally {
      setLoadingAi(false);
    }
  };

  const handleDownloadCheckout = () => {
    const check = validateResumeForExport(resumeData, { requirePersonalInfo: true });
    if (!check.valid) {
      setExportError(
        check.message ||
          "O currículo precisa de nome e contato antes de gerar o PDF. Verifique os dados básicos."
      );
      if (check.targetStep) {
        onNavigateToStep(check.targetStep);
      }
      return;
    }
    setExportError(null);
    onOpenCheckout();
  };

  return (
    <div className="space-y-4">
      {/* 1. Cabeçalho Compacto & Navegação Lateralizada por Abas */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Etapa 6 — Revisão & Finalização
            </h2>
            <p className="text-[11px] text-slate-500">
              Deslize para o lado para ajustar o modelo, a seção Sobre você e aplicar o polimento final do Fast antes de baixar.
            </p>
          </div>

          {/* Botões de Navegação Anterior / Próximo Lateral */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handlePrevSlide}
              disabled={activeSlide === 0}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none text-slate-700 transition-colors cursor-pointer"
              title="Aba anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-bold text-slate-500 px-1">
              {activeSlide + 1}/{REVIEW_SLIDES.length}
            </span>
            <button
              type="button"
              onClick={handleNextSlide}
              disabled={activeSlide === REVIEW_SLIDES.length - 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none text-slate-700 transition-colors cursor-pointer"
              title="Próxima aba"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Abas / Stepper Horizontal Superior */}
        <div className="flex gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
          {REVIEW_SLIDES.map((slide) => {
            const isCurrent = activeSlide === slide.id;
            const Icon = slide.icon;

            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => scrollToSlide(slide.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-blue-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{slide.title}</span>
              </button>
            );
          })}
        </div>
      </div>


      {/* Banner de Sucesso / Desfazer Alterações da IA */}
      {aiSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2 text-emerald-950 text-xs shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{aiSuccessMessage}</span>
          </div>
          {previousResumeData && (
            <button
              type="button"
              onClick={handleRevert}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-emerald-300 text-emerald-900 font-bold rounded-md hover:bg-emerald-100 transition-colors cursor-pointer shrink-0 text-[11px]"
            >
              <RotateCcw className="w-3 h-3 text-emerald-700" />
              <span>Desfazer</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Carrossel Horizontal / Swipe de Seções (Navegação Exclusiva por Gesto, Abas e Setas) */}
      <div
        ref={carouselRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 pt-1 no-scrollbar"
        onScroll={(e) => {
          const el = e.currentTarget;
          const index = Math.round(el.scrollLeft / el.clientWidth);
          if (index !== activeSlide && index >= 0 && index < REVIEW_SLIDES.length) {
            setActiveSlide(index);
          }
        }}
      >
        {/* =========================================================================
           SLIDE 1: OVERVIEW & ESTILO (COM PREVIEW A4 REAL NO MOBILE)
           ========================================================================= */}
        <div className="min-w-full snap-start bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">1. Overview & Estilo Visual</h3>
              </div>
              <span className="text-[10px] font-semibold text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded">
                Tempo Real
              </span>
            </div>

            {/* PREVIEW A4 REAL EM TEMPO REAL NO MOBILE (Overview Pós-Informações) */}
            <div className="block lg:hidden mt-3 mb-4">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-900" />
                  Visualização Real do PDF (A4)
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  Atualização ao vivo
                </span>
              </div>
              <div className="w-full bg-slate-200/90 p-2 sm:p-3 rounded-xl border border-slate-300 shadow-inner flex justify-center">
                <div className="w-full max-w-[340px]">
                  <MobileA4Overview resumeData={resumeData} />
                </div>
              </div>
              <p className="mt-1 text-[10px] text-center text-slate-500">
                Toque nos modelos e cores abaixo para ver a folha A4 mudar instantaneamente.
              </p>
            </div>

            {/* Modelos de Layout Compactos */}
            <div className="mt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Layout do Currículo
              </span>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_LAYOUTS.map((layout) => {
                  const isSelected = customization.layoutId === layout.id;
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setLayout(layout.id)}
                      className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "border-blue-900 bg-white ring-2 ring-blue-900/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white/70"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs text-slate-900 leading-tight">
                          {layout.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-900 shrink-0" />}
                      </div>
                      <span className="text-[10px] font-semibold text-blue-800">
                        {layout.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paleta de Cores e Tipografia Lado a Lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-200">
              {/* Cores */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-blue-900" />
                  Cor de Destaque
                </span>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTES.map((palette) => {
                    const isSelected = customization.primaryColor === palette.value;
                    return (
                      <button
                        key={palette.value}
                        type="button"
                        onClick={() => setColor(palette.value)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? "ring-3 ring-blue-600 ring-offset-1 scale-110 shadow-xs" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: palette.value }}
                        title={palette.name}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tipografia */}
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5 flex items-center gap-1">
                  <Type className="w-3 h-3 text-blue-900" />
                  Fonte
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {(["sans", "serif", "mono"] as const).map((font) => (
                    <button
                      key={font}
                      type="button"
                      onClick={() => setFont(font)}
                      className={`py-1 px-1.5 text-xs rounded-lg border text-center transition-all cursor-pointer capitalize ${
                        customization.fontFamily === font
                          ? "border-blue-900 bg-white text-blue-950 font-bold shadow-2xs"
                          : "border-slate-200 hover:bg-white text-slate-700"
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
           SLIDE 2: SOBRE VOCÊ
           ========================================================================= */}
        <div className="min-w-full snap-start bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-900" />
                <h3 className="text-sm font-bold text-slate-900">2. Sobre você</h3>
              </div>
              <span className="text-[10px] font-semibold text-blue-900 bg-blue-100/60 px-2 py-0.5 rounded">
                Consolidação com Histórico Completo
              </span>
            </div>

            <div className="mt-3 space-y-3">
              {/* Vínculo contextual automático com a Etapa 2 */}
              {resumeData.target.careerContext?.trim() && (
                <div className="flex items-start gap-2 p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 leading-snug">
                  <Lightbulb className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Contexto da Etapa 2 vinculado com sucesso:</span>{" "}
                    <span className="text-slate-700">&quot;{resumeData.target.careerContext}&quot;</span>
                    <span className="block text-[10px] text-blue-800/80 mt-0.5">
                      Esse texto já foi aproveitado no campo abaixo. Clique no botão ao lado para lapidá-lo profissionalmente com o Fast.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                  O Fast vai articular seu objetivo, contexto, formação e experiências para redigir uma apresentação profissional de alto impacto.
                </p>

                {/* Botão de Ação do Fast */}
                <button
                  type="button"
                  disabled={loadingSummaryAi}
                  onClick={handleGenerateStrategicSummary}
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-blue-900 text-white hover:bg-blue-800 transition-colors shadow-2xs disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {loadingSummaryAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Fast estruturando apresentação...</span>
                    </>
                  ) : (resumeData.target.summary || "").trim().length > 0 ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                      <span>✨ Reescrever com o Fast</span>
                    </>
                  ) : resumeData.target.careerContext?.trim() ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                      <span>✨ Gerar a partir do Contexto</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                      <span>✨ Gerar texto com o Fast</span>
                    </>
                  )}
                </button>
              </div>

              {/* Textarea da Seção Sobre Você */}
              <div>
                <textarea
                  rows={5}
                  value={resumeData.target.summary || ""}
                  onChange={(e) => {
                    setSummaryAiError(null);
                    onApplyAiImprovement({
                      ...resumeData,
                      target: {
                        ...resumeData.target,
                        summary: e.target.value,
                      },
                    });
                  }}
                  placeholder="Escreva brevemente sobre você ou clique em 'Gerar com o Fast' para estruturar sua apresentação alinhada ao seu momento de carreira..."
                  className="w-full p-3 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-800 text-slate-900 leading-relaxed shadow-2xs"
                />
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <span>Recomendado: parágrafo contínuo de 2 a 4 linhas sobre seu perfil, sem marcadores (bullet points).</span>
                  <span>{(resumeData.target.summary || "").length} caracteres</span>
                </div>
              </div>

              {summaryAiError && (
                <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{summaryAiError}</span>
                </div>
              )}

              {/* Botão de avanço rápido para a Aba 3 */}
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => scrollToSlide(2)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 hover:text-blue-950 hover:underline cursor-pointer"
                >
                  <span>Avançar para Revisão Geral do Fast &rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
           SLIDE 3: OTIMIZAÇÃO GERAL COM O FAST (NORMALIZAÇÃO ATS)
           ========================================================================= */}
        <div className="min-w-full snap-start bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Wand2 className="w-4 h-4 text-blue-900" />
              <h3 className="text-sm font-bold text-slate-900">3. Revisão Inteligente Geral — Normalização ATS</h3>
            </div>

            <div className="mt-3 p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl shadow-xs space-y-2.5">
              <div className="flex items-center gap-1.5 text-blue-300 text-[11px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ESPECIALISTA FAST — NORMALIZAÇÃO ATS</span>
              </div>
              <h4 className="font-extrabold text-sm sm:text-base">
                Revisar e Profissionalizar Toda a Redação
              </h4>
              <p className="text-[11px] text-blue-100 leading-relaxed">
                O Fast vai aprimorar todo o currículo: gera ou enriquece a seção &quot;Sobre você&quot; (usando seu contexto da Etapa 2 e formação), padroniza o cargo pretendido e converte experiências em tópicos de ação de alto impacto para triagem ATS. Funciona tanto para profissionais com histórico quanto para Primeiro Emprego e Estágio.
              </p>

              <div className="pt-1">
                <button
                  type="button"
                  disabled={loadingAi}
                  onClick={handleFullAiImprovement}
                  className="px-4 py-2 text-xs font-bold text-blue-950 bg-white hover:bg-blue-50 rounded-lg transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {loadingAi ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-900" />
                      <span>Aprimorando todo o currículo...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-blue-900" />
                      <span>Executar Aprimoramento com o Fast</span>
                    </>
                  )}
                </button>
              </div>

              {fullAiError && (
                <div role="alert" className="p-3 bg-rose-900/40 border border-rose-400 text-rose-100 rounded-lg flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                  <span>{fullAiError}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
           SLIDE 4: CONCLUSÃO & DOWNLOAD DO PDF
           ========================================================================= */}
        <div className="min-w-full snap-start bg-emerald-50/60 border border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-800" />
                <h3 className="text-sm font-bold text-slate-900">4. Finalizar e Baixar PDF</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                Pronto para gerar
              </span>
            </div>

            <div className="mt-3 space-y-2 text-center sm:text-left">
              <p className="text-xs text-slate-700 leading-relaxed">
                Seu currículo foi estruturado e formatado em padrão A4 de alta definição para triagem ATS e envio direto para recrutadores.
              </p>

              {exportError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs text-left flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{exportError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateToStep(1)}
                    className="text-xs font-bold text-rose-800 underline hover:text-rose-950 shrink-0 cursor-pointer"
                  >
                    Corrigir Dados &rarr;
                  </button>
                </div>
              )}

              <div className="pt-2">
                <PixPayeeNotice />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadCheckout}
                  className="w-full py-3 px-6 text-sm sm:text-base font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                >
                  <Download className="w-4 h-4" />
                  <span>Finalizar e Baixar PDF ({SITE_CONFIG.pricing.formatted})</span>
                </button>
              </div>

              <div className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pagamento único via Pix • Sem cadastro • Zero armazenamento permanente</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-emerald-200/80 flex justify-end items-center">
            <button
              type="button"
              onClick={onResetData}
              className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>Limpar dados (LGPD)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
