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
    // 9 cols, 8 rows:
    // Top: col 1..9, row 1 (9 tiles: 0..8)
    // Right: col 9, row 2..7 (6 tiles: 9..14)
    // Bottom: col 9..1, row 8 (9 tiles: 15..23)
    // Left: col 1, row 7..2 (6 tiles: 24..29)
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
    // 13 cols, 12 rows:
    // Top: col 1..13, row 1 (13 tiles: 0..12)
    // Right: col 13, row 2..11 (10 tiles: 13..22)
    // Bottom: col 13..1, row 12 (13 tiles: 23..35)
    // Left: col 1, row 11..4 (8 tiles: 36..43)
    // Tile 44: row 2, col 2 (Acesso executivo da Diretoria)
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
  // 17 cols, 15 rows:
  // Top: col 1..17, row 1 (17 tiles: 0..16)
  // Right: col 17, row 2..14 (13 tiles: 17..29)
  // Bottom: col 17..1, row 15 (17 tiles: 30..46)
  // Left: col 1, row 14..2 (13 tiles: 47..59)
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

const SECTORS_SEQUENCE: SectorType[] = [
  'RH',
  'Marketing',
  'Vendas',
  'Financeiro',
  'Logística',
  'Produção',
  'Tecnologia',
  'Diretoria'
];

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
    description: 'Um novo cliente assinou pedido imediato. Ganhe +R$ 2.000 e +1 Cliente.',
    actionText: '+R$ 2.000 | +1 Cliente'
  },
  {
    type: 'Crise',
    title: 'Glitch Operacional',
    description: 'Falha técnica gerou cancelamento de pedidos. Perca R$ 1.500 ou gaste 5 Pontos corporativos para anular.',
    actionText: 'Risco: -R$ 1.500 (ou 5 pts)'
  },
  {
    type: 'Investimento',
    title: 'Rodada de Seed Capital',
    description: 'Aporte de R$ 3.000 para gerar +3 Mercadorias e +2 Pontos de prestígio.',
    actionText: 'Pagar R$ 3.000 -> +3 Mercadorias, +2 Pts',
    requiredLevel: 1
  },
  {
    type: 'Desafio',
    title: 'Comitê de Crise',
    description: 'Situação adversa sorteada pelo sistema! O Narrador julgará a sua argumentação.',
    actionText: 'Carta de Desafio'
  },
  {
    type: 'Negociação',
    title: 'Mesa de Fusões & Aquisições',
    description: 'Momento de negociação livre com outros executivos ou proposta de aliança corporativa.',
    actionText: 'Negociação Aberta'
  },
  {
    type: 'Oportunidade',
    title: 'Inovação de Processos',
    description: 'Redução de custos operacionais e aumento de produtividade. Ganhe +2 Mercadorias e +1 Ponto.',
    actionText: '+2 Mercadorias | +1 Ponto'
  },
  {
    type: 'Crise',
    title: 'Fuga de Talentos',
    description: 'Headhunter concorrente aliciou colaboradores chave. Perca 1 Funcionário ou pague R$ 2.500 de bônus de retenção.',
    actionText: '-1 Funcionário ou -R$ 2.500'
  },
  {
    type: 'Investimento',
    title: 'Expansão de Mercado',
    description: 'Campanha de expansão regional. Pague R$ 4.000 para conquistar +3 Clientes e +1 Nível.',
    actionText: 'Pagar R$ 4.000 -> +3 Clientes',
    requiredLevel: 2
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
        description: 'Ponto de partida da corrida empresarial. Cada volta completa garante bônus de R$ 3.000 e +1 Ponto!',
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
