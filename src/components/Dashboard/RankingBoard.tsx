import React from 'react';
import { useGame } from '../../context/GameContext';
import { Trophy, Users, Package, DollarSign, Star, Handshake, AlertOctagon } from 'lucide-react';

export const RankingBoard: React.FC = () => {
  const { ranking, activePlayer, players } = useGame();

  const getPartnerName = (partnerId: string | null) => {
    if (!partnerId) return '';
    const partner = players.find(p => p.id === partnerId);
    return partner ? partner.name : 'Aliado';
  };

  return (
    <div className="sidebar-section" style={{ flex: 1 }}>
      <div className="section-title">
        <Trophy size={16} color="var(--accent-gold)" />
        <span>Ranking Corporativo em Tempo Real</span>
      </div>

      <div className="ranking-list">
        {ranking.map((player, index) => {
          const isActiveTurn = activePlayer?.id === player.id;
          const rankPos = index + 1;
          const rankClass = rankPos === 1 ? 'rank-1' : rankPos === 2 ? 'rank-2' : rankPos === 3 ? 'rank-3' : '';

          return (
            <div
              key={player.id}
              className={`ranking-card ${isActiveTurn ? 'is-active-turn' : ''} ${player.bankruptcy.inRecovery ? 'in-bankruptcy' : ''} ${player.isEliminated ? 'is-eliminated' : ''}`}
            >
              <div className="ranking-card-top">
                <div className="player-rank-info">
                  <span className={`rank-position-badge ${rankClass}`}>
                    #{rankPos}
                  </span>
                  <div
                    className="player-color-indicator"
                    style={{ backgroundColor: player.color }}
                  />
                  <div>
                    <span className="player-name-text">
                      {player.name}
                    </span>
                    {isActiveTurn && (
                      <span style={{ fontSize: '0.65rem', marginLeft: '6px', color: 'var(--primary)', fontWeight: 700 }}>
                        (Vez Atual)
                      </span>
                    )}
                  </div>
                </div>

                <span className="player-balance-pill" style={{ color: player.balance <= 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                  R$ {player.balance.toLocaleString('pt-BR')}
                </span>
              </div>

              {/* Estatísticas Chave */}
              <div className="ranking-card-stats">
                <div className="stat-item" title="Mercadorias / Produtos (2º critério de desempate)">
                  <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Package size={9} /> Prod
                  </span>
                  <span className="stat-value">{player.goods}</span>
                </div>
                <div className="stat-item" title="Funcionários (3º critério de desempate)">
                  <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Users size={9} /> Func
                  </span>
                  <span className="stat-value">{player.employees}</span>
                </div>
                <div className="stat-item" title="Pontos Corporativos (4º critério de desempate)">
                  <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <Star size={9} /> Pts
                  </span>
                  <span className="stat-value" style={{ color: 'var(--accent-gold)' }}>{player.points}</span>
                </div>
                <div className="stat-item" title="Clientes (5º critério de desempate)">
                  <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <DollarSign size={9} /> Cli
                  </span>
                  <span className="stat-value">{player.clients}</span>
                </div>
              </div>

              {/* Badges de Status Especiais */}
              <div className="badge-row">
                <span className="badge-tag level">
                  ⭐ Nível {player.level}
                </span>

                <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  🏁 {player.lapsCompleted || 0} {player.lapsCompleted === 1 ? 'volta' : 'voltas'}
                </span>

                {player.bankruptcy.inRecovery && !player.isEliminated && (
                  <span className="badge-tag danger" title="Deve regularizar o saldo em até 2 rodadas">
                    <AlertOctagon size={10} /> Recup. Judicial ({player.bankruptcy.roundsLeft} rod.)
                  </span>
                )}

                {player.alliance && !player.isEliminated && (
                  <span className="badge-tag alliance" title="Recursos e riscos divididos igualmente">
                    <Handshake size={10} /> Aliança c/ {getPartnerName(player.alliance.partnerId)} ({player.alliance.roundsLeft} rod.)
                  </span>
                )}

                {player.isEliminated && (
                  <span className="badge-tag danger">
                    💀 Falência Declarada (Eliminado)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
