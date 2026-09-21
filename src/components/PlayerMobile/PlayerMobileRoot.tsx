import React, { useState, useEffect } from 'react';
import { socket } from '../../services/socket';
import { PlayerLogin } from './PlayerLogin';
import { PlayerWaitingRoom } from './PlayerWaitingRoom';
import { PlayerDashboard } from './PlayerDashboard';
import type { Player } from '../../types/game';

interface PlayerMobileRootProps {
  onBackToRoleSelect?: () => void;
}

export const PlayerMobileRoot: React.FC<PlayerMobileRootProps> = ({ onBackToRoleSelect }) => {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(() => {
    const saved = sessionStorage.getItem('cc_player_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [gameState, setGameState] = useState<any>(null);

  useEffect(() => {
    const handleSync = (state: any) => {
      setGameState(state);
      if (currentPlayer) {
        const updated = state.players?.find((p: Player) => p.id === currentPlayer.id);
        if (updated) {
          if (updated.isEliminated) {
            handleQuit();
            return;
          }
          setCurrentPlayer(updated);
          sessionStorage.setItem('cc_player_session', JSON.stringify(updated));
        }
      }
    };

    socket.on('game:sync', handleSync);
    return () => { socket.off('game:sync', handleSync); };
  }, [currentPlayer]);

  const handleLoginSuccess = (player: Player) => {
    setCurrentPlayer(player);
    sessionStorage.setItem('cc_player_session', JSON.stringify(player));
  };

  const handleQuit = () => {
    socket.emit('player:quit');
    sessionStorage.removeItem('cc_player_session');
    setCurrentPlayer(null);
    window.location.reload(); 
  };

  if (!currentPlayer) return <PlayerLogin onLoginSuccess={handleLoginSuccess} />;

  if (!gameState || !gameState.isStarted) {
    return (
      <PlayerWaitingRoom
        player={currentPlayer}
        playersCount={gameState?.players?.length || 1}
        onQuit={handleQuit}
      />
    );
  }

  const activePlayer = gameState.players?.[gameState.activePlayerIndex];
  const isMyTurn = activePlayer?.id === currentPlayer.id;

  return (
    <PlayerDashboard
      player={currentPlayer}
      isMyTurn={isMyTurn}
      activePlayerName={activePlayer ? activePlayer.name : '---'}
      allPlayers={gameState.players || []}
      currentRound={gameState.currentRound || 1}
      phase={gameState.phase || 'ROLL'} // 🔥 PASSANDO O PHASE PRO DADO VOLTAR AO NORMAL
      onQuit={handleQuit} 
    />
  );
};