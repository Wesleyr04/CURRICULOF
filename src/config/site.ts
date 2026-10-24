export const SITE_CONFIG = {
  name: "FastCurrículo",
  tagline: "Seu próximo currículo começa aqui.",
  description: "Organize suas informações, escolha um modelo e tenha seu currículo pronto para baixar. Sem cadastro e sem armazenar seus dados pessoais.",
  pricing: {
    amountInCents: 299,
    formatted: "R$ 2,99",
    period: "pagamento único",
    description: "por currículo gerado",
  },
  contactEmail: "contato@fastcurriculo.com.br",
  version: "1.2.0",
  privacy: {
    zeroPersistence: true,
    policyLastUpdated: "16 de Outubro de 2026",
  },
  features: [
    {
      title: "Sem cadastro ou senhas",
      description: "Você não precisa criar conta, lembrar senha nem fornecer dados desnecessários.",
      icon: "ShieldOff",
    },
    {
      title: "Seu currículo fica no seu navegador",
      description: "O FastCurrículo não grava seu currículo em banco de dados. O rascunho fica salvo no próprio navegador até você limpar os dados.",
      icon: "Lock",
    },
    {
      title: "Criação Rápida e Objetiva",
      description: "Modo Simples para quem quer um currículo direto e Modo Completo para trajetórias detalhadas.",
      icon: "Zap",
    },
    {
      title: "5 Modelos Validados por RH",
      description: "Modelos clássicos para ATS, jovem aprendiz, modernos com sidebar, linhas corporativas e especialista tech.",
      icon: "FileSpreadsheet",
    },
    {
      title: "Preço único de R$ 2,99",
      description: "Apenas R$ 2,99 por currículo via Pix. Sem assinaturas surpresa ou planos recorrentes.",
      icon: "Coins",
    },
    {
      title: "Exportação em PDF A4",
      description: "Gere seu arquivo em formato A4 pronto para impressão ou envio por e-mail e WhatsApp.",
      icon: "Download",
    },
  ],
  steps: [
    {
      step: 1,
      title: "Preencha seus dados",
      description: "Informe suas experiências profissionais, formação, habilidades e demais informações relevantes.",
    },
    {
      step: 2,
      title: "Organize seu currículo",
      description: "O FastCurrículo organiza as informações fornecidas e permite preparar um currículo adequado para apresentação profissional.",
    },
    {
      step: 3,
      title: "Gere e baixe seu PDF",
      description: "Após concluir as etapas necessárias e cumprir as condições de pagamento aplicáveis, acesse e baixe seu currículo em PDF.",
    },
  ],
  dataSecurity: [
    {
      title: "Quais dados pedimos",
      icon: "FileText",
      text: "Nome, contato (e-mail, telefone, cidade), objetivo, experiências, formação, habilidades, cursos e idiomas. Só o necessário para montar o currículo. Não pedimos CPF, RG nem endereço completo.",
    },
    {
      title: "Onde ficam os dados do currículo",
      icon: "HardDrive",
      text: "No seu próprio navegador. O FastCurrículo não grava o currículo em banco de dados. O rascunho continua salvo no navegador até você usar a opção \"Limpar dados\".",
    },
    {
      title: "Quando algo sai do seu navegador",
      icon: "Send",
      text: "Somente se você usar o aprimoramento de texto: o conteúdo é enviado pelo nosso servidor a um provedor de inteligência artificial para gerar a sugestão. Não guardamos esse texto; o provedor segue a própria política de dados.",
    },
    {
      title: "Dados técnicos do pagamento",
      icon: "Receipt",
      text: "São separados do currículo: identificador do pedido, valor, situação e horário. Ficam guardados temporariamente (até 24 horas após a confirmação) para liberar o download. O conteúdo do currículo nunca é enviado à plataforma de pagamento.",
    },
    {
      title: "Como o pagamento é feito",
      icon: "KeyRound",
      text: "Por Pix, processado por uma plataforma de pagamentos. O FastCurrículo nunca pede sua senha bancária. Confira o valor no app do seu banco antes de confirmar.",
    },
  ],
  faqs: [
    {
      question: "O que é o FastCurrículo?",
      answer: "É um serviço online que ajuda você a organizar suas informações profissionais e preparar seu currículo.",
    },
    {
      question: "Como sei se meu pagamento foi aprovado?",
      answer: "O FastCurrículo exibirá a confirmação quando o sistema identificar o pagamento como confirmado. Se houver demora, aguarde a atualização do status.",
    },
    {
      question: "O que acontece com os dados do meu currículo?",
      answer: "Eles ficam salvos no seu navegador e não são armazenados em banco de dados do FastCurrículo. Se você usar o aprimoramento de texto, o conteúdo é enviado a um provedor de IA só para gerar a sugestão. Você pode apagar o rascunho a qualquer momento em \"Limpar dados\".",
    },
    {
      question: "Onde encontro meu comprovante bancário?",
      answer: "No aplicativo ou canal oficial da instituição financeira utilizada para realizar o pagamento.",
    },
    {
      question: "E se eu pagar e não receber acesso?",
      answer: "Aguarde alguns instantes pela atualização automática do status e, se o problema persistir, entre em contato pelo canal de suporte oficial: contato@fastcurriculo.com.br.",
    },
    {
      question: "Por que apenas R$ 2,99?",
      answer: "Acreditamos que buscar emprego não deve ser um processo caro. Nosso sistema não tem custos desnecessários com servidores de banco de dados e contas de usuários, permitindo oferecer um valor acessível e justo para todos.",
    },
    {
      question: "O Fast inventa experiências ou empresas?",
      answer: "De forma alguma. Nosso serviço Fast foi configurado com restrições rígidas para apenas corrigir erros ortográficos, melhorar a clareza e transformar suas atividades reais em uma linguagem profissional, sem criar informações falsas.",
    },
    {
      question: "Os modelos são compatíveis com sistemas ATS (robôs de RH)?",
      answer: "Sim! Em especial o Modelo Clássico ATS foi desenvolvido seguindo todas as boas práticas de leitura automatizada, com estrutura linear, sem elementos gráficos distorcidos e com seções padronizadas.",
    },
    {
      question: "Posso criar meu currículo se nunca trabalhei antes?",
      answer: "Com certeza! O Modelo Primeiro Emprego foi desenhado especialmente para quem não possui experiências formais, valorizando sua formação, projetos acadêmicos, cursos e competências.",
    },
    {
      question: "Como funciona o pagamento?",
      answer: "O pagamento é feito por Pix no valor exato de R$ 2,99. Assim que a transação é confirmada, o download do PDF é liberado instantaneamente.",
    },
  ],
};
