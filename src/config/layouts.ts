import { LayoutMetadata, ResumeData } from "@/types/resume";

export const AVAILABLE_LAYOUTS: LayoutMetadata[] = [
  {
    id: "first-job",
    name: "Jovem Aprendiz / 1º Emprego",
    description: "Estrutura limpa em coluna única, preto e branco, ideal para estágio, jovem aprendiz e início de carreira.",
    badge: "Estágio & 1º Emprego",
    atsFriendly: true,
    recommendedFor: "Estágio, Jovem Aprendiz, Primeiro Emprego e Auxiliares.",
  },
  {
    id: "classic-ats",
    name: "Simples & Preto (Operacional)",
    description: "Monocromático objetivo com detalhe geométrico e leitura rápida, focado em vendas, atendimento e rotinas gerais.",
    badge: "100% ATS / Operacional",
    atsFriendly: true,
    recommendedFor: "Vendedores, Atendimento, Auxiliares e Administrativo Geral.",
  },
  {
    id: "modern",
    name: "Marrom & Moderno (Executivo)",
    description: "Layout refinado em 2 colunas com sidebar marrom elegante (#6E5034), ideal para analistas e perfis plenos.",
    badge: "Mais Popular / Executivo",
    atsFriendly: true,
    recommendedFor: "Analistas Financeiros, Administrativos, Especialistas e Perfis Plenos.",
  },
  {
    id: "minimalist",
    name: "Azul Linhas Simples (Corporativo)",
    description: "Estrutura corporativa em 2 colunas com linhas horizontais em azul marinho (#1E3A5F) para liderança e especialistas.",
    badge: "Corporativo & Liderança",
    atsFriendly: true,
    recommendedFor: "Comercial, Logística, Administrativo Sênior e Liderança.",
  },
];

export const INITIAL_RESUME_DATA: ResumeData = {
  creationMode: "simple",
  personal: {
    fullName: "Carlos Eduardo Silva",
    email: "carlos.silva@email.com",
    phone: "(11) 98765-4321",
    city: "São Paulo",
    state: "SP",
    linkedin: "https://linkedin.com/in/carlos-silva-exemplo",
    portfolio: "https://github.com/carlossilva-exemplo",
  },
  target: {
    jobTitle: "Analista de Suporte e Sistemas",
    field: "Tecnologia da Informação",
    summary: "Profissional de TI com experiência em atendimento ao usuário, resolução de incidentes e sustentação de sistemas. Focado em melhoria contínua, documentação técnica e automação de processos operacionais.",
  },
  experiences: [
    {
      id: "exp-1",
      company: "TechServ Soluções Digitais",
      role: "Analista de Suporte Pleno",
      startDate: "Março 2023",
      endDate: "Atual",
      current: true,
      description: "Atendimento N2 a clientes corporativos em ambiente de alta criticidade. Gestão de chamados, suporte a bancos de dados relacionais e monitoramento de servidores em nuvem.",
      achievements: "Redução do tempo médio de atendimento (TMA) em 25% através da criação de base de conhecimento compartilhada.",
    },
    {
      id: "exp-2",
      company: "Inovare Distribuidora",
      role: "Assistente de TI",
      startDate: "Janeiro 2021",
      endDate: "Fevereiro 2023",
      current: false,
      description: "Configuração de computadores, redes locais, manutenção de impressoras e suporte direto aos colaboradores internos nos módulos do ERP.",
      achievements: "Implementação de rotina preventiva de backup semanal diminuindo perda de arquivos em 90%.",
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "Universidade Nove de Julho",
      course: "Análise e Desenvolvimento de Sistemas",
      degree: "Tecnólogo",
      status: "concluido",
      startDate: "2020",
      endDate: "2022",
    },
  ],
  courses: [
    {
      id: "course-1",
      name: "Fundamentos de Redes e Cloud Computing (AWS)",
      institution: "Escola Digital Brasil",
      hours: "40 horas",
      year: "2023",
    },
    {
      id: "course-2",
      name: "SQL Avançado e Modelagem de Dados",
      institution: "Alura",
      hours: "30 horas",
      year: "2022",
    },
  ],
  certifications: [
    "ITIL v4 Foundation",
    "AWS Certified Cloud Practitioner (Em andamento)",
  ],
  technicalSkills: [
    "Suporte N1/N2",
    "SQL / PostgreSQL",
    "Linux / Windows Server",
    "Redes TCP/IP",
    "Git / GitHub",
    "Jira & Confluence",
  ],
  softSkills: [
    "Comunicação assertiva",
    "Resolução de problemas",
    "Trabalho em equipe",
    "Proatividade",
    "Empatia com o usuário",
  ],
  languages: [
    {
      id: "lang-1",
      name: "Inglês",
      level: "Intermediário",
    },
    {
      id: "lang-2",
      name: "Espanhol",
      level: "Básico",
    },
  ],
  customization: {
    layoutId: "classic-ats",
    primaryColor: "#1e3a8a", // Navy Blue profissional
    fontFamily: "sans",
    fontSize: "base",
    sectionOrder: [
      "summary",
      "experience",
      "education",
      "technicalSkills",
      "softSkills",
      "courses",
      "certifications",
      "languages",
    ],
    hiddenSections: [],
  },
};

export const COLOR_PALETTES = [
  { name: "Azul Marinho (Padrão)", value: "#1e3a8a", borderClass: "border-blue-900" },
  { name: "Grafite Clássico", value: "#334155", borderClass: "border-slate-700" },
  { name: "Verde Floresta", value: "#14532d", borderClass: "border-green-900" },
  { name: "Bordô Nobre", value: "#831843", borderClass: "border-pink-900" },
  { name: "Azul Petróleo", value: "#0f766e", borderClass: "border-teal-700" },
];
