import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { FINAL_BOARDROOM_CHALLENGE } from '../../data/challenges';
import { 
  Trophy, AlertTriangle, TrendingUp, DollarSign, Users, Check, X, Clock, Crown, ShieldCheck, Briefcase, RotateCcw, Handshake, Gavel, Package, Award, Flame, RefreshCw, LogOut 
} from 'lucide-react';
import type { Player } from '../../types/game';

const RES_LABELS: any = { balance: 'R$', goods: 'Merc.', clients: 'Clientes', employees: 'Funcionários', points: 'Pontos' };

export const GameModals: React.FC = () => {
  const { 
    activeModal, closeModal, resolveChallenge, resolveCrisis, resolveInvestment, 
    resolveFinalBoardroom, resolveNegotiation, resolveAllianceModal, resolveOpportunity, resolveQueima,
    activePlayer, players, winner, restartGame, ranking, confirmShuffleBoard, confirmQuitGame
  } = useGame();

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

  useEffect(() => {
    if (activeModal.type === 'CHALLENGE' || activeModal.type === 'ALLIANCE') { setTimerSeconds(30); setIsTimerRunning(activeModal.type === 'ALLIANCE'); }
    else if (activeModal.type === 'FINAL_BOARDROOM' || activeModal.type === 'NEGOTIATION') { setTimerSeconds(60); setIsTimerRunning(true); }
    else setIsTimerRunning(false);

    setTradePartnerId(''); setGiveAmount(0); setReceiveAmount(0); setAlliancePartnerId(''); setAllianceDuration(3); setInspectedPlayer(null);
    setQueimaGoods(0);
  }, [activeModal.type, activeModal.card]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerSeconds > 0) interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    else if (timerSeconds === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!activeModal.type && !winner) return null;

  const getPlayerNameSpan = (player: Player | null) => {
    if (!player) return null;
    return (
      <span style={{ color: player.bankruptcy.inRecovery ? '#ef4444' : 'inherit', fontWeight: 'bold' }}>
        {player.name} {player.bankruptcy.inRecovery && '(Falido)'}
      </span>
    );
  };

  const renderPrincipalDashboard = (player: Player) => (
    <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '0.6rem', borderRadius: '8px', border: `1px solid ${player.color}50`, marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.7rem', color: player.bankruptcy.inRecovery ? '#ef4444' : player.color, fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        Seus Recursos: {player.name} {player.bankruptcy.inRecovery ? '(RECUPERAÇÃO)' : ''} (Nv. {player.level})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', textAlign: 'center', fontSize: '0.75rem' }}>
        <div title="Saldo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><DollarSign size={16} color="#10b981" /><span style={{ fontWeight: 700, marginTop: '2px' }}>{player.balance >= 1000 ? `${(player.balance/1000).toFixed(1)}k` : player.balance}</span></div>
        <div title="Mercadorias" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Package size={16} color="#f8fafc" /><span style={{ fontWeight: 700, marginTop: '2px' }}>{player.goods}</span></div>
        <div title="Clientes" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Users size={16} color="#f8fafc" /><span style={{ fontWeight: 700, marginTop: '2px' }}>{player.clients}</span></div>
        <div title="Funcionários" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Briefcase size={16} color="#f8fafc" /><span style={{ fontWeight: 700, marginTop: '2px' }}>{player.employees}</span></div>
        <div title="Pontos" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Award size={16} color="#f59e0b" /><span style={{ fontWeight: 700, marginTop: '2px' }}>{player.points}</span></div>
      </div>
    </div>
  );

  const renderSelectablePlayerCard = (player: Player, isSelected: boolean, onSelect: () => void) => (
    <div key={player.id} onClick={onSelect} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 41, 59, 0.6)', border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-subtle)'}`, padding: '0.75rem', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: player.color }} />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: player.bankruptcy.inRecovery ? '#ef4444' : 'var(--text-bright)' }}>
            {player.name} {player.hasActiveInvestment && <span title="Possui Investimento Ativo" style={{ fontSize: '0.7rem' }}>📈</span>}
          </span>
          <span style={{ fontSize: '0.7rem', padding: '2px 6px', backgroundColor: `${player.color}25`, borderRadius: '4px', color: 'var(--accent-gold)' }}>Nv. {player.level}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span title="Saldo" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><DollarSign size={12} color="#10b981"/> {player.balance >= 1000 ? `${(player.balance/1000).toFixed(1)}k` : player.balance}</span>
          <span title="Mercadorias" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Package size={12} color="#f8fafc"/> {player.goods}</span>
          <span title="Clientes" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Users size={12} color="#f8fafc"/> {player.clients}</span>
          <span title="Funcionários" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Briefcase size={12} color="#f8fafc"/> {player.employees}</span>
          <span title="Pontos" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Award size={12} color="#f59e0b"/> {player.points}</span>
        </div>
      </div>
      <div style={{ paddingLeft: '1rem' }}><button type="button" onClick={(e) => { e.stopPropagation(); onSelect(); }} style={{ padding: '0.5rem 0.8rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px', border: 'none', backgroundColor: isSelected ? 'var(--primary)' : 'rgba(15, 23, 42, 0.8)', color: isSelected ? '#ffffff' : 'var(--text-muted)', cursor: 'pointer', minWidth: '110px' }}>{isSelected ? '✓ Selecionado' : 'Selecionar'}</button></div>
    </div>
  );

  if (activeModal.type === 'CONFIRM_SHUFFLE') {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ maxWidth: '420px' }}>
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-icon-bubble" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}><RefreshCw size={22} /></div>
              <div><h3 className="modal-title">Embaralhar Tabuleiro?</h3></div>
            </div>
          </div>
          <div className="modal-body" style={{ textAlign: 'center', color: 'var(--text-bright)' }}>
            As cartas de bônus, crises e oportunidades serão misturadas aleatoriamente pelo tabuleiro.<br/><br/>
            <strong>Os executivos continuarão exatamente onde estão.</strong> Deseja confirmar?
          </div>
          <div className="modal-footer">
            <button type="button" onClick={closeModal} className="btn-reject"><X size={18} /> Cancelar</button>
            <button type="button" onClick={confirmShuffleBoard} className="btn-approve"><RefreshCw size={18} /> Embaralhar</button>
          </div>
        </div>
      </div>
    );
  }

  if (activeModal.type === 'CONFIRM_QUIT') {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ maxWidth: '420px', border: '1px solid rgba(244, 63, 94, 0.5)' }}>
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-icon-bubble" style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)', background: 'rgba(244, 63, 94, 0.1)' }}><LogOut size={22} /></div>
              <div><h3 className="modal-title">Abandonar Partida?</h3></div>
            </div>
          </div>
          <div className="modal-body" style={{ textAlign: 'center', color: 'var(--text-bright)' }}>
            Você está prestes a encerrar a partida em andamento.<br/><br/>
            <span style={{ color: 'var(--accent-rose)', fontWeight: 'bold' }}>Todo o progresso será perdido.</span> Tem certeza disso?
          </div>
          <div className="modal-footer">
            <button type="button" onClick={closeModal} className="btn-neutral">Continuar Jogando</button>
            <button type="button" onClick={confirmQuitGame} className="btn-reject"><LogOut size={18} /> Sim, Encerrar</button>
          </div>
        </div>
      </div>
    );
  }

  if (winner || activeModal.type === 'GAME_OVER') {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog victory-modal" style={{ maxWidth: '640px' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.8))' }}>
            <div className="modal-title-group"><div className="modal-icon-bubble" style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b', color: '#f59e0b' }}><Crown size={24} /></div>
              <div><h3 className="modal-title" style={{ color: '#fbbf24' }}>CORRIDA ENCERRADA!</h3></div>
            </div>
          </div>
          <div className="modal-body" style={{ textAlign: 'center' }}>
            <Trophy size={64} color="#fbbf24" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff' }}>{winner?.name || ranking[0]?.name}</h2>
            <div style={{ marginTop: '1.5rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
              {ranking.map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: idx === 0 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(30, 41, 59, 0.7)', borderRadius: '8px', border: `1px solid ${idx === 0 ? '#f59e0b' : 'var(--border-subtle)'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 900, fontSize: '1.1rem', color: idx === 0 ? '#f59e0b' : 'var(--text-dim)' }}>#{idx + 1}</div>
                    <div><div style={{ fontWeight: 700, color: p.bankruptcy.inRecovery ? '#ef4444' : p.color, fontSize: '0.95rem' }}>{p.name} {p.bankruptcy.inRecovery && '💀'}</div></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center', fontSize: '0.75rem' }}>
                    <div><span style={{ display: 'block', color: 'var(--text-muted)' }}>Caixa</span><span style={{ fontWeight: 700, color: '#10b981' }}>{p.balance}</span></div>
                    <div><span style={{ display: 'block', color: 'var(--text-muted)' }}>Merc.</span><span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.goods}</span></div>
                    <div><span style={{ display: 'block', color: 'var(--text-muted)' }}>Cli.</span><span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.clients}</span></div>
                    <div><span style={{ display: 'block', color: 'var(--text-muted)' }}>Func.</span><span style={{ fontWeight: 700, color: '#f8fafc' }}>{p.employees}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer" style={{ justifyContent: 'center' }}><button type="button" onClick={restartGame} className="btn-approve" style={{ padding: '0.85rem 2rem' }}><RotateCcw size={18} /> Nova Temporada</button></div>
        </div>
      </div>
    );
  }

  // ATUALIZADO: Liquidação de Estoque (Fórmula Multiplicada por Clientes)
  if (activeModal.type === 'QUEIMA' && activePlayer) {
    const getBaseValue = (lvl: number) => {
      if (lvl <= 1) return 250; if (lvl === 2) return 500; if (lvl === 3) return 750; if (lvl === 4) return 1000; return 1500;
    };
    
    const baseValue = getBaseValue(activePlayer.level);
    const clientMultiplier = 0.4 * activePlayer.clients; // Cada cliente equivale a 40% (0.4)
    
    // Fórmula final exigida: (Qtd Vendida * Valor Base) * (0.4 * Total de Clientes)
    // Math.floor para evitar números quebrados como "R$ 10.50"
    const amountReceived = Math.floor((queimaGoods * baseValue) * clientMultiplier); 
    
    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ maxWidth: '480px' }}>
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-icon-bubble" style={{ color: '#ea580c', borderColor: '#ea580c' }}><Flame size={22} /></div>
              <div><h3 className="modal-title">{activeModal.tile?.title || 'Liquidação'}</h3><span className="modal-sector-tag">Ação Comercial para {getPlayerNameSpan(activePlayer)}</span></div>
            </div>
          </div>
          <div className="modal-body">
            {renderPrincipalDashboard(activePlayer)}
            <div className="modal-scenario-box" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              Venda suas Mercadorias pelo preço Base e deixe sua Base de Clientes multiplicar os lucros!<br/><br/>
              Valor Unitário Base (Nv. {activePlayer.level}): <strong>R$ {baseValue.toLocaleString('pt-BR')}</strong>.
            </div>

            <div style={{ background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.3)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-bright)', fontWeight: 800, marginBottom: '0.4rem' }}>
                  Quantas mercadorias deseja liquidar?
                </label>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input 
                    type="number" 
                    min="0" 
                    max={activePlayer.goods} 
                    value={queimaGoods || ''} 
                    onChange={(e) => setQueimaGoods(Math.min(activePlayer.goods, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="text-input"
                    style={{ flex: 1, fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold', color: '#ea580c' }}
                    placeholder="Qtd."
                  />
                  <button type="button" className="secondary-btn" onClick={() => setQueimaGoods(Math.floor(activePlayer.goods / 2))}>Metade</button>
                  <button type="button" className="secondary-btn" onClick={() => setQueimaGoods(activePlayer.goods)}>Tudo</button>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Estoque disponível: <strong>{activePlayer.goods} mercadorias</strong>
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-glow)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                  Fórmula: ({queimaGoods} × R$ {baseValue}) × ({activePlayer.clients} clientes × 40%)
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: amountReceived > 0 ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>
                  VOCÊ RECEBE: R$ {amountReceived.toLocaleString('pt-BR')}
                </div>
                {activePlayer.clients === 0 && (
                  <div style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', marginTop: '0.5rem', fontWeight: 'bold' }}>
                    ⚠️ Você tem 0 clientes! Multiplicador zerado.
                  </div>
                )}
              </div>

            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => resolveQueima(0, 0)} className="btn-reject"><X size={18} /> Cancelar / Pular</button>
            <button type="button" disabled={queimaGoods === 0 || queimaGoods > activePlayer.goods || activePlayer.clients === 0} onClick={() => resolveQueima(queimaGoods, amountReceived)} className="btn-approve" style={{ opacity: (queimaGoods > 0 && activePlayer.clients > 0) ? 1 : 0.4 }}><Check size={18} /> Confirmar Venda</button>
          </div>
        </div>
      </div>
    );
  }

  if (activeModal.type === 'FINAL_BOARDROOM') {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog victory-modal">
          <div className="modal-header">
            <div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: '#fbbf24', borderColor: '#fbbf24' }}><Crown size={22} /></div><div><h3 className="modal-title">{FINAL_BOARDROOM_CHALLENGE.title}</h3></div></div>
          </div>
          <div className="modal-body">
            <div className="modal-scenario-box">{FINAL_BOARDROOM_CHALLENGE.scenario}</div>
            <div className="modal-timer-badge"><Clock size={24} /><span>{timerSeconds}s</span><button type="button" onClick={() => setIsTimerRunning(!isTimerRunning)} className="secondary-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>{isTimerRunning ? 'Pausar' : 'Iniciar'}</button></div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => resolveFinalBoardroom(false)} className="btn-reject"><X size={18} /> Recusar (Volta 3 Casas)</button>
            <button type="button" onClick={() => resolveFinalBoardroom(true)} className="btn-approve"><Check size={18} /> Aprovar (Garante a Vaga!)</button>
          </div>
        </div>
      </div>
    );
  }

  if (activeModal.type === 'OPPORTUNITY' && activeModal.tile?.trade) {
    const t = activeModal.tile.trade as any;
    const canAfford = activePlayer && (activePlayer[t.giveType as keyof Player] as number) >= t.giveAmount;
    return (
      <div className="modal-overlay">
        <div className="modal-dialog">
          <div className="modal-header">
            <div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}><TrendingUp size={22} /></div>
              <div><h3 className="modal-title">{activeModal.tile.title}</h3><span className="modal-sector-tag">Oferta Especial para {getPlayerNameSpan(activePlayer)}</span></div>
            </div>
          </div>
          <div className="modal-body">
            {activePlayer && renderPrincipalDashboard(activePlayer)}
            <div className="modal-scenario-box" style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 800 }}>
              {activeModal.tile.description}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={() => resolveOpportunity(false)} className="btn-reject"><X size={18} /> Recusar Oferta</button>
            <button type="button" disabled={!canAfford} onClick={() => resolveOpportunity(true)} className="btn-approve" style={{ opacity: canAfford ? 1 : 0.4 }}><Check size={18} /> Aceitar Troca</button>
          </div>
        </div>
      </div>
    );
  }

  if (activeModal.type === 'NEGOTIATION') {
    const eligiblePartners = players.filter(p => p.id !== activePlayer?.id && !p.isEliminated && !p.hasWon);
    const isTradeValid = tradePartnerId !== '' && giveAmount > 0 && receiveAmount > 0;
    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ maxWidth: '680px' }}>
          <div className="modal-header">
            <div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--accent-purple)', borderColor: 'var(--accent-purple)' }}><Gavel size={22} /></div>
            <div><h3 className="modal-title">Licitação</h3><span className="modal-sector-tag">{getPlayerNameSpan(activePlayer)} é o Principal</span></div></div>
          </div>
          <div className="modal-body">
            {activePlayer && renderPrincipalDashboard(activePlayer)}
            <div className="modal-timer-badge" style={{ justifyContent: 'center', marginBottom: '0.75rem', padding: '0.4rem' }}>
              <Clock size={20} color={timerSeconds <= 10 ? 'var(--accent-rose)' : 'var(--text-bright)'} /><span style={{ fontSize: '1.2rem', color: timerSeconds <= 10 ? 'var(--accent-rose)' : 'var(--text-bright)' }}>{timerSeconds}s</span><button type="button" onClick={() => setIsTimerRunning(!isTimerRunning)} className="secondary-btn" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', marginLeft: '10px' }}>{isTimerRunning ? 'Pausar' : 'Iniciar'}</button>
            </div>
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-glow)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', maxHeight: '180px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                {eligiblePartners.length === 0 ? <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', padding: '1rem' }}>Nenhum executivo livre para negociar.</div> : eligiblePartners.map(p => renderSelectablePlayerCard(p, tradePartnerId === p.id, () => setTradePartnerId(p.id)))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(244, 63, 94, 0.2)' }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-rose)', marginBottom: '0.5rem' }}>🔴 VOCÊ DÁ (Sai de Você):</span><input type="number" min="0" value={giveAmount || ''} onChange={e => setGiveAmount(parseInt(e.target.value) || 0)} placeholder="Qtd" className="text-input" style={{ width: '100%', marginBottom: '0.4rem' }} /><select value={giveType} onChange={e => setGiveType(e.target.value)} className="text-input" style={{ width: '100%' }}><option value="balance">Saldo (R$)</option><option value="goods">Mercadorias</option><option value="clients">Clientes</option><option value="employees">Funcionários</option><option value="points">Pontos</option></select></div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}><span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '0.5rem' }}>🟢 VOCÊ RECEBE (Vem pra Você):</span><input type="number" min="0" value={receiveAmount || ''} onChange={e => setReceiveAmount(parseInt(e.target.value) || 0)} placeholder="Qtd" className="text-input" style={{ width: '100%', marginBottom: '0.4rem' }} /><select value={receiveType} onChange={e => setReceiveType(e.target.value)} className="text-input" style={{ width: '100%' }}><option value="balance">Saldo (R$)</option><option value="goods">Mercadorias</option><option value="clients">Clientes</option><option value="employees">Funcionários</option><option value="points">Pontos</option></select></div>
              </div>
            </div>
          </div>
          <div className="modal-footer"><button type="button" onClick={() => resolveNegotiation(null)} className="btn-reject" style={{ flex: 1 }}>Passar / Sem Acordo</button><button type="button" disabled={!isTradeValid} onClick={() => resolveNegotiation({ partnerId: tradePartnerId, giveType, giveAmount, receiveType, receiveAmount })} className="btn-approve" style={{ flex: 1, opacity: isTradeValid ? 1 : 0.4 }}><Check size={18} /> Confirmar Troca</button></div>
        </div>
      </div>
    );
  }

  if (activeModal.type === 'ALLIANCE') {
    const eligiblePartners = players.filter(p => p.id !== activePlayer?.id && !p.isEliminated && !p.hasWon && !p.alliance);
    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ maxWidth: '680px' }}>
          <div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--accent-purple)' }}><Handshake size={22} /></div>
          <div><h3 className="modal-title">Aliança Estratégica</h3><span className="modal-sector-tag">Convite de {getPlayerNameSpan(activePlayer)}</span></div></div></div>
          <div className="modal-body">
            {activePlayer && renderPrincipalDashboard(activePlayer)}
            <div className="modal-scenario-box" style={{ textAlign: 'center', padding: '0.5rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>Uma união estratégica divide lucros/prejuízos pela metade e soma o nível das empresas! <strong>Tempo: 30s</strong>.</div>
            <div className="modal-timer-badge" style={{ justifyContent: 'center', marginBottom: '0.75rem', padding: '0.4rem' }}><Clock size={20} /><span style={{ fontSize: '1.2rem' }}>{timerSeconds}s</span></div>
            <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-glow)', padding: '1rem', borderRadius: '10px' }}>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 700 }}>Escolha a Empresa para Fundir Aliança:</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', maxHeight: '180px', overflowY: 'auto' }}>
                {eligiblePartners.length === 0 ? <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', padding: '1rem' }}>Nenhum executivo livre para aliança.</div> : eligiblePartners.map(p => renderSelectablePlayerCard(p, alliancePartnerId === p.id, () => setAlliancePartnerId(p.id)))}
              </div>
              <div><label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duração do Contrato (Rodadas):</label><input type="number" min="1" max="10" value={allianceDuration} onChange={e => setAllianceDuration(parseInt(e.target.value) || 1)} className="text-input" style={{ width: '100%', height: '40px' }} /></div>
            </div>
          </div>
          <div className="modal-footer"><button type="button" onClick={() => resolveAllianceModal(null)} className="btn-reject" style={{ flex: 1 }}>Passar / Jogar Sozinho</button><button type="button" disabled={!alliancePartnerId} onClick={() => resolveAllianceModal(alliancePartnerId, allianceDuration)} className="btn-approve" style={{ flex: 1, opacity: alliancePartnerId ? 1 : 0.4 }}><Handshake size={18} /> Firmar Aliança</button></div>
        </div>
      </div>
    );
  }

  if (activeModal.type === 'CHALLENGE') {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog">
          <div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--text-bright)' }}><Briefcase size={22} /></div>
          <div><h3 className="modal-title">Desafio do Narrador</h3><span className="modal-sector-tag">Sabatina para {getPlayerNameSpan(activePlayer)}</span></div></div></div>
          <div className="modal-body">
            <div className="modal-scenario-box" style={{ textAlign: 'center' }}><div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>O Narrador ditará a sua pergunta agora! Responda rápido!</div></div>
            <div className="modal-timer-badge" style={{ justifyContent: 'center' }}><Clock size={28} color={timerSeconds <= 10 ? 'var(--accent-rose)' : 'var(--accent-emerald)'} /><span style={{ fontSize: '1.5rem', color: timerSeconds <= 10 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>{timerSeconds}s</span><button type="button" onClick={() => setIsTimerRunning(!isTimerRunning)} className="secondary-btn" style={{ marginLeft: '10px' }}>{isTimerRunning ? 'Pausar' : 'Iniciar'}</button></div>
          </div>
          <div className="modal-footer"><button type="button" onClick={() => resolveChallenge(false)} className="btn-reject"><X size={18} /> Recusar / Errou</button><button type="button" onClick={() => resolveChallenge(true)} className="btn-approve"><Check size={18} /> Acertou a Resposta!</button></div>
        </div>
      </div>
    );
  }

  if (activeModal.type === 'CRISIS') {
    const canCancel = activePlayer && activePlayer.points >= 5;
    const isSingleCrisis = activeModal.tile?.type === 'Auditoria';
    
    const effectsList = activeModal.tile?.effects?.map((e: any) => {
      const amount = e.amount < 0 ? e.amount.toString().replace('-', '') : e.amount;
      return `- ${e.type === 'balance' && amount >= 1000 ? `${(amount/1000).toFixed(1)}k` : amount} ${RES_LABELS[e.type]}`;
    }).join(' e ') || '-R$ 15.000';

    return (
      <div className="modal-overlay">
        <div className="modal-dialog crisis-modal">
          <div className="modal-header">
            <div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}><AlertTriangle size={22} /></div>
            <div><h3 className="modal-title">{activeModal.tile?.title}</h3><span className="modal-sector-tag">Prejuízo para {getPlayerNameSpan(activePlayer)}</span></div></div>
          </div>
          <div className="modal-body">
            <div className="modal-scenario-box">{activeModal.tile?.description}</div>
            
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '1rem', borderRadius: '10px', textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--accent-rose)', fontSize: '1.2rem' }}>
                {isSingleCrisis ? 'Perda Calculada (30%):' : 'Penalidade Dupla:'}
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--text-bright)', fontWeight: 700 }}>{effectsList}</div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--border-glow)', padding: '0.85rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>🛡️ Gaste 5 Pontos para anular o dano.</div>
              <span style={{ fontWeight: 800, color: canCancel ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>Seus Pontos: {activePlayer?.points ?? 0}</span>
            </div>
          </div>
          <div className="modal-footer"><button type="button" onClick={() => resolveCrisis(false)} className="btn-neutral">Absorver Crise</button><button type="button" onClick={() => resolveCrisis(true)} disabled={!canCancel} className="btn-approve" style={{ opacity: canCancel ? 1 : 0.4 }}><ShieldCheck size={18} /> Usar 5 Pontos</button></div>
        </div>
      </div>
    );
  }

  if (activeModal.type === 'INVESTMENT') {
    const reqLevel = activeModal.tile?.requiredLevel || 1;
    let effectiveLevel = activePlayer?.level ?? 0;
    if (activePlayer?.alliance) effectiveLevel += 1;
    
    const hasRequiredLevel = effectiveLevel >= reqLevel;
    const hasBalance = (activePlayer?.balance ?? 0) >= 30000;
    const canInvest = hasRequiredLevel && hasBalance;

    return (
      <div className="modal-overlay">
        <div className="modal-dialog">
          <div className="modal-header">
            <div className="modal-title-group"><div className="modal-icon-bubble"><DollarSign size={22} /></div>
            <div><h3 className="modal-title">{activeModal.tile?.title}</h3><span className="modal-sector-tag">Aporte para {getPlayerNameSpan(activePlayer)} (Req. Nv {reqLevel})</span></div></div>
          </div>
          <div className="modal-body">
            <div className="modal-scenario-box">{activeModal.tile?.description}</div>
            
            {!hasRequiredLevel && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginTop: '1rem', textAlign: 'center', fontWeight: 'bold' }}>⚠️ Bloqueado: Exige Nível {reqLevel} (Seu Nível é {effectiveLevel}).</div>}
            {!hasBalance && <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', marginTop: '0.5rem', textAlign: 'center', fontWeight: 'bold' }}>⚠️ Bloqueado: Saldo Insuficiente (Requer R$ 50.000).</div>}
            
          </div>
          <div className="modal-footer"><button type="button" onClick={() => resolveInvestment(false)} className="btn-neutral">Recusar Aporte</button><button type="button" onClick={() => resolveInvestment(true)} disabled={!canInvest} className="btn-approve" style={{ opacity: canInvest ? 1 : 0.4 }}><Check size={18} /> Investir (R$ 50.000)</button></div>
        </div>
      </div>
    );
  }

  if (activeModal.type === 'INSPECT_TILE') {
    const tile = activeModal.tile;
    const tilePlayers = activeModal.tilePlayers || [];

    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ maxWidth: '620px' }}>
          <div className="modal-header">
            <div className="modal-title-group"><div className="modal-icon-bubble"><Users size={22} /></div><div><h3 className="modal-title">Casa #{tile?.index}: {tile?.title}</h3><span className="modal-sector-tag">{tilePlayers.length} Executivos Presentes</span></div></div>
            <button type="button" onClick={closeModal} className="pill-remove-btn" style={{ fontSize: '1.2rem' }}><X size={20} /></button>
          </div>
          <div className="modal-body">
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{tile?.description}</div>
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>Executivos Posicionados:</h4>
              {tilePlayers.length === 0 ? (
                <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-dim)' }}>Nenhum executivo posicionado nesta casa.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tilePlayers.map(p => (
                    <div key={p.id} onClick={() => setInspectedPlayer(inspectedPlayer?.id === p.id ? null : p)} style={{ padding: '0.75rem', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: p.color }} />
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: p.bankruptcy.inRecovery ? '#ef4444' : 'inherit' }}>{p.name} {p.bankruptcy.inRecovery && '💀'}</span>
                          <span className="badge-tag level">Nível {p.level}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>R$ {p.balance.toLocaleString('pt-BR')}</span>
                      </div>
                      {inspectedPlayer?.id === p.id && (
                        <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', fontSize: '0.75rem' }}>
                          <div>Mercadorias: <strong>{p.goods}</strong></div><div>Funcionários: <strong>{p.employees}</strong></div><div>Pontos: <strong>{p.points}</strong></div><div>Clientes: <strong>{p.clients}</strong></div>
                          {p.hasActiveInvestment && <div style={{ gridColumn: 'span 4', color: 'var(--accent-gold)', fontWeight: 700 }}>📈 Investimento Ativo na Empresa</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer"><button type="button" onClick={closeModal} className="btn-neutral">Fechar Inspeção</button></div>
        </div>
      </div>
    );
  }

  if (activeModal.type === 'TILE_INFO') {
    const isCrescimento = activeModal.tile?.type === 'Crescimento' && activeModal.tile?.effects;

    return (
      <div className="modal-overlay">
        <div className="modal-dialog">
          <div className="modal-header"><div className="modal-title-group"><div className="modal-icon-bubble" style={{ color: 'var(--text-bright)' }}><TrendingUp size={22} /></div>
          <div><h3 className="modal-title">{activeModal.tile?.title}</h3><span className="modal-sector-tag">{getPlayerNameSpan(activePlayer)} na casa</span></div></div></div>
          
          <div className="modal-body">
            <div className="modal-scenario-box" style={{ textAlign: 'center' }}>{activeModal.tile?.description}</div>
            {isCrescimento && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', textAlign: 'center' }}>
                <span style={{ display: 'block', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Bônus Conquistado:</span>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontWeight: 700, color: 'var(--text-bright)', fontSize: '1.1rem' }}>
                  {activeModal.tile?.effects?.map((e: any, i: number) => (
                    <span key={i}>+{e.amount} {RES_LABELS[e.type]}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer"><button type="button" onClick={closeModal} className="btn-approve"><Check size={18} /> Concluir e Passar Turno</button></div>
        </div>
      </div>
    );
  }

  return null;
};