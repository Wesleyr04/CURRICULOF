import { describe, it, expect } from "vitest";
import { ResumeDataSchema, PersonalInfoSchema } from "@/lib/schema/resume";
import { INITIAL_RESUME_DATA } from "@/config/layouts";

describe("Validação de Esquemas de Currículo com Zod", () => {
  it("deve validar com sucesso os dados padrão iniciais completos", () => {
    const result = ResumeDataSchema.safeParse(INITIAL_RESUME_DATA);
    expect(result.success).toBe(true);
  });

  it("deve aceitar currículo sem experiência profissional (Primeiro Emprego)", () => {
    const firstJobResume = {
      ...INITIAL_RESUME_DATA,
      experiences: [],
    };
    const result = ResumeDataSchema.safeParse(firstJobResume);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.experiences).toHaveLength(0);
    }
  });

  it("deve aceitar campos opcionais vazios ou omitidos (linkedin, portfolio, photoUrl)", () => {
    const minimalPersonal = {
      fullName: "Maria Oliveira",
      email: "maria@teste.com",
      phone: "11988887777",
      city: "Campinas",
      state: "SP",
    };
    const result = PersonalInfoSchema.safeParse(minimalPersonal);
    expect(result.success).toBe(true);
  });

  it("deve rejeitar e-mail inválido", () => {
    const invalidPersonal = {
      fullName: "João",
      email: "email-invalido-sem-arroba",
      phone: "11988887777",
      city: "Rio de Janeiro",
      state: "RJ",
    };
    const result = PersonalInfoSchema.safeParse(invalidPersonal);
    expect(result.success).toBe(false);
  });

  it("deve rejeitar cor com formato hexadecimal inválido", () => {
    const invalidCustomization = {
      ...INITIAL_RESUME_DATA,
      customization: {
        ...INITIAL_RESUME_DATA.customization,
        primaryColor: "cor-invalida",
      },
    };
    const result = ResumeDataSchema.safeParse(invalidCustomization);
    expect(result.success).toBe(false);
  });
});
