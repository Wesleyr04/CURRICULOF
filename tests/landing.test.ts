import { describe, it, expect } from "vitest";
import { SITE_CONFIG } from "@/config/site";

describe("Landing Page — Copywriting e Posicionamento", () => {
  it("deve manter o título principal intacto", () => {
    expect(SITE_CONFIG.tagline).toBe("Seu próximo currículo começa aqui.");
  });

  it("deve conter o novo subtítulo focado em praticidade, rapidez e privacidade verificável", () => {
    const expectedSubtitle =
      "Organize suas informações, escolha um modelo e tenha seu currículo pronto para baixar. Sem cadastro e sem armazenar seus dados pessoais.";
    expect(SITE_CONFIG.description).toBe(expectedSubtitle);
  });

  it("NÃO deve conter o subtítulo antigo com foco proeminente na IA", () => {
    const oldSubtitle =
      "Preencha suas informações, escolha um modelo e deixe a IA ajudar a apresentar sua experiência profissional.";
    expect(SITE_CONFIG.description).not.toBe(oldSubtitle);
    expect(SITE_CONFIG.description).not.toContain("deixe a IA ajudar");
  });

  it("deve destacar o modelo comercial de R$ 2,99 pagamento único sem mensalidade", () => {
    expect(SITE_CONFIG.pricing.amountInCents).toBe(299);
    expect(SITE_CONFIG.pricing.formatted).toBe("R$ 2,99");
    expect(SITE_CONFIG.pricing.period).toBe("pagamento único");
  });

  it("deve conter passos orientados a preenchimento, organização e download do PDF", () => {
    expect(SITE_CONFIG.steps).toHaveLength(3);
    expect(SITE_CONFIG.steps[0].title).toBe("Preencha seus dados");
    expect(SITE_CONFIG.steps[1].title).toBe("Organize seu currículo");
    expect(SITE_CONFIG.steps[2].title).toBe("Gere e baixe seu PDF");
  });

  it("deve conter a seção de dados e segurança com transparência técnica", () => {
    expect(SITE_CONFIG.dataSecurity).toBeDefined();
    expect(SITE_CONFIG.dataSecurity.length).toBeGreaterThanOrEqual(4);
    const storageItem = SITE_CONFIG.dataSecurity.find((i) => i.title.toLowerCase().includes("onde ficam"));
    expect(storageItem?.text).toContain("navegador");
  });

  it("deve manter conformidade com LGPD sem promessas indefensáveis de 'privacidade absoluta'", () => {
    const privacyFaq = SITE_CONFIG.faqs.find((f) =>
      f.question.toLowerCase().includes("dados do meu currículo")
    );
    expect(privacyFaq).toBeDefined();
    expect(privacyFaq?.answer).toContain("não são armazenados em banco de dados");
    expect(privacyFaq?.answer).not.toContain("privacidade absoluta");
  });

  it("deve conter FAQs sobre comprovante bancário e aprovação, sem menção a outro nome no Pix", () => {
    const pixNameFaq = SITE_CONFIG.faqs.find((f) => f.question.includes("outro nome no Pix"));
    const approvalFaq = SITE_CONFIG.faqs.find((f) => f.question.includes("pagamento foi aprovado"));
    const receiptFaq = SITE_CONFIG.faqs.find((f) => f.question.includes("comprovante bancário"));

    expect(pixNameFaq).toBeUndefined();
    expect(approvalFaq).toBeDefined();
    expect(receiptFaq).toBeDefined();
  });

  it("deve mapear os 5 modelos de currículo para navegação na landing page", () => {
    const featureModels = SITE_CONFIG.features.find((f) => f.title.includes("Modelos"));
    expect(featureModels).toBeDefined();
    expect(featureModels?.title).toContain("5 Modelos");
  });

  it("deve apontar o fluxo primário da landing page para o Modo Simples", () => {
    const heroTarget = "/editor?mode=simple";
    expect(heroTarget).toContain("mode=simple");
  });
});
