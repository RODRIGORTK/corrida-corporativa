export type SectorType = 
  | 'RH' 
  | 'Marketing' 
  | 'Vendas' 
  | 'Financeiro' 
  | 'Logística' 
  | 'Produção' 
  | 'Tecnologia' 
  | 'Diretoria';

export type TileType = 
  | 'Oportunidade' 
  | 'Crise' 
  | 'Investimento' 
  | 'Negociação' 
  | 'Desafio' 
  | 'Inicio' 
  | 'DiretoriaFinal';

export interface Tile {
  id: number;
  index: number; // 0-based position
  sector: SectorType;
  type: TileType;
  title: string;
  description: string;
  actionText?: string;
  gridRow: number;
  gridColumn: number;
  badge?: string;
  requiredLevel?: number; // Requisito de nível corporativo
}

export interface PlayerBankruptcy {
  inRecovery: boolean;
  roundsLeft: number; // Max 2 rodadas em recuperação judicial
}

export interface PlayerAlliance {
  partnerId: string;
  roundsLeft: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  position: number; // 0 até maxTiles - 1
  lapsCompleted: number; // Voltas completas no tabuleiro
  
  // Recursos principais
  balance: number;      // Saldo inicial: R$ 10.000
  employees: number;    // Funcionários iniciais: 2
  clients: number;      // Clientes iniciais: 3
  goods: number;        // Mercadorias iniciais: 0
  points: number;       // Pontos iniciais: 0
  level: number;        // Nível inicial: 0 (Máx: 5)
  
  // Estados especiais
  bankruptcy: PlayerBankruptcy;
  alliance: PlayerAlliance | null;
  
  isEliminated: boolean;
  hasWon: boolean;
  lastDiceRoll?: number;
}

export interface ChallengeCard {
  id: string;
  title: string;
  sector: SectorType;
  type: 'narrative' | 'instant';
  scenario: string;
  timeLimitSeconds?: number; // Ex: 30s ou 60s
  approvalReward: {
    text: string;
    balance?: number;
    points?: number;
    employees?: number;
    clients?: number;
    goods?: number;
  };
  rejectionPenalty: {
    text: string;
    balance?: number;
    points?: number;
    employees?: number;
    clients?: number;
    goods?: number;
    retreatTiles?: number;
  };
}

export interface InvestmentOption {
  cost: number;
  requiredLevel: number;
  rewardType: 'immediate' | 'future';
  rewardDescription: string;
  gainBalance?: number;
  gainClients?: number;
  gainGoods?: number;
  gainPoints?: number;
}

export interface GameLog {
  id: string;
  round: number;
  timestamp: string;
  message: string;
  type: 'info' | 'gain' | 'loss' | 'crisis' | 'alliance' | 'victory';
}

export type BoardSize = 30 | 45 | 60;

export interface GameConfig {
  boardSize: BoardSize;
  lapLimit: number | null; // null = Livre / Sem Limite de voltas
  roundLimit?: number | null; // mantido para compatibilidade
}

export type GamePhase = 
  | 'SETUP' 
  | 'ROLL' 
  | 'MOVING' 
  | 'TILE_ACTION' 
  | 'FINAL_CHALLENGE' 
  | 'GAME_OVER';
