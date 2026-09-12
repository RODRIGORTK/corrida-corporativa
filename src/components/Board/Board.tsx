import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { getGridDimensions } from '../../utils/boardGenerator';
import { SECTOR_INFO } from '../../data/challenges';
import { Award, Crown, TrendingUp, AlertTriangle, Briefcase, Users, DollarSign } from 'lucide-react';
import type { Tile } from '../../types/game';
import { NarratorTurnConsole } from '../Narrator/NarratorPanel';

interface BoardProps {
  isSidebarHidden?: boolean;
}

export const Board: React.FC<BoardProps> = ({ isSidebarHidden = false }) => {
  const { 
    tiles, 
    players, 
    activePlayer, 
    config, 
    movingPlayerId, 
    openTileInspectModal 
  } = useGame();

  const dimensions = useMemo(() => {
    return getGridDimensions(config.boardSize);
  }, [config.boardSize]);

  // Agrupa peões por índice de casa
  const playersByTile = useMemo(() => {
    const map = new Map<number, typeof players>();
    for (const player of players) {
      if (player.isEliminated) continue;
      const list = map.get(player.position) || [];
      list.push(player);
      map.set(player.position, list);
    }
    return map;
  }, [players]);

  const renderTileIcon = (tile: Tile) => {
    if (tile.type === 'Inicio') return <Crown size={12} color="#fbbf24" />;
    if (tile.type === 'DiretoriaFinal') return <Award size={14} color="#fbbf24" />;
    if (tile.type === 'Crise') return <AlertTriangle size={11} color="#f43f5e" />;
    if (tile.type === 'Oportunidade') return <TrendingUp size={11} color="#10b981" />;
    if (tile.type === 'Investimento') return <DollarSign size={11} color="#38bdf8" />;
    if (tile.type === 'Negociação') return <Briefcase size={11} color="#a855f7" />;
    return <Users size={11} color="#94a3b8" />;
  };

  return (
    <div className="board-viewport" style={{ width: '100%', height: '100vh', display: 'flex', flex: 1 }}>
      <div 
        className="board-grid-wrapper"
        style={{
          /* 2. MUDANÇA AQUI: Adicionado width e height 100% dentro do grid */
          width: '100%',
          height: '100%',
          gridTemplateColumns: `repeat(${dimensions.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${dimensions.rows}, minmax(0, 1fr))`
        }}
      >
        {/* Miolo Central do Tabuleiro */}
        <div className={`board-center-stage ${isSidebarHidden ? 'interactive-center' : ''}`}>
          {isSidebarHidden ? (
            <NarratorTurnConsole inCenter={true} />
          ) : (
            <>
              <div className="board-center-watermark">
                <Award size={84} color="#38bdf8" />
              </div>
              <h2 className="board-center-title">CORRIDA CORPORATIVA</h2>
              <p className="board-center-subtitle">
                Trilha Estratégica Empresarial • Conselho de Administração
              </p>
              <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>🏢 8 Setores Integrados</span>
                <span>•</span>
                <span>⚖️ Recuperação Judicial Ativa</span>
                <span>•</span>
                <span>🤝 Fusões & Alianças</span>
              </div>
            </>
          )}
        </div>

        {/* Casas Perimétricas */}
        {tiles.map((tile) => {
          const tilePlayers = playersByTile.get(tile.index) || [];
          const isActiveTile = activePlayer?.position === tile.index;
          const sectorData = SECTOR_INFO[tile.sector];
          const sectorColor = sectorData?.color || '#38bdf8';

          const maxVisiblePawns = 2;
          const visiblePawns = tilePlayers.slice(0, maxVisiblePawns);
          const hiddenCount = tilePlayers.length - maxVisiblePawns;

          return (
            <div
              key={tile.id}
              className={`board-tile ${isActiveTile ? 'active-tile' : ''}`}
              style={{
                /* 3. MUDANÇA AQUI: Forçando a casa a ocupar 100% do quadrado dela */
                width: '100%',
                height: '100%',
                gridRow: tile.gridRow,
                gridColumn: tile.gridColumn,
                background: `radial-gradient(circle at top left, ${sectorColor}38 0%, ${sectorColor}1a 70%, rgba(15, 23, 42, 0.92) 100%)`,
                borderColor: isActiveTile ? 'var(--accent-gold)' : `${sectorColor}66`,
                boxShadow: isActiveTile 
                  ? `0 0 18px rgba(245, 158, 11, 0.7), inset 0 0 14px ${sectorColor}33` 
                  : `inset 0 0 12px ${sectorColor}22, 0 2px 8px rgba(0, 0, 0, 0.4)`
              }}
              onClick={() => openTileInspectModal(tile.index)}
              title={`Casa ${tile.index}: ${tile.title} (${tile.sector} - Clique para detalhes)`}
            >
              {/* O conteúdo da casa (headers, ícones e peões) continua EXATAMENTE igual */}
              <div className="tile-header">
                <span className="tile-index">#{tile.index}</span>
                {tile.type === 'Inicio' && (
                  <span className="tile-badge-special start">LARGADA</span>
                )}
                {tile.type === 'DiretoriaFinal' && (
                  <span className="tile-badge-special finish">CHEGADA</span>
                )}
              </div>

              <div className="tile-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {renderTileIcon(tile)}
                  <span className="tile-name">{tile.title.replace(/^[A-Za-zÀ-ÖØ-öø-ÿ]+:\s*/, '')}</span>
                </div>
                <span className="tile-action-preview">
                  {tile.actionText || tile.type}
                </span>
              </div>

              <div className="tile-pawns-container">
                {visiblePawns.map(p => {
                  const isMoving = movingPlayerId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`player-pawn ${isMoving ? 'moving' : ''}`}
                      style={{
                        backgroundColor: p.color,
                        boxShadow: `0 0 10px ${p.color}`
                      }}
                      title={`${p.name} (Nível ${p.level} • R$ ${p.balance.toLocaleString('pt-BR')})`}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  );
                })}

                {hiddenCount > 0 && (
                  <div 
                    className="pawn-cluster-badge"
                    title={`${hiddenCount} outros executivos nesta casa`}
                  >
                    +{hiddenCount}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};