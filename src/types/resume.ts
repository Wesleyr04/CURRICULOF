export type CreationMode = "simple" | "complete";

export type LayoutType =
  | "classic-ats"
  | "modern"
  | "minimalist"
  | "first-job"
  | "tech-specialist";

export type EducationStatus = "concluido" | "cursando" | "incompleto";

export type LanguageLevel =
  | "Básico"
  | "Intermediário"
  | "Avançado"
  | "Fluente"
  | "Nativo";

export type CareerStage = "experienced" | "entry_level" | "career_transition";

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  age?: string;
  linkedin?: string;
  portfolio?: string;
  photoUrl?: string; // data URL or memory URL
}

export interface TargetInfo {
  jobTitle: string;
  field?: string;
  careerStage?: CareerStage;
  careerContext?: string;
  summary: string;
  summaryTouched?: boolean;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements?: string;
}

export interface EducationItem {
  id: string;
  institution: string;
  course: string;
  degree: string;
  status: EducationStatus;
  startDate: string;
  endDate: string;
}

export interface CourseItem {
  id: string;
  name: string;
  institution: string;
  hours?: string;
  year?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  level: LanguageLevel;
}

export interface CustomizationSettings {
  layoutId: LayoutType;
  primaryColor: string;
  fontFamily: "sans" | "serif" | "mono";
  fontSize: "sm" | "base" | "lg";
  sectionOrder: string[];
  hiddenSections: string[];
}

export interface ResumeData {
  creationMode?: CreationMode;
  personal: PersonalInfo;
  target: TargetInfo;
  experiences: ExperienceItem[];
  education: EducationItem[];
  courses: CourseItem[];
  certifications: string[];
  technicalSkills: string[];
  softSkills: string[];
  languages: LanguageItem[];
  customization: CustomizationSettings;
}

export interface LayoutMetadata {
  id: LayoutType;
  name: string;
  description: string;
  badge: string;
  atsFriendly: boolean;
  recommendedFor: string;
}
