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

  describe("Frente 1: Validação Condicional do Ano de Conclusão na Formação Acadêmica", () => {
    it("curso concluído sem ano deve falhar na validação com mensagem em PT-BR", async () => {
      const { EducationItemSchema } = await import("@/lib/schema/resume");
      const eduConcluidoSemAno = {
        id: "edu-test-1",
        institution: "USP",
        course: "Engenharia de Software",
        degree: "Bacharelado",
        status: "concluido",
        startDate: "2018",
        endDate: "",
      };
      const result = EducationItemSchema.safeParse(eduConcluidoSemAno);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Informe o ano de conclusão para formações concluídas.");
      }
    });

    it("curso concluído com ano válido de 4 dígitos deve passar com sucesso", async () => {
      const { EducationItemSchema } = await import("@/lib/schema/resume");
      const eduConcluidoComAno = {
        id: "edu-test-2",
        institution: "USP",
        course: "Engenharia de Software",
        degree: "Bacharelado",
        status: "concluido",
        startDate: "2018",
        endDate: "2022",
      };
      const result = EducationItemSchema.safeParse(eduConcluidoComAno);
      expect(result.success).toBe(true);
    });

    it("curso concluído com ano em formato inválido deve falhar com mensagem em PT-BR", async () => {
      const { EducationItemSchema } = await import("@/lib/schema/resume");
      const eduConcluidoAnoInvalido = {
        id: "edu-test-3",
        institution: "USP",
        course: "Engenharia de Software",
        degree: "Bacharelado",
        status: "concluido",
        startDate: "2018",
        endDate: "concluido em 2022",
      };
      const result = EducationItemSchema.safeParse(eduConcluidoAnoInvalido);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Informe um ano de conclusão válido com 4 dígitos (ex: 2022).");
      }
    });

    it("curso em andamento (cursando) sem ano deve passar com sucesso (opcional)", async () => {
      const { EducationItemSchema } = await import("@/lib/schema/resume");
      const eduCursandoSemAno = {
        id: "edu-test-4",
        institution: "PUC",
        course: "Direito",
        degree: "Bacharelado",
        status: "cursando",
        startDate: "2023",
        endDate: "",
      };
      const result = EducationItemSchema.safeParse(eduCursandoSemAno);
      expect(result.success).toBe(true);
    });

    it("curso em andamento (cursando) com previsão de ano futuro plausível deve passar com sucesso", async () => {
      const { EducationItemSchema } = await import("@/lib/schema/resume");
      const eduCursandoAnoFuturo = {
        id: "edu-test-5",
        institution: "PUC",
        course: "Direito",
        degree: "Bacharelado",
        status: "cursando",
        startDate: "2023",
        endDate: "2027",
      };
      const result = EducationItemSchema.safeParse(eduCursandoAnoFuturo);
      expect(result.success).toBe(true);
    });
  });

  describe("Frente 2: Campo Idade em Dados Pessoais", () => {
    it("deve aceitar idade válida entre 14 e 100 anos", () => {
      const personalValido = {
        fullName: "Carlos Eduardo",
        email: "carlos@teste.com",
        phone: "11999998888",
        city: "São Paulo",
        state: "SP",
        age: "28",
      };
      const result = PersonalInfoSchema.safeParse(personalValido);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.age).toBe("28");
      }
    });

    it("deve aceitar idade vazia ou omitida (campo opcional)", () => {
      const personalVazio = {
        fullName: "Carlos Eduardo",
        email: "carlos@teste.com",
        phone: "11999998888",
        city: "São Paulo",
        state: "SP",
        age: "",
      };
      const result = PersonalInfoSchema.safeParse(personalVazio);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar idade fora da faixa permitida (ex: 12 anos ou 105 anos)", () => {
      const personalMenor = {
        fullName: "Carlos Eduardo",
        email: "carlos@teste.com",
        phone: "11999998888",
        city: "São Paulo",
        state: "SP",
        age: "12",
      };
      const resultMenor = PersonalInfoSchema.safeParse(personalMenor);
      expect(resultMenor.success).toBe(false);

      const personalMaior = {
        ...personalMenor,
        age: "105",
      };
      const resultMaior = PersonalInfoSchema.safeParse(personalMaior);
      expect(resultMaior.success).toBe(false);
    });

    it("deve rejeitar letras ou símbolos no campo idade", () => {
      const personalLetras = {
        fullName: "Carlos Eduardo",
        email: "carlos@teste.com",
        phone: "11999998888",
        city: "São Paulo",
        state: "SP",
        age: "28a",
      };
      const result = PersonalInfoSchema.safeParse(personalLetras);
      expect(result.success).toBe(false);
    });
  });
});
