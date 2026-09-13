import type { BoardSize, SectorType, Tile, TileType } from '../types/game';

interface GridDimensions {
  cols: number;
  rows: number;
}

export function getGridDimensions(boardSize: BoardSize): GridDimensions {
  switch (boardSize) {
    case 30:
      return { cols: 9, rows: 8 };
    case 45:
      return { cols: 13, rows: 12 };
    case 60:
      return { cols: 17, rows: 15 };
  }
}

// Retorna as coordenadas (row, col) na borda do grid
export function getTileCoordinates(index: number, boardSize: BoardSize): { gridRow: number; gridColumn: number } {
  const { cols, rows } = getGridDimensions(boardSize);

  if (boardSize === 30) {
    if (index < 9) {
      return { gridRow: 1, gridColumn: index + 1 };
    } else if (index < 15) {
      return { gridRow: index - 9 + 2, gridColumn: cols };
    } else if (index < 24) {
      return { gridRow: rows, gridColumn: cols - (index - 15) };
    } else {
      return { gridRow: rows - 1 - (index - 24), gridColumn: 1 };
    }
  }

  if (boardSize === 45) {
    if (index < 13) {
      return { gridRow: 1, gridColumn: index + 1 };
    } else if (index < 23) {
      return { gridRow: index - 13 + 2, gridColumn: cols };
    } else if (index < 36) {
      return { gridRow: rows, gridColumn: cols - (index - 23) };
    } else if (index < 44) {
      return { gridRow: rows - 1 - (index - 36), gridColumn: 1 };
    } else {
      return { gridRow: 2, gridColumn: 2 };
    }
  }

  // boardSize === 60:
  if (index < 17) {
    return { gridRow: 1, gridColumn: index + 1 };
  } else if (index < 30) {
    return { gridRow: index - 17 + 2, gridColumn: cols };
  } else if (index < 47) {
    return { gridRow: rows, gridColumn: cols - (index - 30) };
  } else {
    return { gridRow: rows - 1 - (index - 47), gridColumn: 1 };
  }
}

// INCLUÍDOS OS NOVOS SETORES: 'Juridico' e 'PeD'
const SECTORS_SEQUENCE: SectorType[] = [
  'RH',
  'Marketing',
  'Vendas',
  'Financeiro',
  'Logística',
  'Produção',
  'Tecnologia',
  'Diretoria',
  'Juridico',
  'PeD'
];

// TEXTOS E VALORES ATUALIZADOS PARA A NOVA ECONOMIA (X10)
const TILE_TEMPLATES: Array<{
  type: TileType;
  title: string;
  description: string;
  actionText?: string;
  requiredLevel?: number;
}> = [
  {
    type: 'Oportunidade',
    title: 'Contrato Relâmpago',
    description: 'Um novo cliente assinou pedido imediato. Ganhe +R$ 20.000 e +2 Clientes.',
    actionText: '+R$ 20.000 | +2 Clientes'
  },
  {
    type: 'Crise',
    title: 'Glitch Operacional',
    description: 'Falha técnica gerou cancelamento de pedidos. Perca R$ 15.000 ou gaste 5 Pontos corporativos para anular.',
    actionText: 'Risco: -R$ 15.000 (ou 5 pts)'
  },
  {
    type: 'Investimento',
    title: 'Rodada de Seed Capital',
    description: 'Aporte de R$ 30.000 para gerar +5 Mercadorias e +3 Pontos de prestígio.',
    actionText: 'Pagar R$ 30.000 -> +5 Mercadorias, +3 Pts',
    requiredLevel: 2
  },
  {
    type: 'Desafio',
    title: 'Sabatina do Setor',
    description: 'O Narrador elaborará uma pergunta específica desta área. Prepare-se para responder em 30 segundos!',
    actionText: 'Desafio do Narrador'
  },
  {
    type: 'Negociação',
    title: 'Mesa de Licitação',
    description: 'Abra uma rodada de propostas! Você dita as regras e recebe ofertas de troca dos outros executivos.',
    actionText: 'Licitação Aberta (1 min)'
  },
  {
    type: 'Oportunidade',
    title: 'Inovação de Processos',
    description: 'Redução de custos operacionais e aumento de produtividade. Ganhe +5 Mercadorias e +3 Pontos corporativos.',
    actionText: '+5 Mercadorias | +3 Pontos'
  },
  {
    type: 'Crise',
    title: 'Fuga de Talentos',
    description: 'Headhunter concorrente aliciou colaboradores chave. Perca 2 Funcionários ou pague R$ 15.000 de retenção.',
    actionText: '-2 Funcionários ou -R$ 15.000'
  },
  {
    type: 'Investimento',
    title: 'Expansão de Mercado',
    description: 'Campanha de expansão regional robusta. Pague R$ 40.000 para conquistar +5 Clientes e +5 Pontos corporativos.',
    actionText: 'Pagar R$ 40.000 -> +5 Clientes, +5 Pts',
    requiredLevel: 3
  }
];

export function shuffleBoardRules(currentTiles: Tile[]): Tile[] {
  const intermediateCount = currentTiles.length - 2;
  if (intermediateCount <= 0) return currentTiles;

  return currentTiles.map((tile, i) => {
    // Preserva a Largada (0) e a Linha de Chegada (boardSize - 1)
    if (i === 0 || i === currentTiles.length - 1) {
      return tile;
    }

    // Sorteia um setor e um modelo de regra de forma dinâmica
    const randomSector = SECTORS_SEQUENCE[Math.floor(Math.random() * SECTORS_SEQUENCE.length)];
    const randomTemplate = TILE_TEMPLATES[Math.floor(Math.random() * TILE_TEMPLATES.length)];

    return {
      ...tile,
      sector: randomSector,
      type: randomTemplate.type,
      title: randomTemplate.title,
      description: randomTemplate.description,
      actionText: randomTemplate.actionText,
      requiredLevel: randomTemplate.requiredLevel
    };
  });
}

export function generateBoardTiles(boardSize: BoardSize): Tile[] {
  const tiles: Tile[] = [];

  for (let i = 0; i < boardSize; i++) {
    const coords = getTileCoordinates(i, boardSize);

    // Casa Inicial
    if (i === 0) {
      tiles.push({
        id: i,
        index: i,
        sector: 'Diretoria',
        type: 'Inicio',
        title: 'LARGADA CORPORATIVA',
        description: 'Ponto de partida. Cada volta completa garante +R$ 30.000 e +5 Pontos corporativos de prestígio!',
        actionText: 'Início da Corrida',
        gridRow: coords.gridRow,
        gridColumn: coords.gridColumn,
        badge: 'START'
      });
      continue;
    }

    // Linha de Chegada / Desafio Final
    if (i === boardSize - 1) {
      tiles.push({
        id: i,
        index: i,
        sector: 'Diretoria',
        type: 'DiretoriaFinal',
        title: 'CONSELHO DE ADMINISTRAÇÃO',
        description: 'Apresente sua defesa executiva final em 60 segundos perante o Narrador e a mesa diretora para vencer!',
        actionText: 'Desafio do CEO',
        gridRow: coords.gridRow,
        gridColumn: coords.gridColumn,
        badge: 'FINISH'
      });
      continue;
    }

    // Setor e regra sorteados aleatoriamente
    const randomSector = SECTORS_SEQUENCE[Math.floor(Math.random() * SECTORS_SEQUENCE.length)];
    const randomTemplate = TILE_TEMPLATES[Math.floor(Math.random() * TILE_TEMPLATES.length)];

    tiles.push({
      id: i,
      index: i,
      sector: randomSector,
      type: randomTemplate.type,
      title: randomTemplate.title,
      description: randomTemplate.description,
      actionText: randomTemplate.actionText,
      gridRow: coords.gridRow,
      gridColumn: coords.gridColumn,
      requiredLevel: randomTemplate.requiredLevel
    });
  }

  return tiles;
}