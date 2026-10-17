"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResumeData, LayoutType, CustomizationSettings, CreationMode } from "@/types/resume";
import { INITIAL_RESUME_DATA, AVAILABLE_LAYOUTS } from "@/config/layouts";
import { StepIndicator } from "@/components/editor/StepIndicator";
import { Step1Personal } from "@/components/editor/Step1Personal";
import { Step2Target } from "@/components/editor/Step2Target";
import { Step3Experience } from "@/components/editor/Step3Experience";
import { Step4Education } from "@/components/editor/Step4Education";
import { Step5Skills } from "@/components/editor/Step5Skills";
import { Step6Review } from "@/components/editor/Step6Review";
import { ModeSelector } from "@/components/editor/ModeSelector";
import { ResumeRenderer } from "@/components/layouts/ResumeRenderer";
import { PaymentModal } from "@/components/editor/PaymentModal";
import { Eye, Edit3, Trash2, Download, Printer, ShieldCheck, Sparkles, RefreshCw, SlidersHorizontal, Zap, Layers } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { printResumeNatively } from "@/lib/pdf/generate-pdf";

function EditorContent() {
  const searchParams = useSearchParams();
  const initialLayout = (searchParams.get("layout") as LayoutType) || "classic-ats";
  const initialModeParam = searchParams.get("mode") as CreationMode;
  const initialMode: CreationMode = initialModeParam === "complete" ? "complete" : "simple";

  // Estado em memória volátil durante a edição
  const [resumeData, setResumeData] = useState<ResumeData>(() => ({
    ...INITIAL_RESUME_DATA,
    creationMode: initialMode,
    customization: {
      ...INITIAL_RESUME_DATA.customization,
      layoutId: AVAILABLE_LAYOUTS.some((l) => l.id === initialLayout)
        ? initialLayout
        : "classic-ats",
    },
  }));

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Sincroniza query params se houver mudança de layout ou mode
  useEffect(() => {
    const layoutParam = searchParams.get("layout") as LayoutType;
    const modeParam = searchParams.get("mode") as CreationMode;

    setResumeData((prev) => {
      let updated = prev;
      if (layoutParam && AVAILABLE_LAYOUTS.some((l) => l.id === layoutParam) && prev.customization.layoutId !== layoutParam) {
        updated = {
          ...updated,
          customization: {
            ...updated.customization,
            layoutId: layoutParam,
          },
        };
      }
      if (modeParam && (modeParam === "simple" || modeParam === "complete") && prev.creationMode !== modeParam) {
        updated = {
          ...updated,
          creationMode: modeParam,
        };
      }
      return updated;
    });
  }, [searchParams]);

  const setCreationMode = (mode: CreationMode) => {
    setResumeData((prev) => ({
      ...prev,
      creationMode: mode,
    }));
  };

  const hasDetailedData =
    (resumeData.certifications && resumeData.certifications.length > 0) ||
    (resumeData.languages && resumeData.languages.length > 0) ||
    Boolean(resumeData.personal.linkedin || resumeData.personal.portfolio) ||
    resumeData.experiences.some((exp) => exp.achievements && exp.achievements.length > 0);

  // Limpeza de todos os dados da memória (Conformidade estrita com LGPD e Zero Persistência)
  const handleResetData = () => {
    const confirmed = window.confirm(
      "Deseja realmente limpar todos os dados da sua sessão? Os dados serão apagados da memória e esta ação não poderá ser desfeita."
    );
    if (confirmed) {
      setResumeData({
        personal: {
          fullName: "",
          email: "",
          phone: "",
          city: "",
          state: "",
          linkedin: "",
          portfolio: "",
        },
        target: {
          jobTitle: "",
          field: "",
          summary: "",
        },
        experiences: [],
        education: [],
        courses: [],
        certifications: [],
        technicalSkills: [],
        softSkills: [],
        languages: [],
        customization: {
          layoutId: "classic-ats",
          primaryColor: "#1e3a8a",
          fontFamily: "sans",
          fontSize: "base",
          sectionOrder: ["summary", "experience", "education", "technicalSkills", "softSkills"],
          hiddenSections: [],
        },
      });
      setCurrentStep(1);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-[calc(100vh-4rem)]">
      {/* Barra de Ferramentas Superior do Editor */}
      <div className="no-print bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex justify-between items-center shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Edição Ativa</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">|</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Modelo:{" "}
            <strong className="text-slate-900">
              {AVAILABLE_LAYOUTS.find((l) => l.id === resumeData.customization.layoutId)?.name}
            </strong>
          </span>

          <span className="text-slate-300 hidden md:inline">|</span>

          {/* Alternância Rápida de Modo no Topo */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setCreationMode("simple")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                resumeData.creationMode === "simple"
                  ? "bg-white text-blue-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3 h-3 text-emerald-600" />
              <span>Modo Simples</span>
            </button>
            <button
              type="button"
              onClick={() => setCreationMode("complete")}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                resumeData.creationMode === "complete"
                  ? "bg-white text-blue-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3 h-3 text-blue-600" />
              <span>Modo Completo</span>
            </button>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2">
          {/* Seletor Mobile: Alternar entre formulário e prévia */}
          <div className="flex lg:hidden bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setMobileTab("form")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                mobileTab === "form" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Formulário</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                mobileTab === "preview" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Prévia</span>
            </button>
          </div>

          {/* Botão de Limpar Sessão */}
          <button
            type="button"
            onClick={handleResetData}
            title="Limpar todos os dados da memória"
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Botão de Baixar PDF */}
          <button
            type="button"
            onClick={() => setIsCheckoutOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar ({SITE_CONFIG.pricing.formatted})</span>
          </button>
        </div>
      </div>

      {/* Indicador de Passos das 6 Etapas */}
      <div className="no-print">
        <StepIndicator currentStep={currentStep} onSelectStep={(s) => setCurrentStep(s)} />
      </div>

      {/* Corpo Dividido: Formulário na Esquerda | Prévia na Direita */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden print:block print:max-w-none print:overflow-visible">
        {/* Coluna Esquerda: Formulário de Edição */}
        <div
          className={`no-print lg:col-span-6 xl:col-span-5 bg-white border-r border-slate-200 p-4 sm:p-8 overflow-y-auto ${
            mobileTab === "preview" ? "hidden lg:block" : "block"
          }`}
          style={{ maxHeight: "calc(100vh - 8.5rem)" }}
        >
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-900" />
                    Modo de Criação do Currículo
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Alterne livremente sem perder dados
                  </span>
                </div>
                <ModeSelector
                  mode={resumeData.creationMode || "simple"}
                  onSelectMode={setCreationMode}
                  hasDetailedData={hasDetailedData}
                />
              </div>

              <Step1Personal
                data={resumeData.personal}
                mode={resumeData.creationMode}
                onChange={(personal) => setResumeData((prev) => ({ ...prev, personal }))}
                onNext={() => setCurrentStep(2)}
              />
            </div>
          )}

          {currentStep === 2 && (
            <Step2Target
              data={resumeData.target}
              fullData={resumeData}
              mode={resumeData.creationMode}
              onChange={(target) => setResumeData((prev) => ({ ...prev, target }))}
              onNext={() => setCurrentStep(3)}
              onPrev={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3Experience
              experiences={resumeData.experiences}
              jobTitle={resumeData.target.jobTitle}
              mode={resumeData.creationMode}
              onChange={(experiences) => setResumeData((prev) => ({ ...prev, experiences }))}
              onNext={() => setCurrentStep(4)}
              onPrev={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4Education
              education={resumeData.education}
              mode={resumeData.creationMode}
              onChange={(education) => setResumeData((prev) => ({ ...prev, education }))}
              onNext={() => setCurrentStep(5)}
              onPrev={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 5 && (
            <Step5Skills
              technicalSkills={resumeData.technicalSkills}
              softSkills={resumeData.softSkills}
              courses={resumeData.courses}
              certifications={resumeData.certifications}
              languages={resumeData.languages}
              mode={resumeData.creationMode}
              onChangeSkills={(technicalSkills, softSkills) =>
                setResumeData((prev) => ({ ...prev, technicalSkills, softSkills }))
              }
              onChangeCourses={(courses) => setResumeData((prev) => ({ ...prev, courses }))}
              onChangeCertifications={(certifications) =>
                setResumeData((prev) => ({ ...prev, certifications }))
              }
              onChangeLanguages={(languages) => setResumeData((prev) => ({ ...prev, languages }))}
              onNext={() => setCurrentStep(6)}
              onPrev={() => setCurrentStep(4)}
            />
          )}

          {currentStep === 6 && (
            <Step6Review
              resumeData={resumeData}
              onUpdateCustomization={(customization) =>
                setResumeData((prev) => ({ ...prev, customization }))
              }
              onApplyAiImprovement={(improved) => setResumeData(improved)}
              onOpenCheckout={() => setIsCheckoutOpen(true)}
              onNavigateToStep={(s) => setCurrentStep(s)}
              onResetData={handleResetData}
              onChangeMode={setCreationMode}
            />
          )}
        </div>

        {/* Coluna Direita: Pré-visualização em Tempo Real em Folha A4 */}
        <div
          className={`print:flex print:w-full print:p-0 print:m-0 print:max-h-none print:overflow-visible print:bg-white lg:col-span-6 xl:col-span-7 bg-slate-200/70 p-4 sm:p-8 overflow-y-auto flex flex-col items-center ${
            mobileTab === "form" ? "hidden lg:flex" : "flex"
          }`}
          style={{ maxHeight: "calc(100vh - 8.5rem)" }}
        >
          {/* Barra de controle da visualização */}
          <div className="no-print w-full max-w-[210mm] mb-3 flex justify-between items-center text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Pré-visualização A4</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-600 font-medium">
                Atualização em Tempo Real
              </span>
            </div>

            <button
              type="button"
              onClick={printResumeNatively}
              className="flex items-center gap-1 font-semibold text-slate-700 hover:text-blue-900 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Testar Impressão</span>
            </button>
          </div>

          {/* O Documento A4 */}
          <div className="w-full flex justify-center pb-12">
            <ResumeRenderer data={resumeData} isPdfView={false} />
          </div>
        </div>
      </div>

      {/* Modal de Pagamento Pix de R$ 0,50 e Download de PDF */}
      <PaymentModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        resumeData={resumeData}
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-500 text-sm">
          Carregando o editor profissional...
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
