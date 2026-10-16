import { z } from "zod";

export const PersonalInfoSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(100),
  email: z.string().email("E-mail inválido").max(120),
  phone: z.string().min(8, "Telefone inválido").max(25),
  city: z.string().min(2, "Cidade é obrigatória").max(60),
  state: z.string().min(2, "Estado (UF) é obrigatório").max(30),
  linkedin: z.string().url("URL do LinkedIn inválida").or(z.literal("")).optional(),
  portfolio: z.string().url("URL de portfólio inválida").or(z.literal("")).optional(),
  photoUrl: z.string().optional(),
});

export const TargetInfoSchema = z.object({
  jobTitle: z.string().min(2, "Cargo desejado é obrigatório").max(100),
  field: z.string().min(2, "Área profissional é obrigatória").max(100),
  summary: z.string().max(1200, "Resumo profissional muito extenso").optional().default(""),
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

export const EducationItemSchema = z.object({
  id: z.string(),
  institution: z.string().min(2, "Instituição obrigatória").max(100),
  course: z.string().min(2, "Curso obrigatório").max(100),
  degree: z.string().min(2, "Grau/Modalidade obrigatório").max(50),
  status: z.enum(["concluido", "cursando", "incompleto"]),
  startDate: z.string().max(30).optional().default(""),
  endDate: z.string().max(30).optional().default(""),
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
