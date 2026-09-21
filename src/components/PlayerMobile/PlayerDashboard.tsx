import React, { useState, useEffect } from 'react';
import { socket } from '../../services/socket';
import { DollarSign, Package, Users, Briefcase, Award, Dices, Sparkles, RotateCcw, ShieldAlert, Shuffle, ArrowDownLeft, X, EyeOff, LogOut } from 'lucide-react';
import type { Player, SpecialCard } from '../../types/game';

interface PlayerDashboardProps {
  player: Player;
  isMyTurn: boolean;
  activePlayerName: string;
  activePlayerId?: string; 
  allPlayers: Player[];
  currentRound: number;
  phase?: string;
  onQuit?: () => void;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ player, isMyTurn, activePlayerName, activePlayerId, allPlayers, currentRound, phase, onQuit }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);

  useEffect(() => {
    if (isMyTurn && phase === 'ROLL') {
      setHasRolled(false);
    }
  }, [isMyTurn, currentRound, phase]);

  const [selectedCard, setSelectedCard] = useState<SpecialCard | null>(null);
  const [targetPlayerId, setTargetPlayerId] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [customDiceValue, setCustomDiceValue] = useState<number>(1);
  const [cardFeedback, setCardFeedback] = useState<string>('');
  const [isSubmittingCard, setIsSubmittingCard] = useState<boolean>(false);

  // Botão só fica livre se for a vez do cara, fase ROLL e ele não estiver no meio do clique.
  const canRoll = isMyTurn && phase === 'ROLL' && !isRolling && !hasRolled;

  const handleRollDice = () => {
    if (!canRoll) return;
    setIsRolling(true); setHasRolled(true);

    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count >= 10) {
        clearInterval(interval);
        socket.emit('player:roll_dice');
        setTimeout(() => setIsRolling(false), 2000);
      }
    }, 80);
  };

  const handleConfirmUseCard = () => {
    if (!selectedCard) return;
    setIsSubmittingCard(true);
    
    // Auto-alvo para Bloqueio ou Impostor
    let finalTarget = targetPlayerId;
    if (selectedCard.type === 'bloqueio' || selectedCard.type === 'impostor') {
      finalTarget = activePlayerId || allPlayers.find(p => p.name === activePlayerName)?.id || '';
    }

    socket.emit('player:use_card', { cardId: selectedCard.id, targetPlayerId: finalTarget, isAnonymous, customDiceValue }, (res: any) => {
      setIsSubmittingCard(false);
      if (res && res.success) {
        setCardFeedback(res.message || 'Carta ativada com sucesso!');
        setTimeout(() => { setSelectedCard(null); setCardFeedback(''); }, 1800);
      } else { setCardFeedback(res?.message || 'Erro ao usar a carta.'); }
    });
  };

  const renderCardIcon = (type: string) => {
    switch (type) {
      case 'segunda_chance': return <RotateCcw size={18} color="#38bdf8" />;
      case 'bloqueio': return <ShieldAlert size={18} color="#f43f5e" />;
      case 'impostor': return <Shuffle size={18} color="#fbbf24" />;
      case 'dois_dados': return <Dices size={18} color="#10b981" />;
      case 'traicoeiro': return <ArrowDownLeft size={18} color="#a855f7" />;
      default: return <Sparkles size={18} color="#fbbf24" />;
    }
  };

  const eligibleTargets = allPlayers.filter(p => p.id !== player.id && !p.isEliminated);

  const groupedCards = (player.cards || []).reduce((acc: any, card: SpecialCard) => {
    if (!acc[card.type]) { acc[card.type] = { ...card, count: 1, allIds: [card.id] }; } 
    else { acc[card.type].count += 1; acc[card.type].allIds.push(card.id); }
    return acc;
  }, {});
  const uniqueCards = Object.values(groupedCards) as any[];

  // Regra de validação de custo na UI
  const isSelfImpostor = selectedCard?.type === 'impostor' && (activePlayerId || allPlayers.find(p => p.name === activePlayerName)?.id) === player.id;
  const totalCardCost = (isAnonymous ? 20000 : 0) + (isSelfImpostor ? 5000 : 0);
  const cantAfford = (player.balance || 0) < totalCardCost;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060913', color: '#f8fafc', padding: '1rem', paddingBottom: '3rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '480px', margin: '0 auto' }}>
      
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: player.color, boxShadow: `0 0 10px ${player.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.9rem' }}>
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{player.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Nível {player.level || 1} • Casa #{player.position}
              {player.bankruptcy?.inRecovery && ( <span style={{ color: '#ef4444', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>⚠️ Rec. Judicial ({player.bankruptcy.roundsLeft} rodadas)</span> )}
              {player.alliance && ( <span style={{ color: '#3b82f6', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>🤝 Aliança com {(allPlayers.find(p => p.id === player.alliance?.partnerId) || {}).name || '...'} ({player.alliance.roundsLeft} rodadas)</span> )}
            </div>
          </div>
        </div>

        <button onClick={() => { if (window.confirm("Atenção! Ao sair agora sua empresa FALIRÁ instantaneamente e você será eliminado. Deseja mesmo sair?")) onQuit?.(); }} style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid var(--accent-rose)', color: 'var(--accent-rose)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LogOut size={14} /> Sair
        </button>
      </header>

      <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-glow)', borderRadius: '16px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>Patrimônio Corporativo</div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DollarSign size={24} color="var(--accent-emerald)" /><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Saldo em Caixa</span></div>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-emerald)' }}>R$ {(player.balance || 0).toLocaleString('pt-BR')}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Package size={20} color="#38bdf8" /><div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mercadorias</div><div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{player.goods || 0}</div></div></div>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={20} color="#f59e0b" /><div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Clientes</div><div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{player.clients || 0}</div></div></div>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Briefcase size={20} color="#ec4899" /><div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Funcionários</div><div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{player.employees || 0}</div></div></div>
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={20} color="var(--accent-gold)" /><div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pontos XP</div><div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{player.points || 0}</div></div></div>
        </div>
      </div>

      <div style={{ background: isMyTurn ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(16, 185, 129, 0.2))' : 'rgba(15, 23, 42, 0.5)', border: `1px solid ${isMyTurn ? 'var(--primary)' : 'var(--border-subtle)'}`, borderRadius: '16px', padding: '1.25rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.8rem', color: isMyTurn ? 'var(--primary)' : 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.75rem' }}>
          {isMyTurn ? (phase === 'ROLL' ? '🎯 É a sua vez de mover o peão!' : 'Aguarde o Narrador...') : `Vez de: ${activePlayerName}`}
        </div>

        <button
          type="button"
          onClick={handleRollDice}
          disabled={!canRoll}
          style={{
            width: '100%', height: '64px', borderRadius: '12px',
            background: canRoll ? 'linear-gradient(135deg, #0284c7, #10b981)' : 'rgba(255, 255, 255, 0.05)',
            border: canRoll ? 'none' : '1px solid var(--border-subtle)',
            color: canRoll ? '#fff' : 'var(--text-dim)',
            fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            cursor: canRoll ? 'pointer' : 'not-allowed',
            boxShadow: canRoll ? '0 0 20px rgba(56, 189, 248, 0.4)' : 'none',
            transition: 'all 0.2s'
          }}
        >
          <Dices size={28} />
          <span>
            {!isMyTurn ? 'NÃO É SUA VEZ' : (!canRoll && phase !== 'ROLL' ? 'AÇÃO EM ANDAMENTO' : (isRolling ? 'Sorteando...' : 'SORTEAR DADO (1-6)'))}
          </span>
        </button>
      </div>

      <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={18} color="var(--accent-purple)" /><span style={{ fontSize: '0.95rem', fontWeight: 800 }}>Inventário de Cartas</span></div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(player.cards || []).length} carta(s)</span>
        </div>

        {(!player.cards || player.cards.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)', fontSize: '0.85rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '10px' }}>Você ainda não possui cartas.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {uniqueCards.map((card) => {
              return (
                <div key={card.type} style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '0.75rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{renderCardIcon(card.type)}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-bright)' }}>
                        {card.title} {card.count > 1 && <span style={{ color: 'var(--primary)', marginLeft: '4px' }}>{card.count}x</span>}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{card.description}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => { setSelectedCard({...card, id: card.allIds[0]}); setTargetPlayerId(''); setIsAnonymous(false); setCardFeedback(''); setCustomDiceValue(1); }} className="secondary-btn" style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem', fontWeight: 700, borderColor: 'var(--accent-purple)', color: 'var(--text-bright)', cursor: 'pointer', flexShrink: 0 }}>
                    Usar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedCard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(6, 9, 19, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#0f172a', border: '1px solid var(--accent-purple)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{renderCardIcon(selectedCard.type)}<h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{selectedCard.title}</h3></div><button type="button" onClick={() => setSelectedCard(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{selectedCard.description}</p>
            
            {/* 🔥 NOVO GRID DE SELEÇÃO DE JOGADORES (Focado na Carta Traiçoeiro) 🔥 */}
            {selectedCard.type === 'traicoeiro' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-bright)' }}>Selecione o Alvo (A partir da Casa 4):</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                  {eligibleTargets.map(t => {
                    const isDisabled = t.position < 4;
                    const isSelected = targetPlayerId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setTargetPlayerId(t.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '0.6rem', borderRadius: '8px',
                          background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`,
                          opacity: isDisabled ? 0.4 : 1, cursor: isDisabled ? 'not-allowed' : 'pointer',
                          textAlign: 'left', transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: t.color, flexShrink: 0, boxShadow: `0 0 5px ${t.color}` }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: isSelected ? '#fff' : 'var(--text-bright)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</div>
                          <div style={{ fontSize: '0.65rem', color: isSelected ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
                            Casa #{t.position} {isDisabled && ' (Inválido)'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {selectedCard.type === 'bloqueio' && (
               <div style={{ marginBottom: '1rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-rose)', padding: '0.75rem', borderRadius: '8px' }}>
                 <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-rose)' }}>Alvo: Jogador Atual da Vez</div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-bright)' }}>O turno de {activePlayerName} será bloqueado se ele ainda não tiver jogado o dado.</div>
               </div>
            )}
            
            {selectedCard.type === 'impostor' && (
              <>
                 <div style={{ marginBottom: '1rem', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.4)', padding: '0.75rem', borderRadius: '8px' }}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24' }}>Alvo: {activePlayerName} (Vez Atual)</div>
                   <div style={{ fontSize: '0.75rem', color: 'var(--text-bright)' }}>Dica: Se você usar esta carta em si mesmo, pagará uma taxa extra de <strong>R$ 5.000</strong>.</div>
                 </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', color: 'var(--text-bright)' }}>Definir Novo Valor do Dado (1 a 6):</label>
                  <div style={{ display: 'flex', gap: '6px' }}>{[1, 2, 3, 4, 5, 6].map(val => (<button key={val} type="button" onClick={() => setCustomDiceValue(val)} className={`quick-dice-btn ${customDiceValue === val ? 'selected' : ''}`} style={{ flex: 1, background: customDiceValue === val ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: customDiceValue === val ? '#fff' : 'inherit' }}>{val}</button>))}</div>
                </div>
              </>
            )}
            
            <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '0.85rem', marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#a855f7' }}/><div><div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-bright)' }}><EyeOff size={16} color="var(--accent-purple)" /><span>Usar anonimamente (Custo: R$ 20.000)</span></div></div></label>
            </div>
            
            {cardFeedback && (<div style={{ padding: '0.65rem', borderRadius: '8px', background: cardFeedback.includes('sucesso') ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)', color: cardFeedback.includes('sucesso') ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center', marginBottom: '1rem' }}>{cardFeedback}</div>)}
            
            <div style={{ display: 'flex', gap: '8px' }}><button type="button" onClick={() => setSelectedCard(null)} className="secondary-btn" style={{ flex: 1, padding: '0.75rem' }}>Cancelar</button><button type="button" onClick={handleConfirmUseCard} disabled={isSubmittingCard || cantAfford} className="btn-start-game" style={{ flex: 2, padding: '0.75rem', margin: 0 }}>{isSubmittingCard ? 'Ativando...' : 'Confirmar e Usar'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};