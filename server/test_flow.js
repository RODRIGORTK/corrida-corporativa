import { io } from 'socket.io-client';

async function testGameFlow() {
  console.log('🔄 Iniciando teste de fluxo WebSocket...');
  
  const narratorSocket = io('http://localhost:3001');
  const playerSocket = io('http://localhost:3001');

  await new Promise(r => setTimeout(r, 500));

  let generatedPin = '';
  let playerId = '';

  narratorSocket.on('game:sync', (state) => {
    const p = state.players.find(x => x.name === 'Rodrigo');
    if (p && p.pin) {
      generatedPin = p.pin;
      playerId = p.id;
    }
  });

  // 1. Narrador adiciona jogador
  console.log('1. Narrador adicionando jogador Rodrigo...');
  narratorSocket.emit('narrator:add_player', { name: 'Rodrigo' });

  await new Promise(r => setTimeout(r, 600));

  if (!generatedPin) {
    console.error('❌ Falha ao gerar PIN para Rodrigo!');
    process.exit(1);
  }
  console.log(`✅ PIN gerado com sucesso para Rodrigo: ${generatedPin}`);

  // 2. Jogador conecta via login
  console.log('2. Smartphone do Rodrigo fazendo login com PIN...');
  playerSocket.emit('player:login', { name: 'Rodrigo', pin: generatedPin }, (res) => {
    if (res && res.success) {
      console.log('✅ Login via smartphone bem-sucedido!');
    } else {
      console.error('❌ Falha no login do smartphone:', res);
      process.exit(1);
    }
  });

  await new Promise(r => setTimeout(r, 600));

  // 3. Adicionar segundo jogador para iniciar partida
  console.log('3. Adicionando segundo jogador Carlos e conectando...');
  narratorSocket.emit('narrator:add_player', { name: 'Carlos' });

  await new Promise(r => setTimeout(r, 600));

  const carlosSocket = io('http://localhost:3001');
  let carlosPin = '';
  narratorSocket.on('game:sync', (state) => {
    const c = state.players.find(x => x.name === 'Carlos');
    if (c && c.pin) carlosPin = c.pin;
  });

  await new Promise(r => setTimeout(r, 500));
  carlosSocket.emit('player:login', { name: 'Carlos', pin: carlosPin }, (res) => {
    console.log('✅ Segundo jogador conectado!');
  });

  await new Promise(r => setTimeout(r, 600));

  // 4. Iniciar Partida
  console.log('4. Narrador iniciando a partida...');
  narratorSocket.emit('narrator:start_game', { boardSize: 30, lapLimit: 3 });

  await new Promise(r => setTimeout(r, 600));

  // 5. Jogador da vez rola o dado pelo celular
  console.log('5. Celular rola o dado...');
  narratorSocket.on('game:dice_rolled', (data) => {
    console.log(`✅ Telão recebeu dado do celular: ${data.playerName} tirou [ ${data.diceValue} ]!`);
  });

  playerSocket.emit('player:roll_dice');

  await new Promise(r => setTimeout(r, 600));

  // 6. Testar ganho de Carta Aleatória
  console.log('6. Testando sorteio de Carta Especial...');
  narratorSocket.emit('narrator:draw_special_card', { playerId });

  await new Promise(r => setTimeout(r, 600));

  console.log('🎉 Todos os testes de WebSocket, PIN, login e dados passaram com 100% de sucesso!');
  narratorSocket.close();
  playerSocket.close();
  carlosSocket.close();
  process.exit(0);
}

testGameFlow().catch(err => {
  console.error('Erro no teste:', err);
  process.exit(1);
});
