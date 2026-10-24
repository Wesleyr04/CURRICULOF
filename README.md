# FastCurrículo — Criador Rápido de Currículos Profissionais

> **Proposta de Valor:** "Você informa seus dados. O Fast organiza suas experiências. Você recebe um currículo profissional pronto para enviar."
> **Preço Unitário:** R$ 2,99 por currículo via Pix • **Sem cadastro** • **Zero armazenamento permanente de currículos**.

---

## 1. Visão Geral da Arquitetura

O **FastCurrículo** é uma plataforma web construída com foco em simplicidade, velocidade, segurança e proteção de dados pessoais (LGPD).

### Destaques Arquiteturais:
- **Zero Persistência de Currículos:** Não há banco de dados de currículos, nem cadastro de usuários. As informações permanecem estritamente na memória volátil do navegador do usuário durante a sessão.
- **Camada de IA Desacoplada (`IAIService`):** Suporta Google Gemini (`gemini-2.5-flash`), OpenAI (`gpt-4o-mini`), e provedor `MockAIService` para testes locais sem custo. A IA é ativada apenas sob demanda e possui restrições estritas contra invenção de dados ou alucinações.
- **Camada de Pagamento Desacoplada (`IPaymentGateway`):** Preço de R$ 2,99 estritamente fixado no servidor backend. Arquitetura desacoplada com falha controlada (HTTP 501 Not Implemented) até a ativação de um provedor específico.
- **Exportação Fiel em PDF A4:** Suporte duplo via renderização client-side (`html2canvas` + `jsPDF`) e visualização com regras CSS `@media print` para impressão vetorial direta em folha A4.
- **5 Layouts Profissionais Distintos:**
  1. **Clássico ATS:** Coluna única, linear, sem elementos gráficos distorcidos, alta compatibilidade com robôs de triagem.
  2. **Moderno Executivo:** Cabeçalho destacado, divisão equilibrada em 2 colunas com tags de habilidades.
  3. **Minimalista Editorial:** Amplo respiro visual, tipografia refinada, linhas sutis e alta elegância.
  4. **Primeiro Emprego:** Destaca potencial, formação acadêmica, cursos e competências; permite prosseguir sem experiência profissional formal.
  5. **Tecnologia & Especialistas:** Ênfase em stack técnica, repositórios de código (GitHub), certificações e impacto mensurável.

---

## 2. Estrutura de Arquivos

```text
d:/Projetos/CURRICULOFACIL/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── improve-full/route.ts      # Aprimoramento completo do currículo com validação Zod
│   │   │   │   ├── improve-text/route.ts      # Aprimoramento pontual de atividades
│   │   │   │   └── suggest-summary/route.ts   # Sugestão de resumo profissional fundamentado
│   │   │   └── payment/
│   │   │       ├── create/route.ts            # Criação de cobrança Pix de R$ 2,99 fixada no servidor
│   │   │       ├── simulate/route.ts          # Simulação de pagamento instantâneo (apenas dev/testes)
│   │   │       ├── status/route.ts            # Consulta de status e emissão de downloadToken efêmero
│   │   │       ├── verify-token/route.ts      # Validação de token de download pós-pagamento
│   │   │       └── webhook/route.ts           # Webhook seguro com HMAC e idempotência
│   │   ├── editor/page.tsx                    # Editor guiado em 6 etapas com split-view desktop e mobile
│   │   ├── modelos/page.tsx                   # Catálogo dos 5 modelos com pré-visualização ampliada
│   │   ├── privacidade/page.tsx               # Política de Privacidade e Proteção de Dados (LGPD)
│   │   ├── termos/page.tsx                    # Termos de Uso e condições comerciais
│   │   ├── globals.css                        # Estilos Tailwind e regras de impressão A4 (@media print)
│   │   ├── layout.tsx                         # RootLayout em pt-BR com SEO, Navbar e Footer
│   │   └── page.tsx                           # Landing page completa (Hero, Modelos, Passos, Benefícios, FAQ)
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Icons.tsx                      # Ícones SVG dedicados (incluindo LinkedinIcon)
│   │   ├── editor/
│   │   │   ├── StepIndicator.tsx              # Indicador de progresso com 6 etapas
│   │   │   ├── Step1Personal.tsx              # Etapa 1: Dados pessoais (sem pedir CPF/endereço de rua)
│   │   │   ├── Step2Target.tsx                # Etapa 2: Objetivo e sugestão de resumo com IA
│   │   │   ├── Step3Experience.tsx            # Etapa 3: Experiências e melhoria de atividades com IA
│   │   │   ├── Step4Education.tsx             # Etapa 4: Formação acadêmica
│   │   │   ├── Step5Skills.tsx                # Etapa 5: Habilidades, cursos, certificações e idiomas
│   │   │   ├── Step6Review.tsx                # Etapa 6: Revisão, personalização de layout/cores/fontes e IA
│   │   │   └── PaymentModal.tsx               # Modal de checkout Pix (R$ 2,99), QR code e download do PDF
│   │   ├── landing/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ModelsPreviewSection.tsx
│   │   │   ├── StepsSection.tsx
│   │   │   ├── BenefitsSection.tsx
│   │   │   └── FaqSection.tsx
│   │   └── layouts/
│   │       ├── ClassicAtsLayout.tsx
│   │       ├── ModernLayout.tsx
│   │       ├── MinimalistLayout.tsx
│   │       ├── FirstJobLayout.tsx
│   │       ├── TechSpecialistLayout.tsx
│   │       └── ResumeRenderer.tsx             # Orquestrador dos 5 modelos em formato A4
│   ├── config/
│   │   ├── site.ts                            # Configurações institucionais, preços, FAQs e textos centralizados
│   │   └── layouts.ts                         # Metadados dos 5 layouts, paletas de cores e dados padrão
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── types.ts                       # Interfaces e contratos de IA
│   │   │   ├── prompts.ts                     # Prompts seguros com sanitização contra prompt injection
│   │   │   ├── mock-service.ts                # Provedor Mock offline inteligente
│   │   │   ├── gemini-service.ts              # Provedor Google Gemini REST
│   │   │   ├── openai-service.ts              # Provedor OpenAI / Groq
│   │   │   └── factory.ts                     # Fábrica com fallback seguro
│   │   ├── payment/
│   │   │   ├── types.ts                       # Contratos de gateways de pagamento
│   │   │   ├── store.ts                       # OrderStore efêmero em memória com limpeza automática (TTL 15 min)
│   │   │   ├── mock-gateway.ts                # Provedor Pix Simulado para testes
│   │   │   └── factory.ts                     # Fábrica desacoplada com falha controlada (HTTP 501)
│   │   ├── pdf/
│   │   │   └── generate-pdf.ts                # Utilitário de geração de PDF A4 em 300dpi e print nativo
│   │   ├── schema/
│   │   │   └── resume.ts                      # Validação de schemas com Zod
│   │   └── utils/
│   │       └── cn.ts                          # Helper para fusão de classes Tailwind
│   └── types/
│       └── resume.ts                          # Tipos TypeScript do currículo
├── tests/
│   ├── ai.test.ts                             # Testes da camada de IA e integridade fatual
│   ├── layouts.test.ts                        # Testes dos 5 layouts e contratos de dados
│   ├── payment.test.ts                        # Testes de segurança financeira e preço de R$ 1,00
│   └── schema.test.ts                         # Testes de validação Zod e campos opcionais
├── .env.example                               # Modelo de variáveis de ambiente sem credenciais expostas
├── package.json
└── tsconfig.json
```

---

## 3. Instruções de Instalação e Execução

### Pré-requisitos:
- Node.js versão 20 ou superior (testado com Node.js v24.20.0).
- Gerenciador de pacotes `npm`.

### Instalação:
```bash
npm install
```

### Executar em Modo de Desenvolvimento:
```bash
npm run dev
```
Acesse: [http://localhost:3000](http://localhost:3000)

### Executar os Testes Automatizados:
```bash
npm test
```

### Executar o Build de Produção:
```bash
npm run build
```

---

## 4. Variáveis de Ambiente Necessárias

Crie um arquivo `.env.local` a partir do template `.env.example`:

```bash
cp .env.example .env.local
```

### Configurações Disponíveis:

| Variável | Padrão | Descrição |
|---|---|---|
| `AI_PROVIDER` | `anthropic` | Provedor de IA ativo (`anthropic`, `mock`, `gemini` ou `openai`) |
| `ANTHROPIC_API_KEY` | *(recomendado)* | Chave de API da Anthropic Claude |
| `ANTHROPIC_MODEL` | `claude-3-5-haiku-20241022` | Modelo oficial Anthropic |
| `GEMINI_API_KEY` | *(opcional)* | Chave de API do Google Gemini (se `AI_PROVIDER=gemini`) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Modelo do Google Gemini |
| `OPENAI_API_KEY` | *(opcional)* | Chave da OpenAI ou Groq (se `AI_PROVIDER=openai`) |
| `OPENAI_MODEL` | `gpt-4o-mini` | Modelo da OpenAI / Groq |

---

## 5. Conexão com os Provedores

### Conectar Provedor de IA (Anthropic Claude - Recomendado):
1. Gere sua chave no [Anthropic Console](https://console.anthropic.com/).
2. No seu painel da Netlify ou `.env.local`, configure:
   ```env
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=sk-ant-...sua_chave_aqui
   ANTHROPIC_MODEL=claude-3-5-haiku-20241022
   ```

### Camada de Pagamentos (Desacoplamento e Falha Controlada):
A camada de pagamentos segue a interface `IPaymentGateway` e adota o padrão de falha controlada (HTTP 501 Not Implemented) até a definição e integração de um novo provedor oficial, garantindo que nenhuma transação falsa ou mock seja aprovada em produção.

---

## 6. Estimativa de Custos Operacionais (Viabilidade de R$ 2,99)

| Componente | Provedor Selecionado | Custo Estimado por Currículo | Margem com Preço de R$ 2,99 |
|---|---|---|---|
| **Inteligência Artificial** | Claude 3.5 Haiku (~400 tokens) | R$ 0,002 a R$ 0,004 | ~R$ 2,70 |
| **Infraestrutura Web** | Netlify Serverless Functions / CDN | R$ 0,00 (camada gratuita / serverless) | - |
| **Banco de Dados** | Nenhum (Arquitetura Zero Persistência) | R$ 0,00 | - |
| **Resultado Líquido** | — | **Margem de ~90% a 95% por unidade** | **Economicamente sustentável** |

---

## 7. Relatório de Testes Executados

Execução realizada através do runner Vitest (`npm test`):
- Suíte completa de testes unitários e de integração de ponta a ponta.
- Testes cobrindo layouts, geração de resumo, contratos de payload e falha controlada 501 da camada de pagamento.

---

## 8. Checklist de Implantação em Produção na Netlify

- [ ] Definir `NODE_ENV=production` nas variáveis de ambiente da Netlify.
- [ ] Inserir credencial de IA do servidor (`ANTHROPIC_API_KEY`).
- [ ] Verificar certificados e domínio configurados na Netlify.
