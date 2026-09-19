import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { FINAL_BOARDROOM_CHALLENGE } from '../../data/challenges';
import { 
  Trophy, AlertTriangle, TrendingUp, DollarSign, Users, Check, X, Clock, Crown, ShieldCheck, Briefcase, RotateCcw, Handshake, Gavel, Package, Award, Flame, RefreshCw, LogOut, Play, Pause
} from 'lucide-react';
import type { Player } from '../../types/game';

const RES_LABELS: any = { balance: 'R$', goods: 'Merc.', clients: 'Clientes', employees: 'Funcionários', points: 'Pontos' };

// --- COMPONENTE DE SPINNER CUSTOMIZADO ---
const NumberSpinner = ({ value, onChange, min = 0, max = 999999, step = 1, placeholder = "0" }: any) => {
  const handleDec = () => onChange(Math.max(min, (value || 0) - step));
  const handleInc = () => onChange(Math.min(max, (value || 0) + step));
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden', width: '100%', marginBottom: '1rem' }}>
      <button type="button" onClick={handleDec} style={{ padding: '0.8rem 1.2rem', fontSize: '1.5rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', border: 'none', borderRight: '1px solid var(--border-subtle)', color: 'var(--text-bright)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
        −
      </button>
      
      <input 
        type="number" 
        min={min} max={max} 
        value={value || ''} 
        placeholder={placeholder}
        onChange={e => {
          let val = parseInt(e.target.value);
          if (isNaN(val)) val = 0;
          onChange(Math.min(max, Math.max(min, val)));
        }} 
        style={{ flex: 1, textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold', background: 'transparent', border: 'none', color: 'var(--accent-gold)', outline: 'none', width: '100%', MozAppearance: 'textfield' }} 
        className="no-spinners-input"
      />
      
      <button type="button" onClick={handleInc} style={{ padding: '0.8rem 1.2rem', fontSize: '1.5rem', fontWeight: 'bold', background: 'rgba(255,255,255,0.05)', border: 'none', borderLeft: '1px solid var(--border-subtle)', color: 'var(--text-bright)', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
        +
      </button>
    </div>
  );
};

export const GameModals: React.FC = () => {
  const gameContext = useGame();
  
  if (!gameContext) return null;

  const { 
    activeModal, closeModal, resolveChallenge, resolveCrisis, resolveInvestment, resolveInvestmentReturn,
    resolveFinalBoardroom, resolveNegotiation, resolveAllianceModal, resolveOpportunity, resolveQueima,
    activePlayer, players, winner, restartGame, confirmShuffleBoard, confirmQuitGame
  } = gameContext;

  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);

  const [tradePartnerId, setTradePartnerId] = useState('');
  const [giveType, setGiveType] = useState('balance');
  const [giveAmount, setGiveAmount] = useState<number>(0);
  const [receiveType, setReceiveType] = useState('clients');
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const [alliancePartnerId, setAlliancePartnerId] = useState('');
  const [allianceDuration, setAllianceDuration] = useState<number>(3);
  const [queimaGoods, setQueimaGoods] = useState<number>(0);

  const [invBalance, setInvBalance] = useState<number>(0);
  const [invGoods, setInvGoods] = useState<number>(0);
  const [invClients, setInvClients] = useState<number>(0);
  const [invEmployees, setInvEmployees] = useState<number>(0);
  const [invPoints, setInvPoints] = useState<number>(0);

  const sortedPlayers = [...(players || [])].sort((a, b) => {
    if ((b.level || 1) !== (a.level || 1)) return (b.level || 1) - (a.level || 1);
    return (b.balance || 0) - (a.balance || 0);
  });

  const getInitialTime = (type: string | null | undefined) => {
    if (type === 'FINAL_BOARDROOM' || type === 'NEGOTIATION') return 60;
    if (type === 'CHALLENGE' || type === 'ALLIANCE') return 30;
    return 0;
  };

  useEffect(() => {
    if (activeModal?.type) {
      setTimerSeconds(getInitialTime(activeModal.type));
      setIsTimerRunning(activeModal.type === 'ALLIANCE' || activeModal.type === 'FINAL_BOARDROOM' || activeModal.type === 'NEGOTIATION');
    } else {
      setIsTimerRunning(false);
    }
    setTradePartnerId(''); setGiveAmount(0); setReceiveAmount(0); setAlliancePartnerId(''); setAllianceDuration(3); setInspectedPlayer(null);
    setQueimaGoods(0); setInvBalance(0); setInvGoods(0); setInvClients(0); setInvEmployees(0); setInvPoints(0);
  }, [activeModal?.type, activeModal?.card]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!activeModal?.type && !winner) return null;

  const getPlayerNameSpan = (player: Player | null | undefined) => {
    if (!player) return null;
    return (
      <span style={{ color: player.bankruptcy?.inRecovery ? '#ef4444' : 'inherit', fontWeight: 'bold' }}>
        {player.name} {player.bankruptcy?.inRecovery && '(Falido)'}
      </span>
    );
  };

  const renderTimer = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(15, 23, 42, 0.8)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(251, 191, 36, 0.3)', marginTop: '1rem', marginBottom: '1rem', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Clock size={28} color={timerSeconds <= 10 ? 'var(--accent-rose)' : 'var(--accent-gold)'} />
        <span style={{ fontSize: '2rem', fontWeight: 900, color: timerSeconds <= 10 ? 'var(--accent-rose)' : 'var(--accent-gold)', fontVariantNumeric: 'tabular-nums' }}>
          {timerSeconds}s
        </span>
      </div>
      <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '12px' }}>
        <button type="button" onClick={() => setIsTimerRunning(!isTimerRunning)} className="secondary-btn" style={{ flex: 1, padding: '0.6rem' }}>
          {isTimerRunning ? <Pause size={18} /> : <Play size={18} />} {isTimerRunning ? 'Pausar' : 'Iniciar'}
        </button>
        <button type="button" onClick={() => { setTimerSeconds(getInitialTime(activeModal?.type)); setIsTimerRunning(false); }} className="secondary-btn" style={{ flex: 1, padding: '0.6rem' }}>
          <RotateCcw size={18} /> Reiniciar
        </button>
      </div>
    </div>
  );

  const renderPrincipalDashboard = (player: Player) => (
    <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.85rem', borderRadius: '8px', border: `1px solid ${player.color}50` }}>
      <div style={{ fontSize: '0.85rem', color: player.bankruptcy?.inRecovery ? '#ef4444' : player.color, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.6rem' }}>
        Status: {player.name} {player.bankruptcy?.inRecovery ? '(RECUPERAÇÃO)' : ''} (Nv. {player.level || 1})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center', fontSize: '0.9rem' }}>
        <div title="Saldo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><DollarSign size={18} color="#10b981" /><span style={{ fontWeight: 800, marginTop: '4px' }}>{(player.balance || 0) >= 1000 ? `${((player.balance || 0)/1000).toFixed(1)}k` : (player.balance || 0)}</span></div>
        <div title="Mercadorias" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Package size={18} color="#f8fafc" /><span style={{ fontWeight: 800, marginTop: '4px' }}>{player.goods || 0}</span></div>
        <div title="Clientes" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Users size={18} color="#f8fafc" /><span style={{ fontWeight: 800, marginTop: '4px' }}>{player.clients || 0}</span></div>
        <div title="Funcionários" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Briefcase size={18} color="#f8fafc" /><span style={{ fontWeight: 800, marginTop: '4px' }}>{player.employees || 0}</span></div>
        <div title="Pontos" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Award size={18} color="#f59e0b" /><span style={{ fontWeight: 800, marginTop: '4px' }}>{player.points || 0}</span></div>
      </div>
    </div>
  );

  const renderSelectablePlayerCard = (player: Player, isSelected: boolean, onSelect: () => void, rankPosition: number) => (
    <div key={player.id} onClick={onSelect} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.7)', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`, padding: '0.85rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 900, color: rankPosition === 1 ? '#fbbf24' : rankPosition === 2 ? '#94a3b8' : rankPosition === 3 ? '#b45309' : 'var(--text-dim)', minWidth: '25px' }}>
            #{rankPosition}
          </span>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: player.color }} />
          <span style={{ fontWeight: 800, fontSize: '1.15rem', color: player.bankruptcy?.inRecovery ? '#ef4444' : 'var(--text-bright)' }}>
            {player.name}
          </span>
          <span style={{ fontSize: '0.8rem', padding: '3px 8px', backgroundColor: `${player.color}25`, borderRadius: '4px', color: 'var(--accent-gold)' }}>Nv. {player.level || 1}</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          <span title="Saldo" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}><DollarSign size={16} color="#10b981"/> {(player.balance || 0).toLocaleString('pt-BR')}</span>
          <span title="Mercadorias" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}><Package size={16} color="#f8fafc"/> {player.goods || 0}</span>
          <span title="Clientes" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}><Users size={16} color="#f8fafc"/> {player.clients || 0}</span>
        </div>
      </div>
      <div style={{ paddingLeft: '1rem' }}>
        <div style={{ padding: '0.8rem 1.2rem', fontSize: '0.9rem', fontWeight: 800, borderRadius: '6px', border: 'none', backgroundColor: isSelected ? 'var(--primary)' : 'rgba(30, 41, 59, 0.8)', color: isSelected ? '#0f172a' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isSelected ? <Check size={18}/> : null} {isSelected ? 'Selecionado' : 'Escolher'}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .no-spinners-input::-webkit-inner-spin-button, 
        .no-spinners-input::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
      `}</style>

      {/* ---------- TELAS SIMPLES ---------- */}
      {activeModal.type === 'CONFIRM_SHUFFLE' && (
        <div className="modal-overlay"><div className="modal-dialog" style={{ maxWidth: '420px' }}><div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}><RefreshCw size={22} /></div><div><h3 className="modal-title">Embaralhar Tabuleiro?</h3></div></div></div><div className="modal-body" style={{ textAlign: 'center', color: 'var(--text-bright)', fontSize: '1rem' }}>As cartas de bônus, crises e oportunidades serão misturadas aleatoriamente.<br/><br/><strong>Os executivos continuarão onde estão.</strong></div><div className="modal-footer"><button type="button" onClick={closeModal} className="btn-reject"><X size={18} /> Cancelar</button><button type="button" onClick={confirmShuffleBoard} className="btn-approve"><RefreshCw size={18} /> Embaralhar</button></div></div></div>
      )}
      
      {activeModal.type === 'CONFIRM_QUIT' && (
        <div className="modal-overlay"><div className="modal-dialog" style={{ maxWidth: '420px', border: '1px solid rgba(244, 63, 94, 0.5)' }}><div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)' }}><LogOut size={22} /></div><div><h3 className="modal-title">Abandonar Partida?</h3></div></div></div><div className="modal-body" style={{ textAlign: 'center', color: 'var(--text-bright)', fontSize: '1rem' }}>Você está prestes a encerrar a partida.<br/><br/><span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>Todo o progresso será perdido.</span></div><div className="modal-footer"><button type="button" onClick={closeModal} className="btn-neutral">Continuar Jogando</button><button type="button" onClick={confirmQuitGame} className="btn-reject"><LogOut size={18} /> Sim, Encerrar</button></div></div></div>
      )}
      
      {(winner || activeModal.type === 'GAME_OVER') && (
        <div className="modal-overlay">
          <div className="modal-dialog victory-modal" style={{ maxWidth: '640px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.8))' }}><div className="modal-title-group"><div className="modal-icon-bubble" style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b', color: '#f59e0b' }}><Crown size={24} /></div><div><h3 className="modal-title" style={{ color: '#fbbf24' }}>CORRIDA ENCERRADA!</h3></div></div></div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <Trophy size={64} color="#fbbf24" style={{ margin: '0 auto 1rem auto' }} />
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff' }}>{winner?.name || sortedPlayers[0]?.name}</h2>
              <div style={{ marginTop: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                {sortedPlayers.map((p, idx) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: idx === 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(30, 41, 59, 0.7)', borderRadius: '8px', border: `1px solid ${idx === 0 ? '#f59e0b' : 'var(--border-subtle)'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><div style={{ fontWeight: 900, fontSize: '1.1rem', color: idx === 0 ? '#f59e0b' : 'var(--text-dim)' }}>#{idx + 1}</div><div><div style={{ fontWeight: 700, color: p.bankruptcy?.inRecovery ? '#ef4444' : p.color, fontSize: '1.05rem' }}>{p.name} {p.bankruptcy?.inRecovery && '💀'}</div></div></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center', fontSize: '0.85rem' }}><div><span style={{ display: 'block', color: 'var(--text-muted)' }}>Caixa</span><span style={{ fontWeight: 700, color: '#10b981' }}>{p.balance}</span></div><div><span style={{ display: 'block', color: 'var(--text-muted)' }}>Merc.</span><span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.goods}</span></div><div><span style={{ display: 'block', color: 'var(--text-muted)' }}>Cli.</span><span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.clients}</span></div><div><span style={{ display: 'block', color: 'var(--text-muted)' }}>Func.</span><span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.employees}</span></div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: 'center' }}><button type="button" onClick={restartGame} className="btn-approve" style={{ padding: '0.85rem 2rem' }}><RotateCcw size={18} /> Nova Temporada</button></div>
          </div>
        </div>
      )}

      {/* ---------- TELAS DIVIDIDAS (NEGOCIAÇÃO, ALIANÇA, INVESTIMENTO) ---------- */}
      
      {activeModal.type === 'NEGOTIATION' && (() => {
        const eligiblePartners = sortedPlayers.filter(p => p.id !== activePlayer?.id && !p.isEliminated && !p.hasWon);
        const isTradeValid = tradePartnerId !== '' && giveAmount > 0 && receiveAmount > 0;
        
        return (
          <div className="modal-overlay">
            <div className="modal-dialog" style={{ maxWidth: '1000px', width: '95vw', padding: 0, flexDirection: 'row', display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', background: '#0f172a', borderRight: '1px solid var(--border-subtle)' }}>
                <div className="modal-header" style={{ borderBottom: 'none' }}>
                  <div className="modal-title-group">
                    <div className="modal-icon-bubble" style={{ color: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}><Gavel size={22} /></div>
                    <div><h3 className="modal-title">Licitação</h3><span className="modal-sector-tag">{getPlayerNameSpan(activePlayer)} é o Principal</span></div>
                  </div>
                </div>
                <div className="modal-body" style={{ flex: 1, padding: '0 1.5rem 1.5rem 1.5rem', overflowY: 'auto' }}>
                  {activePlayer && renderPrincipalDashboard(activePlayer)}
                  {renderTimer()}
                  <div className="modal-scenario-box" style={{ fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }}>
                    Escolha um executivo no painel ao lado e monte sua proposta de troca comercial.
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '1.5rem', background: 'transparent', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button type="button" disabled={!isTradeValid} onClick={() => resolveNegotiation({ partnerId: tradePartnerId, giveType, giveAmount, receiveType, receiveAmount })} className="btn-approve" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', opacity: isTradeValid ? 1 : 0.4 }}><Check size={20} /> Confirmar Troca</button>
                  <button type="button" onClick={() => resolveNegotiation(null)} className="btn-reject" style={{ width: '100%', padding: '1rem' }}>Passar / Sem Acordo</button>
                </div>
              </div>
              <div style={{ flex: 1, padding: '2rem', background: 'rgba(30, 41, 59, 0.4)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-bright)', marginBottom: '1.5rem', fontWeight: 800 }}>1. Escolha a Empresa Alvo (Ordem de Ranking):</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem', minHeight: '200px' }}>
                  {eligiblePartners.length === 0 ? 
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '1.1rem', padding: '3rem' }}>Nenhum executivo livre para negociar.</div> : 
                    eligiblePartners.map(p => {
                      const rankPos = sortedPlayers.findIndex(r => r.id === p.id) + 1;
                      return renderSelectablePlayerCard(p, tradePartnerId === p.id, () => setTradePartnerId(p.id), rankPos);
                    })
                  }
                </div>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-bright)', marginBottom: '1rem', fontWeight: 800, marginTop: '2rem' }}>2. Defina os Termos do Acordo:</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                    <span style={{ display: 'block', fontSize: '1rem', fontWeight: 800, color: 'var(--accent-rose)', marginBottom: '1rem' }}>🔴 VOCÊ DÁ (Sai de Você):</span>
                    <NumberSpinner value={giveAmount} onChange={setGiveAmount} min={0} step={giveType === 'balance' ? 1000 : 1} placeholder="0" />
                    <select value={giveType} onChange={e => setGiveType(e.target.value)} className="text-input" style={{ width: '100%', fontSize: '1.1rem', padding: '0.8rem' }}>
                      <option value="balance">Saldo (R$)</option><option value="goods">Mercadorias</option><option value="clients">Clientes</option><option value="employees">Funcionários</option><option value="points">Pontos</option>
                    </select>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ display: 'block', fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '1rem' }}>🟢 VOCÊ RECEBE (Vem pra Você):</span>
                    <NumberSpinner value={receiveAmount} onChange={setReceiveAmount} min={0} step={receiveType === 'balance' ? 1000 : 1} placeholder="0" />
                    <select value={receiveType} onChange={e => setReceiveType(e.target.value)} className="text-input" style={{ width: '100%', fontSize: '1.1rem', padding: '0.8rem' }}>
                      <option value="balance">Saldo (R$)</option><option value="goods">Mercadorias</option><option value="clients">Clientes</option><option value="employees">Funcionários</option><option value="points">Pontos</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {activeModal.type === 'ALLIANCE' && (() => {
        const eligiblePartners = sortedPlayers.filter(p => p.id !== activePlayer?.id && !p.isEliminated && !p.hasWon && !p.alliance);
        return (
          <div className="modal-overlay">
            <div className="modal-dialog" style={{ maxWidth: '1000px', width: '95vw', padding: 0, flexDirection: 'row', display: 'flex', overflow: 'hidden' }}>
              <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', background: '#0f172a', borderRight: '1px solid var(--border-subtle)' }}>
                <div className="modal-header" style={{ borderBottom: 'none' }}>
                  <div className="modal-title-group">
                    <div className="modal-icon-bubble" style={{ color: 'var(--accent-purple)' }}><Handshake size={22} /></div>
                    <div><h3 className="modal-title">Aliança Estratégica</h3><span className="modal-sector-tag">Convite de {getPlayerNameSpan(activePlayer)}</span></div>
                  </div>
                </div>
                <div className="modal-body" style={{ flex: 1, padding: '0 1.5rem 1.5rem 1.5rem', overflowY: 'auto' }}>
                  {activePlayer && renderPrincipalDashboard(activePlayer)}
                  {renderTimer()}
                  <div className="modal-scenario-box" style={{ textAlign: 'center', padding: '1.2rem', marginBottom: '1rem', fontSize: '1rem' }}>
                    Uma união estratégica divide os ganhos e os prejuízos pela metade e soma o nível das empresas!
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: '1.5rem', background: 'transparent', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button type="button" disabled={!alliancePartnerId} onClick={() => resolveAllianceModal(alliancePartnerId, allianceDuration)} className="btn-approve" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', opacity: alliancePartnerId ? 1 : 0.4 }}><Handshake size={20} /> Firmar Aliança</button>
                  <button type="button" onClick={() => resolveAllianceModal(null)} className="btn-reject" style={{ width: '100%', padding: '1rem' }}>Passar / Jogar Sozinho</button>
                </div>
              </div>
              <div style={{ flex: 1, padding: '2rem', background: 'rgba(30, 41, 59, 0.4)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-bright)', marginBottom: '1.5rem', fontWeight: 800 }}>Escolha a Empresa Alvo (Ordem de Ranking):</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, overflowY: 'auto', paddingRight: '0.5rem', minHeight: '200px' }}>
                  {eligiblePartners.length === 0 ? 
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '1.1rem', padding: '3rem' }}>Nenhum executivo livre para aliança.</div> : 
                    eligiblePartners.map(p => {
                      const rankPos = sortedPlayers.findIndex(r => r.id === p.id) + 1;
                      return renderSelectablePlayerCard(p, alliancePartnerId === p.id, () => setAlliancePartnerId(p.id), rankPos);
                    })
                  }
                </div>
                <div style={{ marginTop: '2rem', background: 'rgba(15, 23, 42, 0.8)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-glow)' }}>
                  <label style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-bright)', fontWeight: 800, marginBottom: '1rem' }}>Duração do Contrato (Rodadas):</label>
                  <NumberSpinner value={allianceDuration} onChange={setAllianceDuration} min={1} max={10} step={1} placeholder="3" />
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🔥 NOVO LAYOUT DO INVESTIMENTO AQUI 🔥 */}
      {activeModal.type === 'INVESTMENT' && (() => {
        const totalInvested = invBalance + invGoods + invClients + invEmployees + invPoints;
        const canInvest = totalInvested > 0 && activePlayer && invBalance <= (activePlayer.balance || 0) && invGoods <= (activePlayer.goods || 0) && invClients <= (activePlayer.clients || 0) && invEmployees <= (activePlayer.employees || 0) && invPoints <= (activePlayer.points || 0);
        
        return (
          <div className="modal-overlay">
            <div className="modal-dialog" style={{ maxWidth: '1000px', width: '95vw', padding: 0, flexDirection: 'row', display: 'flex', overflow: 'hidden' }}>
              
              {/* LADO ESQUERDO: HEADER + STATUS + BOTÕES */}
              <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', background: '#0f172a', borderRight: '1px solid var(--border-subtle)' }}>
                <div className="modal-header" style={{ borderBottom: 'none' }}>
                  <div className="modal-title-group">
                    <div className="modal-icon-bubble" style={{ color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}><DollarSign size={22} /></div>
                    <div><h3 className="modal-title">{activeModal.tile?.title}</h3><span className="modal-sector-tag">Aporte na Casa #{activeModal.tile?.index}</span></div>
                  </div>
                </div>
                
                <div className="modal-body" style={{ flex: 1, padding: '0 1.5rem 1.5rem 1.5rem', overflowY: 'auto' }}>
                  {activePlayer && renderPrincipalDashboard(activePlayer)}
                  <div className="modal-scenario-box" style={{ fontSize: '0.9rem', textAlign: 'center', marginTop: '1rem' }}>
                    Escolha os recursos que deseja investir e ancorar nesta casa! Quando você der a volta e cair aqui novamente, receberá <strong>tudo de volta com +50% de lucro</strong>!
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: '1.5rem', background: 'transparent', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button type="button" onClick={() => resolveInvestment({ balance: invBalance, goods: invGoods, clients: invClients, employees: invEmployees, points: invPoints })} disabled={!canInvest} className="btn-approve" style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', opacity: canInvest ? 1 : 0.4 }}><Check size={20} /> Confirmar Investimento</button>
                  <button type="button" onClick={() => resolveInvestment(null)} className="btn-reject" style={{ width: '100%', padding: '1rem' }}>Passar (Não Investir)</button>
                </div>
              </div>

              {/* LADO DIREITO: SELEÇÃO DE RECURSOS E PREVISÃO */}
              <div style={{ flex: 1, padding: '2rem', background: 'rgba(30, 41, 59, 0.4)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-bright)', marginBottom: '1.5rem', fontWeight: 800 }}>Quais recursos deseja investir?</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-bright)', display: 'block', marginBottom: '0.6rem', fontWeight: 'bold' }}>Dinheiro (R$)</label>
                    <NumberSpinner value={invBalance} onChange={setInvBalance} min={0} max={activePlayer?.balance || 0} step={1000} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-bright)', display: 'block', marginBottom: '0.6rem', fontWeight: 'bold' }}>Mercadorias</label>
                    <NumberSpinner value={invGoods} onChange={setInvGoods} min={0} max={activePlayer?.goods || 0} step={1} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-bright)', display: 'block', marginBottom: '0.6rem', fontWeight: 'bold' }}>Clientes</label>
                    <NumberSpinner value={invClients} onChange={setInvClients} min={0} max={activePlayer?.clients || 0} step={1} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-bright)', display: 'block', marginBottom: '0.6rem', fontWeight: 'bold' }}>Funcionários</label>
                    <NumberSpinner value={invEmployees} onChange={setInvEmployees} min={0} max={activePlayer?.employees || 0} step={1} />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-bright)', display: 'block', marginBottom: '0.6rem', fontWeight: 'bold' }}>Pontos (Opcional)</label>
                    <NumberSpinner value={invPoints} onChange={setInvPoints} min={0} max={activePlayer?.points || 0} step={1} />
                  </div>
                </div>

                {/* PAINEL DE PREVISÃO DE LUCROS */}
                <div style={{ marginTop: '2rem', background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-emerald)', marginBottom: '1rem', fontWeight: 800 }}>Previsão de Retorno de Resgate (+50%):</h3>
                  
                  {totalInvested > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '1.05rem' }}>
                      {invBalance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: 'var(--text-muted)'}}>Dinheiro:</span> <strong style={{color: '#10b981'}}>{invBalance.toLocaleString('pt-BR')} ➜ {Math.ceil(invBalance * 1.5).toLocaleString('pt-BR')}</strong></div>}
                      {invGoods > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: 'var(--text-muted)'}}>Mercadorias:</span> <strong style={{color: '#f8fafc'}}>{invGoods} ➜ {Math.ceil(invGoods * 1.5)}</strong></div>}
                      {invClients > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: 'var(--text-muted)'}}>Clientes:</span> <strong style={{color: '#f8fafc'}}>{invClients} ➜ {Math.ceil(invClients * 1.5)}</strong></div>}
                      {invEmployees > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: 'var(--text-muted)'}}>Funcionários:</span> <strong style={{color: '#f8fafc'}}>{invEmployees} ➜ {Math.ceil(invEmployees * 1.5)}</strong></div>}
                      {invPoints > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{color: 'var(--text-muted)'}}>Pontos:</span> <strong style={{color: '#f59e0b'}}>{invPoints} ➜ {Math.ceil(invPoints * 1.5)}</strong></div>}
                    </div>
                  ) : (
                    <div style={{color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', padding: '1rem'}}>
                      Selecione recursos acima para ver a estimativa de lucro.
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          </div>
        );
      })()}

      {/* ---------- OUTRAS TELAS COM O CRONÔMETRO REUTILIZÁVEL ---------- */}
      {activeModal.type === 'CHALLENGE' && (() => {
        const canUseTeam = activePlayer && (activePlayer.employees || 0) >= 3;
        return (
          <div className="modal-overlay">
            <div className="modal-dialog">
              <div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--text-bright)' }}><Briefcase size={22} /></div>
              <div><h3 className="modal-title">Desafio do Narrador</h3><span className="modal-sector-tag">Sabatina para {getPlayerNameSpan(activePlayer)}</span></div></div></div>
              <div className="modal-body">
                {activePlayer && renderPrincipalDashboard(activePlayer)}
                <div className="modal-scenario-box" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>O Narrador ditará a sua pergunta agora! Responda rápido!</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Dica: Você pode poupar tempo e "pular" o desafio se usar 3 funcionários para trabalhar para você (porém, você não ganha os prêmios).</div>
                </div>
                {renderTimer()}
              </div>
              <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
                <button type="button" onClick={() => resolveChallenge(false)} className="btn-reject" style={{ flex: 1, padding: '0.8rem' }}><X size={18} /> Errou (Sofre Pena)</button>
                <button type="button" disabled={!canUseTeam} onClick={() => resolveChallenge(false, true)} className="btn-neutral" style={{ flex: 1, padding: '0.8rem', background: canUseTeam ? 'rgba(56, 189, 248, 0.15)' : 'transparent', color: canUseTeam ? 'var(--text-bright)' : 'var(--text-dim)', border: canUseTeam ? '1px solid var(--primary)' : '1px solid var(--border-subtle)', opacity: canUseTeam ? 1 : 0.4 }} title={canUseTeam ? "Anula o desafio instantaneamente" : "Você precisa de 3 funcionários para isso."}>
                  <Users size={18} /> Usar Equipe (-3 Func.)
                </button>
                <button type="button" onClick={() => resolveChallenge(true)} className="btn-approve" style={{ flex: 1, padding: '0.8rem' }}><Check size={18} /> Acertou!</button>
              </div>
            </div>
          </div>
        );
      })()}

      {activeModal.type === 'FINAL_BOARDROOM' && (
        <div className="modal-overlay">
          <div className="modal-dialog victory-modal">
            <div className="modal-header">
              <div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: '#fbbf24', borderColor: '#fbbf24' }}><Crown size={22} /></div><div><h3 className="modal-title">{FINAL_BOARDROOM_CHALLENGE.title}</h3></div></div>
            </div>
            <div className="modal-body">
              {activePlayer && renderPrincipalDashboard(activePlayer)}
              <div className="modal-scenario-box" style={{ fontSize: '1rem' }}>{FINAL_BOARDROOM_CHALLENGE.scenario}</div>
              {renderTimer()}
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => resolveFinalBoardroom(false)} className="btn-reject" style={{ padding: '1rem' }}><X size={18} /> Recusar (Volta 3 Casas)</button>
              <button type="button" onClick={() => resolveFinalBoardroom(true)} className="btn-approve" style={{ padding: '1rem' }}><Check size={18} /> Aprovar (Garante a Vaga!)</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- OUTRAS TELAS (QUEIMA E INVESTIMENTO RETURN) ---------- */}
      {activeModal.type === 'QUEIMA' && activePlayer && (() => {
        const getBaseValue = (lvl: number) => { if (lvl <= 1) return 250; if (lvl === 2) return 500; if (lvl === 3) return 750; if (lvl === 4) return 1000; return 1500; };
        const baseValue = getBaseValue(activePlayer.level || 1);
        const clientMultiplier = 0.4 * (activePlayer.clients || 0); const employeeMultiplier = 0.2 * (activePlayer.employees || 0);
        const amountReceived = Math.floor((queimaGoods * baseValue) * clientMultiplier * employeeMultiplier); 
        
        return (
          <div className="modal-overlay"><div className="modal-dialog" style={{ maxWidth: '520px' }}><div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: '#ea580c', borderColor: '#ea580c' }}><Flame size={22} /></div><div><h3 className="modal-title">{activeModal.tile?.title || 'Liquidação'}</h3><span className="modal-sector-tag">Ação Comercial para {getPlayerNameSpan(activePlayer)}</span></div></div></div><div className="modal-body">{renderPrincipalDashboard(activePlayer)}<div className="modal-scenario-box" style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '1rem' }}>Deixe seus Clientes e Funcionários multiplicarem as vendas da liquidação!<br/><br/>Valor Unitário Base (Nv. {activePlayer.level || 1}): <strong>R$ {baseValue.toLocaleString('pt-BR')}</strong>.</div><div style={{ background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.3)', padding: '1rem', borderRadius: '10px' }}><div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-bright)', fontWeight: 800, marginBottom: '0.5rem' }}>Quantas mercadorias deseja liquidar?</label>
          
          <NumberSpinner value={queimaGoods} onChange={setQueimaGoods} min={0} max={activePlayer.goods || 0} step={1} placeholder="Qtd." />
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button type="button" className="secondary-btn" style={{ flex: 1 }} onClick={() => setQueimaGoods(Math.floor((activePlayer.goods || 0) / 2))}>Metade</button>
            <button type="button" className="secondary-btn" style={{ flex: 1 }} onClick={() => setQueimaGoods(activePlayer.goods || 0)}>Tudo</button>
          </div>
          
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>Estoque disponível: <strong>{activePlayer.goods || 0} mercadorias</strong></div></div><div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-glow)' }}><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Fórmula: ({queimaGoods} × R$ {baseValue}) × ({(activePlayer.clients || 0)} cli. × 40%) × ({(activePlayer.employees || 0)} func. × 20%)</div><div style={{ fontSize: '1.5rem', fontWeight: 900, color: amountReceived > 0 ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>LUCRO TOTAL: R$ {amountReceived.toLocaleString('pt-BR')}</div>{((activePlayer.clients || 0) === 0 || (activePlayer.employees || 0) === 0) && (<div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 'bold' }}>⚠️ Falta clientes ou funcionários! O multiplicador zerou.</div>)}</div></div></div><div className="modal-footer"><button type="button" onClick={() => resolveQueima(0, 0)} className="btn-reject"><X size={18} /> Cancelar / Pular</button><button type="button" disabled={queimaGoods === 0 || queimaGoods > (activePlayer.goods || 0) || (activePlayer.clients || 0) === 0 || (activePlayer.employees || 0) === 0} onClick={() => resolveQueima(queimaGoods, amountReceived)} className="btn-approve" style={{ opacity: (queimaGoods > 0 && (activePlayer.clients || 0) > 0 && (activePlayer.employees || 0) > 0) ? 1 : 0.4 }}><Check size={18} /> Confirmar Venda</button></div></div></div>
        );
      })()}

      {activeModal.type === 'INVESTMENT_RETURN' && activeModal.investment && (() => {
        const inv = activeModal.investment; const isReady = activePlayer && (activePlayer.lapsCompleted || 0) > inv.lapInvested;
        return (
          <div className="modal-overlay"><div className="modal-dialog" style={{ border: '2px solid var(--accent-emerald)', boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' }}><div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}><DollarSign size={22} /></div><div><h3 className="modal-title">Retorno de Investimento!</h3><span className="modal-sector-tag">Casa #{inv.tileIndex} Ativada!</span></div></div></div><div className="modal-body">{activePlayer && renderPrincipalDashboard(activePlayer)}<div className="modal-scenario-box" style={{ fontSize: '1rem', textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.4)' }}>Sua aposta na Casa #{inv.tileIndex} gerou <strong>+50% de lucro líquido</strong> sobre cada recurso investido!</div><div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-glow)' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.95rem' }}>{inv.resources.balance > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}><span>R$:</span> <strong>{inv.resources.balance} ➜ {Math.ceil(inv.resources.balance * 1.5)}</strong></div>}{inv.resources.goods > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f8fafc' }}><span>Mercadorias:</span> <strong>{inv.resources.goods} ➜ {Math.ceil(inv.resources.goods * 1.5)}</strong></div>}{inv.resources.clients > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f8fafc' }}><span>Clientes:</span> <strong>{inv.resources.clients} ➜ {Math.ceil(inv.resources.clients * 1.5)}</strong></div>}{inv.resources.employees > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f8fafc' }}><span>Funcionários:</span> <strong>{inv.resources.employees} ➜ {Math.ceil(inv.resources.employees * 1.5)}</strong></div>}{inv.resources.points > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}><span>Pontos:</span> <strong>{inv.resources.points} ➜ {Math.ceil(inv.resources.points * 1.5)}</strong></div>}</div></div>{!isReady && <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Você investiu nesta rodada, ele começará a render a partir da próxima volta.</div>}</div><div className="modal-footer"><button type="button" onClick={resolveInvestmentReturn} className="btn-approve" style={{ width: '100%' }}><Check size={18} /> Resgatar Todos os Lucros</button></div></div></div>
        );
      })()}

      {/* ---------- OUTRAS MODAIS GERAIS ---------- */}
      {activeModal.type === 'CRISIS' && (() => {
        const canCancel = activePlayer && (activePlayer.points || 0) >= 5; const isSingleCrisis = activeModal.tile?.type === 'Auditoria';
        const effectsList = activeModal.tile?.effects?.map((e: any) => { const amount = e.amount < 0 ? e.amount.toString().replace('-', '') : e.amount; return `- ${e.type === 'balance' && amount >= 1000 ? `${(amount/1000).toFixed(1)}k` : amount} ${RES_LABELS[e.type]}`; }).join(' e ') || '-R$ 15.000';
        return (
          <div className="modal-overlay"><div className="modal-dialog crisis-modal"><div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}><AlertTriangle size={22} /></div><div><h3 className="modal-title">{activeModal.tile?.title}</h3><span className="modal-sector-tag">Prejuízo para {getPlayerNameSpan(activePlayer)}</span></div></div></div><div className="modal-body">{activePlayer && renderPrincipalDashboard(activePlayer)}<div className="modal-scenario-box" style={{ fontSize: '1rem' }}>{activeModal.tile?.description}</div><div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '1rem', borderRadius: '10px', textAlign: 'center', marginBottom: '1rem' }}><div style={{ fontWeight: 800, color: 'var(--accent-rose)', fontSize: '1.2rem' }}>{isSingleCrisis ? 'Perda Calculada (30%):' : 'Penalidade Dupla:'}</div><div style={{ fontSize: '1.1rem', color: 'var(--text-bright)', fontWeight: 700, marginTop: '0.4rem' }}>{effectsList}</div></div><div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--border-glow)', padding: '0.85rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}><div style={{ fontSize: '0.9rem', color: 'var(--accent-gold)' }}>🛡️ Gaste 5 Pontos para anular o dano.</div><span style={{ fontWeight: 800, fontSize: '0.9rem', color: canCancel ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>Seus Pontos: {activePlayer?.points ?? 0}</span></div></div><div className="modal-footer"><button type="button" onClick={() => resolveCrisis(false)} className="btn-neutral">Absorver Crise</button><button type="button" onClick={() => resolveCrisis(true)} disabled={!canCancel} className="btn-approve" style={{ opacity: canCancel ? 1 : 0.4 }}><ShieldCheck size={18} /> Usar 5 Pontos</button></div></div></div>
        );
      })()}

      {activeModal.type === 'OPPORTUNITY' && (() => {
        const t = activeModal.tile?.trade as any; const canAfford = activePlayer && (activePlayer[t.giveType as keyof Player] as number) >= t.giveAmount;
        return (
          <div className="modal-overlay"><div className="modal-dialog"><div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}><TrendingUp size={22} /></div><div><h3 className="modal-title">{activeModal.tile?.title}</h3><span className="modal-sector-tag">Oferta Especial para {getPlayerNameSpan(activePlayer)}</span></div></div></div><div className="modal-body">{activePlayer && renderPrincipalDashboard(activePlayer)}<div className="modal-scenario-box" style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800 }}>{activeModal.tile?.description}</div></div><div className="modal-footer"><button type="button" onClick={() => resolveOpportunity(false)} className="btn-reject"><X size={18} /> Recusar Oferta</button><button type="button" disabled={!canAfford} onClick={() => resolveOpportunity(true)} className="btn-approve" style={{ opacity: canAfford ? 1 : 0.4 }}><Check size={18} /> Aceitar Troca</button></div></div></div>
        );
      })()}

      {activeModal.type === 'TILE_INFO' && (() => {
        const isCrescimento = activeModal.tile?.type === 'Crescimento' && activeModal.tile?.effects;
        return (
          <div className="modal-overlay"><div className="modal-dialog"><div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--text-bright)' }}><TrendingUp size={22} /></div><div><h3 className="modal-title">{activeModal.tile?.title}</h3><span className="modal-sector-tag">{getPlayerNameSpan(activePlayer)} na casa</span></div></div></div><div className="modal-body">{activePlayer && renderPrincipalDashboard(activePlayer)}<div className="modal-scenario-box" style={{ textAlign: 'center', fontSize: '1rem' }}>{activeModal.tile?.description}</div>{isCrescimento && (<div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '1.25rem', borderRadius: '8px', marginTop: '1rem', textAlign: 'center' }}><span style={{ display: 'block', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '0.6rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Bônus Conquistado:</span><div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontWeight: 800, color: 'var(--text-bright)', fontSize: '1.2rem' }}>{activeModal.tile?.effects?.map((e: any, i: number) => (<span key={i}>+{e.amount} {RES_LABELS[e.type]}</span>))}</div></div>)}</div><div className="modal-footer"><button type="button" onClick={closeModal} className="btn-approve"><Check size={18} /> Concluir e Passar Turno</button></div></div></div>
        );
      })()}

      {activeModal.type === 'INSPECT_TILE' && (() => {
        const tile = activeModal.tile; const tilePlayers = activeModal.tilePlayers || [];
        return (
          <div className="modal-overlay"><div className="modal-dialog" style={{ maxWidth: '620px' }}><div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble"><Users size={22} /></div><div><h3 className="modal-title">Casa #{tile?.index}: {tile?.title}</h3><span className="modal-sector-tag">{tilePlayers.length} Executivos Presentes</span></div></div><button type="button" onClick={closeModal} className="pill-remove-btn" style={{ fontSize: '1.2rem' }}><X size={20} /></button></div><div className="modal-body"><div style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{tile?.description}</div><div style={{ marginTop: '1.5rem' }}><h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>Executivos Posicionados:</h4>{tilePlayers.length === 0 ? (<div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-dim)' }}>Nenhum executivo posicionado nesta casa.</div>) : (<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>{tilePlayers.map(p => (<div key={p.id} onClick={() => setInspectedPlayer(inspectedPlayer?.id === p.id ? null : p)} style={{ padding: '0.85rem', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: p.color }} /><span style={{ fontWeight: 800, fontSize: '1.05rem', color: p.bankruptcy?.inRecovery ? '#ef4444' : 'inherit' }}>{p.name} {p.bankruptcy?.inRecovery && '💀'}</span><span className="badge-tag level" style={{ fontSize: '0.8rem' }}>Nível {p.level || 1}</span></div><span style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontSize: '1rem' }}>R$ {(p.balance || 0).toLocaleString('pt-BR')}</span></div>{inspectedPlayer?.id === p.id && (<div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '0.85rem' }}><div>Mercadorias: <strong>{p.goods || 0}</strong></div><div>Funcionários: <strong>{p.employees || 0}</strong></div><div>Pontos: <strong>{p.points || 0}</strong></div><div>Clientes: <strong>{p.clients || 0}</strong></div>{p.hasActiveInvestment && <div style={{ gridColumn: 'span 4', color: 'var(--accent-gold)', fontWeight: 700, marginTop: '6px' }}>📈 Investimento Ativo na Empresa</div>}</div>)}</div>))}</div>)}</div></div><div className="modal-footer"><button type="button" onClick={closeModal} className="btn-neutral">Fechar Inspeção</button></div></div></div>
        );
      })()}
    </>
  );
};