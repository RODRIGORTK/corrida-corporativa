import React from 'react';
import { User, Users, CheckCircle, LogOut } from 'lucide-react';
import type { Player } from '../../types/game';

interface PlayerWaitingRoomProps {
  player: Player;
  playersCount: number;
  onQuit?: () => void;
}

export const PlayerWaitingRoom: React.FC<PlayerWaitingRoomProps> = ({ player, playersCount, onQuit }) => {
  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#060913', color: '#f8fafc',
      display: 'flex', flexDirection: 'column', padding: '2rem 1.5rem', alignItems: 'center'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        
        {/* CABEÇALHO COM BOTÃO DE SAIR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={24} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Sala de Espera</h2>
          </div>
          <button 
            onClick={onQuit}
            style={{ 
              background: 'transparent', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', 
              padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', gap: '6px', alignItems: 'center'
            }}
          >
            <LogOut size={16} /> Sair
          </button>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-glow)',
          borderRadius: '16px', padding: '2rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', backgroundColor: player.color,
            margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 900, boxShadow: `0 0 20px ${player.color}80`
          }}>
            {player.name.charAt(0).toUpperCase()}
          </div>
          
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>{player.name}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Você está conectado e pronto para a Corrida Corporativa!
          </p>

          <div style={{
            background: 'rgba(30, 41, 59, 0.5)', padding: '1rem', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
            <Users size={20} color="var(--text-muted)" />
            <span style={{ fontWeight: 800 }}>{playersCount} jogador(es) na sala</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <CheckCircle size={18} color="var(--accent-emerald)" />
          Aguarde o Narrador iniciar a partida no telão...
        </div>

      </div>
    </div>
  );
};