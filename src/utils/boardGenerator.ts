import type { BoardSize, Tile, TileType } from '../types/game';

interface GridDimensions { cols: number; rows: number; }

export function getGridDimensions(boardSize: BoardSize): GridDimensions {
  switch (boardSize) {
    case 30: return { cols: 9, rows: 8 };
    case 45: return { cols: 13, rows: 12 };
    case 60: return { cols: 17, rows: 15 };
  }
}

export function getTileCoordinates(index: number, boardSize: BoardSize): { gridRow: number; gridColumn: number } {
  const { cols, rows } = getGridDimensions(boardSize);
  if (boardSize === 30) {
    if (index < 9) return { gridRow: 1, gridColumn: index + 1 };
    else if (index < 15) return { gridRow: index - 9 + 2, gridColumn: cols };
    else if (index < 24) return { gridRow: rows, gridColumn: cols - (index - 15) };
    else return { gridRow: rows - 1 - (index - 24), gridColumn: 1 };
  }
  if (boardSize === 45) {
    if (index < 13) return { gridRow: 1, gridColumn: index + 1 };
    else if (index < 23) return { gridRow: index - 13 + 2, gridColumn: cols };
    else if (index < 36) return { gridRow: rows, gridColumn: cols - (index - 23) };
    else if (index < 44) return { gridRow: rows - 1 - (index - 36), gridColumn: 1 };
    else return { gridRow: 2, gridColumn: 2 };
  }
  if (index < 17) return { gridRow: 1, gridColumn: index + 1 };
  else if (index < 30) return { gridRow: index - 17 + 2, gridColumn: cols };
  else if (index < 47) return { gridRow: rows, gridColumn: cols - (index - 30) };
  else return { gridRow: rows - 1 - (index - 47), gridColumn: 1 };
}

export function generateDeck(intermediateCount: number): any[] {
  // Ajuste matemático para dar exatas 2 casas de Desastre em um tabuleiro de 30
  const pLoss = Math.round(intermediateCount * 0.20);
  const pAud  = Math.round(intermediateCount * 0.04); // Nova Crise Leve (30%)
  const pOpp  = Math.round(intermediateCount * 0.10);
  const pInv  = Math.round(intermediateCount * 0.10);
  const pDis  = Math.round(intermediateCount * 0.07); // ~2 cartas em um tabuleiro de 30
  const pAli  = Math.round(intermediateCount * 0.07);
  const pNeg  = Math.round(intermediateCount * 0.10);
  const pDes  = Math.round(intermediateCount * 0.14);
  const pCre  = Math.round(intermediateCount * 0.07);
  
  const pQueima = intermediateCount - (pLoss + pAud + pOpp + pInv + pDis + pAli + pNeg + pDes + pCre);

  const deck: any[] = [];

  const lossVariants = [
    { title: 'Crise: Multa e Roubo', effects: [{ type: 'balance', amount: -30000 }, { type: 'goods', amount: -2 }] },
    { title: 'Crise: Processo e Fuga', effects: [{ type: 'clients', amount: -2 }, { type: 'points', amount: -3 }] },
    { title: 'Crise: Demissão e Caixa', effects: [{ type: 'employees', amount: -1 }, { type: 'balance', amount: -25000 }] },
    { title: 'Crise: Estoque Queimado', effects: [{ type: 'goods', amount: -4 }, { type: 'clients', amount: -1 }] },
    { title: 'Crise: Fofoca Corporativa', effects: [{ type: 'employees', amount: -2 }, { type: 'points', amount: -2 }] },
    { title: 'Crise: Falha Geral', effects: [{ type: 'balance', amount: -40000 }, { type: 'points', amount: -1 }] }
  ];
  for (let i = 0; i < pLoss; i++) {
    const v = lossVariants[i % lossVariants.length];
    deck.push({ type: 'Prejuizo', title: v.title, description: 'Golpe duro no mercado. Sofra a penalidade dupla ou anule gastando 5 Pontos!', effects: v.effects, actionText: 'Risco Duplo' });
  }

  // NOVA CARTA: Auditoria / Crise Leve (Vai calcular 30% dinamicamente)
  for (let i = 0; i < pAud; i++) {
    deck.push({
      type: 'Auditoria', 
      title: 'Auditoria Fiscal', 
      description: 'O fiscal rastreou suas contas! Você perderá 30% de um de seus recursos. Use 5 Pontos de Prestígio para conseguir anular!', 
      actionText: 'Risco Único (-30%)'
    });
  }

  const creVariants = [
    { title: 'Crescimento: Mega Venda', effects: [{ type: 'balance', amount: 25000 }, { type: 'points', amount: 3 }] },
    { title: 'Crescimento: Viralizou!', effects: [{ type: 'clients', amount: 3 }, { type: 'points', amount: 5 }] },
    { title: 'Crescimento: Expansão', effects: [{ type: 'employees', amount: 2 }, { type: 'points', amount: 4 }] },
    { title: 'Crescimento: Lote Extra', effects: [{ type: 'goods', amount: 5 }, { type: 'points', amount: 3 }] }
  ];
  for (let i = 0; i < pCre; i++) {
    const v = creVariants[i % creVariants.length];
    deck.push({ type: 'Crescimento', title: v.title, description: 'O mercado sorriu para você! Recursos adicionados ao seu caixa imediatamente.', effects: v.effects, actionText: 'Bônus Duplo' });
  }

  const oppVariants = [
    { title: 'Oportunidade: Campanha', description: 'Pagar R$ 25.000 para obter +4 Clientes?', trade: { giveType: 'balance', giveAmount: 25000, receiveType: 'clients', receiveAmount: 4 }, actionText: '-25k R$ ➔ +4 Cli' },
    { title: 'Oportunidade: Queima de Lote', description: 'Trocar 4 Mercadorias por +R$ 35.000?', trade: { giveType: 'goods', giveAmount: 4, receiveType: 'balance', receiveAmount: 35000 }, actionText: '-4 Mercadorias ➔ +35k R$' },
    { title: 'Oportunidade: Oportunidade', description: 'Gastar 4 Pontos para contratar +3 Funcionários?', trade: { giveType: 'points', giveAmount: 4, receiveType: 'employees', receiveAmount: 3 }, actionText: '-4 Pts ➔ +3 Func' }
  ];
  for (let i = 0; i < pOpp; i++) {
    const v = oppVariants[i % oppVariants.length];
    deck.push({ type: 'Oportunidade', title: v.title, description: v.description, trade: v.trade, actionText: v.actionText });
  }

  for (let i = 0; i < pInv; i++) deck.push({ type: 'Investimento', title: 'Investimento', description: 'Aporte de R$ 50.000 para +4 Mercadorias e +5 Pontos. Deixa seu Investimento ATIVO!', actionText: 'Investir R$ 50k', requiredLevel: 2 });
  
  for (let i = 0; i < pDis; i++) deck.push({ type: 'Desastre', title: 'Desastre de Mercado', description: 'Se você tiver um Investimento Ativo, ele será destruído. Caso não tenha, o baque te faz recuar 1 casa.', actionText: 'Risco de Queda' });
  for (let i = 0; i < pAli; i++) deck.push({ type: 'Alianca', title: 'Fusão Estratégica', description: 'Você tem 30 segundos para propor uma Aliança com outro jogador ativo.', actionText: 'Propor Aliança (30s)' });
  for (let i = 0; i < pNeg; i++) deck.push({ type: 'Negociação', title: 'Mesa de Licitação', description: 'Você é o Principal! 1 minuto para fechar uma troca de recursos com outro jogador.', actionText: 'Licitação (1 min)' });
  for (let i = 0; i < pDes; i++) deck.push({ type: 'Desafio', title: 'Pergunta do Narrador', description: 'O Narrador decidirá uma pergunta corporativa surpresa. Responda em 30 segundos!', actionText: 'Desafio Surpresa' });
  for (let i = 0; i < pQueima; i++) deck.push({ type: 'Queima', title: 'Liquidação de Estoque', description: 'Venda mercadorias e gere caixa! O lucro é: Valor Base do seu Nível × Qtd Vendida.', actionText: 'Liquidar Mercadorias' });

  return deck.sort(() => Math.random() - 0.5);
}

export function shuffleBoardRules(currentTiles: Tile[]): Tile[] {
  const intermediateCount = currentTiles.length - 2;
  if (intermediateCount <= 0) return currentTiles;

  const deck = generateDeck(intermediateCount);
  let deckIdx = 0;

  return currentTiles.map((tile, i) => {
    if (i === 0 || i === currentTiles.length - 1) return tile;
    const drawn = deck[deckIdx++];
    return {
      ...tile,
      type: drawn.type,
      title: drawn.title,
      description: drawn.description,
      actionText: drawn.actionText,
      effects: drawn.effects,
      trade: drawn.trade,
      requiredLevel: drawn.requiredLevel,
      sector: 'Geral'
    };
  });
}

export function generateBoardTiles(boardSize: BoardSize): Tile[] {
  const tiles: Tile[] = [];
  for (let i = 0; i < boardSize; i++) {
    const coords = getTileCoordinates(i, boardSize);

    if (i === 0) {
      tiles.push({ id: i, index: i, sector: 'Diretoria', type: 'Inicio', title: 'LARGADA', description: 'Ponto de partida.', actionText: 'Início', gridRow: coords.gridRow, gridColumn: coords.gridColumn, badge: 'START' });
      continue;
    }
    if (i === boardSize - 1) {
      tiles.push({ id: i, index: i, sector: 'Diretoria', type: 'DiretoriaFinal', title: 'CONSELHO DE ADMINISTRAÇÃO', description: 'Sabatina final do CEO! Ativa apenas na volta final.', actionText: 'Desafio do CEO', gridRow: coords.gridRow, gridColumn: coords.gridColumn, badge: 'FINISH' });
      continue;
    }
    tiles.push({ id: i, index: i, sector: 'Geral', type: 'Oportunidade', title: 'Carregando...', description: '', gridRow: coords.gridRow, gridColumn: coords.gridColumn });
  }
  return tiles;
}