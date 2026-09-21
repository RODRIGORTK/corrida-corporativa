import React, { useState, useEffect } from 'react';
import { useGame } from './context/GameContext';
import { SetupScreen } from './components/Setup/SetupScreen';
import { Board } from './components/Board/Board';
import { RankingBoard } from './components/Dashboard/RankingBoard';
import { NarratorPanel } from './components/Narrator/NarratorPanel';
import { GameModals } from './components/Modals/GameModals';
import { NarratorLobby } from './components/Narrator/NarratorLobby';
import { PlayerMobileRoot } from './components/PlayerMobile/PlayerMobileRoot';
import { socket } from './services/socket';
import { Award, RotateCcw, Clock, Shield, PanelRightClose, PanelRightOpen, Flag, RefreshCw, LogOut, Tv, Smartphone, UserX } from 'lucide-react';
import type { BoardSize, Player } from './types/game';

const GameView: React.FC = () => {
  const { 
    currentRound, 
    config, 
    activePlayer, 
    requestShuffleBoard, 
    requestQuitGame,
    eliminatePlayer // 🔥 Função extraída do contexto
  } = useGame();

  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  return (
    <div className="app-container">
      {/* Barra de Status Executiva Superior */}
      <header className="top-header">
        <div className="brand-section">
          <div className="brand-icon">
            <Award size={22} />
          </div>
          <div>
            <h1 className="brand-title">Corrida Corporativa</h1>
          </div>
        </div>

        <div className="header-status">
          {/* Contador de Voltas */}
          <div className="round-pill" style={{ color: 'var(--accent-emerald)', borderColor: 'rgba(16, 185, 129, 0.3)' }} title="Voltas do jogador da vez / Limite de voltas da partida">
            <Flag size={15} />
            <span>
              Volta {activePlayer?.lapsCompleted ?? 0} {config.lapLimit ? `/ ${config.lapLimit}` : '(Livre)'}
            </span>
          </div>

          {/* Ciclo de Rodadas */}
          <div className="round-pill" style={{ color: 'var(--text-muted)' }} title="Contador de rodadas para recuperação judicial e duração de contratos">
            <Clock size={14} />
            <span>Rodada {currentRound}</span>
          </div>

          {/* Executivo da Vez */}
          <div className="active-turn-pill">
            <div 
              className="player-turn-dot"
              style={{
                backgroundColor: activePlayer?.color,
                boxShadow: `0 0 10px ${activePlayer?.color}`
              }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Vez:</span>
            <strong style={{ color: 'var(--text-main)' }}>{activePlayer?.name || '---'}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Shield size={14} color="var(--primary)" />
            <span>{config.boardSize} casas</span>
          </div>

          {/* Botões do Painel e Eliminar Jogador da Vez */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsSidebarVisible(prev => !prev)}
              className="secondary-btn"
              style={{ 
                padding: '0.4rem 0.85rem', 
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderColor: isSidebarVisible ? 'var(--primary)' : undefined,
                backgroundColor: isSidebarVisible ? 'rgba(56, 189, 248, 0.15)' : undefined
              }}
              title={isSidebarVisible ? 'Ocultar barra lateral' : 'Exibir barra lateral'}
            >
              {isSidebarVisible ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
              <span>{isSidebarVisible ? 'Ocultar Painel' : 'Exibir Painel'}</span>
            </button>
          
            <button 
               onClick={() => {
                 if(activePlayer && window.confirm(`Tem certeza que deseja ELIMINAR o jogador da vez (${activePlayer.name}) da partida?`)){
                  eliminatePlayer(activePlayer.id);
                 }
               }}
               disabled={!activePlayer}
               style={{ 
                background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', 
                color: 'var(--accent-rose)', borderRadius: '6px', padding: '4px 8px', 
                fontSize: '0.75rem', fontWeight: 'bold', cursor: activePlayer ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                opacity: activePlayer ? 1 : 0.5
               }}
            >
                <UserX size={14} /> Eliminar da Vez
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              onClick={requestShuffleBoard}
              className="secondary-btn"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              title="Mudar a ordem das casas no tabuleiro"
            >
              <RefreshCw size={13} color="var(--primary)" /> Embaralhar
            </button>
            <button
              type="button"
              onClick={requestQuitGame}
              className="secondary-btn"
              style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', borderColor: 'rgba(244, 63, 94, 0.4)', color: 'var(--accent-rose)' }}
              title="Encerrar partida e voltar ao Menu"
            >
              <LogOut size={13} /> Sair do Jogo
            </button>
          </div>

        </div>
      </header>

      {/* Dashboard Principal */}
      <main className={`dashboard-layout ${!isSidebarVisible ? 'sidebar-hidden' : ''}`}>
        <Board isSidebarHidden={!isSidebarVisible} />

        {isSidebarVisible && (
          <aside className="right-sidebar">
            <NarratorPanel />
            <RankingBoard />
          </aside>
        )}
      </main>

      {/* Modais de Decisão, Desafios e Agrupamentos */}
      <GameModals />
    </div>
  );
};

export function App() {
  const { phase, setupGame } = useGame();

  const [role, setRole] = useState<'SELECT' | 'NARRATOR' | 'PLAYER'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'player') return 'PLAYER';
    if (params.get('role') === 'narrator') return 'NARRATOR';
    const saved = sessionStorage.getItem('cc_role');
    if (saved === 'PLAYER' || saved === 'NARRATOR') return saved;
    return 'SELECT';
  });

  const [serverIp, setServerIp] = useState<string>('localhost');
  const [lobbyPlayers, setLobbyPlayers] = useState<Player[]>([]);
  const [boardSize, setBoardSize] = useState<BoardSize>(30);
  const [lapLimit, setLapLimit] = useState<number | null>(3);

  React.useEffect(() => {
    const handleSync = (state: any) => {
      if (state.localIp) setServerIp(state.localIp);
      if (state.players) setLobbyPlayers(state.players);
    };

    socket.on('game:sync', handleSync);
    return () => {
      socket.off('game:sync', handleSync);
    };
  }, []);

  const selectRole = (chosen: 'NARRATOR' | 'PLAYER') => {
    setRole(chosen);
    sessionStorage.setItem('cc_role', chosen);
  };

  // 1. TELA DE ESCOLHA DE PAPEL (NARRADOR VS JOGADOR)
  if (role === 'SELECT') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        background: 'radial-gradient(circle at top, #0f172a 0%, #060913 100%)'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '560px',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(56, 189, 248, 0.3)',          
          borderRadius: '24px',
          padding: '2.5rem 1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.5)',
            marginBottom: '1rem'
          }}>
            <Award size={36} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-bright)', letterSpacing: '-0.03em' }}>
            Corrida Corporativa
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '2.25rem' }}>
            Multiplayer Local via Wi-Fi • Estilo Jackbox Games
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Opção 1: Narrador */}
            <button
              type="button"
              onClick={() => selectRole('NARRATOR')}
              style={{
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                border: '2px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '16px',
                padding: '2rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 10px 20px rgba(0,0,0,0.4)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <Tv size={32} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-bright)' }}>
                  Telão (Narrador)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Hospedar partida e exibir tabuleiro
                </div>
              </div>
            </button>

            {/* Opção 2: Jogador */}
            <button
              type="button"
              onClick={() => selectRole('PLAYER')}
              style={{
                background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))',
                border: '2px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '16px',
                padding: '2rem 1.25rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 10px 20px rgba(0,0,0,0.4)'
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = 'var(--accent-purple)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: 'rgba(168, 85, 247, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-purple)'
              }}>
                <Smartphone size={32} />
              </div>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-bright)' }}>
                  Jogador
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Controle Mobile com Dados e Inventário
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. MODO JOGADOR (SMARTPHONE)
  if (role === 'PLAYER') {
    return <PlayerMobileRoot onBackToRoleSelect={() => selectRole('SELECT')} />;
  }

  // 3. MODO NARRADOR (HOST / PROJETOR)
  if (phase === 'SETUP') {
    return (
      <NarratorLobby
        serverIp={serverIp}
        players={lobbyPlayers}
        boardSize={boardSize}
        setBoardSize={setBoardSize}
        lapLimit={lapLimit}
        setLapLimit={setLapLimit}
        onStartGame={() => setupGame(lobbyPlayers, boardSize, lapLimit)}
      />
    );
  }

  return <GameView />;
}

export default App;