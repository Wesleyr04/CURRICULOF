"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ResumeData, LayoutType, CreationMode } from "@/types/resume";
import { EMPTY_RESUME_DATA, AVAILABLE_LAYOUTS, DEFAULT_LAYOUT_COLORS, STORAGE_KEYS, resolveLayoutId } from "@/config/layouts";
import { StepIndicator } from "@/components/editor/StepIndicator";
import { Step1Personal } from "@/components/editor/Step1Personal";
import { Step2Target } from "@/components/editor/Step2Target";
import { Step3Experience } from "@/components/editor/Step3Experience";
import { Step4Education } from "@/components/editor/Step4Education";
import { Step5Skills } from "@/components/editor/Step5Skills";
import { Step6Review } from "@/components/editor/Step6Review";
import { ResumeRenderer } from "@/components/layouts/ResumeRenderer";
import { PaymentModal } from "@/components/editor/PaymentModal";
import { Eye, Edit3, Trash2, Download, LayoutTemplate, AlertCircle, ZoomIn, ZoomOut } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { useEditor } from "@/context/EditorContext";
import { validateResumeForExport } from "@/lib/security/content-guard";

function EditorContent() {
  const searchParams = useSearchParams();
  const {
    currentStep,
    setCurrentStep,
    isPaid,
    setIsPaid,
    downloadToken,
    setPaymentSession,
    clearPaymentSession,
    registerDownloadTrigger,
  } = useEditor();

  const rawLayoutParam =
    searchParams.get("layout") ||
    searchParams.get("template") ||
    searchParams.get("templateId") ||
    searchParams.get("layoutId") ||
    searchParams.get("model");

  const urlLayout = resolveLayoutId(rawLayoutParam);
  const initialLayout: LayoutType = urlLayout || "classic-ats";
  const initialModeParam = searchParams.get("mode") as CreationMode;
  const initialMode: CreationMode = initialModeParam === "complete" ? "complete" : "simple";

  // Estado inicial limpo para preenchimento de novos currículos com modelo padrão pré-selecionado
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const selectedLayout = initialLayout;
    const defaultColor = DEFAULT_LAYOUT_COLORS[selectedLayout] || "#1e3a8a";
    return {
      ...EMPTY_RESUME_DATA,
      creationMode: initialMode,
      customization: { ...EMPTY_RESUME_DATA.customization, layoutId: selectedLayout, primaryColor: defaultColor },
    };
  });

  // Flag para assegurar que a hidratação inicial do localStorage já foi executada
  const isHydratedRef = useRef(false);

  // 1. Hidratação e restauração inicial no cliente (localStorage + sincronização de URL)
  useEffect(() => {
    if (typeof window === "undefined" || isHydratedRef.current) return;
    isHydratedRef.current = true;

    try {
      // 1.1 Restauração da Sessão de Pagamento com Validação Obrigatória no Backend (Timing-Safe)
      const rawPaymentSession = localStorage.getItem("fastcurriculo_payment_session");
      if (rawPaymentSession) {
        try {
          const session = JSON.parse(rawPaymentSession);
          if (
            session &&
            session.isPaid &&
            session.expiresAt &&
            session.expiresAt > Date.now() &&
            session.downloadToken
          ) {
            // Valida a autenticidade do token diretamente no backend antes de liberar o paywall
            fetch("/api/payment/verify-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: session.downloadToken }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data && data.valid === true) {
                  setIsPaid(true);
                  setPaymentSession({
                    downloadToken: session.downloadToken,
                    orderId: session.orderId,
                  });
                  document.body.classList.add("is-paid");
                } else {
                  // Token forjado ou expirado: revoga a sessão imediatamente
                  localStorage.removeItem("fastcurriculo_payment_session");
                  setIsPaid(false);
                  document.body.classList.remove("is-paid");
                }
              })
              .catch(() => {
                localStorage.removeItem("fastcurriculo_payment_session");
                setIsPaid(false);
                document.body.classList.remove("is-paid");
              });
          } else {
            localStorage.removeItem("fastcurriculo_payment_session");
            setIsPaid(false);
            document.body.classList.remove("is-paid");
          }
        } catch (paymentErr) {
          console.warn("Aviso ao ler sessão de pagamento salva:", paymentErr);
          localStorage.removeItem("fastcurriculo_payment_session");
        }
      }

      // 1.2 Restauração de dados reais do currículo salvos pelo usuário
      const savedResumeJson = localStorage.getItem(STORAGE_KEYS.RESUME_DATA);
      const savedLayoutId = resolveLayoutId(localStorage.getItem(STORAGE_KEYS.SELECTED_LAYOUT));

      if (savedResumeJson) {
        const parsed = JSON.parse(savedResumeJson) as ResumeData;
        const effectiveLayout =
          urlLayout || resolveLayoutId(parsed.customization?.layoutId) || savedLayoutId || initialLayout;
        const effectiveColor = urlLayout
          ? (DEFAULT_LAYOUT_COLORS[urlLayout] || parsed.customization?.primaryColor || "#1e3a8a")
          : (parsed.customization?.primaryColor || DEFAULT_LAYOUT_COLORS[effectiveLayout] || "#1e3a8a");

        setResumeData({
          ...parsed,
          creationMode: parsed.creationMode || initialMode,
          customization: {
            ...EMPTY_RESUME_DATA.customization,
            ...parsed.customization,
            layoutId: effectiveLayout,
            primaryColor: effectiveColor,
          },
        });
        return;
      }

      // Se não havia currículo salvo, mas havia layout salvo ou na URL:
      const targetLayout = urlLayout || savedLayoutId || initialLayout;
      const targetColor = DEFAULT_LAYOUT_COLORS[targetLayout] || "#1e3a8a";
      setResumeData((prev) => ({
        ...prev,
        customization: {
          ...prev.customization,
          layoutId: targetLayout,
          primaryColor: targetColor,
        },
      }));
    } catch (e) {
      console.error("Erro ao restaurar dados salvos no localStorage:", e);
    }
  }, [initialLayout, initialMode, setIsPaid, setPaymentSession, urlLayout]);

  // 2. Sincronização REATIVA da URL: se o usuário clicar em outro modelo no carrossel via navegação client-side
  useEffect(() => {
    const raw =
      searchParams.get("layout") ||
      searchParams.get("template") ||
      searchParams.get("templateId") ||
      searchParams.get("layoutId") ||
      searchParams.get("model");

    const resolved = resolveLayoutId(raw);
    if (resolved) {
      setResumeData((prev) => {
        if (prev.customization.layoutId === resolved) return prev;
        const newColor = DEFAULT_LAYOUT_COLORS[resolved] || prev.customization.primaryColor;
        return {
          ...prev,
          customization: {
            ...prev.customization,
            layoutId: resolved,
            primaryColor: newColor,
          },
        };
      });

      try {
        localStorage.setItem(STORAGE_KEYS.SELECTED_LAYOUT, resolved);
      } catch (err) {
        console.error("Erro ao sincronizar layout da URL com localStorage:", err);
      }
    }
  }, [searchParams]);

  // 3. Persistência contínua no localStorage a cada alteração de dados do currículo
  useEffect(() => {
    if (typeof window === "undefined" || !isHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.RESUME_DATA, JSON.stringify(resumeData));
      if (resumeData.customization?.layoutId) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_LAYOUT, resumeData.customization.layoutId);
      }
    } catch (err) {
      console.error("Erro ao persistir currículo no localStorage:", err);
    }
  }, [resumeData]);

  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [validationAlert, setValidationAlert] = useState<string | null>(null);

  useEffect(() => {
    if (isPaid) document.body.classList.add("is-paid");
    else document.body.classList.remove("is-paid");
  }, [isPaid]);

  // Abertura segura do checkout com validação obrigatória dos dados essenciais
  const handleOpenCheckout = React.useCallback(async () => {
    const check = validateResumeForExport(resumeData, { requirePersonalInfo: true });
    if (!check.valid) {
      const msg =
        check.message || "Por favor, preencha os dados essenciais na Etapa 1 antes de finalizar e baixar o currículo.";
      setValidationAlert(msg);
      setCurrentStep(check.targetStep || 1);
      return;
    }
    setValidationAlert(null);

    // Obtém o token ativo do contexto ou do localStorage
    let activeToken = downloadToken;
    if (!activeToken && typeof window !== "undefined") {
      try {
        const s = JSON.parse(localStorage.getItem("fastcurriculo_payment_session") || "{}");
        activeToken = s?.downloadToken || null;
      } catch {
        activeToken = null;
      }
    }

    // Se a sessão já estiver como paga, valida o token com o backend antes de gerar o download direto
    if (isPaid && activeToken) {
      try {
        const verifyRes = await fetch("/api/payment/verify-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: activeToken }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData && verifyData.valid === true) {
          const sanitizedName = resumeData.personal.fullName
            ? resumeData.personal.fullName
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")
            : "profissional";
          const fileName = `fastcurriculo-${sanitizedName || "profissional"}.pdf`;
          const { downloadResumePdf } = await import("@/lib/pdf/generate-pdf");
          await downloadResumePdf({ fileName, elementId: "resume-document-root" });
          return;
        }
      } catch (err) {
        console.warn("Falha na validação de token para download direto:", err);
      }

      // Se o token for inválido ou rejeitado pelo backend, revoga o estado de pago
      clearPaymentSession();
      if (typeof window !== "undefined") {
        localStorage.removeItem("fastcurriculo_payment_session");
        document.body.classList.remove("is-paid");
      }
    }

    setIsCheckoutOpen(true);
  }, [resumeData, setCurrentStep, isPaid, downloadToken, clearPaymentSession]);

  // Registra a ação de download no contexto central (consumido pela Navbar desacoplada)
  useEffect(() => {
    registerDownloadTrigger(handleOpenCheckout);
  }, [handleOpenCheckout, registerDownloadTrigger]);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const a4SheetRef = useRef<HTMLDivElement>(null);
  const [a4Scale, setA4Scale] = useState<number>(1);
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(1);

  useEffect(() => {
    const computeScale = () => {
      if (!previewContainerRef.current) return;
      const containerWidth = previewContainerRef.current.clientWidth;
      const usableWidth = Math.max(260, containerWidth - 24);
      if (usableWidth < 794) {
        const newScale = usableWidth / 794;
        setA4Scale(newScale);
        setScaledHeight(Math.ceil(Math.max(1123, a4SheetRef.current?.offsetHeight || 1123) * newScale));
      } else {
        setA4Scale(1);
        setScaledHeight(null);
      }
    };
    computeScale();
    window.addEventListener("resize", computeScale);
    return () => window.removeEventListener("resize", computeScale);
  }, [mobileTab, resumeData]);

  const handleZoomIn = () => {
    setZoomMultiplier((prev) => Math.min(2.0, +(prev + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setZoomMultiplier((prev) => Math.max(0.5, +(prev - 0.15).toFixed(2)));
  };

  const handleResetZoom = () => {
    setZoomMultiplier(1);
  };

  const effectiveScale = a4Scale * zoomMultiplier;

  const handleResetData = () => {
    if (window.confirm("Deseja realmente limpar todos os dados da sua sessão?")) {
      const selectedLayout = AVAILABLE_LAYOUTS.some((l) => l.id === resumeData.customization.layoutId)
        ? resumeData.customization.layoutId
        : "classic-ats";
      const defaultColor = DEFAULT_LAYOUT_COLORS[selectedLayout] || "#1e3a8a";
      setResumeData({
        ...EMPTY_RESUME_DATA,
        creationMode: resumeData.creationMode,
        customization: {
          ...EMPTY_RESUME_DATA.customization,
          layoutId: selectedLayout,
          primaryColor: defaultColor,
        },
      });
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(STORAGE_KEYS.RESUME_DATA);
          localStorage.setItem(STORAGE_KEYS.SELECTED_LAYOUT, selectedLayout);
        } catch (e) {
          console.error("Erro ao limpar dados no localStorage:", e);
        }
      }
      setCurrentStep(1);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-[calc(100vh-4rem)]">
      {/* Barra Superior do Editor */}
      <div className="no-print bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex justify-between items-center shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Edição Ativa (Etapa {currentStep} de 6)</span>
          </div>

          <button
            type="button"
            onClick={() => setCurrentStep(6)}
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            title="Alterar modelo e estilo na etapa de revisão"
          >
            <LayoutTemplate className="w-3 h-3 text-blue-700" />
            <span>Modelo: {AVAILABLE_LAYOUTS.find((l) => l.id === resumeData.customization.layoutId)?.name}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex lg:hidden bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setMobileTab("form")}
              className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1 ${
                mobileTab === "form" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Formulário</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1 ${
                mobileTab === "preview" ? "bg-white text-blue-900 shadow-xs" : "text-slate-600"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Prévia</span>
            </button>
          </div>

          {/* O BOTÃO DE DOWNLOAD SÓ APARECE E É LIBERADO NA ETAPA 6 */}
          {currentStep === 6 && (
            <button
              type="button"
              onClick={handleOpenCheckout}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar PDF ({SITE_CONFIG.pricing.formatted})</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetData}
            title="Limpar dados"
            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {validationAlert && (
        <div className="no-print bg-rose-50 border-b border-rose-200 px-4 py-2 text-xs font-medium text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{validationAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => setValidationAlert(null)}
            className="text-rose-600 hover:text-rose-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="no-print">
        <StepIndicator currentStep={currentStep} onSelectStep={(s) => setCurrentStep(s)} />
      </div>

      <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 print:block print:max-w-none print:overflow-visible">
        <div
          className={`no-print lg:col-span-6 xl:col-span-5 bg-white border-r border-slate-200 p-4 sm:p-8 pb-16 ${
            mobileTab === "preview" ? "hidden lg:block" : "block"
          }`}
        >
          {currentStep === 1 && (
            <Step1Personal
              data={resumeData.personal}
              mode={resumeData.creationMode}
              onChange={(personal) => setResumeData((prev) => ({ ...prev, personal }))}
              onNext={() => setCurrentStep(2)}
            />
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
              careerStage={resumeData.target.careerStage}
              careerContext={resumeData.target.careerContext}
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
              onOpenCheckout={handleOpenCheckout}
              onNavigateToStep={(s) => setCurrentStep(s)}
              onResetData={handleResetData}
            />
          )}
        </div>

        <div
          ref={previewContainerRef}
          className={`print:flex print:w-full print:p-0 print:m-0 print:max-h-none print:overflow-visible print:bg-white lg:col-span-6 xl:col-span-7 bg-slate-200/70 p-3 sm:p-6 lg:p-8 flex flex-col items-center ${
            mobileTab === "form" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="no-print w-full max-w-[210mm] mb-3 flex flex-wrap justify-between items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Pré-visualização A4</span>

            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-[11px] font-mono font-medium text-slate-600 mr-1">
                {Math.round(zoomMultiplier * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomMultiplier <= 0.5}
                title="Diminuir zoom"
                aria-label="Diminuir zoom"
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Ajustar à tela"
                aria-label="Ajustar zoom à tela"
                className="px-1.5 py-0.5 text-[10px] font-semibold text-blue-900 hover:bg-blue-50 rounded cursor-pointer"
              >
                Ajustar
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomMultiplier >= 2.0}
                title="Aumentar zoom (modo legível no mobile)"
                aria-label="Aumentar zoom"
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div
            className={`w-full flex justify-center pb-12 select-none print:overflow-visible print:pb-0 print:h-auto ${
              effectiveScale > 1 ? "overflow-x-auto" : "overflow-visible"
            }`}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              height: effectiveScale < 1 ? (scaledHeight ? `${Math.ceil(scaledHeight * zoomMultiplier)}px` : `calc(1123px * ${effectiveScale})`) : "auto",
              minHeight: effectiveScale < 1 ? `calc(1123px * ${effectiveScale})` : "1123px",
            }}
          >
            <div
              ref={a4SheetRef}
              style={{
                width: "794px",
                minWidth: "794px",
                maxWidth: "794px",
                minHeight: "1123px",
                transform: effectiveScale !== 1 ? `scale(${effectiveScale})` : undefined,
                transformOrigin: "top center",
                transition: "transform 0.15s ease-out",
              }}
              className="relative shadow-xl bg-white rounded select-none print:transform-none! print:w-full! print:min-w-0! print:max-w-none!"
            >
              <div
                className="no-print pointer-events-none absolute inset-0 z-30 flex flex-col justify-around items-center opacity-[0.14] select-none"
                aria-hidden="true"
              >
                <div className="rotate-[-32deg] font-extrabold text-3xl tracking-widest uppercase">
                  PRÉVIA • FASTCURRÍCULO
                </div>
                <div className="rotate-[-32deg] font-extrabold text-3xl tracking-widest uppercase">
                  PRÉVIA • FASTCURRÍCULO
                </div>
                <div className="rotate-[-32deg] font-extrabold text-3xl tracking-widest uppercase">
                  PRÉVIA • FASTCURRÍCULO
                </div>
              </div>
              <ResumeRenderer data={resumeData} isPdfView={false} />
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        resumeData={resumeData}
        onPaymentSuccess={(downloadToken, orderId) => {
          setIsPaid(true);
          setPaymentSession({ downloadToken, orderId });
          if (typeof document !== "undefined") {
            document.body.classList.add("is-paid");
          }
        }}
      />
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-500 text-sm">A carregar o editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}
