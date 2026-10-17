"use client";

import React from "react";
import { ResumeData } from "@/types/resume";
import { ClassicAtsLayout } from "./ClassicAtsLayout";
import { ModernLayout } from "./ModernLayout";
import { MinimalistLayout } from "./MinimalistLayout";
import { FirstJobLayout } from "./FirstJobLayout";
import { TechSpecialistLayout } from "./TechSpecialistLayout";

interface ResumeRendererProps {
  data: ResumeData;
  isPdfView?: boolean;
}

export function ResumeRenderer({ data, isPdfView = false }: ResumeRendererProps) {
  const layoutId = data.customization.layoutId || "classic-ats";
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

  const renderSelectedLayout = () => {
    switch (layoutId) {
      case "classic-ats":
        return <ClassicAtsLayout data={data} isPdfView={isPdfView} />;
      case "modern":
        return <ModernLayout data={data} isPdfView={isPdfView} />;
      case "minimalist":
        return <MinimalistLayout data={data} isPdfView={isPdfView} />;
      case "first-job":
        return <FirstJobLayout data={data} isPdfView={isPdfView} />;
      case "tech-specialist":
        return <TechSpecialistLayout data={data} isPdfView={isPdfView} />;
      default:
        return <ClassicAtsLayout data={data} isPdfView={isPdfView} />;
    }
  };

  return (
    <div
      id="resume-document-root"
      className={`resume-a4-sheet bg-white text-slate-900 shadow-lg mx-auto print:shadow-none print:m-0 print:w-full ${fontClass}`}
      style={{
        width: "100%",
        maxWidth: "210mm",
        minHeight: isPdfView ? "297mm" : "auto",
        boxSizing: "border-box",
        fontFamily: fontStyleMap[fontFamily] || fontStyleMap.sans,
      }}
    >
      {renderSelectedLayout()}
    </div>
  );
}
