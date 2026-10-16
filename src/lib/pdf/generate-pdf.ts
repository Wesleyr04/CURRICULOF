"use client";

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface GeneratePdfOptions {
  fileName?: string;
  elementId?: string;
}

/**
 * Gera e realiza o download direto do currículo em formato A4 PDF
 * utilizando html2canvas (escala 2x para nitidez vetorial de 300dpi) e jsPDF.
 */
export async function downloadResumePdf({
  fileName = "curriculo-profissional.pdf",
  elementId = "resume-document-root",
}: GeneratePdfOptions = {}): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Elemento com ID ${elementId} não encontrado para geração do PDF.`);
      // Fallback para impressão nativa do navegador
      window.print();
      return false;
    }

    // Cria clone temporário com estilos otimizados para evitar cortes de scrollbar
    const canvas = await html2canvas(element, {
      scale: 2, // 2x para nitidez profissional
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 794, // 210mm a 96dpi aprox
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

    // Se o currículo tiver múltiplas páginas, adiciona quebras automáticas
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
    return true;
  } catch (error) {
    console.error("Erro na exportação com jsPDF, acionando impressão nativa:", error);
    window.print();
    return false;
  }
}

/**
 * Dispara impressão direta A4 com tipografia 100% vetorial nativa do navegador
 */
export function printResumeNatively() {
  window.print();
}
