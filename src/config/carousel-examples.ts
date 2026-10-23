import { ResumeData, LayoutType } from "@/types/resume";
import { DEFAULT_LAYOUT_COLORS } from "@/config/layouts";

export interface CarouselExample {
  id: string;
  professionTitle: string;
  shortLabel: string;
  layoutId: LayoutType;
  layoutName: string;
  badge: string;
  resumeData: ResumeData;
}

export const CAROUSEL_EXAMPLES: CarouselExample[] = [
  // 1. Professor(a) de Ensino Fundamental / Médio
  {
    id: "ex-professor",
    professionTitle: "Professor(a) de Ensino Fundamental / Médio",
    shortLabel: "Exemplo: Professor(a)",
    layoutId: "minimalist",
    layoutName: "Azul Linhas Simples (Corporativo)",
    badge: "Educação & Pedagogia",
    resumeData: {
      creationMode: "complete",
      personal: {
        fullName: "Mariana Souza Ribeiro",
        email: "mariana.ribeiro.prof@email.com",
        phone: "(11) 98452-1140",
        city: "São Paulo",
        state: "SP",
        linkedin: "https://linkedin.com/in/mariana-souza-ribeiro",
        portfolio: "",
      },
      target: {
        jobTitle: "Professora de Ensino Fundamental e Médio",
        field: "Educação Básica",
        summary:
          "Profissional da educação com experiência em planejamento pedagógico alinhado à BNCC, gestão de sala de aula e aplicação de metodologias ativas para engajamento e evolução do aprendizado dos alunos.",
      },
      experiences: [
        {
          id: "exp-prof-1",
          company: "Colégio Integrado Horizonte",
          role: "Professora de Língua Portuguesa e Literatura",
          startDate: "Fevereiro 2022",
          endDate: "Atual",
          current: true,
          description:
            "Docência para turmas de Ensino Fundamental II e Médio. Elaboração de planos de aula interdisciplinares alinhados às competências gerais da BNCC, mediação de projetos de leitura e condução de reuniões pedagógicas e atendimentos individualizados a pais e responsáveis.",
          achievements:
            "Aumento de 35% no índice de proficiência leitora das turmas por meio de oficinas interativas de produção textual e círculos de literatura.",
        },
        {
          id: "exp-prof-2",
          company: "Escola Municipal Monteiro Lobato",
          role: "Docente de Educação Básica",
          startDate: "Fevereiro 2019",
          endDate: "Dezembro 2021",
          current: false,
          description:
            "Aplicação de avaliações diagnósticas, desenvolvimento de planos de aula adaptados e recuperação paralela de aprendizagem. Coordenação de projetos extracurriculares de ciências e feiras culturais da comunidade escolar.",
          achievements:
            "Redução da evasão escolar no contraturno através da implementação de metodologias ativas e dinâmicas colaborativas em grupo.",
        },
      ],
      education: [
        {
          id: "edu-prof-1",
          institution: "Universidade de São Paulo (USP)",
          course: "Licenciatura Plena em Letras e Pedagogia",
          degree: "Graduação",
          status: "concluido",
          startDate: "2015",
          endDate: "2018",
        },
      ],
      courses: [
        {
          id: "crs-prof-1",
          name: "Metodologias Ativas e Tecnologias Educacionais",
          institution: "Instituto Singularidades",
          hours: "60 horas",
          year: "2023",
        },
        {
          id: "crs-prof-2",
          name: "BNCC na Prática: Planejamento e Avaliação Formativa",
          institution: "Nova Escola",
          hours: "40 horas",
          year: "2021",
        },
      ],
      certifications: [
        "Certificação em Educação Inclusiva e Acessibilidade Pedagógica",
      ],
      technicalSkills: [
        "Planejamento Pedagógico (BNCC)",
        "Gestão de Sala de Aula",
        "Metodologias Ativas",
        "Comunicação Didática",
        "Avaliação Escolar",
      ],
      softSkills: [
        "Empatia e Escuta Ativa",
        "Mediação de Conflitos",
        "Organização e Pontualidade",
        "Trabalho em Equipe Multidisciplinar",
      ],
      languages: [
        {
          id: "lang-prof-1",
          name: "Inglês",
          level: "Intermediário",
        },
      ],
      customization: {
        layoutId: "minimalist",
        primaryColor: DEFAULT_LAYOUT_COLORS["minimalist"] || "#1e3a5f",
        fontFamily: "sans",
        fontSize: "base",
        sectionOrder: [
          "summary",
          "experience",
          "education",
          "technicalSkills",
          "courses",
          "softSkills",
          "certifications",
          "languages",
        ],
        hiddenSections: [],
      },
    },
  },

  // 2. Faxineira / Auxiliar de Limpeza e Conservação
  {
    id: "ex-faxineira",
    professionTitle: "Faxineira / Auxiliar de Limpeza e Conservação",
    shortLabel: "Exemplo: Faxineira / Limpeza",
    layoutId: "classic-ats",
    layoutName: "Simples & Preto (Operacional)",
    badge: "Serviços Gerais & Conservação",
    resumeData: {
      creationMode: "simple",
      personal: {
        fullName: "Maria de Fátima Oliveira",
        email: "maria.fatima.conservacao@email.com",
        phone: "(11) 97120-6588",
        city: "Guarulhos",
        state: "SP",
        linkedin: "",
        portfolio: "",
      },
      target: {
        jobTitle: "Auxiliar de Limpeza e Conservação",
        field: "Serviços Gerais e Higienização",
        summary:
          "Profissional dedicada e pontual, com sólida experiência na higienização, organização e conservação de ambientes residenciais, comerciais e corporativos, prezando pelo cuidado com materiais e cumprimento rigoroso de rotinas.",
      },
      experiences: [
        {
          id: "exp-fax-1",
          company: "LimpeMais Terceirização e Serviços Ltda",
          role: "Auxiliar de Limpeza Corporativa",
          startDate: "Maio 2022",
          endDate: "Atual",
          current: true,
          description:
            "Limpeza detalhada de salas administrativas, vidros, áreas comuns de alto tráfego e sanitários. Diluição técnica e aplicação correta de produtos químicos de higienização segundo fichas de segurança (FISPQ), além da reposição pontual de insumos como papel toalha e sabonete.",
          achievements:
            "Reconhecida com índice de 100% de pontualidade e assiduidade durante 2 anos consecutivos na equipe de conservação predial.",
        },
        {
          id: "exp-fax-2",
          company: "Edifício Comercial Alpha Office Tower",
          role: "Auxiliar de Serviços Gerais e Conservação",
          startDate: "Agosto 2019",
          endDate: "Abril 2022",
          current: false,
          description:
            "Higienização de pisos com lavadoras industriais e enceradeiras, coleta seletiva de resíduos, desinfecção de corrimãos e elevadores, e apoio na organização de copas e reposição diária de materiais de limpeza.",
          achievements:
            "Otimização no controle de estoque de insumos, reduzindo o desperdício mensal de desinfetantes e descartáveis em 18%.",
        },
      ],
      education: [
        {
          id: "edu-fax-1",
          institution: "E.E. Padre Manoel da Nóbrega",
          course: "Ensino Médio Completo",
          degree: "Ensino Médio",
          status: "concluido",
          startDate: "2013",
          endDate: "2016",
        },
      ],
      courses: [
        {
          id: "crs-fax-1",
          name: "Boas Práticas de Higienização e Desinfecção Profissional",
          institution: "SENAC SP",
          hours: "30 horas",
          year: "2021",
        },
        {
          id: "crs-fax-2",
          name: "Normas de Segurança no Trabalho (NR-06 - EPIs)",
          institution: "Centro de Formação Técnica",
          hours: "20 horas",
          year: "2020",
        },
      ],
      certifications: [],
      technicalSkills: [
        "Higienização Profunda",
        "Organização de Ambientes",
        "Controle de Produtos e Insumos",
        "Agilidade e Zelo",
        "Pontualidade e Discrição",
      ],
      softSkills: [
        "Atenção aos Detalhes",
        "Confiabilidade e Honestidade",
        "Disposição Física e Foco",
        "Trabalho em Equipe e Respeito",
      ],
      languages: [],
      customization: {
        layoutId: "classic-ats",
        primaryColor: DEFAULT_LAYOUT_COLORS["classic-ats"] || "#0f172a",
        fontFamily: "sans",
        fontSize: "base",
        sectionOrder: [
          "summary",
          "experience",
          "education",
          "technicalSkills",
          "courses",
          "softSkills",
        ],
        hiddenSections: ["languages", "certifications"],
      },
    },
  },

  // 3. Padeiro(a) / Confeiteiro(a)
  {
    id: "ex-padeiro",
    professionTitle: "Padeiro(a) / Confeiteiro(a)",
    shortLabel: "Exemplo: Padeiro(a)",
    layoutId: "first-job",
    layoutName: "Jovem Aprendiz / 1º Emprego",
    badge: "Gastronomia & Panificação",
    resumeData: {
      creationMode: "simple",
      personal: {
        fullName: "José Roberto dos Santos",
        email: "roberto.panificacao@email.com",
        phone: "(11) 99870-3412",
        city: "Santo André",
        state: "SP",
        linkedin: "",
        portfolio: "",
      },
      target: {
        jobTitle: "Padeiro e Confeiteiro Profissional",
        field: "Panificação e Confeitaria",
        summary:
          "Profissional de panificação com prática no preparo de pães artesanais, massas doces e salgadas em alta tiragem, dominando processos de fermentação, forneamento e rigoroso controle de higiene e validade.",
      },
      experiences: [
        {
          id: "exp-pad-1",
          company: "Padaria e Confeitaria Pão D'Ouro",
          role: "Padeiro Chefe de Turno",
          startDate: "Outubro 2021",
          endDate: "Atual",
          current: true,
          description:
            "Produção diária de pães franceses, rústicos, baguetes de fermentação natural (levain) e massas folhadas. Pesagem precisa de ingredientes, operação de masseiras industriais e cilindros, monitoramento de câmaras de fermentação e fornos lastro e turbo.",
          achievements:
            "Padronizou as fichas técnicas de 12 receitas de pães artesanais, elevando as vendas de pães especiais em 40% e zerando quebras de fornada.",
        },
        {
          id: "exp-pad-2",
          company: "Supermercados Estrela - Setor de Panificação",
          role: "Auxiliar de Padeiro e Forneiro",
          startDate: "Março 2018",
          endDate: "Setembro 2021",
          current: false,
          description:
            "Preparação e modelagem de pães doces, salgados e broas. Controle rigoroso de tempo e temperatura de forneamento, reposição de balcões e higienização diária de bancadas e maquinários conforme normas da ANVISA.",
          achievements:
            "Diminuiu o desperdício de insumos na pesagem de massas em 15% através da implantação de tabela de rendimento por lote.",
        },
      ],
      education: [
        {
          id: "edu-pad-1",
          institution: "SENAI - Escola de Panificação e Confeitaria",
          course: "Técnico em Panificação e Confeitaria",
          degree: "Curso Técnico",
          status: "concluido",
          startDate: "2016",
          endDate: "2017",
        },
      ],
      courses: [
        {
          id: "crs-pad-1",
          name: "Boas Práticas de Manipulação de Alimentos (ANVISA)",
          institution: "SENAI Alimentação",
          hours: "40 horas",
          year: "2022",
        },
        {
          id: "crs-pad-2",
          name: "Panificação Artesanal e Fermentação Lenta (Levain)",
          institution: "Instituto de Gastronomia Aplicada",
          hours: "32 horas",
          year: "2020",
        },
      ],
      certifications: [
        "Certificado de Manipulador de Alimentos - Vigilância Sanitária",
      ],
      technicalSkills: [
        "Panificação Comercial e Artesanal",
        "Controle de Fermentação e Forno",
        "Boas Práticas de Manipulação (ANVISA)",
        "Padronização de Receitas",
        "Controle de Estoque/Desperdício",
      ],
      softSkills: [
        "Disciplina e Trabalho em Turno Noturno/Madrugada",
        "Atenção ao Padrão de Qualidade",
        "Agilidade sob Demanda Intensa",
        "Espírito de Equipe na Produção",
      ],
      languages: [],
      customization: {
        layoutId: "first-job",
        primaryColor: DEFAULT_LAYOUT_COLORS["first-job"] || "#0f172a",
        fontFamily: "sans",
        fontSize: "base",
        sectionOrder: [
          "summary",
          "experience",
          "education",
          "technicalSkills",
          "courses",
          "certifications",
          "softSkills",
        ],
        hiddenSections: ["languages"],
      },
    },
  },

  // 4. Pintor(a) Profissional (Residencial e Comercial)
  {
    id: "ex-pintor",
    professionTitle: "Pintor(a) Profissional (Residencial e Comercial)",
    shortLabel: "Exemplo: Pintor(a)",
    layoutId: "classic-ats",
    layoutName: "Simples & Preto (Operacional)",
    badge: "Construção Civil & Acabamento",
    resumeData: {
      creationMode: "simple",
      personal: {
        fullName: "Marcos Aurélio da Silva",
        email: "marcos.pinturas.pro@email.com",
        phone: "(11) 96530-8910",
        city: "Campinas",
        state: "SP",
        linkedin: "",
        portfolio: "",
      },
      target: {
        jobTitle: "Pintor Profissional Residencial e Comercial",
        field: "Construção Civil e Reformas",
        summary:
          "Pintor profissional com ampla experiência em preparação de superfícies, acabamento fino e revitalização de ambientes internos e externos, garantindo limpeza na execução e entrega rigorosamente dentro do prazo.",
      },
      experiences: [
        {
          id: "exp-pnt-1",
          company: "Silva & Filhos Reformas e Acabamentos",
          role: "Pintor Especialista em Acabamento Fino",
          startDate: "Janeiro 2021",
          endDate: "Atual",
          current: true,
          description:
            "Execução de serviços de pintura em residências de alto padrão e lojas comerciais. Aplicação de massa corrida e massa acrílica com lixamento técnico aspirado, recorte milimétrico de tetos e rodapés, aplicação de tintas acrílicas laváveis, esmalte sintético em portas e janelas e impermeabilização preventiva de fachadas.",
          achievements:
            "Mais de 45 imóveis entregues sem nenhuma queixa de respingos ou atraso na entrega das chaves nos últimos 3 anos.",
        },
        {
          id: "exp-pnt-2",
          company: "Engenharia e Manutenção Predial Vanguarda",
          role: "Pintor de Manutenção Predial",
          startDate: "Fevereiro 2017",
          endDate: "Dezembro 2020",
          current: false,
          description:
            "Isolamento e proteção de pisos, móveis e esquadrias com fitas e lonas. Tratamento de trincas dinâmicas com telas e selantes elastoméricos, aplicação de textura projetada e pintura em epóxi em garagens e pisos industriais.",
          achievements:
            "Otimizou o rendimento de galões de tinta em 15% através do uso de pistolas airless de alta pressão com regulagem precisa de vazão.",
        },
      ],
      education: [
        {
          id: "edu-pnt-1",
          institution: "E.E. Bento Quirino",
          course: "Ensino Médio",
          degree: "Ensino Médio",
          status: "concluido",
          startDate: "2010",
          endDate: "2013",
        },
      ],
      courses: [
        {
          id: "crs-pnt-1",
          name: "Técnicas de Pintura Imobiliária e Acabamento Fino",
          institution: "Escola SENAI da Construção Civil",
          hours: "40 horas",
          year: "2020",
        },
        {
          id: "crs-pnt-2",
          name: "Tratamento de Superfícies, Texturas e Impermeabilizantes",
          institution: "Instituto de Capacitação Suvinil",
          hours: "24 horas",
          year: "2019",
        },
      ],
      certifications: [
        "NR-35: Trabalho em Altura para Pintura de Fachadas",
      ],
      technicalSkills: [
        "Preparação de Superfícies e Massa Corrida",
        "Pintura Interna e Externa",
        "Acabamento Fino e Recorte",
        "Texturas e Impermeabilização",
        "Organização e Limpeza de Obra",
      ],
      softSkills: [
        "Rigor no Cumprimento de Prazos",
        "Cuidado e Respeito ao Patrimônio do Cliente",
        "Comunicação Clara e Orçamentação Transparente",
        "Postura Profissional e Foco no Detalhe",
      ],
      languages: [],
      customization: {
        layoutId: "classic-ats",
        primaryColor: DEFAULT_LAYOUT_COLORS["classic-ats"] || "#0f172a",
        fontFamily: "sans",
        fontSize: "base",
        sectionOrder: [
          "summary",
          "experience",
          "education",
          "technicalSkills",
          "courses",
          "certifications",
          "softSkills",
        ],
        hiddenSections: ["languages"],
      },
    },
  },

  // 5. Assistente / Analista de Recursos Humanos (RH)
  {
    id: "ex-rh",
    professionTitle: "Assistente / Analista de Recursos Humanos (RH)",
    shortLabel: "Exemplo: Analista de RH",
    layoutId: "modern",
    layoutName: "Marrom & Moderno (Executivo)",
    badge: "Recursos Humanos & Gestão",
    resumeData: {
      creationMode: "complete",
      personal: {
        fullName: "Camila Vasconcelos Prado",
        email: "camila.prado.rh@email.com",
        phone: "(11) 98722-4490",
        city: "São Paulo",
        state: "SP",
        linkedin: "https://linkedin.com/in/camila-vasconcelos-rh",
        portfolio: "",
      },
      target: {
        jobTitle: "Analista de Recursos Humanos",
        field: "Recursos Humanos / Gente & Gestão",
        summary:
          "Profissional de Recursos Humanos com foco em recrutamento e seleção, triagem de perfis, condução de entrevistas e suporte às rotinas de integração (onboarding) e departamento pessoal.",
      },
      experiences: [
        {
          id: "exp-rh-1",
          company: "Nexus Soluções Corporativas",
          role: "Analista de Recursos Humanos Pleno",
          startDate: "Janeiro 2022",
          endDate: "Atual",
          current: true,
          description:
            "Responsável pelo ciclo completo de Recrutamento & Seleção para posições operacionais, administrativas e comerciais. Alinhamento de perfil de vaga junto aos gestores de área, triagem em plataformas especializadas, condução de dinâmicas e entrevistas por competências (método STAR), além da estruturação da jornada de integração (onboarding) dos novos colaboradores.",
          achievements:
            "Redução do tempo médio de fechamento de vagas (Time to Hire) de 38 para 22 dias, mantendo taxa de retenção no período de experiência superior a 92%.",
        },
        {
          id: "exp-rh-2",
          company: "Grupo Varejista Aliança",
          role: "Assistente de Recursos Humanos",
          startDate: "Julho 2019",
          endDate: "Dezembro 2021",
          current: false,
          description:
            "Divulgação de vagas em canais de atração, triagem de mais de 300 currículos por semana, agendamento de testes psicológicos e entrevistas. Suporte direto às rotinas de departamento pessoal no recolhimento e conferência de documentação admissional e controle de ponto eletrônico.",
          achievements:
            "Criou o manual digital de acolhimento do colaborador diminuindo dúvidas cadastrais no DP em 30% logo na primeira semana de admissão.",
        },
      ],
      education: [
        {
          id: "edu-rh-1",
          institution: "Universidade Anhembi Morumbi",
          course: "Tecnologia em Gestão de Recursos Humanos",
          degree: "Graduação",
          status: "concluido",
          startDate: "2017",
          endDate: "2019",
        },
      ],
      courses: [
        {
          id: "crs-rh-1",
          name: "Entrevista por Competências e Avaliação de Perfil (DISC)",
          institution: "Gupy Academy",
          hours: "35 horas",
          year: "2023",
        },
        {
          id: "crs-rh-2",
          name: "Legislação Trabalhista e Rotinas Admissionais de DP",
          institution: "ABRH-SP",
          hours: "40 horas",
          year: "2021",
        },
      ],
      certifications: [
        "Analista Comportamental DISC Certificada",
      ],
      technicalSkills: [
        "Recrutamento e Seleção",
        "Triagem e Entrevistas",
        "Integração (Onboarding)",
        "Clima Organizacional",
        "Rotinas de Departamento Pessoal",
      ],
      softSkills: [
        "Comunicação Assertiva e Empatia",
        "Organização e Gestão de Prazos",
        "Negociação e Alinhamento de Expectativas",
        "Discrição e Ética Profissional",
      ],
      languages: [
        {
          id: "lang-rh-1",
          name: "Inglês",
          level: "Intermediário",
        },
      ],
      customization: {
        layoutId: "modern",
        primaryColor: DEFAULT_LAYOUT_COLORS["modern"] || "#6e5034",
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
    },
  },
];
