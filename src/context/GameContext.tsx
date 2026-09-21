import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { BoardSize, ChallengeCard, GameConfig, GameLog, GamePhase, Player, Tile } from '../types/game';
import { generateBoardTiles, shuffleBoardRules } from '../utils/boardGenerator';
import { CHALLENGE_CARDS, getCompanyLevelInfo } from '../data/challenges';
import { socket } from '../services/socket';

export const PLAYER_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#ef4444', '#14b8a6', '#84cc16'];
const RES_LABELS: any = { balance: 'R$', goods: 'Mercadorias', clients: 'Clientes', employees: 'Funcionários', points: 'Pontos' };

interface GameContextType {
  players: Player[]; ranking: Player[]; activePlayer: Player | null; activePlayerIndex: number; currentRound: number;
  tiles: Tile[]; config: GameConfig; phase: GamePhase; logs: GameLog[];
  activeModal: { type: string | null; tile?: Tile; card?: ChallengeCard; tilePlayers?: Player[]; investment?: any; invIndex?: number; diceValue?: number; playerName?: string; };
  winner: Player | null; movingPlayerId: string | null; selectedDice: number | null;
  notification: { id: string; message: string; type: string } | null;
  setupGame: (playerNames: (string | Player)[], boardSize: BoardSize, lapLimit: number | null) => void;
  rollDiceAndMove: (diceValue: number) => Promise<void>;
  closeModal: () => void; openTileInspectModal: (tileIndex: number) => void;
  resolveChallenge: (approved: boolean, useEmployees?: boolean) => void; 
  resolveCrisis: (cancelWithPoints: boolean) => void;
  resolveInvestment: (investments: any) => void; 
  resolveInvestmentReturn: () => void;
  resolveFinalBoardroom: (approved: boolean) => void;
  resolveNegotiation: (trade: any | null) => void; resolveAllianceModal: (partnerId: string | null, duration?: number) => void;
  resolveOpportunity: (accept: boolean) => void; resolveQueima: (goodsSold: number, amountReceived: number) => void; restartGame: () => void;
  requestShuffleBoard: () => void; requestQuitGame: () => void; confirmShuffleBoard: () => void; confirmQuitGame: () => void;
  eliminatePlayer: (playerId: string) => void;
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
  const [pendingTileAction, setPendingTileAction] = useState<{ tile: Tile, pos: number } | null>(null);
  
  const [forceAdvanceToggle, setForceAdvanceToggle] = useState(0);

  useEffect(() => {
    if (notification) { const timer = setTimeout(() => setNotification(null), 5500); return () => clearTimeout(timer); }
  }, [notification]);

  useEffect(() => {
    const handleCardDrawn = ({ playerId, card }: any) => {
      setPlayers(prev => prev.map(p => { if (p.id === playerId) { return { ...p, cards: [...(p.cards || []), card] }; } return p; }));
    };
    socket.on('game:card_drawn', handleCardDrawn);
    return () => { socket.off('game:card_drawn', handleCardDrawn); };
  }, []);

  useEffect(() => {
    const handleDramaticAlert = (alertData: { id: string; message: string; type: string }) => {
      setNotification({ id: alertData.id || Math.random().toString(36).substring(2, 9), message: alertData.message, type: alertData.type || 'crisis' });
      setLogs(prev => [{ id: alertData.id || Math.random().toString(36).substring(2, 9), round: currentRound, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message: alertData.message, type: (alertData.type === 'crisis' ? 'crisis' : 'gain') as any }, ...prev.slice(0, 49)]);
    };
    socket.on('game:dramatic_alert', handleDramaticAlert);
    return () => { socket.off('game:dramatic_alert', handleDramaticAlert); };
  }, [currentRound]);

  useEffect(() => {
    const handleCardUsed = (data: { playerId: string; cardId: string }) => {
      setPlayers(prev => prev.map(p => p.id === data.playerId ? { ...p, cards: p.cards.filter(c => c.id !== data.cardId) } : p));
    };

    const handleRemoteDice = (data: { playerId: string; diceValue: number; playerName?: string }) => { setActiveModal({ type: 'DICE_RESULT', diceValue: data.diceValue, playerName: data.playerName }); };
    const handleTraicoeiroApplied = (data: { targetPlayerId: string; newPosition: number }) => { setPlayers(prev => prev.map(p => p.id === data.targetPlayerId ? { ...p, position: data.newPosition } : p)); };
    const handleImpostorApplied = (data: { targetPlayerId: string; newDiceValue: number }) => { 
      setPlayers(prev => prev.map(p => p.id === data.targetPlayerId ? { ...p, lastDiceRoll: data.newDiceValue } : p)); 
      setActiveModal(prev => { if (prev.type === 'DICE_RESULT') return { ...prev, diceValue: data.newDiceValue }; return prev; });
    };

    const handleDoisDados = (data: { playerId: string }) => {
      setPlayers(prev => prev.map(p => p.id === data.playerId ? { ...p, hasExtraRoll: true } : p));
    };

    const handleBloqueio = (data: { attackerName: string }) => {
      setPhase('TILE_ACTION'); 
      setActiveModal({
          type: 'TILE_INFO',
          tile: {
              index: -1,
              title: '🚫 JOGADOR BLOQUEADO!',
              description: `A jogada atual foi cancelada por ${data.attackerName}. Clique em "Continuar" para passar a vez ao próximo.`,
              type: 'Prejuizo'
          } as any
      });
    };

    const handleSecondChance = (data: { playerId: string; recoil: number }) => {
      setPlayers(prev => {
        const updated = [...prev];
        const pIdx = updated.findIndex(p => p.id === data.playerId);
        if (pIdx !== -1) {
          const p = updated[pIdx];
          let newPos = p.position - data.recoil;
          let laps = p.lapsCompleted;
          if (newPos < 0) { newPos = (newPos + config.boardSize) % config.boardSize; laps = Math.max(1, laps - 1); }
          updated[pIdx] = { ...p, position: newPos, lapsCompleted: laps };
        }
        return updated;
      });
      setActiveModal({ type: null }); setPhase('ROLL'); setSelectedDice(null);
    };

    socket.on('card:used', handleCardUsed);
    socket.on('game:dice_rolled', handleRemoteDice); 
    socket.on('card:traicoeiro_applied', handleTraicoeiroApplied);
    socket.on('card:impostor_applied', handleImpostorApplied);
    socket.on('card:dois_dados_applied', handleDoisDados);
    socket.on('card:bloqueio_applied', handleBloqueio);
    socket.on('card:second_chance_applied', handleSecondChance);

    return () => { 
      socket.off('card:used', handleCardUsed);
      socket.off('game:dice_rolled', handleRemoteDice); 
      socket.off('card:traicoeiro_applied', handleTraicoeiroApplied); 
      socket.off('card:impostor_applied', handleImpostorApplied);
      socket.off('card:dois_dados_applied', handleDoisDados);
      socket.off('card:bloqueio_applied', handleBloqueio);
      socket.off('card:second_chance_applied', handleSecondChance);
    };
  }, [config.boardSize]);

  const addLog = useCallback((message: string, type: GameLog['type'] = 'info') => {
    if (!message) return;
    const id = Math.random().toString(36).substring(2, 9);
    setLogs(prev => [{ id, round: currentRound, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message, type }, ...prev.slice(0, 49)]);
    const isMovement = message.includes('andou') || message.includes('parou na casa') || message.includes('Nova rodada');
    if (!isMovement) setNotification({ id, message, type });
  }, [currentRound]);

  const eliminatePlayer = useCallback((playerId: string) => {
    socket.emit('narrator:eliminate_player', { playerId });
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, isEliminated: true, bankruptcy: { inRecovery: true, roundsLeft: 0 } } : p));
  }, []);

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
      addLog(`🏁 CORRIDA ENCERRADA! Fim de jogo!`, 'victory'); setTimeout(() => confetti({ particleCount: 500, spread: 200 }), 100);
    }
  }, [players, phase, ranking, addLog]);

  const setupGame = useCallback((playerListOrNames: (string | Player)[], boardSize: BoardSize, lapLimit: number | null) => {
    const baseTiles = generateBoardTiles(boardSize); const newTiles = shuffleBoardRules(baseTiles);
    const initialPoints = 5; const initialLevel = getCompanyLevelInfo(initialPoints).level;

    const newPlayers: Player[] = playerListOrNames.map((item, idx) => {
      if (typeof item === 'object' && item !== null) {
        return { ...item, position: 0, lapsCompleted: 1, balance: item.balance ?? 20000, employees: item.employees ?? 10, clients: item.clients ?? 10, goods: item.goods ?? 10, points: item.points ?? initialPoints, level: item.level ?? initialLevel, cards: item.cards ?? [], bankruptcy: item.bankruptcy ?? { inRecovery: false, roundsLeft: 2 }, alliance: item.alliance ?? null, isEliminated: false, hasWon: false, investments: [], hasExtraRoll: false };
      }
      return {
        id: `p-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`, name: (item as string).trim(), color: PLAYER_PALETTE[idx % PLAYER_PALETTE.length], position: 0, lapsCompleted: 1, balance: 20000, employees: 10, clients: 10, goods: 10, points: initialPoints, level: initialLevel, cards: [], bankruptcy: { inRecovery: false, roundsLeft: 2 }, alliance: null, isEliminated: false, hasWon: false, investments: [], hasExtraRoll: false
      } as any;
    });

    setConfig({ boardSize, lapLimit }); setTiles(newTiles); setPlayers(newPlayers); setActivePlayerIndex(0); setCurrentRound(1); setPhase('ROLL'); setLogs([]); setWinner(null); setActiveModal({ type: null }); setNotification(null);

    if (socket.connected) {
      socket.emit('narrator:start_game', { boardSize, lapLimit });
      socket.emit('narrator:sync_full_state', { players: newPlayers, boardSize, lapLimit, activePlayerIndex: 0, phase: 'ROLL', currentRound: 1, isStarted: true });
    }
  }, []);

  const applyResourceChange = useCallback((playerId: string, delta: any, actionDescription: string) => {
    const target = players.find(p => p.id === playerId); if (!target) return;
    const partner = target.alliance ? players.find(p => p.id === target.alliance?.partnerId && !p.isEliminated) : null;
    const divisor = partner ? 2 : 1;
    
    let logMsg = actionDescription;
    if (actionDescription && partner) {
      let halves: string[] = [];
      if (delta.balance) halves.push(`${delta.balance > 0 ? '+' : ''}R$ ${Math.round(delta.balance / 2).toLocaleString('pt-BR')}`);
      if (delta.goods) halves.push(`${delta.goods > 0 ? '+' : ''}${Math.round(delta.goods / 2)} Merc.`);
      if (delta.clients) halves.push(`${delta.clients > 0 ? '+' : ''}${Math.round(delta.clients / 2)} Cli.`);
      if (delta.employees) halves.push(`${delta.employees > 0 ? '+' : ''}${Math.round(delta.employees / 2)} Func.`);
      if (delta.points) halves.push(`${delta.points > 0 ? '+' : ''}${Math.round(delta.points / 2)} Pts`);
      logMsg = `🤝 ALIANÇA: ${target.name} e ${partner.name} receberam cada um ${halves.join(', ')}!`;
    }

    setPlayers(prevPlayers => {
      const currentTarget = prevPlayers.find(p => p.id === playerId); if (!currentTarget) return prevPlayers;
      const currentPartner = currentTarget.alliance ? prevPlayers.find(p => p.id === currentTarget.alliance?.partnerId && !p.isEliminated) : null;

      return prevPlayers.map(p => {
        let isTarget = p.id === playerId; let isPartner = currentPartner && p.id === currentPartner.id;
        if (!isTarget && !isPartner) return p;

        let newGoods = p.goods; let newEmployees = p.employees; let penaltyForMissing = 0;

        if (delta.goods) {
          const deltaG = Math.round(delta.goods / divisor);
          if (p.goods + deltaG < 0) { const missing = Math.abs(p.goods + deltaG); newGoods = 0; penaltyForMissing += -(missing * 1000); } else { newGoods = p.goods + deltaG; }
        }

        if (delta.employees) {
          const deltaE = Math.round(delta.employees / divisor);
          if (p.employees + deltaE < 0) { const missing = Math.abs(p.employees + deltaE); newEmployees = 0; penaltyForMissing += -(missing * 5000); } else { newEmployees = p.employees + deltaE; }
        }

        const newBalance = p.balance + (delta.balance ? Math.round(delta.balance / divisor) : 0) + penaltyForMissing;
        const newClients = Math.max(0, p.clients + (delta.clients ? Math.round(delta.clients / divisor) : 0));
        const newPoints = Math.max(0, p.points + (delta.points ? Math.round(delta.points / divisor) : 0));
        const newLevelInfo = getCompanyLevelInfo(newPoints);
        
        let updatedBankruptcy = { ...p.bankruptcy };
        if (newBalance <= 0 && !updatedBankruptcy.inRecovery) { updatedBankruptcy = { inRecovery: true, roundsLeft: 2, _isNew: true } as any; }
        else if (newBalance > 0 && updatedBankruptcy.inRecovery) { updatedBankruptcy = { inRecovery: false, roundsLeft: 2 }; }

        return { ...p, balance: newBalance, employees: newEmployees, clients: newClients, goods: newGoods, points: newPoints, level: newLevelInfo.level, bankruptcy: updatedBankruptcy };
      });
    });
    
    if (logMsg) addLog(logMsg, delta.balance && delta.balance < 0 ? 'loss' : 'gain');
  }, [addLog, players]);

  const advanceTurn = useCallback(() => {
    setActiveModal({ type: null });

    setPlayers(prevPlayers => {
      let updatedPlayers = [...prevPlayers];
      const currPlayer = updatedPlayers[activePlayerIndex];
      let isEliminatedNow = false;

      if (currPlayer && currPlayer.bankruptcy.inRecovery && !currPlayer.isEliminated) {
        const bank = currPlayer.bankruptcy as any;
        if (bank._isNew) { updatedPlayers[activePlayerIndex] = { ...currPlayer, bankruptcy: { inRecovery: true, roundsLeft: bank.roundsLeft } }; } 
        else {
          const newRounds = bank.roundsLeft - 1;
          if (newRounds <= 0 && currPlayer.balance <= 0) { isEliminatedNow = true; updatedPlayers[activePlayerIndex] = { ...currPlayer, isEliminated: true, bankruptcy: { inRecovery: true, roundsLeft: 0 } }; } 
          else { updatedPlayers[activePlayerIndex] = { ...currPlayer, bankruptcy: { inRecovery: true, roundsLeft: newRounds } }; }
        }
      }

      let nextIdx = activePlayerIndex;
      let roundAdvanced = false;
      let isExtraRoll = false;

      if (currPlayer && currPlayer.hasExtraRoll && !currPlayer.isEliminated) {
        isExtraRoll = true;
        updatedPlayers[activePlayerIndex] = { ...currPlayer, hasExtraRoll: false };
      } else {
        nextIdx = (activePlayerIndex + 1) % updatedPlayers.length;
        let loops = 0; if (nextIdx === 0) roundAdvanced = true;
        while ((updatedPlayers[nextIdx]?.isEliminated || updatedPlayers[nextIdx]?.hasWon) && loops < updatedPlayers.length) { 
          nextIdx = (nextIdx + 1) % updatedPlayers.length; 
          loops++; 
          if (nextIdx === 0) roundAdvanced = true; 
        }
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
        if (isEliminatedNow) { addLog(`💀 FALÊNCIA: A empresa de ${currPlayer?.name} não se recuperou e FOI ELIMINADA!`, 'loss'); }
        else if (updatedCurrPlayer && updatedCurrPlayer.bankruptcy.inRecovery && !updatedCurrPlayer.isEliminated) {
          if (!(currPlayer?.bankruptcy as any)?._isNew) { addLog(`⚠️ CONTAGEM REGRESSIVA: ${updatedCurrPlayer.name} tem apenas ${updatedCurrPlayer.bankruptcy.roundsLeft} rodada(s) para sair do vermelho!`, 'crisis'); }
        }

        if (isExtraRoll) { 
          addLog(`🎲 DE NOVO! A vez continuou com ${currPlayer?.name}!`, 'gain'); 
          setActivePlayerIndex(nextIdx); 
          setPhase('ROLL');
          if (socket.connected) { socket.emit('narrator:sync_full_state', { players: updatedPlayers, activePlayerIndex: nextIdx, phase: 'ROLL' }); }
        }
        else {
          if (roundAdvanced) { addLog(`🎲 Nova rodada iniciada!`, 'info'); setCurrentRound(r => r + 1); }
          setActivePlayerIndex(nextIdx); 
          setPhase('ROLL');
          if (socket.connected) { socket.emit('narrator:sync_full_state', { players: updatedPlayers, activePlayerIndex: nextIdx, phase: 'ROLL' }); }
        }
      }, 0);

      return updatedPlayers;
    });
  }, [activePlayerIndex, addLog]);

  useEffect(() => {
    if (forceAdvanceToggle > 0) {
      advanceTurn();
    }
  }, [forceAdvanceToggle, advanceTurn]);


  const executeTileAction = useCallback((landingTile: Tile, currentPos: number) => {
    if (!activePlayer) return;

    if (landingTile.type === 'Auditoria') {
      const resTypes = ['balance', 'goods', 'clients', 'employees']; const chosen = resTypes[Math.floor(Math.random() * resTypes.length)]; const currentVal = activePlayer[chosen as keyof Player] as number; const amountLost = Math.ceil(currentVal * 0.3);
      setActiveModal({ type: 'CRISIS', tile: { ...landingTile, effects: [{ type: chosen, amount: -amountLost }] } }); return;
    }
    if (landingTile.type === 'Crescimento') {
      let change: any = {}; let descParts = landingTile.effects?.map((e: any) => { change[e.type] = e.amount; return `+${e.type === 'balance' ? `R$ ${e.amount.toLocaleString('pt-BR')}` : `${e.amount}${RES_LABELS[e.type]}`}`; }) || [];
      applyResourceChange(activePlayer.id, change, `🚀 CRESCIMENTO: ${activePlayer.name} ganhou ${descParts.join(' e ')}!`); setActiveModal({ type: 'TILE_INFO', tile: landingTile }); return;
    }
    if (landingTile.type === 'CartaAleatoria') {
      if (socket.connected) { socket.emit('narrator:draw_special_card', { playerId: activePlayer.id }); }
      setActiveModal({ type: 'TILE_INFO', tile: { ...landingTile, description: 'Você recebeu uma carta secreta! Olhe no seu celular para ver o que é e guarde para usar no momento certo.' } }); return;
    }

    if (landingTile.type === 'Queima') { setActiveModal({ type: 'QUEIMA', tile: landingTile }); return; }
    if (landingTile.type === 'Oportunidade') { setActiveModal({ type: 'OPPORTUNITY', tile: landingTile }); return; }
    if (landingTile.type === 'Prejuizo') { setActiveModal({ type: 'CRISIS', tile: landingTile }); return; }
    if (landingTile.type === 'Investimento') { setActiveModal({ type: 'INVESTMENT', tile: landingTile }); return; }
    if (landingTile.type === 'Negociação') { setActiveModal({ type: 'NEGOTIATION', tile: landingTile }); return; }
    if (landingTile.type === 'Alianca') { setActiveModal({ type: 'ALLIANCE', tile: landingTile }); return; }
    if (landingTile.type === 'Desafio') { setActiveModal({ type: 'CHALLENGE', tile: landingTile, card: CHALLENGE_CARDS[0] }); return; }

    setActiveModal({ type: 'TILE_INFO', tile: landingTile });
  }, [activePlayer, applyResourceChange]);

  const rollDiceAndMove = useCallback(async (diceValue: number) => {
    if (!activePlayer || phase !== 'ROLL') return;
    await new Promise(resolve => setTimeout(resolve, 500));
    setSelectedDice(diceValue); setPhase('MOVING'); setMovingPlayerId(activePlayer.id); addLog(`🎲 ${activePlayer.name} andou ${diceValue} casas.`, 'info');

    const boardLength = tiles.length;
    let currentPos = activePlayer.position;
    let currentLap = activePlayer.lapsCompleted;
    let newBoard = [...tiles];

    for (let step = 1; step <= diceValue; step++) {
      await new Promise(resolve => setTimeout(resolve, 320));
      let nextPos = (currentPos + 1) % boardLength;

      if (config.lapLimit && currentLap >= config.lapLimit && nextPos === 0) {
        currentPos = boardLength - 1; setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: currentPos, lastDiceRoll: diceValue } : p)); break; 
      }
      currentPos = nextPos;
      if (currentPos === 0) {
        currentLap += 1;
        applyResourceChange(activePlayer.id, { balance: 30000, points: 8 }, `🏁 VOLTA COMPLETA: ${activePlayer.name} completou a volta e ganhou bônus!`);
        newBoard = shuffleBoardRules(newBoard); setTiles(newBoard);
        addLog(`🔄 O Tabuleiro corporativo foi re-embaralhado!`, 'alliance');
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: 0, lastDiceRoll: diceValue, lapsCompleted: currentLap } : p));
        break; 
      } else {
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: currentPos, lastDiceRoll: diceValue } : p));
      }

      if (config.lapLimit && currentLap >= config.lapLimit && currentPos === boardLength - 1) break;
    }

    setMovingPlayerId(null); setPhase('TILE_ACTION');
    let landingTile = newBoard[currentPos];

    while (true) {
      let recoil = 0;
      if (landingTile.type === 'Alianca' && activePlayer.alliance) { addLog(`⚠️ CONFLITO: ${activePlayer.name} já tem aliança e recuou 1 casa!`, 'crisis'); recoil = 1; } 
      else if (landingTile.type === 'Desastre') { addLog(`🌋 DESASTRE: ${activePlayer.name} perdeu o controle e recuou 1 casa!`, 'crisis'); recoil = 1; } 
      else if (landingTile.type === 'Investimento') {
        const invs = (activePlayer as any).investments || []; const isReturn = invs.some((inv: any) => inv.tileIndex === currentPos && inv.lapInvested < activePlayer.lapsCompleted);
        if (invs.length > 0 && !isReturn) { addLog(`⛔ OCUPADO: ${activePlayer.name} já possui investimento e recuou 1 casa!`, 'crisis'); recoil = 1; }
      } 
      else if (landingTile.type === 'DiretoriaFinal') {
        const isFinalLap = config.lapLimit ? activePlayer.lapsCompleted >= config.lapLimit : false;        if (!isFinalLap) { addLog(`🚀 ACESSO NEGADO: ${activePlayer.name} tentou entrar na Diretoria antes do tempo (Recuou 2 casas)!`, 'crisis'); recoil = 2; } 
        else { setSelectedDice(null); setActiveModal({ type: 'FINAL_BOARDROOM', tile: landingTile }); return; }
      }

      if (recoil > 0) {
        await new Promise(resolve => setTimeout(resolve, 600)); currentPos = (currentPos - recoil + boardLength) % boardLength; landingTile = newBoard[currentPos];
        setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: currentPos } : p));
      } else { break; }
    }

    addLog(`${activePlayer.name} parou na casa [${landingTile.index}]: ${landingTile.title}`, 'info'); setSelectedDice(null);
    const investments = (activePlayer as any).investments || []; const matchedInvIndex = investments.findIndex((inv: any) => inv.tileIndex === currentPos && inv.lapInvested < activePlayer.lapsCompleted);

    if (matchedInvIndex >= 0) {
      setPendingTileAction({ tile: landingTile, pos: currentPos }); setActiveModal({ type: 'INVESTMENT_RETURN', tile: landingTile, investment: investments[matchedInvIndex], invIndex: matchedInvIndex }); return;
    }

    executeTileAction(landingTile, currentPos);
  }, [activePlayer, phase, tiles, addLog, applyResourceChange, config.lapLimit, executeTileAction]);

  const resolveInvestment = useCallback((investments: any) => {
    if (!activePlayer) return; if (!investments) { advanceTurn(); return; }
    let descParts = []; let deduct: any = {};
    if (investments.balance > 0) { deduct.balance = -investments.balance; descParts.push(`R$ ${investments.balance.toLocaleString('pt-BR')}`); }
    if (investments.goods > 0) { deduct.goods = -investments.goods; descParts.push(`${investments.goods} Merc.`); }
    if (investments.clients > 0) { deduct.clients = -investments.clients; descParts.push(`${investments.clients} Cli.`); }
    if (investments.employees > 0) { deduct.employees = -investments.employees; descParts.push(`${investments.employees} Func.`); }
    if (investments.points > 0) { deduct.points = -investments.points; descParts.push(`${investments.points} Pts.`); }

    applyResourceChange(activePlayer.id, deduct, `📈 INVESTIMENTO: ${activePlayer.name} ancorou ${descParts.join(' e ')} na Casa #${activePlayer.position}!`);
    setPlayers(prev => prev.map(p => { if (p.id !== activePlayer.id) return p; return { ...p, investments: [...(p as any).investments || [], { tileIndex: p.position, lapInvested: p.lapsCompleted, resources: investments }] }; }));
    advanceTurn();
  }, [activePlayer, applyResourceChange, advanceTurn]);

  const resolveInvestmentReturn = useCallback(() => {
    if (!activePlayer || activeModal.type !== 'INVESTMENT_RETURN') return;
    const inv = activeModal.investment; const returns: any = {};
    if (inv.resources.balance) returns.balance = Math.ceil(inv.resources.balance * 1.5);
    if (inv.resources.goods) returns.goods = Math.ceil(inv.resources.goods * 1.5);
    if (inv.resources.clients) returns.clients = Math.ceil(inv.resources.clients * 1.5);
    if (inv.resources.employees) returns.employees = Math.ceil(inv.resources.employees * 1.5);
    if (inv.resources.points) returns.points = Math.ceil(inv.resources.points * 1.5);
    applyResourceChange(activePlayer.id, returns, `💰 RETORNO GORDO: ${activePlayer.name} resgatou investimento na Casa #${inv.tileIndex}!`);
    setPlayers(prev => prev.map(p => { if (p.id !== activePlayer.id) return p; const newInvs = [...(p as any).investments]; newInvs.splice(activeModal.invIndex, 1); return { ...p, investments: newInvs }; }));

    setActiveModal({ type: null }); 
    if (pendingTileAction) { setTimeout(() => { executeTileAction(pendingTileAction.tile, pendingTileAction.pos); setPendingTileAction(null); }, 600); } else { advanceTurn(); }
  }, [activePlayer, activeModal, pendingTileAction, applyResourceChange, executeTileAction, advanceTurn]);

  const resolveOpportunity = useCallback((accept: boolean) => {
    if (!activePlayer || !activeModal.tile?.trade) return;
    if (accept) {
      const trade = activeModal.tile.trade as any;
      if (activePlayer[trade.giveType as keyof Player] >= trade.giveAmount) {
        applyResourceChange(activePlayer.id, { [trade.giveType]: -trade.giveAmount, [trade.receiveType]: trade.receiveAmount }, `✨ OPORTUNIDADE: ${activePlayer.name} realizou a troca com sucesso!`);
      } else addLog(`❌ Oportunidade perdida: Recursos insuficientes.`, 'loss');
    }
    advanceTurn();
  }, [activePlayer, activeModal.tile, applyResourceChange, advanceTurn, addLog]);

  const resolveQueima = useCallback((goodsSold: number, amountReceived: number) => {
    if (!activePlayer) return;
    if (goodsSold > 0) { applyResourceChange(activePlayer.id, { balance: amountReceived, goods: -goodsSold }, `🔥 LIQUIDAÇÃO: ${activePlayer.name} vendeu -${goodsSold} Mercadorias por +R$ ${amountReceived.toLocaleString('pt-BR')}!`); } else { addLog(`🤷‍♂️ ${activePlayer.name} não liquidou mercadorias.`, 'info'); }
    advanceTurn();
  }, [activePlayer, applyResourceChange, advanceTurn, addLog]);

  const resolveChallenge = useCallback((approved: boolean, useEmployees: boolean = false) => {
    if (!activePlayer) return;
    if (useEmployees) { applyResourceChange(activePlayer.id, { employees: -3 }, `🛡️ DELEGAÇÃO: ${activePlayer.name} usou -3 Func. para escapar.`); advanceTurn(); }
    else if (approved) { applyResourceChange(activePlayer.id, { balance: 20000, points: 5 }, `🏆 APROVADO: ${activePlayer.name} superou a Sabatina!`); advanceTurn(); }
    else {
      applyResourceChange(activePlayer.id, { balance: -25000, points: -2 }, `❌ RECUSADO: ${activePlayer.name} falhou e sofreu punições!`);
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: (p.position - 2 + tiles.length) % tiles.length } : p));
      addLog(`📉 PUNIÇÃO EXTRA: ${activePlayer.name} recuou 2 casas!`, 'crisis'); advanceTurn();
    }
  }, [activePlayer, applyResourceChange, advanceTurn, tiles.length, addLog]);

  const resolveCrisis = useCallback((cancelWithPoints: boolean) => {
    if (!activePlayer || !activeModal.tile?.effects) return;
    if (cancelWithPoints) {
      if (activePlayer.points >= 5) { applyResourceChange(activePlayer.id, { points: -5 }, `🛡️ DEFESA: ${activePlayer.name} anulou completamente a Crise!`); }
      else { let change: any = {}; activeModal.tile.effects.forEach((e: any) => change[e.type] = e.amount); applyResourceChange(activePlayer.id, change, `💥 IMPACTO: ${activePlayer.name} sofreu os danos da crise!`); }
    } else {
      let change: any = {}; activeModal.tile.effects.forEach((e: any) => change[e.type] = e.amount); applyResourceChange(activePlayer.id, change, `💥 IMPACTO: ${activePlayer.name} sofreu os danos da crise!`);
    }
    advanceTurn();
  }, [activePlayer, activeModal.tile, applyResourceChange, advanceTurn]);

  const resolveFinalBoardroom = useCallback((approved: boolean) => {
    if (!activePlayer) return;
    if (approved) { 
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, hasWon: true } : p)); 
      addLog(`👏 CONTRATADO! ${activePlayer.name} VENCEU O JOGO E ASSUMIU O CONSELHO!`, 'gain'); 
      advanceTurn(); 
    }
    else { 
      // CORREÇÃO: Não removemos mais lapsCompleted!
      setPlayers(prev => prev.map(p => p.id === activePlayer.id ? { ...p, position: (activePlayer.position - 3 + tiles.length) % tiles.length } : p)); 
      addLog(`📉 REPROVADO NA SABATINA FINAL! ${activePlayer.name} recuou 3 casas!`, 'crisis'); 
      advanceTurn(); 
    }  
  }, [activePlayer, tiles.length, addLog, advanceTurn]);

  const resolveAllianceModal = useCallback((partnerId: string | null, duration: number = 3) => {
    if (partnerId && activePlayer) {
      const partner = players.find(p => p.id === partnerId);
      setPlayers(prev => prev.map(p => { if (p.id === activePlayer.id) return { ...p, alliance: { partnerId, roundsLeft: duration } }; if (p.id === partnerId) return { ...p, alliance: { partnerId: activePlayer.id, roundsLeft: duration } }; return p; }));
      addLog(`🤝 CONTRATO ASSINADO: ${activePlayer.name} e ${partner?.name} fecharam aliança!`, 'alliance');
    }
    advanceTurn();
  }, [activePlayer, players, addLog, advanceTurn]);

  const resolveNegotiation = useCallback((trade: any | null) => {
    if (!activePlayer) return;
    if (trade && trade.partnerId) {
      const partner = players.find(p => p.id === trade.partnerId);
      if (partner) {
        applyResourceChange(activePlayer.id, { [trade.giveType]: -trade.giveAmount }, ''); applyResourceChange(partner.id, { [trade.giveType]: trade.giveAmount }, ''); applyResourceChange(partner.id, { [trade.receiveType]: -trade.receiveAmount }, ''); applyResourceChange(activePlayer.id, { [trade.receiveType]: trade.receiveAmount }, `⚖️ ACORDO COMERCIAL: ${activePlayer.name} concluiu troca com ${partner.name}!`);
      }
    }
    advanceTurn();
  }, [activePlayer, players, applyResourceChange, advanceTurn]);

  const openTileInspectModal = useCallback((tileIndex: number) => {
    const tile = tiles[tileIndex]; if (tile) setActiveModal({ type: 'INSPECT_TILE', tile, tilePlayers: players.filter(p => p.position === tileIndex && !p.isEliminated) });
  }, [tiles, players]);

  const closeModal = useCallback(() => { if (activeModal.type === 'TILE_INFO') advanceTurn(); else setActiveModal({ type: null }); }, [activeModal.type, advanceTurn]);
  const restartGame = useCallback(() => { setPhase('SETUP'); setPlayers([]); setActiveModal({ type: null }); setWinner(null); }, []);
  const requestShuffleBoard = useCallback(() => setActiveModal({ type: 'CONFIRM_SHUFFLE' }), []);
  const requestQuitGame = useCallback(() => setActiveModal({ type: 'CONFIRM_QUIT' }), []);
  const confirmShuffleBoard = useCallback(() => { setTiles(prev => shuffleBoardRules([...prev])); addLog(`🔄 O Tabuleiro corporativo foi re-embaralhado!`, 'info'); setActiveModal({ type: null }); }, [addLog]);
  const confirmQuitGame = useCallback(() => { if (socket.connected) socket.emit('narrator:quit_game'); restartGame(); }, [restartGame]);

  return (
    <GameContext.Provider value={{ players, ranking, activePlayer, activePlayerIndex, currentRound, tiles, config, phase, logs, activeModal, winner, movingPlayerId, selectedDice, notification, setupGame, rollDiceAndMove, closeModal, openTileInspectModal, resolveChallenge, resolveCrisis, resolveInvestment, resolveInvestmentReturn, resolveFinalBoardroom, resolveNegotiation, resolveAllianceModal, resolveOpportunity, resolveQueima, restartGame, requestShuffleBoard, requestQuitGame, confirmShuffleBoard, confirmQuitGame, eliminatePlayer }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => { const ctx = useContext(GameContext); if (!ctx) throw new Error('Error'); return ctx; };