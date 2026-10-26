import { z } from "zod";

export const PersonalInfoSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  email: z.string().email("E-mail inválido").max(120),
  phone: z.string().min(8, "Telefone inválido").max(25),
  city: z.string().min(2, "Cidade é obrigatória").max(60),
  state: z.string().min(2, "Estado (UF) é obrigatório").max(30),
  age: z
    .string()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const num = Number(val.trim());
        return Number.isInteger(num) && num >= 14 && num <= 100;
      },
      { message: "A idade deve ser um número inteiro entre 14 e 100 anos" }
    )
    .optional()
    .default(""),
  linkedin: z.string().url("URL do LinkedIn inválida").or(z.literal("")).optional(),
  portfolio: z.string().url("URL de portfólio inválida").or(z.literal("")).optional(),
  photoUrl: z.string().optional(),
});

export const CareerStageSchema = z.enum(["experienced", "entry_level", "career_transition"]);

export const TargetInfoSchema = z.object({
  jobTitle: z.string().min(2, "Cargo pretendido é obrigatório").max(100),
  field: z.string().max(100).optional().default(""),
  careerStage: CareerStageSchema.optional().default("experienced"),
  careerContext: z.string().max(500).optional().default(""),
  summary: z.string().max(1200, "Resumo profissional muito extenso").optional().default(""),
  summaryTouched: z.boolean().optional(),
});

export const ExperienceItemSchema = z.object({
  id: z.string(),
  company: z.string().min(2, "Nome da empresa obrigatório").max(100),
  role: z.string().min(2, "Cargo obrigatório").max(100),
  startDate: z.string().min(2, "Data de início obrigatória").max(30),
  endDate: z.string().max(30).optional().default(""),
  current: z.boolean().default(false),
  description: z.string().max(1000, "Descrição muito longa").optional().default(""),
  achievements: z.string().max(800).optional(),
});

export const EducationItemSchema = z
  .object({
    id: z.string(),
    institution: z.string().min(2, "Instituição obrigatória").max(100),
    course: z.string().min(2, "Curso obrigatório").max(100),
    degree: z.string().min(2, "Grau/Modalidade obrigatório").max(50),
    status: z.enum(["concluido", "cursando", "incompleto"]),
    startDate: z.string().max(30).optional().default(""),
    endDate: z.string().max(30).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.status === "concluido") {
      const cleanYear = (data.endDate || "").trim();
      if (!cleanYear) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o ano de conclusão para formações concluídas.",
          path: ["endDate"],
        });
        return;
      }
      const isValidFormat = /^\d{4}$/.test(cleanYear);
      const yearNum = parseInt(cleanYear, 10);
      const currentYear = new Date().getFullYear();
      if (!isValidFormat || yearNum < 1950 || yearNum > currentYear + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe um ano de conclusão válido com 4 dígitos (ex: 2022).",
          path: ["endDate"],
        });
      }
    } else if (data.status === "cursando") {
      const cleanYear = (data.endDate || "").trim();
      if (cleanYear) {
        const isValidFormat = /^\d{4}$/.test(cleanYear);
        const yearNum = parseInt(cleanYear, 10);
        const currentYear = new Date().getFullYear();
        if (!isValidFormat || yearNum < 1950 || yearNum > currentYear + 15) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Previsão de conclusão deve ser um ano válido com 4 dígitos (ex: 2026).",
            path: ["endDate"],
          });
        }
      }
    }
  });

export const CourseItemSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Nome do curso obrigatório").max(120),
  institution: z.string().min(2, "Instituição obrigatória").max(100),
  hours: z.string().max(20).optional(),
  year: z.string().max(10).optional(),
});

export const LanguageItemSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "Idioma obrigatório").max(50),
  level: z.enum(["Básico", "Intermediário", "Avançado", "Fluente", "Nativo"]),
});

export const CustomizationSettingsSchema = z.object({
  layoutId: z.enum([
    "classic-ats",
    "modern",
    "minimalist",
    "first-job",
    "tech-specialist",
  ]),
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Cor hexadecimal inválida"),
  fontFamily: z.enum(["sans", "serif", "mono"]),
  fontSize: z.enum(["sm", "base", "lg"]),
  sectionOrder: z.array(z.string()).default([
    "summary",
    "experience",
    "education",
    "technicalSkills",
    "softSkills",
    "courses",
    "certifications",
    "languages",
  ]),
  hiddenSections: z.array(z.string()).default([]),
});

export const ResumeDataSchema = z.object({
  creationMode: z.enum(["simple", "complete"]).default("simple"),
  personal: PersonalInfoSchema,
  target: TargetInfoSchema,
  experiences: z.array(ExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  courses: z.array(CourseItemSchema).default([]),
  certifications: z.array(z.string().max(120)).default([]),
  technicalSkills: z.array(z.string().max(50)).default([]),
  softSkills: z.array(z.string().max(50)).default([]),
  languages: z.array(LanguageItemSchema).default([]),
  customization: CustomizationSettingsSchema,
});

export type ResumeDataInput = z.infer<typeof ResumeDataSchema>;
