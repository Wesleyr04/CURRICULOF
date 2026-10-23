"use client";

import React, { useRef, useState, useEffect } from "react";
import { LayoutType, ResumeData } from "@/types/resume";
import { EMPTY_RESUME_DATA, DEFAULT_LAYOUT_COLORS } from "@/config/layouts";
import { ResumeRenderer } from "@/components/layouts/ResumeRenderer";

interface ModelA4PreviewProps {
  layoutId: LayoutType;
  resumeData?: ResumeData;
  className?: string;
}

/**
 * ModelA4Preview: Componente de miniatura A4 com fidelidade visual 100% ao PDF e ao renderizador real.
 * Renderiza o próprio ResumeRenderer oficial escalado proporcionalmente via ResizeObserver.
 */
export function ModelA4Preview({ layoutId, resumeData, className = "" }: ModelA4PreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.26);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      if (width > 0) {
        setScale(width / 794);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    window.addEventListener("resize", updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const previewData: ResumeData = resumeData
    ? {
        ...resumeData,
        customization: {
          ...resumeData.customization,
          layoutId,
          primaryColor: resumeData.customization?.primaryColor || DEFAULT_LAYOUT_COLORS[layoutId] || "#0f172a",
        },
      }
    : {
        ...EMPTY_RESUME_DATA,
        customization: {
          ...EMPTY_RESUME_DATA.customization,
          layoutId,
          primaryColor: DEFAULT_LAYOUT_COLORS[layoutId] || "#0f172a",
        },
      };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-white select-none pointer-events-none ${className}`}
      style={{
        aspectRatio: "794 / 1123",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          width: "794px",
          minHeight: "1123px",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        <ResumeRenderer
          data={previewData}
          rootId={`preview-thumb-${layoutId}`}
          isPdfView={false}
        />
      </div>
    </div>
  );
}
