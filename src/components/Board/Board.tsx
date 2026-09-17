import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';
import { getGridDimensions } from '../../utils/boardGenerator';
import { Award, Crown, TrendingUp, AlertTriangle, Briefcase, Users, DollarSign, Handshake, Gavel, Zap, ShieldAlert, Flame } from 'lucide-react';
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
    openTileInspectModal,
    notification // Puxando a notificação
  } = useGame();

  const dimensions = useMemo(() => {
    return getGridDimensions(config.boardSize);
  }, [config.boardSize]);

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
    if (tile.type === 'Prejuizo') return <AlertTriangle size={11} color="#f43f5e" />;
    if (tile.type === 'Desastre') return <ShieldAlert size={11} color="#be123c" />;
    if (tile.type === 'Crescimento') return <TrendingUp size={11} color="#10b981" />;
    if (tile.type === 'Oportunidade') return <Zap size={11} color="#14b8a6" />;
    if (tile.type === 'Investimento') return <DollarSign size={11} color="#facc15" />;
    if (tile.type === 'Negociação') return <Gavel size={11} color="#ec4899" />;
    if (tile.type === 'Alianca') return <Handshake size={11} color="#a855f7" />;
    if (tile.type === 'Desafio') return <Briefcase size={11} color="#6366f1" />;
    if (tile.type === 'Queima') return <Flame size={11} color="#f97316" />;
    return <Users size={11} color="#94a3b8" />;
  };

  const getTileColor = (type: string) => {
    switch (type) {
      case 'Inicio': return '#3b82f6';
      case 'DiretoriaFinal': return '#f59e0b';
      case 'Prejuizo': return '#e11d48';
      case 'Desastre': return '#9f1239';
      case 'Crescimento': return '#059669';
      case 'Oportunidade': return '#0d9488';
      case 'Investimento': return '#ca8a04';
      case 'Alianca': return '#7c3aed';
      case 'Negociação': return '#db2777';
      case 'Desafio': return '#4f46e5';
      case 'Queima': return '#f97316';
      default: return '#64748b';
    }
  };

  return (
    // ATUALIZADO: Adicionamos position: 'relative' no contêiner PAI de todos para ancorar a notificação
    <div className="board-viewport" style={{ width: '100%', height: '100vh', display: 'flex', flex: 1, position: 'relative' }}>
      
      {/* ===== SISTEMA DE NOTIFICAÇÃO FLUTUANTE ISOLADO ===== */}
      <style>{`
        @keyframes popInFadeOut {
          0% { opacity: 0; transform: translate(-50%, -10px) scale(0.9); }
          10% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          85% { opacity: 1; transform: translate(-50%, 0) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -10px) scale(0.9); }
        }
      `}</style>
      
      {notification && (
        <div 
          key={notification.id}
          style={{
            position: 'absolute',
            top: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 
              notification.type === 'gain' ? 'rgba(16, 185, 129, 0.95)' : 
              notification.type === 'loss' || notification.type === 'crisis' ? 'rgba(244, 63, 94, 0.95)' : 
              notification.type === 'alliance' ? 'rgba(139, 92, 246, 0.95)' : 
              'rgba(59, 130, 246, 0.95)', 
            color: '#fff',
            padding: '0.8rem 1.5rem',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.2)',
            fontWeight: 'bold',
            fontSize: '1rem',
            textAlign: 'center',
            zIndex: 9999, // Garantindo que fique por cima de tudo
            animation: 'popInFadeOut 4.8s ease-in-out forwards',
            pointerEvents: 'none',
            width: 'max-content',
            maxWidth: '80%'
          }}
        >
          {notification.message}
        </div>
      )}
      {/* ===== FIM DO SISTEMA DE NOTIFICAÇÃO ===== */}

      <div 
        className="board-grid-wrapper"
        style={{
          width: '100%',
          height: '100%',
          gridTemplateColumns: `repeat(${dimensions.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${dimensions.rows}, minmax(0, 1fr))`
        }}
      >
        {/* Restaurado o centro exatamente como era antes */}
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
                <span>🏢 Eventos Dinâmicos</span>
                <span>•</span>
                <span>⚖️ Recuperação Judicial</span>
                <span>•</span>
                <span>🤝 Fusões & Alianças</span>
              </div>
            </>
          )}
        </div>

        {tiles.map((tile) => {
          const tilePlayers = playersByTile.get(tile.index) || [];
          const isActiveTile = activePlayer?.position === tile.index;
          const tileColor = getTileColor(tile.type);
          const maxVisiblePawns = 2;
          const visiblePawns = tilePlayers.slice(0, maxVisiblePawns);
          const hiddenCount = tilePlayers.length - maxVisiblePawns;

          return (
            <div
              key={tile.id}
              className={`board-tile ${isActiveTile ? 'active-tile' : ''}`}
              style={{
                width: '100%',
                height: '100%',
                gridRow: tile.gridRow,
                gridColumn: tile.gridColumn,
                background: `radial-gradient(circle at top left, ${tileColor}38 0%, ${tileColor}1a 70%, rgba(15, 23, 42, 0.92) 100%)`,
                borderColor: isActiveTile ? 'var(--accent-gold)' : `${tileColor}66`,
                boxShadow: isActiveTile 
                  ? `0 0 18px rgba(245, 158, 11, 0.7), inset 0 0 14px ${tileColor}33` 
                  : `inset 0 0 12px ${tileColor}22, 0 2px 8px rgba(0, 0, 0, 0.4)`
              }}
              onClick={() => openTileInspectModal(tile.index)}
              title={`Casa ${tile.index}: ${tile.title} (${tile.type})`}
            >
              <div className="tile-header">
                <span className="tile-index">#{tile.index}</span>
                {tile.type === 'Inicio' && <span className="tile-badge-special start">LARGADA</span>}
                {tile.type === 'DiretoriaFinal' && <span className="tile-badge-special finish">CHEGADA</span>}
              </div>
              <div className="tile-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {renderTileIcon(tile)}
                  <span className="tile-name">{tile.title.replace(/^[A-Za-zÀ-ÖØ-öø-ÿ]+:\s*/, '')}</span>
                </div>
                <span className="tile-action-preview">{tile.actionText || tile.type}</span>
              </div>
              <div className="tile-pawns-container">
                {visiblePawns.map(p => {
                  const isMoving = movingPlayerId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`player-pawn ${isMoving ? 'moving' : ''}`}
                      style={{ backgroundColor: p.color, boxShadow: `0 0 10px ${p.color}` }}
                      title={`${p.name} (Nível ${p.level} • R$ ${p.balance.toLocaleString('pt-BR')})`}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  );
                })}
                {hiddenCount > 0 && <div className="pawn-cluster-badge">+{hiddenCount}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};