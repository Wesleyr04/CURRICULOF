"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { ClassicAtsLayout } from "./ClassicAtsLayout";
import { ModernLayout } from "./ModernLayout";
import { MinimalistLayout } from "./MinimalistLayout";
import { FirstJobLayout } from "./FirstJobLayout";
import { TechSpecialistLayout } from "./TechSpecialistLayout";
import { isAiRefusal } from "@/lib/security/content-guard";
import { resolveLayoutId } from "@/config/layouts";

interface ResumeRendererProps {
  data: ResumeData;
  isPdfView?: boolean;
  rootId?: string;
}

export function ResumeRenderer({ data, isPdfView = false, rootId }: ResumeRendererProps) {
  const layoutId = resolveLayoutId(data.customization?.layoutId) || "classic-ats";
  const fontFamily = data.customization.fontFamily || "sans";

  const fontClass =
    fontFamily === "serif"
      ? "font-serif"
      : fontFamily === "mono"
      ? "font-mono"
      : "font-sans";

  const fontStyleMap: Record<string, string> = {
    sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, Cambria, "Times New Roman", Times, ui-serif, serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  };

  // Sanitização estrita: jamais renderiza mensagens de recusa de IA como objetivo/resumo no A4
  const safeSummary = isAiRefusal(data.target.summary) ? "" : data.target.summary;
  const safeData: ResumeData = {
    ...data,
    target: {
      ...data.target,
      summary: safeSummary,
    },
  };

  const renderSelectedLayout = () => {
    switch (layoutId) {
      case "classic-ats":
        return <ClassicAtsLayout data={safeData} isPdfView={isPdfView} />;
      case "modern":
        return <ModernLayout data={safeData} isPdfView={isPdfView} />;
      case "minimalist":
        return <MinimalistLayout data={safeData} isPdfView={isPdfView} />;
      case "tech-specialist":
        return <TechSpecialistLayout data={safeData} isPdfView={isPdfView} />;
      case "first-job":
        return <FirstJobLayout data={safeData} isPdfView={isPdfView} />;
      default:
        return <ClassicAtsLayout data={safeData} isPdfView={isPdfView} />;
    }
  };

  return (
    <div
      id={rootId ?? "resume-document-root"}
      className={`resume-a4-sheet bg-white text-slate-900 shadow-lg mx-auto print:shadow-none print:m-0 print:w-full ${fontClass}`}
      style={{
        width: "100%",
        maxWidth: "210mm",
        minHeight: isPdfView ? "297mm" : "auto",
        boxSizing: "border-box",
        fontFamily: fontStyleMap[fontFamily] || fontStyleMap.sans,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {renderSelectedLayout()}
    </div>
  );
}
