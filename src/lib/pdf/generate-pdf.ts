import type jsPDF from "jspdf";

export type PdfDocumentInstance = jsPDF;

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

let helperCanvasCtx: CanvasRenderingContext2D | null = null;

/**
 * Converte qualquer formato de cor CSS moderno (lab, oklch, oklab, color)
 * para um formato seguro (hex ou rgb) suportado por qualquer parser de canvas.
 */
export function safeColorToRgb(colorStr: string, fallback: string = "#18181b"): string {
  if (!colorStr || typeof colorStr !== "string") return fallback;
  const trimmed = colorStr.trim();
  if (
    !trimmed ||
    trimmed === "transparent" ||
    trimmed === "inherit" ||
    trimmed === "initial" ||
    trimmed === "none" ||
    trimmed === "currentColor"
  ) {
    return trimmed;
  }

  // Se já for hexadecimal ou rgb/rgba padrão simples, retorna direto
  if (/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed)) {
    return trimmed;
  }
  if (/^rgba?\s*\([^)]*\)$/i.test(trimmed) && !trimmed.includes("lab(") && !trimmed.includes("oklch(")) {
    return trimmed;
  }

  // Se contiver funções de cores modernas
  if (
    trimmed.includes("lab(") ||
    trimmed.includes("oklch(") ||
    trimmed.includes("oklab(") ||
    trimmed.includes("lch(") ||
    trimmed.includes("color(")
  ) {
    try {
      if (!helperCanvasCtx && typeof document !== "undefined") {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 1;
        tempCanvas.height = 1;
        helperCanvasCtx = tempCanvas.getContext("2d");
      }
      if (helperCanvasCtx) {
        helperCanvasCtx.fillStyle = "#000000"; // reset
        helperCanvasCtx.fillStyle = trimmed;
        const converted = helperCanvasCtx.fillStyle;
        if (
          converted &&
          typeof converted === "string" &&
          !converted.includes("lab(") &&
          !converted.includes("oklch(") &&
          !converted.includes("oklab(") &&
          !converted.includes("lch(") &&
          !converted.includes("color(")
        ) {
          return converted;
        }
      }
    } catch {
      // Ignora erro e usa fallback
    }
    return fallback;
  }

  return trimmed;
}

/**
 * Sanitiza o documento clonado antes da renderização pelo html2canvas:
 * 1. Purga regras de CSS global em tags <style> contendo lab() / oklch().
 * 2. Varre os nós do elemento alvo e sanitiza propriedades de cores (color, background, border, etc.).
 */
export function sanitizeClonedDocumentForPdf(clonedDoc: Document, targetEl: HTMLElement | null) {
  try {
    // 1. Purga regras CSS com lab() e oklch() em tags <style>
    const styleTags = Array.from(clonedDoc.querySelectorAll("style"));
    styleTags.forEach((styleTag) => {
      try {
        if (styleTag.textContent) {
          const text = styleTag.textContent;
          if (
            text.includes("lab(") ||
            text.includes("oklch(") ||
            text.includes("oklab(") ||
            text.includes("lch(") ||
            text.includes("color(")
          ) {
            // Substitui funções modernas de cores por formato rgb seguro via regex
            const sanitizedCss = text.replace(
              /(?:oklch|oklab|lab|lch|color)\([^)]+\)/gi,
              (match) => safeColorToRgb(match, "#18181b")
            );
            styleTag.textContent = sanitizedCss;
          }
        }
      } catch {
        // Ignora erros de CSS individual
      }
    });

    // 2. Varre os elementos do nó alvo
    if (!targetEl) return;

    const elementsToSanitize: HTMLElement[] = [
      targetEl,
      ...Array.from(targetEl.querySelectorAll<HTMLElement>("*")),
    ];

    elementsToSanitize.forEach((el) => {
      try {
        // Sanitiza estilos inline
        if (el.style) {
          if (el.style.color) {
            el.style.color = safeColorToRgb(el.style.color, "#18181b");
          }
          if (el.style.backgroundColor) {
            el.style.backgroundColor = safeColorToRgb(el.style.backgroundColor, "#ffffff");
          }
          if (el.style.borderColor) {
            el.style.borderColor = safeColorToRgb(el.style.borderColor, "#cbd5e1");
          }
          if (el.style.outlineColor) {
            el.style.outlineColor = safeColorToRgb(el.style.outlineColor, "#cbd5e1");
          }
          if (el.style.fill) {
            el.style.fill = safeColorToRgb(el.style.fill, "#18181b");
          }
          if (el.style.stroke) {
            el.style.stroke = safeColorToRgb(el.style.stroke, "#18181b");
          }
          if (
            el.style.boxShadow &&
            (el.style.boxShadow.includes("lab(") ||
              el.style.boxShadow.includes("oklch(") ||
              el.style.boxShadow.includes("color("))
          ) {
            el.style.boxShadow = "none";
          }
        }

        // Sanitiza estilos computados que o browser possa ter herdado em lab/oklch
        try {
          if (typeof window !== "undefined" && window.getComputedStyle) {
            const computed = window.getComputedStyle(el);
            if (
              computed.color &&
              (computed.color.includes("lab(") || computed.color.includes("oklch("))
            ) {
              el.style.color = safeColorToRgb(computed.color, "#18181b");
            }
            if (
              computed.backgroundColor &&
              (computed.backgroundColor.includes("lab(") || computed.backgroundColor.includes("oklch("))
            ) {
              el.style.backgroundColor = safeColorToRgb(computed.backgroundColor, "#ffffff");
            }
            if (
              computed.borderColor &&
              (computed.borderColor.includes("lab(") || computed.borderColor.includes("oklch("))
            ) {
              el.style.borderColor = safeColorToRgb(computed.borderColor, "#cbd5e1");
            }
            if (
              computed.boxShadow &&
              (computed.boxShadow.includes("lab(") || computed.boxShadow.includes("oklch("))
            ) {
              el.style.boxShadow = "none";
            }
          }
        } catch {
          // Ignora erro em elementos sem suporte a getComputedStyle
        }
      } catch {
        // Ignora falha em elemento isolado
      }
    });
  } catch (err) {
    console.warn("Falha geral na sanitização defensiva:", err);
  }
}

/**
 * Ajusta quebras de página inteligentes no clone do DOM antes da captura por canvas:
 * Identifica seções (<section>), artigos e blocos individuais de experiência/educação
 * que cruzam a fronteira de 1122px (altura de 1 página A4 a 96 DPI).
 * Se um elemento cruzar a linha divisória, insere margin-top suave para que o elemento comece
 * limpo no início da próxima folha, evitando que linhas de texto sejam cortadas horizontalmente.
 */
export function applySmartPageBreaks(rootElement: HTMLElement, pageHeightPx: number = 1122) {
  try {
    const rootRect = rootElement.getBoundingClientRect();
    const rootTop = rootRect.top;

    // Seleciona elementos de bloco que não devem ser partidos ao meio
    const blockElements = Array.from(
      rootElement.querySelectorAll("section, article, header, .break-inside-avoid, [data-page-break-avoid]")
    ) as HTMLElement[];

    const subBlocks = Array.from(
      rootElement.querySelectorAll("section > div > div, section > div > p, ul > li")
    ) as HTMLElement[];

    const candidates = Array.from(new Set([...blockElements, ...subBlocks]));

    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      const elTopRelative = rect.top - rootTop;
      const elBottomRelative = rect.bottom - rootTop;
      const elHeight = rect.height;

      // Se o elemento for menor que uma folha inteira, mas cruza a borda de corte (1122, 2244, etc.):
      if (elHeight < pageHeightPx * 0.85) {
        const pageIndex = Math.floor(elTopRelative / pageHeightPx);
        const nextPageBreakY = (pageIndex + 1) * pageHeightPx;

        // Se o topo do elemento estiver antes da quebra, mas a base passar da quebra com folga de segurança:
        if (elTopRelative < nextPageBreakY && elBottomRelative > nextPageBreakY - 20) {
          const pushDistance = nextPageBreakY - elTopRelative + 20;
          const currentMarginTop = parseFloat(window.getComputedStyle(el).marginTop) || 0;
          el.style.marginTop = `${currentMarginTop + pushDistance}px`;
        }
      }
    }
  } catch (err) {
    console.warn("Aviso ao aplicar quebras de página inteligentes:", err);
  }
}

/**
 * Realiza o download seguro e resiliente de uma instância jsPDF em qualquer navegador,
 * criando um Blob explícito do tipo 'application/pdf', anexando elemento âncora temporário
 * com atributo download, disparando o clique e postergando a revogação do ObjectURL.
 */
export function triggerPdfDownload(pdf: PdfDocumentInstance, fileName: string): boolean {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      // Fallback para ambientes sem DOM (ex: testes em Node.js / Vitest)
      pdf.save(fileName);
      return true;
    }

    // 1. Gera o Blob a partir da instância jsPDF
    const pdfBlob = pdf.output("blob");
    const safeBlob = pdfBlob instanceof Blob ? pdfBlob : new Blob([pdfBlob as unknown as BlobPart], { type: "application/pdf" });

    // 2. Cria a URL temporária do Blob
    const blobUrl = URL.createObjectURL(safeBlob);

    // 3. Cria elemento âncora com o nome do arquivo para download
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = "none";
    link.setAttribute("aria-hidden", "true");

    // 4. Anexa ao documento, aciona o clique do usuário e desacopla
    document.body.appendChild(link);
    link.click();

    // 5. Revogação postergada de segurança: 60 segundos garantem que o navegador
    // tenha tempo hábil de abrir e ler o stream antes de liberar a memória.
    setTimeout(() => {
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Ignora erros na limpeza de memória
      }
    }, 60000);

    return true;
  } catch (err) {
    console.error("Falha ao disparar download do PDF via Blob:", err);
    try {
      pdf.save(fileName);
      return true;
    } catch (fallbackErr) {
      console.error("Fallback pdf.save também falhou:", fallbackErr);
      return false;
    }
  }
}

/**
 * Gera e realiza o download direto do currículo em formato A4 PDF.
 * Suporta renderização em telas móveis e desktop clonando temporariamente
 * o elemento em uma sandbox A4 com coordenadas fixas (top: 0, left: 0),
 * evitando capturas em branco ou cortes por scroll do usuário.
 * 
 * Lazy Loading de bibliotecas: importa jspdf e html2canvas-pro sob demanda.
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

    // Lazy loading sob demanda das bibliotecas pesadas de geração gráfica
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas-pro"),
    ]);

    // Criamos um contêiner sandbox com proporções rígidas de folha A4 (794px a 96 DPI).
    // Posicionado de forma invisível mas com coordenadas ativas para renderização precisa do canvas.
    offscreenContainer = document.createElement("div");
    offscreenContainer.id = "pdf-render-sandbox";
    offscreenContainer.style.position = "fixed";
    offscreenContainer.style.top = "0";
    offscreenContainer.style.left = "0";
    offscreenContainer.style.width = "794px";
    offscreenContainer.style.maxWidth = "794px";
    offscreenContainer.style.backgroundColor = "#ffffff";
    offscreenContainer.style.zIndex = "-9999";
    offscreenContainer.style.pointerEvents = "none";
    offscreenContainer.style.opacity = "1";
    offscreenContainer.style.display = "block";
    offscreenContainer.style.visibility = "visible";
    offscreenContainer.style.overflow = "visible";

    // Clona o documento profundamente para desacoplá-lo de qualquer regra de display: none
    const cloned = originalElement.cloneNode(true) as HTMLElement;
    cloned.style.display = "block";
    cloned.style.visibility = "visible";
    cloned.style.width = "794px";
    cloned.style.maxWidth = "794px";
    cloned.style.minHeight = "1123px";
    cloned.style.margin = "0";
    cloned.style.boxShadow = "none";
    cloned.style.transform = "none";

    offscreenContainer.appendChild(cloned);
    document.body.appendChild(offscreenContainer);

    // Aplica quebra inteligente de página para evitar fatiamento horizontal de texto
    applySmartPageBreaks(cloned, 1122);

    // Renderiza em canvas com html2canvas-pro e sanitização defensiva completa contra lab() e oklch()
    const canvas = await html2canvas(cloned, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 794,
      windowWidth: 794,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (clonedDoc, element) => {
        try {
          sanitizeClonedDocumentForPdf(clonedDoc, element);
        } catch (sanitizeErr) {
          console.warn("Aviso na sanitização defensiva de CSS:", sanitizeErr);
        }
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas gerado com dimensões inválidas ou vazio.");
    }

    const imgData = canvas.toDataURL("image/jpeg", 0.98);

    // Cria documento A4 (210 x 297 mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    }) as unknown as PdfDocumentInstance;

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

    return triggerPdfDownload(pdf, fileName);
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
 * 
 * Lazy Loading: importa jspdf sob demanda.
 */
export async function downloadReceiptPdf(data: ReceiptPdfData): Promise<boolean> {
  try {
    const { default: jsPDF } = await import("jspdf");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    }) as unknown as PdfDocumentInstance;

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
      ["Valor Pago:", data.formattedAmount || "R$ 5,00"],
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
      "Este documento comprova o pagamento unitário no valor fixo de R$ 5,00 para exportação do currículo em formato A4. " +
      "Em estrita observância à LGPD, o FastCurrículo adota arquitetura de zero persistência permanente de dados pessoais de candidatos. " +
      "Nenhum dado cadastral ou sensível bancário é armazenado ou compartilhado com terceiros.";
    const splitLegal = pdf.splitTextToSize(legalNotice, contentWidth);
    pdf.text(splitLegal, margin, startY + 108);

    const receiptFileName = `fastcurriculo-comprovante-pix-${data.orderId.replace(/[^a-zA-Z0-9_-]/g, "")}.pdf`;
    return triggerPdfDownload(pdf, receiptFileName);
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

