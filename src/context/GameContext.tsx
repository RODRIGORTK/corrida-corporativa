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
import { CHALLENGE_CARDS } from '../data/challenges';

// Cores premium para peões corporativos
export const PLAYER_PALETTE = [
  '#3b82f6', // Azul Safira
  '#10b981', // Esmeralda
  '#f59e0b', // Âmbar Dourado
  '#ec4899', // Rosa Executivo
  '#8b5cf6', // Roxo Real
  '#06b6d4', // Ciano Tech
  '#f97316', // Laranja Cobre
  '#ef4444', // Rubi Intenso
  '#14b8a6', // Turquesa
  '#84cc16', // Lima Neon
  '#6366f1', // Índigo
  '#d946ef', // Magenta
  '#eab308', // Ouro Corporativo
  '#22c55e', // Verde Negócios
  '#0284c7', // Azul Oceano
  '#a855f7', // Violeta
  '#f43f5e', // Rosa Coral
  '#e11d48', // Carmim
  '#0d9488', // Teal Escuro
  '#7c3aed', // Púrpura Imperial
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
  upgradePlayerLevel: (playerId: string) => boolean;
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
  const [tiles, setTiles] = useState<Tile[]>(() => generateBoardTiles(30));
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

  // Ranking em Tempo Real com Desempate Estrito:
  // 1º Saldo, 2º Mercadorias, 3º Funcionários, 4º Pontos, 5º Clientes
  const ranking = useMemo(() => {
    return [...players].sort((a, b) => {
      // Eliminados vão para o fim da lista
      if (a.isEliminated && !b.isEliminated) return 1;
      if (!a.isEliminated && b.isEliminated) return -1;

      // Voltas completadas
      if (b.lapsCompleted !== a.lapsCompleted) return b.lapsCompleted - a.lapsCompleted;

      // Critérios Oficiais de Desempate: 1º Saldo, 2º Mercadorias, 3º Funcionários, 4º Pontos, 5º Clientes
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
    const newTiles = generateBoardTiles(boardSize);
    const newPlayers: Player[] = playerNames.map((name, idx) => ({
      id: `p-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      color: PLAYER_PALETTE[idx % PLAYER_PALETTE.length],
      position: 0,
      lapsCompleted: 0,
      balance: 10000,
      employees: 2,
      clients: 3,
      goods: 0,
      points: 0,
      level: 0,
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

  // Aplicação de recursos respeitando Alianças (50% para cada)
  const applyResourceChange = useCallback((
    playerId: string,
    delta: {
      balance?: number;
      employees?: number;
      clients?: number;
      goods?: number;
      points?: number;
    },
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

        // Se houver aliança ativa, rateia 50% para cada
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
      // Checa se há apenas 1 jogador não eliminado
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

      // Se deu uma volta completa na lista de jogadores, avança a rodada
      if (nextIdx === 0) {
        // Embaralha dinamicamente as regras das casas a cada nova rodada
        setTiles(currTiles => shuffleBoardRules(currTiles));
        addLog(`🎲 Nova rodada corporativa! O mercado se reestruturou e as regras das casas mudaram de posição.`, 'info');

        setCurrentRound(prevRound => {
          const nextRound = prevRound + 1;

          // Decrementa duração de alianças ativas
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

      // Pula jogadores eliminados
      while (players[nextIdx]?.isEliminated && loops < players.length) {
        nextIdx = (nextIdx + 1) % players.length;
        loops++;
      }

      const nextPlayer = players[nextIdx];
      if (nextPlayer && nextPlayer.bankruptcy.inRecovery) {
        // Decrementa contador de recuperação judicial (mantida a lógica de 2 rodadas)
        if (nextPlayer.bankruptcy.roundsLeft <= 1 && nextPlayer.balance <= 0) {
          // Falência irreversível!
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

  // Rolar Dado Físico e Mover Peão Passo a Passo com Animação Fluida
  const rollDiceAndMove = useCallback(async (diceValue: number) => {
    if (!activePlayer || phase !== 'ROLL') return;

    setPhase('MOVING');
    setMovingPlayerId(activePlayer.id);
    addLog(`🎲 ${activePlayer.name} rolou o dado: ${diceValue}.`, 'info');

    const boardLength = tiles.length;
    let currentPos = activePlayer.position;
    let lapsGained = 0;

    // Animação passo a passo
    for (let step = 1; step <= diceValue; step++) {
      await new Promise(resolve => setTimeout(resolve, 320));
      currentPos = (currentPos + 1) % boardLength;

      // Se completou a volta (passou ou parou na casa 0)
      if (currentPos === 0) {
        lapsGained += 1;
        applyResourceChange(
          activePlayer.id, 
          { balance: 3000, points: 1 }, 
          `🏁 ${activePlayer.name} completou uma volta inteira no tabuleiro! Ganhou +R$ 3.000 e +1 Ponto.`
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

    // Checagem se atingiu o limite de voltas configurado
    const totalLaps = activePlayer.lapsCompleted + lapsGained;
    if (config.lapLimit && totalLaps >= config.lapLimit) {
      endGameByLimit();
      return;
    }

    setPhase('TILE_ACTION');

    const landingTile = tiles[currentPos];
    addLog(`${activePlayer.name} parou na casa [${landingTile.index}]: ${landingTile.title}`, 'info');

    // Despacho da ação da casa
    if (landingTile.type === 'DiretoriaFinal') {
      setActiveModal({
        type: 'FINAL_BOARDROOM',
        tile: landingTile
      });
      return;
    }

    if (landingTile.type === 'Desafio') {
      // Sorteia carta de desafio corporativo
      const matchingSector = CHALLENGE_CARDS.filter(c => c.sector === landingTile.sector);
      const pool = matchingSector.length > 0 ? matchingSector : CHALLENGE_CARDS;
      const card = pool[Math.floor(Math.random() * pool.length)];

      setActiveModal({
        type: 'CHALLENGE',
        tile: landingTile,
        card
      });
      return;
    }

    if (landingTile.type === 'Crise') {
      setActiveModal({
        type: 'CRISIS',
        tile: landingTile
      });
      return;
    }

    if (landingTile.type === 'Investimento') {
      setActiveModal({
        type: 'INVESTMENT',
        tile: landingTile
      });
      return;
    }

    if (landingTile.type === 'Oportunidade') {
      applyResourceChange(
        activePlayer.id,
        { balance: 2000, clients: 1 },
        `✨ ${activePlayer.name} aproveitou a Oportunidade: +R$ 2.000 e +1 Cliente!`
      );
      setActiveModal({
        type: 'TILE_INFO',
        tile: landingTile
      });
      return;
    }

    // Negociação ou Início
    setActiveModal({
      type: 'TILE_INFO',
      tile: landingTile
    });
  }, [activePlayer, phase, tiles, addLog, applyResourceChange]);

  // Resolução do Desafio do Narrador (Aprovar / Recusar)
  const resolveChallenge = useCallback((approved: boolean) => {
    if (!activePlayer || !activeModal.card) return;
    const card = activeModal.card;

    if (approved) {
      applyResourceChange(
        activePlayer.id,
        card.approvalReward,
        `🏆 NARRADOR APROVOU: ${activePlayer.name} superou o desafio "${card.title}"! Recompensa: ${card.approvalReward.text}`
      );
      confetti({ particleCount: 60, spread: 50 });
    } else {
      applyResourceChange(
        activePlayer.id,
        card.rejectionPenalty,
        `❌ NARRADOR RECUSOU: ${activePlayer.name} não convenceu no desafio "${card.title}". Penalidade: ${card.rejectionPenalty.text}`
      );
    }

    advanceTurn();
  }, [activePlayer, activeModal.card, applyResourceChange, advanceTurn]);

  // Resolução de Crise (Pagar prejuízo ou gastar 5 pontos para anular)
  const resolveCrisis = useCallback((cancelWithPoints: boolean) => {
    if (!activePlayer) return;

    if (cancelWithPoints) {
      if (activePlayer.points >= 5) {
        setPlayers(prev => prev.map(p => 
          p.id === activePlayer.id ? { ...p, points: p.points - 5 } : p
        ));
        addLog(`🛡️ PODER CORPORATIVO: ${activePlayer.name} gastou 5 Pontos corporativos para ANULAR completamente as perdas da crise!`, 'gain');
      } else {
        addLog(`${activePlayer.name} não possui 5 pontos para anular. Prejuízo aplicado.`, 'loss');
        applyResourceChange(activePlayer.id, { balance: -1500 }, `💥 ${activePlayer.name} sofreu perdas financeiras na crise: -R$ 1.500`);
      }
    } else {
      applyResourceChange(activePlayer.id, { balance: -1500 }, `💥 ${activePlayer.name} absorveu a crise corporativa: -R$ 1.500`);
    }

    advanceTurn();
  }, [activePlayer, applyResourceChange, advanceTurn, addLog]);

  // Resolução de Investimento
  const resolveInvestment = useCallback((invest: boolean) => {
    if (!activePlayer) return;

    if (invest) {
      // Requisito de nível (soma se tiver aliado)
      let effectiveLevel = activePlayer.level;
      if (activePlayer.alliance) {
        const ally = players.find(p => p.id === activePlayer.alliance?.partnerId);
        if (ally) effectiveLevel += ally.level;
      }

      const reqLevel = activeModal.tile?.requiredLevel || 1;
      if (effectiveLevel >= reqLevel) {
        applyResourceChange(
          activePlayer.id,
          { balance: -3000, goods: 3, points: 2 },
          `📈 INVESTIMENTO REALIZADO: ${activePlayer.name} investiu R$ 3.000 e obteve +3 Mercadorias e +2 Pontos corporativos!`
        );
      } else {
        addLog(`⚠️ Investimento cancelado: Requer Nível ${reqLevel} (Nível disponível: ${effectiveLevel}).`, 'info');
      }
    }

    advanceTurn();
  }, [activePlayer, activeModal.tile, players, applyResourceChange, advanceTurn, addLog]);

  // Resolução do Desafio Final da Linha de Chegada
  const resolveFinalBoardroom = useCallback((approved: boolean) => {
    if (!activePlayer) return;

    if (approved) {
      setPlayers(prev => prev.map(p => 
        p.id === activePlayer.id ? { ...p, hasWon: true } : p
      ));
      setWinner(activePlayer);
      setPhase('GAME_OVER');
      addLog(`👑 VITÓRIA HISTÓRICA! O Conselho de Administração aclamou ${activePlayer.name} como o(a) Vencedor(a) da Corrida Corporativa!`, 'victory');
      confetti({ particleCount: 300, spread: 120 });
    } else {
      // Recua 3 casas
      const boardLength = tiles.length;
      const newPos = (activePlayer.position - 3 + boardLength) % boardLength;
      setPlayers(prev => prev.map(p => 
        p.id === activePlayer.id ? { ...p, position: newPos } : p
      ));
      addLog(`📉 REPROVADO NA SABATINA: O Conselho recusou o plano de ${activePlayer.name}. O executivo recuou 3 casas!`, 'crisis');
      advanceTurn();
    }
  }, [activePlayer, tiles.length, addLog, advanceTurn]);

  // Subir Nível (Custa 5 pontos para subir 1 nível, máx 5)
  const upgradePlayerLevel = useCallback((playerId: string): boolean => {
    let success = false;
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      if (p.points >= 5 && p.level < 5) {
        success = true;
        const newLevel = p.level + 1;
        addLog(`⭐ PROMOÇÃO EXECUTIVA: ${p.name} subiu para o Nível ${newLevel} de Liderança Corporativa!`, 'gain');
        return {
          ...p,
          points: p.points - 5,
          level: newLevel
        };
      }
      return p;
    }));
    return success;
  }, [addLog]);

  // Criar Aliança Corporativa
  const createAlliance = useCallback((playerAId: string, playerBId: string, durationRounds: number) => {
    const playerA = players.find(p => p.id === playerAId);
    const playerB = players.find(p => p.id === playerBId);
    if (!playerA || !playerB || playerAId === playerBId) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === playerAId) {
        return { ...p, alliance: { partnerId: playerBId, roundsLeft: durationRounds } };
      }
      if (p.id === playerBId) {
        return { ...p, alliance: { partnerId: playerAId, roundsLeft: durationRounds } };
      }
      return p;
    }));

    addLog(`🤝 FUSÃO CORPORATIVA: ${playerA.name} e ${playerB.name} formaram uma aliança estratégica por ${durationRounds} rodadas! Recursos e riscos serão rateados igualmente.`, 'alliance');
  }, [players, addLog]);

  // Romper Aliança
  const breakAlliance = useCallback((playerId: string) => {
    const target = players.find(p => p.id === playerId);
    if (!target || !target.alliance) return;
    const partnerId = target.alliance.partnerId;

    setPlayers(prev => prev.map(p => {
      if (p.id === playerId || p.id === partnerId) {
        return { ...p, alliance: null };
      }
      return p;
    }));

    addLog(`💔 DISSOLUÇÃO: A aliança de ${target.name} foi encerrada imediatamente.`, 'info');
  }, [players, addLog]);

  // Inspecionar Casa Clicada
  const openTileInspectModal = useCallback((tileIndex: number) => {
    const tile = tiles[tileIndex];
    if (!tile) return;
    const tilePlayers = players.filter(p => p.position === tileIndex && !p.isEliminated);

    setActiveModal({
      type: 'INSPECT_TILE',
      tile,
      tilePlayers
    });
  }, [tiles, players]);

  const closeModal = useCallback(() => {
    if (activeModal.type === 'TILE_INFO') {
      advanceTurn();
    } else {
      setActiveModal({ type: null });
    }
  }, [activeModal.type, advanceTurn]);

  const restartGame = useCallback(() => {
    setPhase('SETUP');
    setPlayers([]);
    setActiveModal({ type: null });
    setWinner(null);
  }, []);

  return (
    <GameContext.Provider value={{
      players,
      ranking,
      activePlayer,
      activePlayerIndex,
      currentRound,
      tiles,
      config,
      phase,
      logs,
      activeModal,
      winner,
      movingPlayerId,
      setupGame,
      rollDiceAndMove,
      closeModal,
      openTileInspectModal,
      resolveChallenge,
      resolveCrisis,
      resolveInvestment,
      resolveFinalBoardroom,
      upgradePlayerLevel,
      createAlliance,
      breakAlliance,
      restartGame,
      endGameByLimit
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
