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

  // 1. Gera cobrança Pix real chamando o backend (/api/pix/criar)
  const createRealPixOrder = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCopied(false);
    setIsSuccess(false);
    setOrderData(null);
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

  // 2. Polling automático a cada 3 segundos em /api/pix/status?id={id}
  useEffect(() => {
    if (!isOpen || !orderData?.id) return;

    stopPolling();

    pollingRef.current = setInterval(async () => {
      if (isPaidHandledRef.current) return;

      try {
        const res = await fetch(`/api/pix/status?id=${encodeURIComponent(orderData.id)}`, {
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json().catch(() => null);

        // Se pago === true: grava sessão no localStorage, fecha o modal, desbloqueia paywall e dispara download imediatamente
        if (data && data.pago === true && !isPaidHandledRef.current) {
          isPaidHandledRef.current = true;
          stopPolling();

          // Persistência segura da sessão de pagamento no localStorage (válida por 24 horas)
          if (typeof window !== "undefined") {
            try {
              const sessionPayload = {
                isPaid: true,
                downloadToken: data.downloadToken || "",
                orderId: orderData.id,
                paidAt: Date.now(),
                expiresAt: Date.now() + 24 * 60 * 60 * 1000,
              };
              localStorage.setItem("fastcurriculo_payment_session", JSON.stringify(sessionPayload));
            } catch (storageErr) {
              console.warn("Aviso ao persistir sessão de pagamento no localStorage:", storageErr);
            }
          }

          // Notifica componente pai para liberar estado de impressão e paywall
          onPaymentSuccess?.(data.downloadToken, orderData.id);

          // Ativa a tela de sucesso no modal
          setIsSuccess(true);

          // Dispara download do PDF imediatamente para conveniência
          setTimeout(() => {
            triggerImmediateDownload();
          }, 80);
        }
      } catch (pollErr: unknown) {
        console.error("Erro na verificação de status Pix:", pollErr);
      }
    }, 3000);

    return () => {
      stopPolling();
    };
  }, [isOpen, orderData?.id, onPaymentSuccess, stopPolling, triggerImmediateDownload]);

  // Copia o código Pix real
  const handleCopyPix = () => {
    if (orderData?.qrCode) {
      navigator.clipboard.writeText(orderData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!isOpen) return null;

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
              <h3 className="font-bold text-slate-900 text-sm">
                {isSuccess
                  ? `Pagamento Aprovado — ${SITE_CONFIG.pricing.formatted}`
                  : `Pagamento Pix — ${SITE_CONFIG.pricing.formatted}`}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isSuccess
                  ? "Seu currículo foi liberado com sucesso em alta definição"
                  : "Liberação instantânea do seu currículo em PDF oficial"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6">
          {isSuccess ? (
            <div className="py-1 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Currículo Liberado com Sucesso!
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  O download direto foi iniciado. Escolha abaixo caso queira baixar novamente ou gerar em formato vetorial nativo:
                </p>
              </div>

              <div className="space-y-2.5 pt-2 text-left">
                {/* 1. Download Direto em Alta Resolução */}
                <button
                  type="button"
                  onClick={triggerImmediateDownload}
                  className="w-full p-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-between shadow-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 shrink-0" />
                    <div className="text-left">
                      <span className="block font-bold">Baixar PDF Oficial Direto</span>
                      <span className="block text-[10px] text-emerald-100 font-normal">
                        Arquivo em PDF de alta qualidade para impressão e envio
                      </span>
                    </div>
                  </div>
                </button>

                {/* 2. PDF Vetorial Nativo (ATS Friendly / Gupy) */}
                <button
                  type="button"
                  onClick={() => printResumeNatively()}
                  className="w-full p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-950 rounded-xl font-bold text-xs flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Printer className="w-4 h-4 text-blue-800 shrink-0" />
                    <div className="text-left">
                      <span className="block font-bold text-blue-900">
                        Salvar PDF Vetorial / Impressão Nativa (Recomendado para Gupy/ATS)
                      </span>
                      <span className="block text-[10px] text-blue-700 font-normal">
                        Texto 100% selecionável via motor nativo do navegador
                      </span>
                    </div>
                  </div>
                </button>

                {/* 3. Comprovante Oficial Pix */}
                {orderData?.id && (
                  <button
                    type="button"
                    disabled={downloadingReceipt}
                    onClick={async () => {
                      setDownloadingReceipt(true);
                      try {
                        await downloadReceiptPdf({
                          orderId: orderData.id,
                          paymentId: orderData.id,
                          formattedAmount: SITE_CONFIG.pricing.formatted,
                          paidAt: Date.now(),
                          customerName: resumeData.personal.fullName || "Cliente FastCurrículo",
                        });
                      } finally {
                        setDownloadingReceipt(false);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    {downloadingReceipt ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
                    ) : (
                      <FileCheck className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    <span>Baixar Comprovante Pix Oficial (PDF)</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Concluir e Voltar ao Editor
                </button>
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
            /* Exibição clara e fiel do erro da API para diagnóstico sem QR fake */
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
          ) : (
            /* Tela do QR Code Pix */
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
                    className="w-52 h-52 rounded-lg shadow-xs bg-white p-2 border border-slate-200"
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

              {/* Indicador "Aguardando pagamento..." */}
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100/80 border border-slate-200 p-2.5 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                <span>Aguardando pagamento...</span>
              </div>

              <div className="text-[11px] text-slate-400 text-center">
                Assim que a transferência de {SITE_CONFIG.pricing.formatted} for confirmada pelo Banco Central, o download começará automaticamente.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
