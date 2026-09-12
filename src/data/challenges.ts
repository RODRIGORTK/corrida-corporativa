import type { ChallengeCard, SectorType } from '../types/game';

export const SECTOR_INFO: Record<SectorType, { label: string; color: string; bgGradient: string; iconName: string }> = {
  RH: {
    label: 'Recursos Humanos',
    color: '#38bdf8',
    bgGradient: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.05))',
    iconName: 'Users'
  },
  Marketing: {
    label: 'Marketing & Brand',
    color: '#ec4899',
    bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.05))',
    iconName: 'Megaphone'
  },
  Vendas: {
    label: 'Vendas & Negócios',
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.05))',
    iconName: 'TrendingUp'
  },
  Financeiro: {
    label: 'Controladoria & Finanças',
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.05))',
    iconName: 'DollarSign'
  },
  Logística: {
    label: 'Logística & Suprimentos',
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.05))',
    iconName: 'Truck'
  },
  Produção: {
    label: 'Operações & Produção',
    color: '#f97316',
    bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.05))',
    iconName: 'Factory'
  },
  Tecnologia: {
    label: 'TI & Inovação Digital',
    color: '#06b6d4',
    bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(8, 145, 178, 0.05))',
    iconName: 'Cpu'
  },
  Diretoria: {
    label: 'Conselho de Administração',
    color: '#eab308',
    bgGradient: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(202, 138, 4, 0.1))',
    iconName: 'Crown'
  }
};

export const CHALLENGE_CARDS: ChallengeCard[] = [
  // Tecnologia
  {
    id: 'tech-1',
    title: 'Ataque de Ransomware',
    sector: 'Tecnologia',
    type: 'narrative',
    scenario: 'Os servidores centrais foram criptografados por hackers exigindo resgate. Você tem 45 segundos para explicar ao conselho seu protocolo de contingência e contenção.',
    timeLimitSeconds: 45,
    approvalReward: {
      text: 'Protocolo de segurança impecável! A reputação corporativa foi salva.',
      points: 3,
      balance: 1500
    },
    rejectionPenalty: {
      text: 'Vazamento de dados críticos. Multa regulatória pesada e perda de clientes.',
      balance: -2500,
      clients: -1
    }
  },
  {
    id: 'tech-2',
    title: 'Apagão em Nuvem',
    sector: 'Tecnologia',
    type: 'instant',
    scenario: 'A infraestrutura de nuvem caiu em pleno horário de pico! O sistema de checkout ficou fora do ar por 2 horas.',
    approvalReward: {
      text: 'Recuperação com redundância aprovada pelo CTO.',
      points: 1
    },
    rejectionPenalty: {
      text: 'Prejuízo direto de transações perdidas.',
      balance: -1800
    }
  },

  // Marketing
  {
    id: 'mkt-1',
    title: 'Pitch Relâmpago: Novo Slogan',
    sector: 'Marketing',
    type: 'narrative',
    scenario: 'Você precisa criar um slogan marcante para o produto de lançamento da empresa em 30 segundos e convencer a bancada!',
    timeLimitSeconds: 30,
    approvalReward: {
      text: 'Slogan viralizou nas redes sociais! Explosão de novos clientes e visibilidade.',
      clients: 2,
      points: 2,
      balance: 1000
    },
    rejectionPenalty: {
      text: 'Ideia genérica rejeitada pelo público. Campanha flopou.',
      points: -1,
      balance: -500
    }
  },
  {
    id: 'mkt-2',
    title: 'Crise de Cancelamento Digital',
    sector: 'Marketing',
    type: 'narrative',
    scenario: 'Uma postagem polêmica de um executivo gerou boicote de consumidores. Explique em 40 segundos seu plano de relações públicas para mitigar o impacto.',
    timeLimitSeconds: 40,
    approvalReward: {
      text: 'Gestão de crise exemplar e pedido de desculpas humanizado!',
      points: 2,
      clients: 1
    },
    rejectionPenalty: {
      text: 'Boicote massivo. Clientes cancelaram contratos.',
      clients: -2,
      balance: -1500
    }
  },

  // Vendas
  {
    id: 'vendas-1',
    title: 'Negociação com Big Player',
    sector: 'Vendas',
    type: 'narrative',
    scenario: 'Um grande grupo multinacional quer fechar um contrato anual, mas exige desconto agressivo ou cláusula de exclusividade. Convença o Narrador da sua proposta em 45 segundos.',
    timeLimitSeconds: 45,
    approvalReward: {
      text: 'Contrato fechado com excelente margem de lucro!',
      balance: 4000,
      clients: 2,
      points: 2
    },
    rejectionPenalty: {
      text: 'O cliente fechou com a concorrência.',
      balance: -800
    }
  },
  {
    id: 'vendas-2',
    title: 'Quebra de Contrato Imprevista',
    sector: 'Vendas',
    type: 'instant',
    scenario: 'Um dos principais clientes rescindiu o contrato unilateralmente alegando corte interno de orçamento.',
    approvalReward: {
      text: 'Multa rescisória cobrada judicialmente com sucesso.',
      balance: 1200
    },
    rejectionPenalty: {
      text: 'Perda do cliente e faturamento estornado.',
      clients: -1,
      balance: -1000
    }
  },

  // RH
  {
    id: 'rh-1',
    title: 'Ameaça de Greve no Setor Operacional',
    sector: 'RH',
    type: 'narrative',
    scenario: 'O sindicato exige aumento de benefícios e redução da jornada sob pena de paralisação total. Apresente em 45 segundos seu acordo de conciliação.',
    timeLimitSeconds: 45,
    approvalReward: {
      text: 'Acordo firmado pacificamente, retenção dos colaboradores!',
      points: 2,
      employees: 1
    },
    rejectionPenalty: {
      text: 'Greve deflagrada por 3 dias e debandada de talentos.',
      employees: -1,
      balance: -2000
    }
  },
  {
    id: 'rh-2',
    title: 'Caça de Talentos Estratégicos (Headhunting)',
    sector: 'RH',
    type: 'instant',
    scenario: 'Uma consultoria identificou executivos sêniores da concorrência prontos para migrarem para sua empresa.',
    approvalReward: {
      text: 'Novos talentos contratados elevam a produtividade corporativa!',
      employees: 2,
      points: 1
    },
    rejectionPenalty: {
      text: 'Custo de processo seletivo sem contratações efetivas.',
      balance: -1000
    }
  },

  // Financeiro
  {
    id: 'fin-1',
    title: 'Auditoria Fiscal Inesperada',
    sector: 'Financeiro',
    type: 'narrative',
    scenario: 'Auditores fiscais identificaram inconsistências nos relatórios contábeis dos últimos dois trimestres. Defenda a conformidade fiscal da sua empresa em 45 segundos.',
    timeLimitSeconds: 45,
    approvalReward: {
      text: 'Balanço aprovado com louvor e compliance comprovado!',
      points: 3,
      balance: 1000
    },
    rejectionPenalty: {
      text: 'Autuação fiscal com juros e multa sobre o balanço.',
      balance: -3000,
      points: -1
    }
  },
  {
    id: 'fin-2',
    title: 'Alta Volatilidade de Câmbio',
    sector: 'Financeiro',
    type: 'instant',
    scenario: 'O dólar disparou 12% na semana, encarecendo matéria-prima importada.',
    approvalReward: {
      text: 'Operação de hedge cambial protegeu o caixa.',
      balance: 1500
    },
    rejectionPenalty: {
      text: 'Aumento expressivo no custo financeiro dos estoques.',
      balance: -2000
    }
  },

  // Logística
  {
    id: 'log-1',
    title: 'Carga Bloqueada na Alfândega',
    sector: 'Logística',
    type: 'narrative',
    scenario: 'Um lote crucial de insumos foi retido na alfândega portuária por divergência de documentação. Como você agiliza o desembaraço em 40 segundos?',
    timeLimitSeconds: 40,
    approvalReward: {
      text: 'Desembaraço concluído em tempo recorde!',
      goods: 2,
      points: 2
    },
    rejectionPenalty: {
      text: 'Mercadorias retidas gerando custos de armazenagem portuária.',
      goods: -1,
      balance: -1200
    }
  },

  // Produção
  {
    id: 'prod-1',
    title: 'Falha Grave na Linha de Produção',
    sector: 'Produção',
    type: 'narrative',
    scenario: 'A esteira automatizada principal quebrou e a fábrica parou. Apresente seu plano para não atrasar as entregas e substituir a máquina em 45 segundos.',
    timeLimitSeconds: 45,
    approvalReward: {
      text: 'Turno extra acionado e manutenção expressa com sucesso!',
      goods: 3,
      points: 1
    },
    rejectionPenalty: {
      text: 'Lote com defeito descartado e custo de peças sobressalentes.',
      goods: -2,
      balance: -1800
    }
  }
];

export const FINAL_BOARDROOM_CHALLENGE = {
  title: 'Reunião Extraordinária do Conselho da Diretoria (Desafio Final)',
  scenario: 'Você chegou ao topo da corporação! Para assumir o controle como CEO Vencedor(a), você tem exatamente 60 segundos para apresentar ao Narrador e aos demais executivos seu Plano Estratégico de Expansão Global e Defesa contra Aquisições Hostis. Convença a mesa diretora de que você é o líder supremo desta empresa!',
  timeLimitSeconds: 60,
  approvalText: 'O Conselho aprovou sua liderança por unanimidade! VOCÊ VENCEU A CORRIDA CORPORATIVA!',
  rejectionText: 'O Conselho considerou sua estratégia insuficiente e imatura para o cargo máximo. Você recua 3 casas e terá que se reestruturar para uma nova sabatina!'
};
