import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { BoardSize, ChallengeCard, GameConfig, GameLog, GamePhase, Player, Tile } from '../types/game';
import { generateBoardTiles, shuffleBoardRules } from '../utils/boardGenerator';
import { CHALLENGE_CARDS, getCompanyLevelInfo } from '../data/challenges';

export const PLAYER_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#ef4444', '#14b8a6', '#84cc16'];

const RES_LABELS: any = { balance: 'R$', goods: 'Mercadorias', clients: 'Clientes', employees: 'Funcionários', points: 'Pontos' };

interface GameContextType {
  players: Player[]; ranking: Player[]; activePlayer: Player | null; activePlayerIndex: number; currentRound: number;
  tiles: Tile[]; config: GameConfig; phase: GamePhase; logs: GameLog[];
  activeModal: { type: 'TILE_INFO' | 'CHALLENGE' | 'CRISIS' | 'INVESTMENT' | 'ALLIANCE' | 'NEGOTIATION' | 'INSPECT_TILE' | 'FINAL_BOARDROOM' | 'OPPORTUNITY' | 'QUEIMA' | 'GAME_OVER' | 'CONFIRM_SHUFFLE' | 'CONFIRM_QUIT' | null; tile?: Tile; card?: ChallengeCard; tilePlayers?: Player[]; };
  winner: Player | null; movingPlayerId: string | null; selectedDice: number | null;
  notification: { id: string; message: string; type: string } | null;
  setupGame: (playerNames: string[], boardSize: BoardSize, lapLimit: number | null) => void;
  rollDiceAndMove: (diceValue: number) => Promise<void>;
  closeModal: () => void; openTileInspectModal: (tileIndex: number) => void;
  resolveChallenge: (approved: boolean) => void; resolveCrisis: (cancelWithPoints: boolean) => void;
  resolveInvestment: (invest: boolean) => void; resolveFinalBoardroom: (approved: boolean) => void;
  resolveNegotiation: (trade: any | null) => void; resolveAllianceModal: (partnerId: string | null, duration?: number) => void;
  resolveOpportunity: (accept: boolean) => void; resolveQueima: (goodsSold: number, amountReceived: number) => void; restartGame: () => void;
  requestShuffleBoard: () => void; requestQuitGame: () => void; confirmShuffleBoard: () => void; confirmQuitGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<GameConfig>({ boardSize: 30, lapLimit: 3 });
  const [tiles, setTiles] = useState<Tile[]>(() => shuffleBoardRules(generateBoardTiles(30)));
  const [players, setPlayers] = useState<Player[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [phase, setPhase] = useState<GamePhase>('SETUP');
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [movingPlayerId, setMovingPlayerId] = useState<string | null>(null);
  const [selectedDice, setSelectedDice] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<GameContextType['activeModal']>({ type: null });
  const [notification, setNotification] = useState<GameContextType['notification']>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4800);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const addLog = useCallback((message: string, type: GameLog['type'] = 'info') => {
    if (!message) return;
    const id = Math.random().toString(36).substring(2, 9);
    setLogs(prev => [{ id, round: currentRound, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message, type }, ...prev.slice(0, 49)]);

    const isMovement = message.includes('andou') || message.includes('parou na casa') || message.includes('Nova rodada');
    if (!isMovement) {
      setNotification({ id, message, type });
    }
  }, [currentRound]);

  const ranking = useMemo(() => {
    return [...players].sort((a, b) => {
      if (a.isEliminated && !b.isEliminated) return 1; if (!a.isEliminated && b.isEliminated) return -1;
      if (a.hasWon && !b.hasWon) return -1; if (!a.hasWon && b.hasWon) return 1;
      if (b.lapsCompleted !== a.lapsCompleted) return b.lapsCompleted - a.lapsCompleted;
      if (b.balance !== a.balance) return b.balance - a.balance;
      return b.points - a.points;
    });
  }, [players]);

  const activePlayer = useMemo(() => players[activePlayerIndex] || null, [players, activePlayerIndex]);

  useEffect(() => {
    if (phase === 'SETUP' || phase === 'GAME_OVER' || players.length === 0) return;
    const stillPlaying = players.filter(p => !p.isEliminated && !p.hasWon);
    if (players.length > 1 ? stillPlaying.length <= 1 : stillPlaying.length === 0) {
      setPhase('GAME_OVER'); setWinner(ranking[0]); setActiveModal({ type: null });
      addLog(`🏁 CORRIDA ENCERRADA! Fim de jogo!`, 'victory');
      setTimeout(() => confetti({ particleCount: 400, spread: 150 }), 100);
    }
  }, [players, phase, ranking, addLog]);

  const setupGame = useCallback((playerNames: string[], boardSize: BoardSize, lapLimit: number | null) => {
    const baseTiles = generateBoardTiles(boardSize);
    const newTiles = shuffleBoardRules(baseTiles);
    const initialPoints = 5;
    const initialLevel = getCompanyLevelInfo(initialPoints).level;

    const newPlayers: Player[] = playerNames.map((name, idx) => ({
      id: `p-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`, name: name.trim(), color: PLAYER_PALETTE[idx % PLAYER_PALETTE.length],
      position: 0, lapsCompleted: 0, 
      balance: 20000, employees: 10, clients: 10, goods: 10, points: initialPoints, level: initialLevel,
      bankruptcy: { inRecovery: false, roundsLeft: 2 }, alliance: null, isEliminated: false, hasWon: false,
      hasActiveInvestment: false
    }));
    setConfig({ boardSize, lapLimit }); setTiles(newTiles); setPlayers(newPlayers); setActivePlayerIndex(0);
    setCurrentRound(1); setPhase('ROLL'); setLogs([]); setWinner(null); setActiveModal({ type: null }); setNotification(null);
  }, []);

  const applyResourceChange = useCallback((playerId: string, delta: any, actionDescription: string) => {
    const target = players.find(p => p.id === playerId);
    if (target) {
      const partner = target.alliance ? players.find(p => p.id === target.alliance?.partnerId && !p.isEliminated) : null;
      const divisor = partner ? 2 : 1;
      
      let penalty = 0;
      if (delta.goods) {
        const dG = Math.round(delta.goods / divisor);
        if (target.goods + dG < 0) {
          penalty = -(Math.abs(target.goods + dG) * 1000); 
        }
      }
      
      const predictedBalance = target.balance + (delta.balance ? Math.round(delta.balance / divisor) : 0) + penalty;
      
      if (predictedBalance <= 0 && !target.bankruptcy.inRecovery) {
        setTimeout(() => addLog(`🚨 ALERTA VERMELHO: ${target.name} negativou o caixa e entrou em Recuperação Judicial!`, 'crisis'), 150);
      } else if (predictedBalance > 0 && target.bankruptcy.inRecovery) {
        setTimeout(() => addLog(`🟢 ALÍVIO: ${target.name} pagou as dívidas e saiu da Recuperação Judicial!`, 'gain'), 150);
      }
    }

    setPlayers(prevPlayers => {
      const currentTarget = prevPlayers.find(p => p.id === playerId);
      if (!currentTarget) return prevPlayers;
      const currentPartner = currentTarget.alliance ? prevPlayers.find(p => p.id === currentTarget.alliance?.partnerId && !p.isEliminated) : null;

      return prevPlayers.map(p => {
        let isTarget = p.id === playerId; let isPartner = currentPartner && p.id === currentPartner.id;
        if (!isTarget && !isPartner) return p;

        const divisor = currentPartner ? 2 : 1;
        let newGoods = p.goods;
        let penaltyForMissingGoods = 0;

        if (delta.goods) {
          const deltaG = Math.round(delta.goods / divisor);
          if (deltaG < 0) {
            if (p.goods + deltaG < 0) {
              const missingAmount = Math.abs(p.goods + deltaG);
              newGoods = 0;
              penaltyForMissingGoods = -(missingAmount * 1000);
            } else {
              newGoods = p.goods + deltaG;
            }
          } else {
            newGoods = p.goods + deltaG;
          }
        }

        const newBalance = p.balance + (delta.balance ? Math.round(delta.balance / divisor) : 0) + penaltyForMissingGoods;
        const newEmployees = Math.max(0, p.employees + (delta.employees ? Math.round(delta.employees / divisor) : 0));
        const newClients = Math.max(0, p.clients + (delta.clients ? Math.round(delta.clients / divisor) : 0));
        const newPoints = Math.max(0, p.points + (delta.points ? Math.round(delta.points / divisor) : 0));
        
        const newHasInv = (delta.hasActiveInvestment !== undefined && isTarget) ? delta.hasActiveInvestment : p.hasActiveInvestment;
        const newLevelInfo = getCompanyLevelInfo(newPoints);
        
        // CORREÇÃO: Aplica "_isNew" para garantir que ele terá 2 turnos inteiros
        let updatedBankruptcy = { ...p.bankruptcy };
        
        if (newBalance <= 0 && !updatedBankruptcy.inRecovery) { 
          updatedBankruptcy = { inRecovery: true, roundsLeft: 2, _isNew: true } as any; 
        }
        else if (newBalance > 0 && updatedBankruptcy.inRecovery) { 
          updatedBankruptcy = { inRecovery: false, roundsLeft: 2 }; 
        }

        return { ...p, balance: newBalance, employees: newEmployees, clients: newClients, goods: newGoods, points: newPoints, level: newLevelInfo.level, bankruptcy: updatedBankruptcy, hasActiveInvestment: newHasInv };
      });
    });
    
    if (actionDescription) addLog(actionDescription, delta.balance && delta.balance < 0 ? 'loss' : 'gain');
  }, [addLog, players]);

  const advanceTurn = useCallback(() => {
    setActiveModal({ type: null });

    setPlayers(prevPlayers => {
      let updatedPlayers = [...prevPlayers];
      const currPlayer = updatedPlayers[activePlayerIndex];
      let isEliminatedNow = false;

      // CORREÇÃO: Lê a tag _isNew para ignorar o relógio no turno exato em que ele entrou em falência
      if (currPlayer && currPlayer.bankruptcy.inRecovery && !currPlayer.isEliminated) {
        const bank = currPlayer.bankruptcy as any;
        
        if (bank._isNew) {
          updatedPlayers[activePlayerIndex] = { ...currPlayer, bankruptcy: { inRecovery: true, roundsLeft: bank.roundsLeft } };
        } else {
          const newRounds = bank.roundsLeft - 1;
          if (newRounds <= 0 && currPlayer.balance <= 0) {
            isEliminatedNow = true;
            updatedPlayers[activePlayerIndex] = { ...currPlayer, isEliminated: true, bankruptcy: { inRecovery: true, roundsLeft: 0 } };
          } else {
            updatedPlayers[activePlayerIndex] = { ...currPlayer, bankruptcy: { inRecovery: true, roundsLeft: newRounds } };
          }
        }
      }

      let nextIdx = (activePlayerIndex + 1) % updatedPlayers.length;
      let loops = 0;
      let roundAdvanced = false;

      if (nextIdx === 0) roundAdvanced = true;
      
      while ((updatedPlayers[nextIdx]?.isEliminated || updatedPlayers[nextIdx]?.hasWon) && loops < updatedPlayers.length) {
        nextIdx = (nextIdx + 1) % updatedPlayers.length;
        loops++;
        if (nextIdx === 0) roundAdvanced = true;
      }

      if (roundAdvanced) {
        updatedPlayers = updatedPlayers.map(p => {
          if (!p.alliance) return p;
          const ar = p.alliance.roundsLeft - 1;
          return ar <= 0 ? { ...p, alliance: null } : { ...p, alliance: { ...p.alliance, roundsLeft: ar } };
        });
      }

      const updatedCurrPlayer = updatedPlayers[activePlayerIndex];

      setTimeout(() => {
        if (isEliminatedNow) {
          addLog(`💀 FALÊNCIA: A empresa de ${currPlayer?.name} não se recuperou e FOI ELIMINADA!`, 'loss');
        } else if (updatedCurrPlayer && updatedCurrPlayer.bankruptcy.inRecovery && !updatedCurrPlayer.isEliminated) {
          // Só avisa a contagem se não for o turno que ele acabou de negativar
          if (!(currPlayer?.bankruptcy as any)?._isNew) {
            addLog(`⚠️ CONTAGEM REGRESSIVA: ${updatedCurrPlayer.name} tem apenas ${updatedCurrPlayer.bankruptcy.roundsLeft} rodada(s) para sair do vermelho!`, 'crisis');
          }
        }
        if (roundAdvanced) {
          addLog(`🎲 Nova rodada iniciada!`, 'info');
          setCurrentRound(r => r + 1);
        }
        setActivePlayerIndex(nextIdx);
        setPhase('ROLL');
      }, 0);

      return updatedPlayers;
    });
  }, [activePlayerIndex, addLog]);

  const rollDiceAndMove = useCallback(async (diceValue: number) => {
    if (!activePlayer || phase !== 'ROLL') return;
    
    setSelectedDice(diceValue);
    setPhase('MOVING'); setMovingPlayerId(activePlayer.id);
    addLog(`🎲 ${activePlayer.name} andou ${diceValue} casas.`, 'info');

    const boardLength = tiles.length;
    let currentPos = activePlayer.position;
    let newBoard = [...tiles];

    for (let step = 1; step <= diceValue; step++) {
      await new Promise(resolve => setTimeout(resolve, 320));
      currentPos = (currentPos + 1) % boardLength;

      if (currentPos === 0) {
        applyResourceChange(activePlayer.id, { balance: 30000, points: 8 }, `🏁 VOLTA COMPLETA: ${activePlayer.name} ganhou +R$ 30.000 e +8 Pontos!`);
        newBoard = shuffleBoardRules(newBoard);
        setTiles(newBoard);
        addLog(`🔄 O Tabuleiro corporativo foi re-embaralhado!`, 'alliance');
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: 0, lastDiceRoll: diceValue, lapsCompleted: p.lapsCompleted + 1 } : p));
        break; 
      } else {
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: currentPos, lastDiceRoll: diceValue } : p));
      }
    }

    setMovingPlayerId(null); setPhase('TILE_ACTION');
    let landingTile = newBoard[currentPos];

    if (landingTile.type === 'Auditoria') {
      const resTypes = ['balance', 'goods', 'clients', 'employees'];
      const chosen = resTypes[Math.floor(Math.random() * resTypes.length)];
      const currentVal = activePlayer[chosen as keyof Player] as number;
      const amountLost = Math.ceil(currentVal * 0.3);
      const dynamicTile = { ...landingTile, effects: [{ type: chosen, amount: -amountLost }] };
      setActiveModal({ type: 'CRISIS', tile: dynamicTile });
      return;
    }

    if (landingTile.type === 'DiretoriaFinal') {
      const isFinalLap = config.lapLimit ? activePlayer.lapsCompleted >= (config.lapLimit - 1) : false;
      if (!isFinalLap) {
        await new Promise(resolve => setTimeout(resolve, 400));
        currentPos = 0; landingTile = newBoard[0];
        applyResourceChange(activePlayer.id, { balance: 30000, points: 8 }, `🚀 BARRADO NA DIRETORIA: ${activePlayer.name} recuou pro início e recebeu +R$ 30.000 e +8 Pontos.`);
        newBoard = shuffleBoardRules(newBoard); setTiles(newBoard);
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: 0, lapsCompleted: p.lapsCompleted + 1 } : p));
        setSelectedDice(null); setActiveModal({ type: 'TILE_INFO', tile: landingTile });
        return;
      } else {
        setSelectedDice(null); setActiveModal({ type: 'FINAL_BOARDROOM', tile: landingTile }); return;
      }
    } else if (landingTile.type === 'Desastre') {
      if (activePlayer.hasActiveInvestment) {
        applyResourceChange(activePlayer.id, { hasActiveInvestment: false }, `🌋 SOBREVIVEU: ${activePlayer.name} queimou seu Investimento Ativo para não sofrer o Desastre!`);
        setSelectedDice(null); setActiveModal({ type: 'TILE_INFO', tile: landingTile }); return;
      } else {
        await new Promise(resolve => setTimeout(resolve, 400));
        currentPos = (currentPos - 1 + boardLength) % boardLength; landingTile = newBoard[currentPos];
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: currentPos } : p));
        addLog(`🌋 DESASTRE: ${activePlayer.name} foi forçado a recuar 1 casa.`, 'crisis');
      }
    }

    addLog(`${activePlayer.name} parou na casa [${landingTile.index}]: ${landingTile.title}`, 'info');
    setSelectedDice(null);

    if (landingTile.type === 'Crescimento') {
      let change: any = {}; 
      let descParts = landingTile.effects?.map((e: any) => {
        change[e.type] = e.amount;
        return `+${e.type === 'balance' ? `R$ ${e.amount.toLocaleString('pt-BR')}` : `${e.amount} ${RES_LABELS[e.type]}`}`;
      }) || [];
      applyResourceChange(activePlayer.id, change, `🚀 CRESCIMENTO: ${activePlayer.name} ganhou ${descParts.join(' e ')}!`);
      setActiveModal({ type: 'TILE_INFO', tile: landingTile }); return;
    }
    
    if (landingTile.type === 'Queima') { setActiveModal({ type: 'QUEIMA', tile: landingTile }); return; }
    if (landingTile.type === 'Oportunidade') { setActiveModal({ type: 'OPPORTUNITY', tile: landingTile }); return; }
    if (landingTile.type === 'Prejuizo') { setActiveModal({ type: 'CRISIS', tile: landingTile }); return; }
    if (landingTile.type === 'Investimento') { setActiveModal({ type: 'INVESTMENT', tile: landingTile }); return; }
    if (landingTile.type === 'Negociação') { setActiveModal({ type: 'NEGOTIATION', tile: landingTile }); return; }
    if (landingTile.type === 'Alianca') { setActiveModal({ type: 'ALLIANCE', tile: landingTile }); return; }
    if (landingTile.type === 'Desafio') { setActiveModal({ type: 'CHALLENGE', tile: landingTile, card: CHALLENGE_CARDS[0] }); return; }

    setActiveModal({ type: 'TILE_INFO', tile: landingTile });
  }, [activePlayer, phase, tiles, addLog, applyResourceChange, config.lapLimit]);

  const resolveOpportunity = useCallback((accept: boolean) => {
    if (!activePlayer || !activeModal.tile?.trade) return;
    if (accept) {
      const trade = activeModal.tile.trade as any;
      if (activePlayer[trade.giveType as keyof Player] >= trade.giveAmount) {
        const giveFmt = trade.giveType === 'balance' ? `R$ ${trade.giveAmount.toLocaleString('pt-BR')}` : `${trade.giveAmount} ${RES_LABELS[trade.giveType]}`;
        const recFmt = trade.receiveType === 'balance' ? `R$ ${trade.receiveAmount.toLocaleString('pt-BR')}` : `${trade.receiveAmount} ${RES_LABELS[trade.receiveType]}`;
        applyResourceChange(activePlayer.id, { [trade.giveType]: -trade.giveAmount, [trade.receiveType]: trade.receiveAmount }, `✨ OPORTUNIDADE: ${activePlayer.name} trocou -${giveFmt} por +${recFmt}!`);
      } else addLog(`❌ Oportunidade perdida: Recursos insuficientes.`, 'loss');
    }
    advanceTurn();
  }, [activePlayer, activeModal.tile, applyResourceChange, advanceTurn, addLog]);

  const resolveQueima = useCallback((goodsSold: number, amountReceived: number) => {
    if (!activePlayer) return;
    if (goodsSold > 0) {
      applyResourceChange(activePlayer.id, { balance: amountReceived, goods: -goodsSold }, `🔥 LIQUIDAÇÃO: ${activePlayer.name} vendeu -${goodsSold} Mercadorias e faturou +R$ ${amountReceived.toLocaleString('pt-BR')}!`);
    } else {
      addLog(`🤷‍♂️ ${activePlayer.name} não liquidou mercadorias.`, 'info');
    }
    advanceTurn();
  }, [activePlayer, applyResourceChange, advanceTurn, addLog]);

  const resolveChallenge = useCallback((approved: boolean) => {
    if (!activePlayer) return;
    if (approved) applyResourceChange(activePlayer.id, { balance: 20000, points: 5 }, `🏆 APROVADO: ${activePlayer.name} superou a Sabatina! Ganhou +R$ 20.000 e +5 Pontos!`);
    else applyResourceChange(activePlayer.id, { balance: -25000, points: -2 }, `❌ RECUSADO: ${activePlayer.name} falhou na Sabatina e sofreu -R$ 25.000 e -2 Pontos!`);
    advanceTurn();
  }, [activePlayer, applyResourceChange, advanceTurn]);

  const resolveCrisis = useCallback((cancelWithPoints: boolean) => {
    if (!activePlayer || !activeModal.tile?.effects) return;
    if (cancelWithPoints) {
      if (activePlayer.points >= 5) {
        applyResourceChange(activePlayer.id, { points: -5 }, `🛡️ DEFESA: ${activePlayer.name} gastou -5 Pontos e anulou completamente a Crise!`);
      } else {
        let change: any = {}; 
        let descParts = activeModal.tile.effects.map((e: any) => {
          change[e.type] = e.amount;
          return `-${e.type === 'balance' ? `R$ ${Math.abs(e.amount).toLocaleString('pt-BR')}` : `${Math.abs(e.amount)} ${RES_LABELS[e.type]}`}`;
        });
        applyResourceChange(activePlayer.id, change, `💥 IMPACTO: ${activePlayer.name} sofreu ${descParts.join(' e ')}!`);
      }
    } else {
      let change: any = {}; 
      let descParts = activeModal.tile.effects.map((e: any) => {
        change[e.type] = e.amount;
        return `-${e.type === 'balance' ? `R$ ${Math.abs(e.amount).toLocaleString('pt-BR')}` : `${Math.abs(e.amount)} ${RES_LABELS[e.type]}`}`;
      });
      applyResourceChange(activePlayer.id, change, `💥 IMPACTO: ${activePlayer.name} sofreu ${descParts.join(' e ')}!`);
    }
    advanceTurn();
  }, [activePlayer, activeModal.tile, applyResourceChange, advanceTurn]);

  const resolveInvestment = useCallback((invest: boolean) => {
    if (!activePlayer) return;
    if (invest) {
      const reqLevel = activeModal.tile?.requiredLevel || 1;
      if ((activePlayer.level + (activePlayer.alliance ? 1 : 0)) >= reqLevel) {
        applyResourceChange(activePlayer.id, { balance: -50000, goods: 4, points: 5, hasActiveInvestment: true }, `📈 APORTE FEITO: ${activePlayer.name} investiu -R$ 50.000 em troca de +4 Mercadorias e +5 Pontos!`);
      }
    }
    advanceTurn();
  }, [activePlayer, activeModal.tile, applyResourceChange, advanceTurn]);

  const resolveFinalBoardroom = useCallback((approved: boolean) => {
    if (!activePlayer) return;
    if (approved) {
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, hasWon: true } : p));
      addLog(`👏 CONTRATADO! ${activePlayer.name} garantiu a vaga no Conselho!`, 'gain'); confetti({ particleCount: 100, spread: 70 });
    } else {
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: (activePlayer.position - 3 + tiles.length) % tiles.length, lapsCompleted: Math.max(0, p.lapsCompleted - 1) } : p));
      addLog(`📉 REPROVADO! ${activePlayer.name} recuou 3 casas na etapa final.`, 'crisis');
    }
    advanceTurn();
  }, [activePlayer, tiles.length, addLog, advanceTurn]);

  const resolveAllianceModal = useCallback((partnerId: string | null, duration: number = 3) => {
    if (partnerId && activePlayer) {
      const partner = players.find(p => p.id === partnerId);
      setPlayers(prev => prev.map(p => {
        if (p.id === activePlayer.id) return { ...p, alliance: { partnerId, roundsLeft: duration } };
        if (p.id === partnerId) return { ...p, alliance: { partnerId: activePlayer.id, roundsLeft: duration } };
        return p;
      }));
      addLog(`🤝 CONTRATO ASSINADO: ${activePlayer.name} e ${partner?.name || 'outro executivo'} dividem lucros e dívidas pelas próximas ${duration} rodadas!`, 'alliance');
    }
    advanceTurn();
  }, [activePlayer, players, addLog, advanceTurn]);

  const resolveNegotiation = useCallback((trade: any | null) => {
    if (!activePlayer) return;
    if (trade && trade.partnerId) {
      const partner = players.find(p => p.id === trade.partnerId);
      if (partner) {
        const giveFmt = trade.giveType === 'balance' ? `R$ ${trade.giveAmount.toLocaleString('pt-BR')}` : `${trade.giveAmount} ${RES_LABELS[trade.giveType]}`;
        const recFmt = trade.receiveType === 'balance' ? `R$ ${trade.receiveAmount.toLocaleString('pt-BR')}` : `${trade.receiveAmount} ${RES_LABELS[trade.receiveType]}`;
        
        applyResourceChange(activePlayer.id, { [trade.giveType]: -trade.giveAmount }, ''); 
        applyResourceChange(partner.id, { [trade.giveType]: trade.giveAmount }, '');
        applyResourceChange(partner.id, { [trade.receiveType]: -trade.receiveAmount }, '');
        applyResourceChange(activePlayer.id, { [trade.receiveType]: trade.receiveAmount }, `⚖️ ACORDO COMERCIAL: ${activePlayer.name} entregou -${giveFmt} e recebeu +${recFmt} de ${partner.name}!`);
      }
    }
    advanceTurn();
  }, [activePlayer, players, applyResourceChange, advanceTurn]);

  const openTileInspectModal = useCallback((tileIndex: number) => {
    const tile = tiles[tileIndex];
    if (tile) setActiveModal({ type: 'INSPECT_TILE', tile, tilePlayers: players.filter(p => p.position === tileIndex && !p.isEliminated) });
  }, [tiles, players]);

  const closeModal = useCallback(() => { if (activeModal.type === 'TILE_INFO') advanceTurn(); else setActiveModal({ type: null }); }, [activeModal.type, advanceTurn]);
  const restartGame = useCallback(() => { setPhase('SETUP'); setPlayers([]); setActiveModal({ type: null }); setWinner(null); }, []);

  const requestShuffleBoard = useCallback(() => setActiveModal({ type: 'CONFIRM_SHUFFLE' }), []);
  const requestQuitGame = useCallback(() => setActiveModal({ type: 'CONFIRM_QUIT' }), []);
  
  const confirmShuffleBoard = useCallback(() => {
    setTiles(prev => shuffleBoardRules([...prev]));
    addLog(`🔄 O Tabuleiro corporativo foi re-embaralhado!`, 'info');
    setActiveModal({ type: null });
  }, [addLog]);

  const confirmQuitGame = useCallback(() => {
    restartGame();
  }, [restartGame]);

  return (
    <GameContext.Provider value={{
      players, ranking, activePlayer, activePlayerIndex, currentRound, tiles, config, phase, logs, activeModal, winner, movingPlayerId, selectedDice,
      notification, 
      setupGame, rollDiceAndMove, closeModal, openTileInspectModal, resolveChallenge, resolveCrisis, resolveInvestment, resolveFinalBoardroom, resolveNegotiation, resolveAllianceModal, resolveOpportunity, resolveQueima, restartGame,
      requestShuffleBoard, requestQuitGame, confirmShuffleBoard, confirmQuitGame
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => { const ctx = useContext(GameContext); if (!ctx) throw new Error('Error'); return ctx; };