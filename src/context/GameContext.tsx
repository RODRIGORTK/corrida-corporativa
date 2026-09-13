import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import type { 
  BoardSize, 
  ChallengeCard, 
  GameConfig, 
  GameLog, 
  GamePhase, 
  Player, 
  Tile 
} from '../types/game';
import { generateBoardTiles, shuffleBoardRules } from '../utils/boardGenerator';
import { CHALLENGE_CARDS, getCompanyLevelInfo } from '../data/challenges';

// Cores premium para peões corporativos
export const PLAYER_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#ef4444', 
  '#14b8a6', '#84cc16', '#6366f1', '#d946ef', '#eab308', '#22c55e', '#0284c7', '#a855f7', 
  '#f43f5e', '#e11d48', '#0d9488', '#7c3aed',
];

interface GameContextType {
  players: Player[];
  ranking: Player[];
  activePlayer: Player | null;
  activePlayerIndex: number;
  currentRound: number;
  tiles: Tile[];
  config: GameConfig;
  phase: GamePhase;
  logs: GameLog[];
  activeModal: {
    type: 'TILE_INFO' | 'CHALLENGE' | 'CRISIS' | 'INVESTMENT' | 'ALLIANCE' | 'INSPECT_TILE' | 'FINAL_BOARDROOM' | 'GAME_OVER' | null;
    tile?: Tile;
    card?: ChallengeCard;
    tilePlayers?: Player[];
  };
  winner: Player | null;
  movingPlayerId: string | null;

  // Ações de jogo
  setupGame: (playerNames: string[], boardSize: BoardSize, lapLimit: number | null) => void;
  rollDiceAndMove: (diceValue: number) => Promise<void>;
  closeModal: () => void;
  openTileInspectModal: (tileIndex: number) => void;
  
  // Resolução de ações
  resolveChallenge: (approved: boolean) => void;
  resolveCrisis: (cancelWithPoints: boolean) => void;
  resolveInvestment: (invest: boolean) => void;
  resolveFinalBoardroom: (approved: boolean) => void;
  
  // Progressão e alianças
  createAlliance: (playerAId: string, playerBId: string, durationRounds: number) => void;
  breakAlliance: (playerId: string) => void;
  restartGame: () => void;
  endGameByLimit: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<GameConfig>({
    boardSize: 30,
    lapLimit: 3
  });
  // O tabuleiro é gerado e misturado apenas uma vez na inicialização ou no Setup!
  const [tiles, setTiles] = useState<Tile[]>(() => shuffleBoardRules(generateBoardTiles(30)));
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);

  const [activeModal, setActiveModal] = useState<GameContextType['activeModal']>({
    type: null
  });

  const addLog = useCallback((message: string, type: GameLog['type'] = 'info') => {
    const newLog: GameLog = {
      id: Math.random().toString(36).substring(2, 9),
      round: currentRound,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]);
  }, [currentRound]);

  // Ranking em Tempo Real
  const ranking = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.isEliminated && !b.isEliminated) return 1;
      if (!a.isEliminated && b.isEliminated) return -1;
      if (b.lapsCompleted !== a.lapsCompleted) return b.lapsCompleted - a.lapsCompleted;
      if (b.balance !== a.balance) return b.balance - a.balance;
      if (b.goods !== a.goods) return b.goods - a.goods;
      if (b.employees !== a.employees) return b.employees - a.employees;
      if (b.points !== a.points) return b.points - a.points;
      return b.clients - a.clients;
    });
  }, [players]);

  const activePlayer = useMemo(() => {
    if (players.length === 0) return null;
    return players[activePlayerIndex] || null;
  }, [players, activePlayerIndex]);

  // Inicialização da Partida
  const setupGame = useCallback((playerNames: string[], boardSize: BoardSize, lapLimit: number | null) => {
    const baseTiles = generateBoardTiles(boardSize);
    const newTiles = shuffleBoardRules(baseTiles);
    
    const newPlayers: Player[] = playerNames.map((name, idx) => ({
      id: `p-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      color: PLAYER_PALETTE[idx % PLAYER_PALETTE.length],
      position: 0,
      lapsCompleted: 0,
      balance: 10000,
      employees: 2,
      clients: 3,
      goods: 5,
      points: 0,
      level: 1, // Começa sempre no Nível 1 (Microempresa)
      bankruptcy: {
        inRecovery: false,
        roundsLeft: 2
      },
      alliance: null,
      isEliminated: false,
      hasWon: false
    }));

    setConfig({ boardSize, lapLimit });
    setTiles(newTiles);
    setPlayers(newPlayers);
    setActivePlayerIndex(0);
    setCurrentRound(1);
    setPhase('ROLL');
    setLogs([]);
    setWinner(null);
    setActiveModal({ type: null });

    addLog(`Partida corporativa iniciada com ${newPlayers.length} executivos. Tabuleiro de ${boardSize} casas. Meta: ${lapLimit ? `${lapLimit} voltas completas` : 'Livre / Sem limite'}.`, 'info');
  }, [addLog]);

  // Aplicação de recursos com Nível Automático
  const applyResourceChange = useCallback((
    playerId: string,
    delta: { balance?: number; employees?: number; clients?: number; goods?: number; points?: number; },
    actionDescription: string
  ) => {
    setPlayers(prevPlayers => {
      const target = prevPlayers.find(p => p.id === playerId);
      if (!target) return prevPlayers;

      const partner = target.alliance 
        ? prevPlayers.find(p => p.id === target.alliance?.partnerId && !p.isEliminated)
        : null;

      return prevPlayers.map(p => {
        let isTarget = p.id === playerId;
        let isPartner = partner && p.id === partner.id;

        if (!isTarget && !isPartner) return p;

        const divisor = partner ? 2 : 1;

        const deltaBal = delta.balance ? Math.round(delta.balance / divisor) : 0;
        const deltaEmp = delta.employees ? Math.round(delta.employees / divisor) : 0;
        const deltaCli = delta.clients ? Math.round(delta.clients / divisor) : 0;
        const deltaGood = delta.goods ? Math.round(delta.goods / divisor) : 0;
        const deltaPts = delta.points ? Math.round(delta.points / divisor) : 0;

        const newBalance = p.balance + deltaBal;
        const newEmployees = Math.max(0, p.employees + deltaEmp);
        const newClients = Math.max(0, p.clients + deltaCli);
        const newGoods = Math.max(0, p.goods + deltaGood);
        const newPoints = Math.max(0, p.points + deltaPts);

        // --- SISTEMA DE NÍVEL AUTOMÁTICO DE XP ---
        const newLevelInfo = getCompanyLevelInfo(newPoints);
        
        if (newLevelInfo.level > p.level && isTarget) { // Notifica apenas para o alvo principal para não flodar o log
          addLog(`📈 CRESCIMENTO EXECUTIVO: Com ${newPoints} pontos, ${p.name} evoluiu e agora é uma ${newLevelInfo.title} (Nível ${newLevelInfo.level})!`, 'gain');
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
        } else if (newLevelInfo.level < p.level && isTarget) {
          addLog(`📉 QUEDA DE MERCADO: ${p.name} perdeu influência e foi rebaixado(a) para ${newLevelInfo.title} (Nível ${newLevelInfo.level}).`, 'loss');
        }

        // Checagem de Recuperação Judicial
        let updatedBankruptcy = { ...p.bankruptcy };
        if (newBalance <= 0) {
          if (!updatedBankruptcy.inRecovery) {
            updatedBankruptcy = { inRecovery: true, roundsLeft: 2 };
            addLog(`⚠️ ATENÇÃO: ${p.name} entrou em RECUPERAÇÃO JUDICIAL! Saldo negativo ou nulo.`, 'crisis');
          }
        } else {
          if (updatedBankruptcy.inRecovery) {
            updatedBankruptcy = { inRecovery: false, roundsLeft: 2 };
            addLog(`✅ ${p.name} recuperou o fluxo de caixa e saiu da Recuperação Judicial!`, 'gain');
          }
        }

        return {
          ...p,
          balance: newBalance,
          employees: newEmployees,
          clients: newClients,
          goods: newGoods,
          points: newPoints,
          level: newLevelInfo.level, // Salva o nível calculado!
          bankruptcy: updatedBankruptcy
        };
      });
    });

    addLog(actionDescription, delta.balance && delta.balance < 0 ? 'loss' : 'gain');
  }, [addLog]);

  // Avançar Turno do Jogador
  const advanceTurn = useCallback(() => {
    setActiveModal({ type: null });

    setPlayers(prevPlayers => {
      const activeSurvivors = prevPlayers.filter(p => !p.isEliminated);
      if (activeSurvivors.length === 1 && prevPlayers.length > 1) {
        setWinner(activeSurvivors[0]);
        setPhase('GAME_OVER');
        confetti({ particleCount: 150, spread: 80 });
        return prevPlayers;
      }
      return prevPlayers;
    });

    setActivePlayerIndex(prevIdx => {
      let nextIdx = (prevIdx + 1) % players.length;
      let loops = 0;

      if (nextIdx === 0) {
        addLog(`🎲 Nova rodada corporativa iniciada!`, 'info');

        setCurrentRound(prevRound => {
          const nextRound = prevRound + 1;
          setPlayers(curr => curr.map(p => {
            if (!p.alliance) return p;
            const newRounds = p.alliance.roundsLeft - 1;
            if (newRounds <= 0) {
              addLog(`A aliança corporativa de ${p.name} expirou após o término do prazo contratual.`, 'info');
              return { ...p, alliance: null };
            }
            return { ...p, alliance: { ...p.alliance, roundsLeft: newRounds } };
          }));
          return nextRound;
        });
      }

      while (players[nextIdx]?.isEliminated && loops < players.length) {
        nextIdx = (nextIdx + 1) % players.length;
        loops++;
      }

      const nextPlayer = players[nextIdx];
      if (nextPlayer && nextPlayer.bankruptcy.inRecovery) {
        if (nextPlayer.bankruptcy.roundsLeft <= 1 && nextPlayer.balance <= 0) {
          setPlayers(curr => curr.map(p => 
            p.id === nextPlayer.id ? { ...p, isEliminated: true } : p
          ));
          addLog(`💀 FALÊNCIA CORPORATIVA: ${nextPlayer.name} esgotou as 2 rodadas em Recuperação Judicial sem recompor caixa e foi ELIMINADO(A)!`, 'crisis');
        } else {
          setPlayers(curr => curr.map(p => 
            p.id === nextPlayer.id 
              ? { ...p, bankruptcy: { ...p.bankruptcy, roundsLeft: p.bankruptcy.roundsLeft - 1 } }
              : p
          ));
          addLog(`⏳ ${nextPlayer.name} segue em Recuperação Judicial! Restam ${nextPlayer.bankruptcy.roundsLeft - 1} rodada(s) para regularizar o saldo.`, 'crisis');
        }
      }

      setPhase('ROLL');
      return nextIdx;
    });
  }, [players, addLog]);

  // Fim de jogo por atingimento da meta de voltas
  const endGameByLimit = useCallback(() => {
    setPhase('GAME_OVER');
    const leader = ranking[0];
    if (leader) {
      setWinner(leader);
      addLog(`🏆 FIM DE JOGO! A meta de voltas completas foi atingida. ${leader.name} venceu pelo Ranking Corporativo!`, 'victory');
      confetti({ particleCount: 200, spread: 100 });
    }
  }, [ranking, addLog]);

  // Rolar Dado Físico e Mover Peão
  const rollDiceAndMove = useCallback(async (diceValue: number) => {
    if (!activePlayer || phase !== 'ROLL') return;

    setPhase('MOVING');
    setMovingPlayerId(activePlayer.id);
    addLog(`🎲 ${activePlayer.name} rolou o dado: ${diceValue}.`, 'info');

    const boardLength = tiles.length;
    let currentPos = activePlayer.position;
    let lapsGained = 0;

    for (let step = 1; step <= diceValue; step++) {
      await new Promise(resolve => setTimeout(resolve, 320));
      currentPos = (currentPos + 1) % boardLength;

      if (currentPos === 0) {
        lapsGained += 1;
        applyResourceChange(
          activePlayer.id, 
          { balance: 30000, points: 5 }, 
          `🏁 ${activePlayer.name} completou uma volta inteira! Ganhou +R$ 30.000 e +5 Pontos.`
        );
      }

      setPlayers(prev => prev.map(p => 
        p.id === activePlayer.id ? { 
          ...p, 
          position: currentPos, 
          lastDiceRoll: diceValue,
          lapsCompleted: p.lapsCompleted + (currentPos === 0 ? 1 : 0)
        } : p
      ));
    }

    setMovingPlayerId(null);

    const totalLaps = activePlayer.lapsCompleted + lapsGained;
    if (config.lapLimit && totalLaps >= config.lapLimit) {
      endGameByLimit();
      return;
    }

    setPhase('TILE_ACTION');

    const landingTile = tiles[currentPos];
    addLog(`${activePlayer.name} parou na casa [${landingTile.index}]: ${landingTile.title}`, 'info');

    if (landingTile.type === 'DiretoriaFinal') {
      setActiveModal({ type: 'FINAL_BOARDROOM', tile: landingTile });
      return;
    }

    if (landingTile.type === 'Desafio') {
      const matchingSector = CHALLENGE_CARDS.filter(c => c.sector === landingTile.sector);
      const pool = matchingSector.length > 0 ? matchingSector : CHALLENGE_CARDS;
      const card = pool[Math.floor(Math.random() * pool.length)];

      setActiveModal({ type: 'CHALLENGE', tile: landingTile, card });
      return;
    }

    if (landingTile.type === 'Crise') {
      setActiveModal({ type: 'CRISIS', tile: landingTile });
      return;
    }

    if (landingTile.type === 'Investimento') {
      setActiveModal({ type: 'INVESTMENT', tile: landingTile });
      return;
    }

    if (landingTile.type === 'Oportunidade') {
      applyResourceChange(
        activePlayer.id,
        { balance: 20000, clients: 1 },
        `✨ ${activePlayer.name} aproveitou a Oportunidade: +R$ 20.000 e +1 Cliente!`
      );
      setActiveModal({ type: 'TILE_INFO', tile: landingTile });
      return;
    }

    setActiveModal({ type: 'TILE_INFO', tile: landingTile });
  }, [activePlayer, phase, tiles, addLog, applyResourceChange, config.lapLimit, endGameByLimit]);

  const resolveChallenge = useCallback((approved: boolean) => {
    if (!activePlayer || !activeModal.card) return;
    const card = activeModal.card;

    if (approved) {
      applyResourceChange(
        activePlayer.id,
        card.approvalReward,
        `🏆 NARRADOR APROVOU: ${activePlayer.name} superou o desafio! Recompensa concedida.`
      );
      confetti({ particleCount: 60, spread: 50 });
    } else {
      applyResourceChange(
        activePlayer.id,
        card.rejectionPenalty,
        `❌ NARRADOR RECUSOU: ${activePlayer.name} falhou no desafio. Penalidade aplicada.`
      );
    }
    advanceTurn();
  }, [activePlayer, activeModal.card, applyResourceChange, advanceTurn]);

  const resolveCrisis = useCallback((cancelWithPoints: boolean) => {
    if (!activePlayer) return;
    if (cancelWithPoints) {
      if (activePlayer.points >= 5) {
        applyResourceChange(activePlayer.id, { points: -5 }, `🛡️ PODER CORPORATIVO: ${activePlayer.name} gastou 5 Pontos para ANULAR a crise!`);
      } else {
        applyResourceChange(activePlayer.id, { balance: -15000 }, `💥 ${activePlayer.name} tentou anular sem pontos e sofreu a crise: -R$ 15.000`);
      }
    } else {
      applyResourceChange(activePlayer.id, { balance: -15000 }, `💥 ${activePlayer.name} absorveu a crise corporativa: -R$ 15.000`);
    }
    advanceTurn();
  }, [activePlayer, applyResourceChange, advanceTurn]);

  const resolveInvestment = useCallback((invest: boolean) => {
    if (!activePlayer) return;

    if (invest) {
      let effectiveLevel = activePlayer.level;
      if (activePlayer.alliance) effectiveLevel += 1;

      const reqLevel = activeModal.tile?.requiredLevel || 1;
      if (effectiveLevel >= reqLevel) {
        applyResourceChange(
          activePlayer.id,
          { balance: -30000, goods: 3, points: 2 },
          `📈 INVESTIMENTO: ${activePlayer.name} investiu R$ 30.000 e obteve +3 Mercadorias e +2 Pontos!`
        );
      } else {
        addLog(`⚠️ Investimento cancelado: Requer Nível ${reqLevel} (Nível disponível: ${effectiveLevel}).`, 'info');
      }
    }
    advanceTurn();
  }, [activePlayer, activeModal.tile, applyResourceChange, advanceTurn, addLog]);

  const resolveFinalBoardroom = useCallback((approved: boolean) => {
    if (!activePlayer) return;

    if (approved) {
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, hasWon: true } : p));
      setWinner(activePlayer);
      setPhase('GAME_OVER');
      addLog(`👑 VITÓRIA HISTÓRICA! O Conselho de Administração aclamou ${activePlayer.name} como o(a) Vencedor(a)!`, 'victory');
      confetti({ particleCount: 300, spread: 120 });
    } else {
      const boardLength = tiles.length;
      const newPos = (activePlayer.position - 3 + boardLength) % boardLength;
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: newPos } : p));
      addLog(`📉 REPROVADO NA SABATINA: O Conselho recusou o plano de ${activePlayer.name}. O executivo recuou 3 casas!`, 'crisis');
      advanceTurn();
    }
  }, [activePlayer, tiles.length, addLog, advanceTurn]);

  const createAlliance = useCallback((playerAId: string, playerBId: string, durationRounds: number) => {
    const playerA = players.find(p => p.id === playerAId);
    const playerB = players.find(p => p.id === playerBId);
    if (!playerA || !playerB || playerAId === playerBId) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === playerAId) return { ...p, alliance: { partnerId: playerBId, roundsLeft: durationRounds } };
      if (p.id === playerBId) return { ...p, alliance: { partnerId: playerAId, roundsLeft: durationRounds } };
      return p;
    }));
    addLog(`🤝 FUSÃO: ${playerA.name} e ${playerB.name} formaram aliança por ${durationRounds} rodadas! Recursos rateados.`, 'alliance');
  }, [players, addLog]);

  const breakAlliance = useCallback((playerId: string) => {
    const target = players.find(p => p.id === playerId);
    if (!target || !target.alliance) return;
    const partnerId = target.alliance.partnerId;

    setPlayers(prev => prev.map(p => {
      if (p.id === playerId || p.id === partnerId) return { ...p, alliance: null };
      return p;
    }));
    addLog(`💔 DISSOLUÇÃO: A aliança de ${target.name} foi encerrada imediatamente.`, 'info');
  }, [players, addLog]);

  const openTileInspectModal = useCallback((tileIndex: number) => {
    const tile = tiles[tileIndex];
    if (!tile) return;
    const tilePlayers = players.filter(p => p.position === tileIndex && !p.isEliminated);
    setActiveModal({ type: 'INSPECT_TILE', tile, tilePlayers });
  }, [tiles, players]);

  const closeModal = useCallback(() => {
    if (activeModal.type === 'TILE_INFO') advanceTurn();
    else setActiveModal({ type: null });
  }, [activeModal.type, advanceTurn]);

  const restartGame = useCallback(() => {
    setPhase('SETUP');
    setPlayers([]);
    setActiveModal({ type: null });
    setWinner(null);
  }, []);

  return (
    <GameContext.Provider value={{
      players, ranking, activePlayer, activePlayerIndex, currentRound, tiles, config,
      phase, logs, activeModal, winner, movingPlayerId,
      setupGame, rollDiceAndMove, closeModal, openTileInspectModal,
      resolveChallenge, resolveCrisis, resolveInvestment, resolveFinalBoardroom,
      createAlliance, breakAlliance, restartGame, endGameByLimit
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};