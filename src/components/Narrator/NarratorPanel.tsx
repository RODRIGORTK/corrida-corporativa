import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { Dices, ArrowRight, Star, ScrollText, DollarSign, Package, Users, Briefcase, Award } from 'lucide-react';

export interface NarratorTurnConsoleProps {
  inCenter?: boolean;
}

export const NarratorTurnConsole: React.FC<NarratorTurnConsoleProps> = ({ inCenter = false }) => {
  const { 
    activePlayer, 
    phase, 
    rollDiceAndMove, 
    config
  } = useGame();

  const [diceInput, setDiceInput] = useState<number>(1);

  const handleRoll = () => {
    if (diceInput < 1) return;
    rollDiceAndMove(Number(diceInput));
  };

  const handleQuickDice = (val: number) => {
    // ATUALIZADO: Agora apenas atualiza o visor e NÃO anda automaticamente!
    setDiceInput(val);
  };

  const isMovingOrBusy = phase !== 'ROLL';

  // Retorna o título da empresa baseado no nível atual
  const getCompanyTitle = (level: number) => {
    switch (level) {
      case 5: return 'Empresa Líder';
      case 4: return 'Grande Empresa';
      case 3: return 'Empresa em Crescimento';
      case 2: return 'Pequena Empresa';
      default: return 'Microempresa';
    }
  };

  return (
    <div className={`narrator-console ${inCenter ? 'center-stage-console' : ''}`}>
      <div className="active-turn-banner">
        <div>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Executivo da Vez
          </span>
          <div className="active-player-name">
            <div 
              style={{
                width: inCenter ? '16px' : '12px',
                height: inCenter ? '16px' : '12px',
                borderRadius: '50%',
                backgroundColor: activePlayer?.color,
                boxShadow: `0 0 10px ${activePlayer?.color}`
              }}
            />
            <span style={{ fontSize: inCenter ? '1.15rem' : '0.95rem' }}>
              {activePlayer?.name || '---'}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                Casa Atual
              </span>
              <div style={{ fontSize: inCenter ? '1.25rem' : '1.1rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                #{activePlayer?.position ?? 0}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.6rem' }}>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>
                Voltas
              </span>
              <div style={{ fontSize: inCenter ? '1.25rem' : '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {activePlayer?.lapsCompleted ?? 0}{config.lapLimit ? `/${config.lapLimit}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD DE ESTATÍSTICAS DO JOGADOR + TÍTULO DE NÍVEL */}
      {activePlayer && (
        <div style={{
          backgroundColor: `${activePlayer.color}15`,
          border: `1px solid ${activePlayer.color}40`,
          borderRadius: '8px',
          padding: '0.75rem',
          marginBottom: '1rem',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.6rem',
            color: 'var(--text-bright)',
            marginBottom: '0.6rem'
          }}>
            <div title="Saldo Financeiro" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <DollarSign size={14} color={activePlayer.color} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {activePlayer.balance >= 1000 ? `${(activePlayer.balance / 1000).toFixed(1)}k` : activePlayer.balance}
              </span>
            </div>
            <div title="Mercadorias / Estoque" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Package size={14} color={activePlayer.color} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{activePlayer.goods}</span>
            </div>
            <div title="Clientes" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={14} color={activePlayer.color} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{activePlayer.clients}</span>
            </div>
            <div title="Funcionários" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Briefcase size={14} color={activePlayer.color} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{activePlayer.employees}</span>
            </div>
            <div title="Pontos Corporativos (XP)" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award size={14} color={activePlayer.color} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{activePlayer.points} pts</span>
            </div>
            <div title="Nível Corporativo" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={14} color={activePlayer.color} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Nv. {activePlayer.level}</span>
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            padding: '4px 8px',
            backgroundColor: `${activePlayer.color}25`,
            borderRadius: '4px',
            color: 'var(--accent-gold)',
            border: `1px solid ${activePlayer.color}50`
          }}>
            🏢 {getCompanyTitle(activePlayer.level)}
          </div>
        </div>
      )}

      {/* Entrada do Dado Físico */}
      <div className="dice-input-group">
        <input
          type="number"
          min={1}
          max={30}
          value={diceInput}
          onChange={e => setDiceInput(Math.max(1, parseInt(e.target.value) || 1))}
          disabled={isMovingOrBusy}
          className="dice-number-input"
        />
        <button
          type="button"
          onClick={handleRoll}
          disabled={isMovingOrBusy}
          className="roll-btn"
        >
          <ArrowRight size={18} />
          <span>{phase === 'MOVING' ? 'Movendo peão...' : 'Avançar Peão'}</span>
        </button>
      </div>

      {/* Botões Rápidos (1 a 6) */}
      <div className="quick-dice-buttons">
        {[1, 2, 3, 4, 5, 6].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => handleQuickDice(num)}
            disabled={isMovingOrBusy}
            className="quick-dice-btn"
            style={{ 
              // ATUALIZADO: Agora pinta de azul baseado no input atual, e não no peão andando!
              backgroundColor: diceInput === num ? '#3b82f6' : '',
              color: diceInput === num ? '#ffffff' : '',
              borderColor: diceInput === num ? '#3b82f6' : ''
            }}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export const NarratorPanel: React.FC = () => {
  const { logs } = useGame();

  return (
    <div>
      <div className="sidebar-section">
        <div className="section-title">
          <Dices size={16} color="var(--primary)" />
          <span>Console do Narrador (Ação de Turno)</span>
        </div>
        <NarratorTurnConsole />
      </div>

      <div className="sidebar-section">
        <div className="section-title">
          <ScrollText size={16} color="var(--text-muted)" />
          <span>Auditoria Corporativa (Histórico)</span>
        </div>

        <div className="logs-stream">
          {logs.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem 0' }}>
              Nenhuma movimentação registrada.
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className={`log-entry ${log.type}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Rodada {log.round}
                  </span>
                  <span className="log-time">{log.timestamp}</span>
                </div>
                <div>{log.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};