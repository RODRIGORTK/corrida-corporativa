import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import { SetupScreen } from './components/Setup/SetupScreen';
import { Board } from './components/Board/Board';
import { RankingBoard } from './components/Dashboard/RankingBoard';
import { NarratorPanel } from './components/Narrator/NarratorPanel';
import { GameModals } from './components/Modals/GameModals';
import { Award, RotateCcw, Clock, Shield, PanelRightClose, PanelRightOpen, Flag } from 'lucide-react';

const GameView: React.FC = () => {
  const { 
    currentRound, 
    config, 
    activePlayer, 
    restartGame 
  } = useGame();

  const [isSidebarVisible, setIsSidebarVisible] = useState(false);

  const handleConfirmRestart = () => {
    if (window.confirm('Tem certeza que deseja reiniciar a partida e voltar ao Setup?')) {
      restartGame();
    }
  };

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

          {/* Ciclo de Rodadas (para carência judicial e alianças) */}
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

          {/* Botão de Alternância da Barra Lateral para Maximizar Visão */}
          <button
            type="button"
            onClick={() => setIsSidebarVisible(prev => !prev)}
            className="secondary-btn"
            style={{ 
              padding: '0.4rem 0.85rem', 
              fontSize: '0.8rem',
              borderColor: isSidebarVisible ? 'var(--primary)' : undefined,
              backgroundColor: isSidebarVisible ? 'rgba(56, 189, 248, 0.15)' : undefined
            }}
            title={isSidebarVisible ? 'Ocultar barra lateral para maximizar visão do tabuleiro' : 'Exibir barra lateral com Ranking e Auditoria'}
          >
            {isSidebarVisible ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
            <span>{isSidebarVisible ? 'Ocultar Painel Lateral' : 'Exibir Painel Lateral'}</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmRestart}
            className="secondary-btn"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            title="Reiniciar partida"
          >
            <RotateCcw size={14} /> Novo Jogo
          </button>
        </div>
      </header>

      {/* Dashboard Principal */}
      <main className={`dashboard-layout ${!isSidebarVisible ? 'sidebar-hidden' : ''}`}>
        {/* Tabuleiro Perimétrico com Console no Centro quando a barra estiver oculta */}
        <Board isSidebarHidden={!isSidebarVisible} />

        {/* Barra Lateral Opcional */}
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
  const { phase } = useGame();

  if (phase === 'SETUP') {
    return <SetupScreen />;
  }

  return <GameView />;
}

export default App;
