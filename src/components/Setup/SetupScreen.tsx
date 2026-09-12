import React, { useState } from 'react';
import { useGame, PLAYER_PALETTE } from '../../context/GameContext';
import type { BoardSize } from '../../types/game';
import { Users, Play, Plus, X, Shield, Award, Sparkles } from 'lucide-react';

export const SetupScreen: React.FC = () => {
  const { setupGame } = useGame();

  const [players, setPlayers] = useState<string[]>([
    'Alpha Corp',
    'Apex Capital',
    'Nexus Ventures',
    'Titan Holdings'
  ]);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [boardSize, setBoardSize] = useState<BoardSize>(30);
  const [lapLimit, setLapLimit] = useState<number | null>(3);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    if (players.length >= 20) return;
    if (players.some(p => p.toLowerCase() === trimmed.toLowerCase())) return;

    setPlayers([...players, trimmed]);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (index: number) => {
    setPlayers(players.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    if (players.length < 2 || players.length > 20) return;
    setupGame(players, boardSize, lapLimit);
  };

  return (
    <div className="setup-container">
      <div className="setup-card">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <div className="brand-icon" style={{ width: '48px', height: '48px' }}>
            <Award size={28} />
          </div>
        </div>

        <h1 className="setup-title">Corrida Corporativa</h1>

        <div className="setup-grid">
          {/* Seção 1: Jogadores */}
          <div className="setup-section-box">
            <div className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} /> Executivos / Empresas ({players.length}/20)
              </span>
              <span style={{ fontSize: '0.75rem', color: players.length >= 2 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {players.length < 2 ? 'Mínimo 2 jogadores' : 'Pronto para jogar'}
              </span>
            </div>

            <form onSubmit={handleAddPlayer} className="player-input-row">
              <input
                type="text"
                placeholder="Nome da empresa ou executivo..."
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                maxLength={24}
                className="text-input"
              />
              <button 
                type="submit" 
                className="btn-add" 
                disabled={!newPlayerName.trim() || players.length >= 20}
              >
                <Plus size={18} /> Adicionar
              </button>
            </form>

            <div className="players-pill-container">
              {players.map((name, idx) => (
                <div key={idx} className="player-registered-pill">
                  <div
                    className="pill-dot"
                    style={{ backgroundColor: PLAYER_PALETTE[idx % PLAYER_PALETTE.length] }}
                  />
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePlayer(idx)}
                    className="pill-remove-btn"
                    title="Remover participante"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              * Recursos iniciais: R$ 10.000, 2 Funcionários, 3 Clientes, 0 Mercadorias, Nível 0.
            </div>
          </div>

          {/* Seção 2: Parâmetros de Partida */}
          <div className="setup-section-box">
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Shield size={16} /> Tamanho do Mapa (Casas)
              </label>
              <div className="options-toggle-group">
                <button
                  type="button"
                  onClick={() => setBoardSize(30)}
                  className={`toggle-option-btn ${boardSize === 30 ? 'selected' : ''}`}
                >
                  Pequeno (30)
                </button>
                <button
                  type="button"
                  onClick={() => setBoardSize(45)}
                  className={`toggle-option-btn ${boardSize === 45 ? 'selected' : ''}`}
                >
                  Médio (45)
                </button>
                <button
                  type="button"
                  onClick={() => setBoardSize(60)}
                  className={`toggle-option-btn ${boardSize === 60 ? 'selected' : ''}`}
                >
                  Grande (60)
                </button>
              </div>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} /> Limite de Voltas Completas da Partida
              </label>

              {/* Controle customizável para manipular qualquer quantidade de voltas */}
              <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(15, 23, 42, 0.9)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-glow)' }}>
                  <button
                    type="button"
                    onClick={() => setLapLimit(prev => Math.max(1, (prev ?? 1) - 1))}
                    disabled={lapLimit === null || lapLimit <= 1}
                    className="quick-dice-btn"
                    style={{ width: '28px', height: '28px', fontSize: '1rem', padding: 0 }}
                    title="Diminuir voltas"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={lapLimit ?? ''}
                    placeholder="Livre"
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') setLapLimit(null);
                      else setLapLimit(Math.max(1, parseInt(val) || 1));
                    }}
                    className="text-input"
                    style={{ width: '64px', height: '32px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-gold)' }}
                    title="Digite livremente a quantidade de voltas desejada"
                  />
                  <button
                    type="button"
                    onClick={() => setLapLimit(prev => (prev ?? 0) + 1)}
                    className="quick-dice-btn"
                    style={{ width: '28px', height: '28px', fontSize: '1rem', padding: 0 }}
                    title="Aumentar voltas"
                  >
                    +
                  </button>
                </div>

                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {lapLimit ? `${lapLimit} volta(s) inteira(s)` : 'Sem limite (Modo Livre)'}
                </span>
              </div>

              {/* Atalhos Rápidos */}
              <div className="options-toggle-group" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {[1, 2, 3, 5].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLapLimit(val)}
                    className={`toggle-option-btn ${lapLimit === val ? 'selected' : ''}`}
                  >
                    {val} {val === 1 ? 'Volta' : 'Voltas'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setLapLimit(null)}
                  className={`toggle-option-btn ${lapLimit === null ? 'selected' : ''}`}
                >
                  Infinito
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                {lapLimit 
                  ? `A partida encerra quando o primeiro executivo completar ${lapLimit} volta(s) inteira(s) no mapa.`
                  : 'Modo Livre/Infinito: O jogo continua até a conquista final ou decisão manual do Narrador.'}
              </p>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <strong>Critérios Oficiais de Desempate:</strong>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                <span style={{ color: 'var(--accent-emerald)' }}>1º Saldo</span> •
                <span style={{ color: '#38bdf8' }}>2º Mercadorias</span> •
                <span style={{ color: '#f59e0b' }}>3º Funcionários</span> •
                <span style={{ color: '#ec4899' }}>4º Pontos</span> •
                <span style={{ color: '#a855f7' }}>5º Clientes</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={players.length < 2}
          className="btn-start-game"
        >
          <Play size={20} fill="currentColor" /> Iniciar Corrida Corporativa
        </button>
      </div>
    </div>
  );
};
