"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface GeneratePdfOptions {
  fileName?: string;
  elementId?: string;
}

export interface ReceiptPdfData {
  orderId: string;
  paymentId: string;
  formattedAmount: string;
  paidAt?: string | number;
  downloadToken?: string;
  customerName?: string;
}

/**
 * Gera e realiza o download direto do currículo em formato A4 PDF.
 * Suporta renderização em telas móveis e desktop clonando temporariamente
 * o elemento off-screen caso esteja oculto no DOM (ex: mobileTab === 'form').
 */
export async function downloadResumePdf({
  fileName = "fastcurriculo-profissional.pdf",
  elementId = "resume-document-root",
}: GeneratePdfOptions = {}): Promise<boolean> {
  let offscreenContainer: HTMLDivElement | null = null;

  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return false;
    }

    const originalElement = document.getElementById(elementId);
    if (!originalElement) {
      throw new Error(`Elemento com ID '${elementId}' não foi localizado na página.`);
    }

    let targetElement: HTMLElement = originalElement;

    // Se o elemento estiver com display: none ou dimensões zeradas (ex: no mobile na aba formulário),
    // clonamos o documento e o colocamos temporariamente off-screen com visibilidade garantida
    const rect = originalElement.getBoundingClientRect();
    const isElementHidden = rect.width === 0 || rect.height === 0 || window.getComputedStyle(originalElement).display === "none";

    if (isElementHidden) {
      offscreenContainer = document.createElement("div");
      offscreenContainer.style.position = "fixed";
      offscreenContainer.style.left = "-9999px";
      offscreenContainer.style.top = "0";
      offscreenContainer.style.width = "794px"; // 210mm a 96dpi aprox
      offscreenContainer.style.backgroundColor = "#ffffff";
      offscreenContainer.style.zIndex = "-9999";
      offscreenContainer.style.display = "block";
      offscreenContainer.style.visibility = "visible";

      const cloned = originalElement.cloneNode(true) as HTMLElement;
      cloned.style.display = "block";
      cloned.style.width = "794px";
      cloned.style.minHeight = "1123px";

      offscreenContainer.appendChild(cloned);
      document.body.appendChild(offscreenContainer);
      targetElement = cloned;
    }

    // Renderiza em canvas com escala 2x para nitidez profissional de 300dpi
    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    // Cria documento A4 (210 x 297 mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = 210;
    const pageHeight = 297;
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Adiciona primeira página
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= pageHeight;

    // Quebras automáticas de página caso o currículo ultrapasse 1 folha
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error("Falha ao exportar PDF do currículo:", error);
    return false;
  } finally {
    if (offscreenContainer && offscreenContainer.parentNode) {
      offscreenContainer.parentNode.removeChild(offscreenContainer);
    }
  }
}

/**
 * Gera e realiza o download exclusivamente do Comprovante de Pagamento Pix
 * em formato PDF profissional, sem nenhuma dependência do DOM do currículo.
 */
export async function downloadReceiptPdf(data: ReceiptPdfData): Promise<boolean> {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Cabeçalho institucional
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pageWidth, 28, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text("FASTCURRÍCULO", margin, 14);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text("Comprovante Oficial de Transação Pix", margin, 21);

    // Faixa de status verde
    pdf.setFillColor(236, 253, 245); // emerald-50
    pdf.setDrawColor(16, 185, 129); // emerald-500
    pdf.roundedRect(margin, 36, contentWidth, 22, 3, 3, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(6, 95, 70); // emerald-800
    pdf.text("PAGAMENTO CONFIRMADO", margin + 8, 46);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(4, 120, 87);
    pdf.text("Acesso e download do currículo liberados instantaneamente.", margin + 8, 52);

    // Bloco de detalhes do pagamento
    const startY = 66;
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.roundedRect(margin, startY, contentWidth, 85, 3, 3, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(30, 41, 59);
    pdf.text("Detalhes da Cobrança", margin + 8, startY + 12);

    const emitDate = data.paidAt
      ? new Date(data.paidAt).toLocaleString("pt-BR")
      : new Date().toLocaleString("pt-BR");

    const rows = [
      ["Serviço:", "Liberação de Download de Currículo Profissional (A4)"],
      ["Valor Pago:", data.formattedAmount || "R$ 0,50"],
      ["Método de Pagamento:", "Pix Instantâneo (Banco Central do Brasil)"],
      ["ID do Pedido:", data.orderId],
      ["Identificador Pix (Payment ID):", data.paymentId],
      ["Data e Hora da Aprovação:", emitDate],
      ["Token Efêmero de Liberação:", data.downloadToken ? `${data.downloadToken.slice(0, 16)}...` : "Validado no servidor"],
    ];

    let currentY = startY + 22;
    rows.forEach(([label, value]) => {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(label, margin + 8, currentY);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(15, 23, 42);
      pdf.text(String(value), margin + 65, currentY);

      currentY += 8.5;
    });

    // Rodapé legal e privacidade
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(71, 85, 105);
    pdf.text("Termos de Privacidade & Conformidade LGPD:", margin, startY + 102);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    const legalNotice =
      "Este documento comprova o pagamento unitário no valor fixo de R$ 0,50 para exportação do currículo em formato A4. " +
      "Em estrita observância à LGPD, o FastCurrículo adota arquitetura de zero persistência permanente de dados pessoais de candidatos. " +
      "Nenhum dado cadastral ou sensível bancário é armazenado ou compartilhado com terceiros.";
    const splitLegal = pdf.splitTextToSize(legalNotice, contentWidth);
    pdf.text(splitLegal, margin, startY + 108);

    const receiptFileName = `fastcurriculo-comprovante-pix-${data.orderId.replace(/[^a-zA-Z0-9_-]/g, "")}.pdf`;
    pdf.save(receiptFileName);
    return true;
  } catch (error) {
    console.error("Falha ao gerar comprovante de pagamento:", error);
    return false;
  }
}

/**
 * Dispara impressão direta A4 com tipografia 100% vetorial nativa do navegador
 */
export function printResumeNatively() {
  window.print();
}

