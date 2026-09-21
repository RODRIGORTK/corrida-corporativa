import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import os from 'os';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const PORT = process.env.PORT || 3001;

function generatePin() { return Math.floor(1000 + Math.random() * 9000).toString(); }

const PLAYER_PALETTE = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#ef4444', '#14b8a6', '#84cc16'];

const CARD_TYPES = [
  { type: 'segunda_chance', title: 'Segunda Chance', description: 'Anule o efeito da casa atual, recupere o peão e role o dado de novo.', icon: 'RotateCcw' },
  { type: 'bloqueio', title: 'Bloqueio', description: 'Cancele a vez do jogador atual. (Obrigatório usar ANTES dele rolar o dado).', icon: 'ShieldAlert' },
  { type: 'impostor', title: 'Impostor', description: 'Altera o resultado do dado do jogador da vez. Custa +R$ 5.000 se usar em si mesmo.', icon: 'Shuffle' },
  { type: 'dois_dados', title: 'Dois dados?', description: 'Ao final do seu turno atual, a vez não passa, volta para você rolar de novo.', icon: 'Dices' },
  { type: 'traicoeiro', title: 'Traiçoeiro', description: 'Escolha um jogador para voltar 3 casas ao final do turno do jogador atual.', icon: 'ArrowDownLeft' }
];

let gameState = {
  isStarted: false, boardSize: 30, lapLimit: 3, currentRound: 1, activePlayerIndex: 0, phase: 'SETUP',
  players: [], lastDiceRoll: null, activeNotification: null, historyLogs: []
};

function addServerLog(message, type = 'info') {
  const log = { id: Math.random().toString(36).substring(2, 9), round: gameState.currentRound, timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), message, type };
  gameState.historyLogs.unshift(log);
  if (gameState.historyLogs.length > 50) gameState.historyLogs.pop();
  return log;
}

function broadcastState() { io.emit('game:sync', { ...gameState, localIp }); }

function emitDramaticNotification(message, type = 'card') {
  const notification = { id: Math.random().toString(36).substring(2, 9), message, type, timestamp: Date.now() };
  gameState.activeNotification = notification;
  io.emit('game:dramatic_alert', notification);
}

app.get('/api/info', (req, res) => { res.json({ localIp, port: PORT, playersCount: gameState.players.length, isStarted: gameState.isStarted }); });

io.on('connection', (socket) => {
  socket.emit('game:sync', { ...gameState, localIp });

  socket.on('narrator:add_player', ({ name }) => {
    if (gameState.isStarted) return;
    const trimmed = (name || '').trim(); if (!trimmed) return;
    if (gameState.players.length >= 20 || gameState.players.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) return;
    let pin = generatePin(); while (gameState.players.some(p => p.pin === pin)) pin = generatePin();
    const idx = gameState.players.length;
    
    const newPlayer = { id: `p-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`, name: trimmed, pin, color: PLAYER_PALETTE[idx % PLAYER_PALETTE.length], socketId: null, isConnected: false, balance: 20000, employees: 10, clients: 10, goods: 10, points: 5, level: 1, position: 0, lapsCompleted: 1, cards: [], hasExtraRoll: false, bankruptcy: { inRecovery: false, roundsLeft: 2 }, alliance: null, isEliminated: false, hasWon: false, investments: [] };
    
    gameState.players.push(newPlayer); addServerLog(`👤 Participante cadastrado: ${newPlayer.name} (PIN: ${newPlayer.pin})`); broadcastState();
  });

  socket.on('narrator:remove_player', ({ playerId }) => {
    if (gameState.isStarted) return;
    gameState.players = gameState.players.filter(p => p.id !== playerId); broadcastState();
  });

  socket.on('narrator:eliminate_player', ({ playerId }) => {
    const p = gameState.players.find(x => x.id === playerId);
    if (p) { p.isEliminated = true; p.bankruptcy = { inRecovery: true, roundsLeft: 0 }; addServerLog(`💥 ELIMINAÇÃO: ${p.name} foi removido pelo Narrador!`, 'loss'); broadcastState(); }
  });

  socket.on('narrator:quit_game', () => {
    gameState.isStarted = false; gameState.players = []; gameState.phase = 'SETUP'; gameState.historyLogs = []; broadcastState();
  });

  socket.on('narrator:start_game', ({ boardSize = 30, lapLimit = 3 }) => {
    if (gameState.players.length < 2) return;
    gameState.isStarted = true; gameState.boardSize = boardSize; gameState.lapLimit = lapLimit; gameState.phase = 'ROLL'; gameState.activePlayerIndex = 0; gameState.currentRound = 1; addServerLog(`🏁 A Corrida Corporativa foi iniciada!`, 'victory'); broadcastState();
  });

  socket.on('player:login', ({ name, pin }, callback) => {
    const trimmedName = (name || '').trim().toLowerCase(); const cleanPin = (pin || '').trim();
    const player = gameState.players.find(p => p.name.toLowerCase() === trimmedName && p.pin === cleanPin);
    if (!player) { if (callback) callback({ success: false, message: 'Nome ou PIN inválido!' }); return; }
    player.socketId = socket.id; player.isConnected = true; socket.data.playerId = player.id; addServerLog(`📱 ${player.name} conectou-se!`, 'gain');
    if (callback) callback({ success: true, player }); broadcastState();
  });

  socket.on('player:quit', () => {
    const p = gameState.players.find(x => x.socketId === socket.id);
    if (p) {
      p.isConnected = false; p.socketId = null;
      if (gameState.isStarted) { p.isEliminated = true; p.bankruptcy = { inRecovery: true, roundsLeft: 0 }; addServerLog(`🏃‍♂️ ABANDONO: ${p.name} saiu do jogo!`, 'loss'); } 
      else { gameState.players = gameState.players.filter(x => x.id !== p.id); }
      broadcastState();
    }
  });

  socket.on('player:roll_dice', () => {
    const player = gameState.players.find(p => p.socketId === socket.id); if (!player) return;
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== player.id || gameState.phase !== 'ROLL') return;

    const diceValue = Math.floor(Math.random() * 6) + 1;
    gameState.lastDiceRoll = diceValue; player.lastDiceRoll = diceValue;
    addServerLog(`🎲 ${player.name} rolou o dado pelo celular!`, 'info');
    io.emit('game:dice_rolled', { playerId: player.id, diceValue, playerName: player.name });
    broadcastState();
  });

  socket.on('narrator:roll_dice', ({ diceValue }) => {
    const activePlayer = gameState.players[gameState.activePlayerIndex]; if (!activePlayer || gameState.phase !== 'ROLL') return;
    const val = Number(diceValue) || (Math.floor(Math.random() * 6) + 1);
    gameState.lastDiceRoll = val; activePlayer.lastDiceRoll = val;
    addServerLog(`🎲 Narrador acionou o dado: [ ${val} ] para ${activePlayer.name}`, 'info');
    io.emit('game:dice_rolled', { playerId: activePlayer.id, diceValue: val, playerName: activePlayer.name });
    broadcastState();
  });

  socket.on('narrator:draw_special_card', ({ playerId }) => {
    const player = gameState.players.find(p => p.id === playerId); if (!player) return;
    const randomCardDef = CARD_TYPES[Math.floor(Math.random() * CARD_TYPES.length)];
    const newCard = { id: `card-${Math.random().toString(36).substring(2, 9)}`, ...randomCardDef, receivedAt: gameState.currentRound };
    player.cards.push(newCard); addServerLog(`🃏 CARTA OCULTA: ${player.name} pegou uma carta secreta!`, 'gain'); emitDramaticNotification(`🃏 ${player.name} conquistou uma Carta Secreta!`, 'card');
    io.emit('game:card_drawn', { playerId, card: newCard }); broadcastState();
  });

  socket.on('player:use_card', ({ cardId, targetPlayerId, isAnonymous, customDiceValue }, callback) => {
    const sender = gameState.players.find(p => p.socketId === socket.id) || gameState.players.find(p => p.cards.some(c => c.id === cardId));
    if (!sender) { if (callback) callback({ success: false, message: 'Jogador não encontrado.' }); return; }
    const cardIndex = sender.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) { if (callback) callback({ success: false, message: 'Carta não encontrada no inventário.' }); return; }

    const card = sender.cards[cardIndex];
    const activePlayer = gameState.players[gameState.activePlayerIndex];
    let attackerDisplayName = isAnonymous ? 'ALGUÉM' : sender.name;

    if (isAnonymous) {
      if (sender.balance < 20000) { if (callback) callback({ success: false, message: 'Saldo insuficiente para Modo Anônimo (R$ 20.000).' }); return; }
      sender.balance -= 20000; addServerLog(`🕵️ Modo Anônimo ativado: R$ 20.000 debitados de ${sender.name}.`);
    }

    const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
    let success = false; let feedback = '';

    switch (card.type) {
      case 'segunda_chance':
        success = true; feedback = 'Segunda Chance ativada! Ação cancelada e você jogará novamente.';
        emitDramaticNotification(`⚡ ${attackerDisplayName} ativou SEGUNDA CHANCE! Retornou ao início e jogará de novo!`, 'card');
        addServerLog(`⚡ ${attackerDisplayName} ativou SEGUNDA CHANCE e teve a jogada reiniciada!`, 'gain');
        io.emit('card:second_chance_applied', { playerId: sender.id, recoil: sender.lastDiceRoll || 1 }); 
        break;
        
      case 'bloqueio':
        if (!activePlayer || targetPlayerId !== activePlayer.id) { if (callback) callback({ success: false, message: 'A carta só funciona contra o jogador da vez atual!' }); return; }
        if (gameState.phase !== 'ROLL') { if (callback) callback({ success: false, message: 'Tarde demais! O bloqueio deve ser ativado ANTES dele rolar o dado.' }); return; }
        success = true; feedback = `${activePlayer.name} teve o turno bloqueado imediatamente!`;
        emitDramaticNotification(`🚫 ${attackerDisplayName} jogou a carta BLOQUEIO! A vez de ${activePlayer.name} foi interceptada!`, 'crisis');
        addServerLog(`🚫 ${attackerDisplayName} interceptou e cancelou o turno de ${activePlayer.name}!`, 'loss'); 
        io.emit('card:bloqueio_applied', { attackerName: attackerDisplayName });
        break;

      case 'impostor':
        const impostorTarget = activePlayer;
        if (!impostorTarget) { if (callback) callback({ success: false, message: 'Ninguém está na vez.' }); return; }
        
        // Regra de auto-uso
        if (impostorTarget.id === sender.id) {
            if (sender.balance < 5000) { if (callback) callback({ success: false, message: 'Saldo insuficiente! Usar o impostor em si mesmo exige R$ 5.000.' }); return; }
            sender.balance -= 5000; addServerLog(`🎭 AUTO-IMPOSTOR: R$ 5.000 debitados de ${sender.name} por manipular seu próprio dado.`);
        }

        const alteredDice = customDiceValue ? Math.max(1, Math.min(6, Number(customDiceValue))) : (Math.floor(Math.random() * 6) + 1);
        impostorTarget.lastDiceRoll = alteredDice; gameState.lastDiceRoll = alteredDice;
        
        success = true; feedback = `Dado de ${impostorTarget.name} alterado para [ ${alteredDice} ]!`;
        emitDramaticNotification(`🎭 ${attackerDisplayName} ativou IMPOSTOR e mudou o dado para ${alteredDice}!`, 'crisis');
        addServerLog(`🎭 IMPOSTOR: ${attackerDisplayName} adulterou o dado de ${impostorTarget.name} para [ ${alteredDice} ]!`, 'crisis');
        io.emit('card:impostor_applied', { targetPlayerId: impostorTarget.id, newDiceValue: alteredDice }); 
        break;

      case 'dois_dados':
        success = true; feedback = 'Dois dados ativado! Ao final da vez o turno voltará para você.';
        emitDramaticNotification(`🎲🎲 ${attackerDisplayName} ativou DOIS DADOS e emendará duas jogadas seguidas!`, 'gain');
        addServerLog(`🎲🎲 ${attackerDisplayName} ativou DOIS DADOS para prolongar sua vez!`, 'gain'); 
        io.emit('card:dois_dados_applied', { playerId: sender.id });
        break;

      case 'traicoeiro':
        if (!targetPlayer) { if (callback) callback({ success: false, message: 'Selecione um alvo.' }); return; }
        
        // 🔥 NOVA REGRA: Proíbe o uso em quem está antes da casa 4
        if (targetPlayer.position < 4) { 
          if (callback) callback({ success: false, message: 'Alvo inválido! Só pode ser usada em quem está a partir da casa 4.' }); 
          return; 
        }

        // Como agora a posição é no mínimo 4, a nova posição nunca será negativa
        const newPos = targetPlayer.position - 3;
        targetPlayer.position = newPos; 
        success = true; 
        feedback = `${targetPlayer.name} recuou 3 casas!`;
        
        emitDramaticNotification(`🗡️ ${attackerDisplayName} usou TRAIÇOEIRO contra ${targetPlayer.name}!`, 'crisis');
        addServerLog(`🗡️ TRAIÇOEIRO: ${attackerDisplayName} fez ${targetPlayer.name} recuar para a casa #${newPos}!`, 'loss');
        io.emit('card:traicoeiro_applied', { targetPlayerId: targetPlayer.id, newPosition: newPos }); 
        break;
    }

    if (success) { 
      sender.cards.splice(cardIndex, 1); 
      io.emit('card:used', { playerId: sender.id, cardId: card.id });
      if (callback) callback({ success: true, message: feedback }); 
      broadcastState(); 
    }
  });

  socket.on('game:update_players', ({ players }) => { gameState.players = players; broadcastState(); });
  
  socket.on('narrator:next_turn', () => {
    if (!gameState.isStarted) return;
    let nextIdx = (gameState.activePlayerIndex + 1) % gameState.players.length;
    let roundAdvanced = nextIdx === 0;
    if (roundAdvanced) { gameState.currentRound += 1; addServerLog(`📅 Nova Rodada Corporativa (#${gameState.currentRound}) iniciada!`, 'info'); }

    gameState.activePlayerIndex = nextIdx; gameState.phase = 'ROLL'; gameState.lastDiceRoll = null; broadcastState();
  });

  socket.on('narrator:sync_full_state', (updatedData) => { gameState = { ...gameState, ...updatedData }; broadcastState(); });
  
  socket.on('disconnect', () => {
    const player = gameState.players.find(p => p.socketId === socket.id);
    if (player) { player.isConnected = false; player.socketId = null; addServerLog(`🔌 ${player.name} desconectou-se.`, 'crisis'); broadcastState(); }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`🚀 Servidor Socket.io Corrida Corporativa`);
  console.log(`📡 Local:   http://localhost:${PORT}`);
  console.log(`=============================================`);
});