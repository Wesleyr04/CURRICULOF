"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ResumeData } from "@/types/resume";
import { downloadResumePdf, printResumeNatively, downloadReceiptPdf } from "@/lib/pdf/generate-pdf";
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Printer,
  Download,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Calendar,
  Hash,
  AlertTriangle,
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
  onPaymentSuccess?: (downloadToken?: string, orderId?: string) => void;
}

interface PixOrderData {
  id: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl?: string;
}

interface ConfirmedDetails {
  orderId: string;
  amountInCents: number;
  paidAt: number;
}

export function PaymentModal({
  isOpen,
  onClose,
  resumeData,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<PixOrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pixStatus, setPixStatus] = useState<"pending" | "paid" | "expired" | "failed">("pending");
  const [checkingManual, setCheckingManual] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState<ConfirmedDetails | null>(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isPaidHandledRef = useRef(false);

  // Limpa o polling de verificação
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Dispara o download automático do currículo em PDF de alta resolução
  const triggerImmediateDownload = useCallback(async () => {
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

    try {
      await downloadResumePdf({ fileName, elementId: "resume-document-root" });
    } catch (err) {
      console.error("Erro ao disparar download do PDF após pagamento:", err);
    }
  }, [resumeData.personal.fullName]);

  // Trata a transição idempotente para o estado pago verificado pelo backend
  const handlePaymentApproved = useCallback(
    (data: { downloadToken?: string; orderId?: string; amountInCents?: number; paidAt?: number }) => {
      if (isPaidHandledRef.current) return;
      isPaidHandledRef.current = true;
      stopPolling();

      const orderId = data.orderId || orderData?.id || "";
      const paidAt = data.paidAt || Date.now();
      const amountInCents = data.amountInCents || SITE_CONFIG.pricing.amountInCents;

      // Persistência segura da sessão de pagamento no localStorage (válida por 24 horas)
      if (typeof window !== "undefined") {
        try {
          const sessionPayload = {
            isPaid: true,
            downloadToken: data.downloadToken || "",
            orderId,
            amountInCents,
            paidAt,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
          };
          localStorage.setItem("fastcurriculo_payment_session", JSON.stringify(sessionPayload));
        } catch (storageErr) {
          console.warn("Aviso ao persistir sessão de pagamento no localStorage:", storageErr);
        }
      }

      setConfirmedDetails({
        orderId,
        amountInCents,
        paidAt,
      });

      setPixStatus("paid");
      setIsSuccess(true);

      // Notifica componente pai para liberar estado de impressão e paywall
      onPaymentSuccess?.(data.downloadToken, orderId);

      // Dispara download do PDF para conveniência
      setTimeout(() => {
        triggerImmediateDownload();
      }, 100);
    },
    [onPaymentSuccess, orderData?.id, stopPolling, triggerImmediateDownload]
  );

  // 1. Gera cobrança Pix real chamando o backend (/api/pix/criar)
  const createRealPixOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    setIsSuccess(false);
    setOrderData(null);
    setConfirmedDetails(null);
    setPixStatus("pending");
    isPaidHandledRef.current = false;
    stopPolling();

    try {
      const res = await fetch("/api/pix/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        throw new Error(data?.error || `Falha na requisição Pix (${res.status}).`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.qr_code && !data.qr_code_base64) {
        throw new Error("O serviço de pagamento não retornou dados válidos de Pix. Verifique as credenciais da conta.");
      }

      setOrderData({
        id: String(data.id),
        status: data.status || "pending",
        qrCode: data.qr_code || "",
        qrCodeBase64: data.qr_code_base64 || "",
        ticketUrl: data.ticket_url || "",
      });
      setLoading(false);
    } catch (err: unknown) {
      console.error("[Pix Modal Error]", err);
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao conectar com o serviço de pagamento Pix.";
      setError(errorMessage);
      setLoading(false);
    }
  }, [stopPolling]);

  // Inicia a geração da cobrança sempre que o modal for aberto
  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      return;
    }

    createRealPixOrder();

    return () => {
      stopPolling();
    };
  }, [isOpen, createRealPixOrder, stopPolling]);

  // Consulta individual de status
  const checkStatusOnce = useCallback(async () => {
    if (!orderData?.id || isPaidHandledRef.current) return;

    try {
      const res = await fetch(`/api/pix/status?id=${encodeURIComponent(orderData.id)}`, {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json().catch(() => null);

      if (data && data.pago === true) {
        handlePaymentApproved(data);
        return;
      }

      if (data && (data.status === "expired" || data.status === "expirada")) {
        setPixStatus("expired");
        stopPolling();
        return;
      }

      if (data && (data.status === "failed" || data.status === "cancelled" || data.status === "rejected")) {
        setPixStatus("failed");
        stopPolling();
        return;
      }
    } catch (pollErr: unknown) {
      console.error("Erro na verificação de status Pix:", pollErr);
    }
  }, [handlePaymentApproved, orderData?.id, stopPolling]);

  // 2. Polling automático a cada 3 segundos em /api/pix/status?id={id}
  useEffect(() => {
    if (!isOpen || !orderData?.id || isSuccess || pixStatus !== "pending") return;

    stopPolling();
    pollingRef.current = setInterval(() => {
      checkStatusOnce();
    }, 3000);

    return () => {
      stopPolling();
    };
  }, [isOpen, orderData?.id, isSuccess, pixStatus, checkStatusOnce, stopPolling]);

  // Verificação manual sob demanda
  const handleManualCheck = async () => {
    setCheckingManual(true);
    await checkStatusOnce();
    setTimeout(() => setCheckingManual(false), 500);
  };

  // Copia o código Pix real
  const handleCopyPix = () => {
    if (orderData?.qrCode) {
      navigator.clipboard.writeText(orderData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!isOpen) return null;

  const formattedConfirmedDate = confirmedDetails?.paidAt
    ? new Date(confirmedDetails.paidAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  const formattedConfirmedAmount = confirmedDetails?.amountInCents
    ? `R$ ${(confirmedDetails.amountInCents / 100).toFixed(2).replace(".", ",")}`
    : SITE_CONFIG.pricing.formatted;

  return (
    <div className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto border border-slate-100">
        {/* Cabeçalho do Modal */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg ${
                isSuccess
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                  {SITE_CONFIG.name}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isSuccess
                  ? "Pagamento confirmado!"
                  : `Pagamento Pix — ${SITE_CONFIG.pricing.formatted}`}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-5 sm:p-6">
          {/* ===============================================================
              1. TELA DE CONFIRMAÇÃO VISUAL DE PAGAMENTO (após aprovação real)
             =============================================================== */}
          {isSuccess ? (
            <div className="py-1 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <h4 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Pagamento confirmado!
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Seu pagamento foi confirmado pelo sistema. Obrigado por utilizar o FastCurrículo.
                </p>
              </div>

              {/* Tabela de Dados Verificados do Pedido */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-left text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Situação:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Pagamento confirmado
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-500 font-medium">Produto / Serviço:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    Liberação de Currículo Profissional (PDF A4)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Valor efetivamente pago:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formattedConfirmedAmount}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Data e hora da confirmação:</span>
                  <span className="font-medium text-slate-800">
                    {formattedConfirmedDate}
                  </span>
                </div>

                {confirmedDetails?.orderId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">ID do Pedido:</span>
                    <span className="font-mono text-[11px] text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {confirmedDetails.orderId}
                    </span>
                  </div>
                )}
              </div>

              {/* Ações / Botões */}
              <div className="space-y-2.5 pt-1 text-left">
                {/* CTA Principal Obrigatório: Continuar para meu currículo */}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full p-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>Continuar para meu currículo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* 1. Download Direto em Alta Resolução */}
                <button
                  type="button"
                  onClick={triggerImmediateDownload}
                  className="w-full p-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 rounded-xl font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Baixar PDF Oficial Direto</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal">Alta resolução</span>
                </button>

                {/* 2. PDF Vetorial Nativo (ATS Friendly / Gupy) */}
                <button
                  type="button"
                  onClick={() => printResumeNatively()}
                  className="w-full p-2.5 bg-blue-50/70 hover:bg-blue-100 border border-blue-200 text-blue-950 rounded-xl font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Printer className="w-4 h-4 text-blue-800 shrink-0" />
                    <span>Salvar PDF Vetorial / Impressão Nativa</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-normal">ATS / Gupy</span>
                </button>

                {/* 3. Comprovante Oficial Pix */}
                {confirmedDetails?.orderId && (
                  <button
                    type="button"
                    disabled={downloadingReceipt}
                    onClick={async () => {
                      setDownloadingReceipt(true);
                      try {
                        await downloadReceiptPdf({
                          orderId: confirmedDetails.orderId,
                          paymentId: confirmedDetails.orderId,
                          formattedAmount: formattedConfirmedAmount,
                          paidAt: confirmedDetails.paidAt,
                          customerName: resumeData.personal.fullName || "Cliente FastCurrículo",
                        });
                      } finally {
                        setDownloadingReceipt(false);
                      }
                    }}
                    className="w-full p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {downloadingReceipt ? (
                      <Loader2 className="w-3 h-3 animate-spin text-slate-600" />
                    ) : (
                      <FileCheck className="w-3 h-3 text-slate-600" />
                    )}
                    <span>Baixar confirmação em PDF</span>
                  </button>
                )}
              </div>

              {/* Observação de rodapé obrigatória da especificação 2.4 */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                  Esta é uma confirmação de pagamento exibida pelo FastCurrículo. Para consultar o comprovante bancário, acesse o aplicativo da instituição financeira utilizada no pagamento.
                </p>
              </div>
            </div>
          ) : loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">
                Gerando cobrança Pix segura...
              </p>
            </div>
          ) : error ? (
            <div className="py-4 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-900">
                  Falha ao gerar cobrança Pix
                </h4>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-left text-xs font-mono text-rose-800 break-words max-h-36 overflow-y-auto">
                  {error}
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Provedor de pagamento pendente de ativação no ambiente do servidor.
                </p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  type="button"
                  onClick={createRealPixOrder}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tentar Novamente</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          ) : pixStatus === "expired" ? (
            /* Estado Expirado */
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Cobrança Pix Expirada
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  O tempo de 15 minutos para efetuar este pagamento expirou. Gere uma nova cobrança para concluir.
                </p>
              </div>
              <button
                type="button"
                onClick={createRealPixOrder}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Gerar Novo Pix</span>
              </button>
            </div>
          ) : pixStatus === "failed" ? (
            /* Estado Falho / Recusado */
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Pagamento não concluído
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  A transação não foi aprovada ou foi cancelada pelo provedor de pagamentos.
                </p>
              </div>
              <button
                type="button"
                onClick={createRealPixOrder}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          ) : (
            /* ===============================================================
               2. TELA DO QR CODE PIX COM AVISO PRÉ-PAGAMENTO INTEGRADO
               =============================================================== */
            <div className="space-y-4">
              {/* Valor e Validade */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-800 font-medium block">
                    Valor Único
                  </span>
                  <span className="text-xl font-extrabold text-emerald-950">
                    {SITE_CONFIG.pricing.formatted}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Válido por 15 min</span>
                </div>
              </div>

              {/* QR Code Pix em Imagem Base64 gerada pelo Provedor */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center">
                {orderData?.qrCodeBase64 && (
                  <img
                    src={`data:image/png;base64,${orderData.qrCodeBase64}`}
                    alt="QR Code Pix"
                    className="w-48 h-48 rounded-lg shadow-xs bg-white p-2 border border-slate-200"
                  />
                )}
                <span className="text-[11px] text-slate-600 mt-2 text-center font-medium">
                  Abra o aplicativo do seu banco e aponte a câmera para o QR Code
                </span>
              </div>

              {/* Código Pix Copia e Cola Real */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Pix Copia e Cola:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={orderData?.qrCode || ""}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-700 select-all font-mono truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="px-3.5 py-2 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Indicador "Aguardando confirmação do pagamento" com Reconsulta Manual */}
              <div className="flex items-center justify-between p-2.5 bg-slate-100/90 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  <span>Aguardando confirmação do pagamento...</span>
                </div>
                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={checkingManual}
                  title="Verificar status manualmente"
                  className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${checkingManual ? "animate-spin" : ""}`} />
                  <span>{checkingManual ? "Checando..." : "Verificar agora"}</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                Assim que a transferência de {SITE_CONFIG.pricing.formatted} for confirmada pelo Banco Central, o currículo será liberado instantaneamente.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
