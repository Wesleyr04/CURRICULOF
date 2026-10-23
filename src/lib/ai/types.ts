import { ResumeData, CreationMode, CareerStage } from "@/types/resume";

export interface AISuggestSummaryParams {
  jobTitle: string;
  field?: string;
  careerStage?: CareerStage;
  careerContext?: string;
  currentSummary?: string;
  experiences?: Array<{
    role: string;
    company: string;
    description: string;
    achievements?: string;
  }>;
  skills?: string[];
  softSkills?: string[];
  education?: Array<{
    course: string;
    institution: string;
  }>;
  courses?: Array<{
    name: string;
    institution: string;
  }>;
  certifications?: string[];
  mode?: CreationMode;
  correlationId?: string;
}

export interface AIImproveTextParams {
  rawText: string;
  context: "experience" | "summary" | "skills";
  jobTitle?: string;
  careerStage?: CareerStage;
  careerContext?: string;
  company?: string;
  achievements?: string;
  mode?: CreationMode;
  correlationId?: string;
}

export interface IAIService {
  providerName: string;
  suggestSummary(params: AISuggestSummaryParams): Promise<string>;
  improveText(params: AIImproveTextParams): Promise<string>;
  improveFullResume(
    resumeData: ResumeData,
    mode?: CreationMode,
    correlationId?: string
  ): Promise<ResumeData>;
}
