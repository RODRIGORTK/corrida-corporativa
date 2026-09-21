import React, { useState } from 'react';
import { socket } from '../../services/socket';
import { Shield, Sparkles, Smartphone, CheckCircle, Clock, AlertCircle, Copy, Check } from 'lucide-react';
import type { BoardSize, Player } from '../../types/game';

interface NarratorLobbyProps {
  serverIp: string;
  players: Player[];
  boardSize: BoardSize;
  setBoardSize: (size: BoardSize) => void;
  lapLimit: number | null;
  setLapLimit: (laps: number | null) => void;
  onStartGame: () => void;
}

export const NarratorLobby: React.FC<NarratorLobbyProps> = ({
  serverIp,
  players,
  boardSize,
  setBoardSize,
  lapLimit,
  setLapLimit,
  onStartGame
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [copied, setCopied] = useState(false);

  // URL para os celulares acessarem (porta da aplicação Vite)
  const clientPort = window.location.port || '5173';
  const mobileAccessUrl = `http://${serverIp}:${clientPort}`;

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    socket.emit('narrator:add_player', { name: trimmed });
    setNewPlayerName('');
  };

  const handleRemovePlayer = (playerId: string) => {
    socket.emit('narrator:remove_player', { playerId });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileAccessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const allConnected = players.length >= 2 && players.every(p => p.isConnected);

  return (
    <div className="setup-container">
      <div className="setup-card" style={{ maxWidth: '1000px' }}>
        
        {/* Banner de Conexão Wi-Fi para os Smartphones */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(99, 102, 241, 0.2))',
          border: '1px solid var(--primary)',
          borderRadius: '12px',
          padding: '1.2rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              backgroundColor: 'rgba(56, 189, 248, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)'
            }}>
              <Smartphone size={28} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Conectar Celulares na mesma rede Wi-Fi
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-bright)' }}>
                {mobileAccessUrl}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="secondary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.6rem 1rem' }}
          >
            {copied ? <Check size={16} color="var(--accent-emerald)" /> : <Copy size={16} />}
            <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>
        </div>

        <div className="setup-grid">
          
          {/* Coluna 1: Gestão de Participantes com PIN */}
          <div className="setup-section-box">
            <div className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>👥 Executivos & PINs de Acesso ({players.length}/20)</span>
              <span style={{ fontSize: '0.75rem', color: players.length >= 2 ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                {players.length < 2 ? 'Mínimo 2 jogadores' : 'Jogadores cadastrados'}
              </span>
            </div>

            <form onSubmit={handleAddPlayer} className="player-input-row">
              <input
                type="text"
                placeholder="Nome do executivo / empresa..."
                value={newPlayerName}
                onChange={e => setNewPlayerName(e.target.value)}
                maxLength={20}
                className="text-input"
              />
              <button
                type="submit"
                className="btn-add"
                disabled={!newPlayerName.trim() || players.length >= 20}
              >
                + Adicionar
              </button>
            </form>

            {/* Lista com Nome - PIN e Status de Conexão */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto', marginTop: '0.75rem' }}>
              {players.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem 1rem', fontSize: '0.9rem' }}>
                  Digite os nomes acima para gerar os PINs de 4 dígitos.
                </div>
              ) : (
                players.map((player) => (
                  <div
                    key={player.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: `1px solid ${player.isConnected ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-subtle)'}`,
                      borderRadius: '8px',
                      padding: '0.6rem 0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: player.color,
                          boxShadow: `0 0 8px ${player.color}`
                        }}
                      />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-bright)' }}>
                        {player.name}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {/* PIN destacado para visualização dos jogadores no telão */}
                      <div style={{
                        background: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.4)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: 900,
                        letterSpacing: '2px',
                        color: 'var(--accent-gold)'
                      }}>
                        PIN: {player.pin}
                      </div>

                      {/* Status de Conexão */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        color: player.isConnected ? 'var(--accent-emerald)' : 'var(--text-dim)'
                      }}>
                        {player.isConnected ? (
                          <>
                            <CheckCircle size={14} color="var(--accent-emerald)" />
                            <span>Conectado</span>
                          </>
                        ) : (
                          <>
                            <Clock size={14} />
                            <span>Aguardando celular</span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(player.id)}
                        className="pill-remove-btn"
                        title="Remover participante"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.6rem' }}>
              💡 Peça para cada jogador abrir o link no celular e digitar seu Nome e o PIN de 4 dígitos correspondente.
            </div>
          </div>

          {/* Coluna 2: Configuração de Mapa e Partida */}
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

            <div style={{ marginTop: '1rem' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} /> Limite de Voltas
              </label>
              <div className="options-toggle-group" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[1, 2, 3].map(val => (
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
                  Livre
                </button>
              </div>
            </div>

            {/* Alerta de Status de Conexão para Iniciar */}
            <div style={{
              background: allConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
              border: `1px solid ${allConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.3)'}`,
              borderRadius: '8px',
              padding: '0.85rem',
              marginTop: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: allConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)'
            }}>
              {allConnected ? (
                <>
                  <CheckCircle size={18} />
                  <span>Todos os executivos estão conectados com seus smartphones! Pronto para iniciar.</span>
                </>
              ) : (
                <>
                  <AlertCircle size={18} />
                  <span>
                    {players.length < 2
                      ? 'Adicione no mínimo 2 participantes.'
                      : 'Aguardando todos os jogadores entrarem com seus PINs para liberar o início da partida.'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botão de Iniciar Partida */}
        <button
          type="button"
          onClick={onStartGame}
          disabled={!allConnected}
          className="btn-start-game"
          style={{
            marginTop: '1.5rem',
            opacity: allConnected ? 1 : 0.4,
            cursor: allConnected ? 'pointer' : 'not-allowed'
          }}
        >
          🚀 Iniciar Partida (Telão do Narrador)
        </button>
      </div>
    </div>
  );
};
