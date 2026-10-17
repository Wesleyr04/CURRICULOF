"use client";

import React, { useState, useEffect } from "react";
import { ResumeData } from "@/types/resume";
import { downloadResumePdf, downloadReceiptPdf, printResumeNatively } from "@/lib/pdf/generate-pdf";
import {
  X,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  Loader2,
  Download,
  Printer,
  ShieldCheck,
  AlertCircle,
  Zap,
  FileText,
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resumeData: ResumeData;
}

interface PaymentOrderData {
  orderId: string;
  paymentId: string;
  formattedAmount: string;
  qrCodeText: string;
  qrCodeBase64?: string;
  isMock: boolean;
  expiresAt: string;
}

export function PaymentModal({ isOpen, onClose, resumeData }: PaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<PaymentOrderData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Inicia a cobrança no backend ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setIsPaid(false);
    setDownloadToken(null);
    setDownloadingResume(false);
    setDownloadingReceipt(false);
    setDownloadError(null);
    setDownloadSuccessMessage(null);

    async function initPayment() {
      try {
        const res = await fetch("/api/payment/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          throw new Error("Não foi possível gerar a cobrança Pix no servidor.");
        }

        const data = await res.json();
        if (isMounted) {
          setOrderData(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Erro ao conectar com o serviço de pagamentos.");
          setLoading(false);
        }
      }
    }

    initPayment();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Polling automático de verificação de status do Pix a cada 3 segundos
  useEffect(() => {
    if (!isOpen || isPaid || !orderData?.orderId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/payment/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderData.orderId }),
        });
        if (!res.ok) return;

        const data = await res.json();
        if (data.status === "paid" && data.downloadToken) {
          setIsPaid(true);
          setDownloadToken(data.downloadToken);
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Erro na verificação de status:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, isPaid, orderData?.orderId]);

  const handleCopyPix = () => {
    if (orderData?.qrCodeText) {
      navigator.clipboard.writeText(orderData.qrCodeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleLiberarEBaixarPdfTeste = async () => {
    // 1. Marca estado de pagamento como aprovado/liberado
    setIsPaid(true);
    setDownloadToken(`dl_test_token_${Date.now()}`);

    // 2. Fecha o modal imediatamente conforme solicitado
    onClose();

    // 3. Dispara a geração e download do PDF do currículo preenchido (não o comprovante)
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

    setTimeout(async () => {
      try {
        await downloadResumePdf({ fileName, elementId: "resume-document-root" });
      } catch (err) {
        console.error("Erro ao gerar PDF do currículo em modo teste:", err);
      }
    }, 60);
  };

  const handleDownloadResumePdf = async () => {
    if (downloadingResume || !isPaid) return;
    setDownloadingResume(true);
    setDownloadError(null);
    setDownloadSuccessMessage(null);

    try {
      const sanitizedName = resumeData.personal.fullName
        ? resumeData.personal.fullName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-")
        : "profissional";
      const fileName = `fastcurriculo-${sanitizedName}.pdf`;

      const success = await downloadResumePdf({ fileName, elementId: "resume-document-root" });
      if (!success) {
        setDownloadError("Não foi possível gerar o PDF do currículo. Verifique se o formulário foi preenchido.");
      } else {
        setDownloadSuccessMessage("Currículo baixado com sucesso!");
        setTimeout(() => setDownloadSuccessMessage(null), 5000);
      }
    } catch {
      setDownloadError("Ocorreu uma falha ao preparar o download do currículo.");
    } finally {
      setDownloadingResume(false);
    }
  };

  const handleDownloadReceiptPdf = async () => {
    if (downloadingReceipt || !orderData || !isPaid) return;
    setDownloadingReceipt(true);
    setDownloadError(null);
    setDownloadSuccessMessage(null);

    try {
      const success = await downloadReceiptPdf({
        orderId: orderData.orderId,
        paymentId: orderData.paymentId,
        formattedAmount: orderData.formattedAmount || SITE_CONFIG.pricing.formatted,
        paidAt: Date.now(),
        downloadToken: downloadToken || undefined,
        customerName: resumeData.personal.fullName || undefined,
      });

      if (!success) {
        setDownloadError("Não foi possível gerar o comprovante Pix.");
      } else {
        setDownloadSuccessMessage("Comprovante Pix baixado com sucesso!");
        setTimeout(() => setDownloadSuccessMessage(null), 5000);
      }
    } catch {
      setDownloadError("Ocorreu uma falha ao gerar o comprovante Pix.");
    } finally {
      setDownloadingReceipt(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden my-auto border border-slate-100">
        {/* Cabeçalho do Modal */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
              <QrCode className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isPaid ? "Pagamento Confirmado!" : "Pagamento Pix — R$ 0,50"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isPaid ? "Seu currículo está pronto para download" : "Liberação instantânea do seu currículo em PDF"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo do Modal */}
        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-900 mx-auto" />
              <p className="text-xs text-slate-600 font-medium">Gerando cobrança Pix segura...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-rose-700 font-semibold">{error}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Não se preocupe! Você pode liberar e baixar seu currículo profissional imediatamente no modo de teste.
                </p>
              </div>

              {/* Botão visível de liberação direta no modo de teste */}
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-950 text-xs font-bold">
                    <Zap className="w-4 h-4 text-emerald-700" />
                    <span>Modo de Teste — Liberação Imediata</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 uppercase">
                    1 Clique
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Aprova o status instantaneamente, fecha este modal e baixa o PDF do currículo preenchido:
                </p>
                <button
                  type="button"
                  onClick={handleLiberarEBaixarPdfTeste}
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Liberar e Baixar PDF (Modo Teste)</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : isPaid ? (
            /* Tela de Sucesso pós-pagamento */
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Pagamento Recebido com Sucesso!</h4>
                <p className="text-xs text-slate-600 max-w-xs mx-auto mt-1">
                  O token de liberação foi emitido pelo servidor. Escolha como deseja obter seu documento:
                </p>
              </div>

              {/* Mensagem de Erro ou Sucesso de Download */}
              {downloadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{downloadError}</span>
                </div>
              )}
              {downloadSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 text-left">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{downloadSuccessMessage}</span>
                </div>
              )}

              {/* Botões de Download Isolados */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={downloadingResume || downloadingReceipt}
                  onClick={handleDownloadResumePdf}
                  className="w-full py-3 px-4 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {downloadingResume ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Gerando currículo em PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Baixar Currículo em PDF (A4)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={downloadingResume || downloadingReceipt}
                  onClick={handleDownloadReceiptPdf}
                  className="w-full py-2.5 px-4 text-xs font-bold text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {downloadingReceipt ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-900" />
                      <span>Gerando comprovante...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-blue-800" />
                      <span>Baixar Comprovante Pix (PDF)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={printResumeNatively}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  <span>Imprimir Currículo Diretamente (Ctrl+P)</span>
                </button>
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                Seus dados serão descartados da memória da sessão após a conclusão.
              </div>
            </div>
          ) : (
            /* Tela de Pagamento Pix Pendente */
            <div className="space-y-4">
              {/* Valor em destaque */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-800 font-medium block">Valor Unitário</span>
                  <span className="text-xl font-extrabold text-emerald-950">
                    {orderData?.formattedAmount || SITE_CONFIG.pricing.formatted}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <span>Válido por 15 min</span>
                </div>
              </div>

              {/* QR Code Simulado ou Real */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center justify-center">
                {orderData?.qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${orderData.qrCodeBase64}`}
                    alt="QR Code Pix"
                    className="w-48 h-48 rounded shadow-2xs"
                  />
                ) : (
                  /* QR Code SVG Vetorial estilizado */
                  <div className="w-44 h-44 bg-white border border-slate-300 p-2 rounded shadow-2xs flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-10 h-10 border-4 border-slate-900 rounded-xs flex items-center justify-center">
                        <div className="w-4 h-4 bg-slate-900"></div>
                      </div>
                      <div className="w-10 h-10 border-4 border-slate-900 rounded-xs flex items-center justify-center">
                        <div className="w-4 h-4 bg-slate-900"></div>
                      </div>
                    </div>
                    <div className="flex justify-center items-center gap-1">
                      <div className="w-8 h-8 bg-slate-900 rounded-xs flex items-center justify-center text-white text-[8px] font-bold">
                        PIX
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="w-10 h-10 border-4 border-slate-900 rounded-xs flex items-center justify-center">
                        <div className="w-4 h-4 bg-slate-900"></div>
                      </div>
                      <div className="w-10 h-10 bg-slate-100 flex flex-wrap gap-1 p-1">
                        <div className="w-2 h-2 bg-slate-900"></div>
                        <div className="w-2 h-2 bg-slate-900"></div>
                      </div>
                    </div>
                  </div>
                )}
                <span className="text-[11px] text-slate-500 mt-2 text-center">
                  Abra o app do seu banco e aponte a câmera para o QR Code
                </span>
              </div>

              {/* Código Pix Copia e Cola */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Ou copie o código Pix Copia-e-Cola:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={orderData?.qrCodeText || ""}
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-600 select-all font-mono truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="px-3 py-2 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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

              {/* Opção Clara de Liberação Imediata para Testes */}
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-950 text-xs font-bold">
                    <Zap className="w-4 h-4 text-emerald-700" />
                    <span>Ambiente de Testes — Liberação Imediata</span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 uppercase">
                    1 Clique
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Para fins de teste imediato da geração do PDF do currículo preenchido, clique no botão abaixo para aprovar, fechar este modal e baixar seu currículo diretamente:
                </p>
                <button
                  type="button"
                  onClick={handleLiberarEBaixarPdfTeste}
                  className="w-full py-3 px-3 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Liberar e Baixar PDF (Modo Teste)</span>
                </button>
              </div>

              {/* Status de espera */}
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                <span>Aguardando confirmação do pagamento...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
