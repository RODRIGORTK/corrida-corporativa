import type { ChallengeCard } from '../types/game';

// Mudamos para Record<string, ...> para aceitar os novos setores sem quebrar a tipagem antiga
export const SECTOR_INFO: Record<string, { label: string; color: string; bgGradient: string; iconName: string }> = {
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
  },
  // NOVOS SETORES ADICIONADOS:
  Juridico: {
    label: 'Departamento Jurídico',
    color: '#ef4444', 
    bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.05))',
    iconName: 'Scale'
  },
  PeD: {
    label: 'Pesquisa e Desenvolvimento (P&D)',
    color: '#6366f1', 
    bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.05))',
    iconName: 'Lightbulb'
  }
};

// Como o cenário é genérico agora, focamos em variações altas de recompensas e riscos
const GENERIC_SCENARIO = 'Atenção, Executivo! O Narrador irá ditar o desafio deste setor. Você tem 30 segundos para formular sua resposta e convencer a mesa.';

export const CHALLENGE_CARDS: ChallengeCard[] = [
  {
    id: 'tech-1',
    title: 'Oportunidade Digital',
    sector: 'Tecnologia',
    type: 'narrative',
    scenario: GENERIC_SCENARIO,
    timeLimitSeconds: 30,
    approvalReward: { text: 'Inovação aprovada! Sistema modernizado com sucesso.', points: 8, balance: 15000, clients: 3 },
    rejectionPenalty: { text: 'Projeto com falhas de segurança críticas.', balance: -8000, points: -3 }
  },
  {
    id: 'mkt-1',
    title: 'Campanha de Alto Impacto',
    sector: 'Marketing',
    type: 'narrative',
    scenario: GENERIC_SCENARIO,
    timeLimitSeconds: 30,
    approvalReward: { text: 'Campanha viral! A marca dominou o mercado global.', clients: 6, points: 10, balance: 25000 },
    rejectionPenalty: { text: 'Boicote! O mercado rejeitou a campanha agressiva.', points: -4, balance: -15000, clients: -2 }
  },
  {
    id: 'vendas-1',
    title: 'Fechamento de Conta Global',
    sector: 'Vendas',
    type: 'narrative',
    scenario: GENERIC_SCENARIO,
    timeLimitSeconds: 30,
    approvalReward: { text: 'Mega contrato assinado com multinacional!', balance: 40000, clients: 5, points: 8 },
    rejectionPenalty: { text: 'O cliente gigante assinou com seu pior concorrente.', balance: -20000, clients: -2 }
  },
  {
    id: 'rh-1',
    title: 'Gestão de Talentos',
    sector: 'RH',
    type: 'narrative',
    scenario: GENERIC_SCENARIO,
    timeLimitSeconds: 30,
    approvalReward: { text: 'Líderes inspirados e equipe de alto desempenho formada!', points: 12, employees: 4, balance: 10000 },
    rejectionPenalty: { text: 'Debandada geral! Talentos foram para a concorrência.', employees: -3, balance: -12000, points: -2 }
  },
  {
    id: 'fin-1',
    title: 'Manobra Fiscal Estratégica',
    sector: 'Financeiro',
    type: 'narrative',
    scenario: GENERIC_SCENARIO,
    timeLimitSeconds: 30,
    approvalReward: { text: 'Lucro otimizado e caixa blindado!', points: 10, balance: 50000 },
    rejectionPenalty: { text: 'Auditoria encontrou rombo no caixa da empresa.', balance: -35000, points: -5 }
  },
  {
    id: 'log-1',
    title: 'Expansão de Frota e Rota',
    sector: 'Logística',
    type: 'narrative',
    scenario: GENERIC_SCENARIO,
    timeLimitSeconds: 30,
    approvalReward: { text: 'Cadeia de suprimentos perfeita. Estoque lotado!', goods: 15, points: 6, balance: 18000 },
    rejectionPenalty: { text: 'Carga perdida e rotas ineficientes geraram prejuízo.', goods: -8, balance: -15000 }
  },
  {
    id: 'prod-1',
    title: 'Automação da Fábrica',
    sector: 'Produção',
    type: 'narrative',
    scenario: GENERIC_SCENARIO,
    timeLimitSeconds: 30,
    approvalReward: { text: 'Produção recorde alcançada com maquinário novo!', goods: 20, points: 5, balance: 12000 },
    rejectionPenalty: { text: 'Lotes inteiros de mercadoria perdidos por defeito de fábrica.', goods: -12, balance: -10000 }
  },
  // Cartas para os Novos Setores
  {
    id: 'jur-1',
    title: 'Disputa de Patente (Processo)',
    sector: 'Juridico',
    type: 'narrative',
    scenario: GENERIC_SCENARIO,
    timeLimitSeconds: 30,
    approvalReward: { text: 'Causa Ganha no tribunal! Indenização milionária recebida.', balance: 35000, points: 10 },
    rejectionPenalty: { text: 'Processo perdido! Custas judiciais e bloqueio de bens.', balance: -25000, points: -3 }
  },
  {
    id: 'ped-1',
    title: 'Protótipo de Nova Tecnologia',
    sector: 'PeD',
    type: 'narrative',
    scenario: GENERIC_SCENARIO,
    timeLimitSeconds: 30,
    approvalReward: { text: 'Patente revolucionária criada! Vantagem competitiva absurda.', goods: 10, clients: 5, balance: 20000, points: 15 },
    rejectionPenalty: { text: 'O protótipo explodiu no laboratório. Dinheiro de pesquisa jogado fora.', balance: -30000, points: -5 }
  }
];

export const FINAL_BOARDROOM_CHALLENGE = {
  title: 'Reunião Extraordinária do Conselho da Diretoria',
  scenario: 'Atenção! Para assumir o controle como CEO Vencedor(a), aguarde a pergunta final elaborada pelo Narrador sobre a sua gestão. Você terá exatamente 60 segundos para apresentar sua defesa.',
  timeLimitSeconds: 60,
  approvalText: 'O Conselho aprovou sua liderança por unanimidade! VOCÊ VENCEU A CORRIDA CORPORATIVA!',
  rejectionText: 'O Conselho considerou sua resposta insuficiente. Você recua 3 casas e terá que tentar novamente!'
};

// --- NOVA TABELA DE NÍVEIS CORPORATIVOS ---
export const getCompanyLevelInfo = (points: number) => {
  if (points >= 40) return { level: 5, title: 'Empresa Líder' };
  if (points >= 30) return { level: 4, title: 'Grande Empresa' };
  if (points >= 20) return { level: 3, title: 'Empresa em Crescimento' };
  if (points >= 10) return { level: 2, title: 'Pequena Empresa' };
  return { level: 1, title: 'Microempresa' };
};