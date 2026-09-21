import React, { useState } from 'react';
import { socket } from '../../services/socket';
import { Smartphone, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import type { Player } from '../../types/game';

interface PlayerLoginProps {
  onLoginSuccess: (player: Player) => void;
}

export const PlayerLogin: React.FC<PlayerLoginProps> = ({ onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPin = pin.trim();

    if (!cleanName) {
      setError('Por favor, informe seu Nome de Usuário.');
      return;
    }

    if (cleanPin.length !== 4) {
      setError('O PIN deve conter exatamente 4 dígitos.');
      return;
    }

    setError('');
    setLoading(true);

    socket.emit('player:login', { name: cleanName, pin: cleanPin }, (response: any) => {
      setLoading(false);
      if (response && response.success) {
        onLoginSuccess(response.player);
      } else {
        setError(response?.message || 'Nome ou PIN não conferem com a lista do Narrador.');
      }
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'radial-gradient(circle at top, #0f172a 0%, #060913 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '16px',
        padding: '2rem 1.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(16px)'
      }}>
        {/* Ícone e Cabeçalho */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
            marginBottom: '0.75rem'
          }}>
            <Smartphone size={30} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-bright)' }}>
            Entrar como Jogador
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Consulte seu PIN de 4 dígitos na tela do Narrador
          </p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid var(--accent-rose)',
            color: 'var(--accent-rose)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Nome */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Nome de Usuário
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                placeholder="Nome de Usuário"
                value={name}
                onChange={e => setName(e.target.value)}
                autoCapitalize="words"
                className="text-input"
                style={{ paddingLeft: '2.5rem', width: '100%', height: '48px', fontSize: '1rem' }}
              />
            </div>
          </div>

          {/* PIN de 4 dígitos */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              PIN de 4 Dígitos
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                className="text-input"
                style={{
                  paddingLeft: '2.5rem',
                  width: '100%',
                  height: '48px',
                  fontSize: '1.3rem',
                  letterSpacing: '8px',
                  fontWeight: 900
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-start-game"
            style={{
              height: '50px',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '0.5rem'
            }}
          >
            {loading ? (
              <span>Conectando...</span>
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>Entrar na Partida</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
