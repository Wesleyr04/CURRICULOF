import { ResumeData } from "@/types/resume";

export interface SmartLayoutMetrics {
  density: "compact" | "normal" | "airy";
  fontSizePx: string;
  spacingClass: string;
  score: number;
  hasExperiences: boolean;
  hasEducation: boolean;
  hasCourses: boolean;
  hasTechnicalSkills: boolean;
  hasSoftSkills: boolean;
  hasLanguages: boolean;
  hasCertifications: boolean;
  hasSummary: boolean;
  hasPhoto: boolean;
  hasLinkedin: boolean;
  hasPortfolio: boolean;
}

/**
 * Motor de Auto-Adaptação (Smart Layout Engine)
 * Calcula a densidade ideal e determina quais seções devem ser exibidas
 * garantindo harmonia visual e mantendo o documento rigorosamente em 1 página A4.
 */
export function calculateSmartLayout(data: ResumeData): SmartLayoutMetrics {
  const validExperiences = (data.experiences || []).filter(
    (e) => (e.company && e.company.trim().length > 0) || (e.role && e.role.trim().length > 0)
  );

  const validEducation = (data.education || []).filter(
    (e) => (e.institution && e.institution.trim().length > 0) || (e.course && e.course.trim().length > 0)
  );

  const validCourses = (data.courses || []).filter(
    (c) => c.name && c.name.trim().length > 0
  );

  const validTechSkills = (data.technicalSkills || []).filter((s) => s && s.trim().length > 0);
  const validSoftSkills = (data.softSkills || []).filter((s) => s && s.trim().length > 0);

  const validLanguages = (data.languages || []).filter(
    (l) => l.name && l.name.trim().length > 0
  );

  const validCertifications = (data.certifications || []).filter(
    (c) => c && c.trim().length > 0
  );

  const summaryText = data.target?.summary?.trim() || "";
  const hasSummary = summaryText.length > 0;

  // Cálculo de volume relativo (peso de ocupação em página A4)
  let score = 0;
  score += validExperiences.length * 6;
  validExperiences.forEach((exp) => {
    score += Math.ceil((exp.description?.length || 0) / 75);
    if (exp.achievements?.trim()) score += 2;
  });

  score += validEducation.length * 4;
  score += validCourses.length * 2.5;
  score += Math.ceil((validTechSkills.length + validSoftSkills.length) / 3);
  score += validLanguages.length * 2;
  score += validCertifications.length * 2;
  score += Math.ceil(summaryText.length / 85);

  let density: "compact" | "normal" | "airy" = "normal";
  if (score > 24) {
    density = "compact";
  } else if (score < 13) {
    density = "airy";
  }

  const fontSizePx = density === "compact" ? "12px" : density === "airy" ? "14px" : "13px";
  const spacingClass = density === "compact" ? "space-y-3" : density === "airy" ? "space-y-6" : "space-y-4";

  return {
    density,
    fontSizePx,
    spacingClass,
    score,
    hasExperiences: validExperiences.length > 0,
    hasEducation: validEducation.length > 0,
    hasCourses: validCourses.length > 0,
    hasTechnicalSkills: validTechSkills.length > 0,
    hasSoftSkills: validSoftSkills.length > 0,
    hasLanguages: validLanguages.length > 0,
    hasCertifications: validCertifications.length > 0,
    hasSummary,
    hasPhoto: Boolean(data.personal?.photoUrl),
    hasLinkedin: Boolean(data.personal?.linkedin?.trim()),
    hasPortfolio: Boolean(data.personal?.portfolio?.trim()),
  };
}

/**
 * Detecta se uma cor hexadecimal é considerada clara para contraste
 */
export function isColorLight(hex: string): boolean {
  if (!hex) return false;
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length !== 6) return false;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 130;
}
