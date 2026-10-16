import { ResumeData, CreationMode } from "@/types/resume";

export interface AISuggestSummaryParams {
  jobTitle: string;
  field: string;
  experiences?: Array<{
    role: string;
    company: string;
    description: string;
  }>;
  skills?: string[];
  education?: Array<{
    course: string;
    institution: string;
  }>;
  mode?: CreationMode;
}

export interface AIImproveTextParams {
  rawText: string;
  context: "experience" | "summary" | "skills";
  jobTitle?: string;
  mode?: CreationMode;
}

export interface IAIService {
  providerName: string;
  suggestSummary(params: AISuggestSummaryParams): Promise<string>;
  improveText(params: AIImproveTextParams): Promise<string>;
  improveFullResume(resumeData: ResumeData, mode?: CreationMode): Promise<ResumeData>;
}
