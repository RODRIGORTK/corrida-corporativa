import React, { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { FINAL_BOARDROOM_CHALLENGE, SECTOR_INFO } from '../../data/challenges';
import { 
  Trophy, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Check, 
  X, 
  Clock, 
  Crown, 
  ShieldCheck, 
  Briefcase,
  RotateCcw
} from 'lucide-react';
import type { Player } from '../../types/game';

export const GameModals: React.FC = () => {
  const { 
    activeModal, 
    closeModal, 
    resolveChallenge, 
    resolveCrisis, 
    resolveInvestment, 
    resolveFinalBoardroom, 
    activePlayer,
    winner,
    restartGame,
    ranking
  } = useGame();

  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [inspectedPlayer, setInspectedPlayer] = useState<Player | null>(null);

  // Inicializa timer quando modal de desafio abre
  useEffect(() => {
    if (activeModal.type === 'CHALLENGE') {
      // Começa travado em 30s esperando o Narrador apertar Iniciar
      setTimerSeconds(30);
      setIsTimerRunning(false);
    } else if (activeModal.type === 'FINAL_BOARDROOM') {
      setTimerSeconds(60);
      setIsTimerRunning(true);
    } else {
      setIsTimerRunning(false);
    }
  }, [activeModal.type, activeModal.card]);

  // Efeito regressivo do cronômetro
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!activeModal.type && !winner) return null;

  // 1. MODAL DE FIM DE JOGO / VITÓRIA
  if (winner || activeModal.type === 'GAME_OVER') {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog victory-modal" style={{ maxWidth: '640px' }}>
          <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(15, 23, 42, 0.8))' }}>
            <div className="modal-title-group">
              <div className="modal-icon-bubble" style={{ background: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b', color: '#f59e0b' }}>
                <Crown size={24} />
              </div>
              <div>
                <h3 className="modal-title" style={{ color: '#fbbf24' }}>CORRIDA CORPORATIVA CONCLUÍDA!</h3>
                <span className="modal-sector-tag">Conselho de Administração Aclama o(a) Vencedor(a)</span>
              </div>
            </div>
          </div>

          <div className="modal-body" style={{ textAlign: 'center' }}>
            <div style={{ padding: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '14px' }}>
              <Trophy size={64} color="#fbbf24" style={{ margin: '0 auto 1rem auto' }} />
              <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#ffffff' }}>
                {winner?.name}
              </h2>
              <p style={{ color: 'var(--accent-gold)', fontSize: '1.1rem', marginTop: '0.4rem', fontWeight: 700 }}>
                Novo(a) Diretor(a) Executivo(a) Supremo(a) (CEO)
              </p>
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <span>💰 Saldo Final: <strong>R$ {winner?.balance.toLocaleString('pt-BR')}</strong></span>
                <span>📦 Mercadorias: <strong>{winner?.goods}</strong></span>
                <span>⭐ Nível: <strong>{winner?.level}</strong></span>
              </div>
            </div>

            {/* Pódio dos 3 primeiros */}
            <div style={{ marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Pódio Final da Temporada
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                {ranking.slice(0, 3).map((p, idx) => (
                  <div key={p.id} style={{ flex: 1, padding: '0.6rem', background: 'rgba(30, 41, 59, 0.7)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 800, color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#b45309' }}>
                      #{idx + 1}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)' }}>R$ {p.balance.toLocaleString('pt-BR')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer" style={{ justifyContent: 'center' }}>
            <button type="button" onClick={restartGame} className="btn-approve" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
              <RotateCcw size={18} /> Iniciar Nova Temporada Corporativa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. MODAL DE DESAFIO FINAL DA DIRETORIA
  if (activeModal.type === 'FINAL_BOARDROOM') {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog victory-modal">
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-icon-bubble" style={{ color: '#fbbf24', borderColor: '#fbbf24' }}>
                <Crown size={22} />
              </div>
              <div>
                <h3 className="modal-title">{FINAL_BOARDROOM_CHALLENGE.title}</h3>
                <span className="modal-sector-tag">Linha de Chegada • Sabatina do CEO</span>
              </div>
            </div>
          </div>

          <div className="modal-body">
            <div className="modal-scenario-box">
              {FINAL_BOARDROOM_CHALLENGE.scenario}
            </div>

            {/* Cronômetro */}
            <div className="modal-timer-badge">
              <Clock size={24} />
              <span>{timerSeconds}s</span>
              <button 
                type="button" 
                onClick={() => setIsTimerRunning(!isTimerRunning)} 
                className="secondary-btn"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
              >
                {isTimerRunning ? 'Pausar' : 'Iniciar'}
              </button>
              <button 
                type="button" 
                onClick={() => setTimerSeconds(60)} 
                className="secondary-btn"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
              >
                Reset
              </button>
            </div>

            <div className="modal-consequences-grid">
              <div className="consequence-card reward">
                <span className="consequence-title">Se Aprovado pela Mesa:</span>
                <span className="consequence-desc">{FINAL_BOARDROOM_CHALLENGE.approvalText}</span>
              </div>
              <div className="consequence-card penalty">
                <span className="consequence-title">Se Reprovado pela Mesa:</span>
                <span className="consequence-desc">{FINAL_BOARDROOM_CHALLENGE.rejectionText}</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => resolveFinalBoardroom(false)}
              className="btn-reject"
            >
              <X size={18} /> Recusar (Volta 3 Casas)
            </button>
            <button
              type="button"
              onClick={() => resolveFinalBoardroom(true)}
              className="btn-approve"
            >
              <Check size={18} /> Aprovar (Vencedor Supremo!)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. MODAL DE DESAFIO NARRATIVO / DINÂMICO
  if (activeModal.type === 'CHALLENGE' && activeModal.card) {
    const card = activeModal.card;
    const sector = SECTOR_INFO[card.sector];

    return (
      <div className="modal-overlay">
        <div className="modal-dialog">
          <div className="modal-header">
            <div className="modal-title-group">
              <div 
                className="modal-icon-bubble"
                style={{ color: sector?.color, borderColor: sector?.color }}
              >
                <Briefcase size={22} />
              </div>
              <div>
                {/* Título adaptado para exibir apenas "Desafio: Setor RH", etc. */}
                <h3 className="modal-title">Desafio: {sector?.label || card.sector}</h3>
                <span className="modal-sector-tag">Sabatina do Narrador</span>
              </div>
            </div>
          </div>

          <div className="modal-body">
            {/* Caixa de Texto Substituída */}
            <div className="modal-scenario-box" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>
                O Narrador fará uma pergunta exclusiva relacionada ao <strong>{sector?.label || card.sector}</strong>.
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Assim que a pergunta for feita, inicie o cronômetro. Você terá 30 segundos para responder!
              </div>
            </div>

            {/* Painel do Cronômetro */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              gap: '1rem', 
              background: 'rgba(15, 23, 42, 0.4)', 
              padding: '1.5rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border-glow)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '2rem', fontWeight: 900, color: timerSeconds <= 10 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                <Clock size={32} />
                <span>00:{timerSeconds.toString().padStart(2, '0')}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setIsTimerRunning(!isTimerRunning)} 
                  className={isTimerRunning ? 'btn-neutral' : 'btn-approve'}
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  {isTimerRunning ? 'Pausar Tempo' : timerSeconds === 30 ? '▶ Iniciar Cronômetro' : '▶ Continuar'}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => { setTimerSeconds(30); setIsTimerRunning(false); }} 
                  className="btn-neutral"
                  style={{ padding: '0.6rem 1.2rem' }}
                >
                  <RotateCcw size={16} /> Reset
                </button>
              </div>
            </div>

            <div className="modal-consequences-grid">
              <div className="consequence-card reward">
                <span className="consequence-title">Se Aprovar</span>
                <span className="consequence-desc">{card.approvalReward.text}</span>
              </div>
              <div className="consequence-card penalty">
                <span className="consequence-title">Se Recusar</span>
                <span className="consequence-desc">{card.rejectionPenalty.text}</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => resolveChallenge(false)}
              className="btn-reject"
            >
              <X size={18} /> Recusar
            </button>
            <button
              type="button"
              onClick={() => resolveChallenge(true)}
              className="btn-approve"
            >
              <Check size={18} /> Aprovar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. MODAL DE CRISE CORPORATIVA
  if (activeModal.type === 'CRISIS') {
    const canCancel = activePlayer && activePlayer.points >= 5;

    return (
      <div className="modal-overlay">
        <div className="modal-dialog crisis-modal">
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-icon-bubble" style={{ color: 'var(--accent-rose)', borderColor: 'var(--accent-rose)' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 className="modal-title">{activeModal.tile?.title || 'Crise Corporativa'}</h3>
                <span className="modal-sector-tag">Instabilidade no Setor</span>
              </div>
            </div>
          </div>

          <div className="modal-body">
            <div className="modal-scenario-box">
              {activeModal.tile?.description || 'Turbulência no mercado causou prejuízo operacional imprevisto.'}
            </div>

            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '1rem', borderRadius: '10px' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent-rose)', marginBottom: '4px' }}>
                Impacto Imediato: Prejuízo de -R$ 1.500 no Caixa
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                * Se o saldo ficar igual ou abaixo de R$ 0, o executivo entra em <strong>Recuperação Judicial</strong> (com 2 rodadas para sair da crise antes da falência).
              </div>
            </div>

            <div style={{ background: 'rgba(30, 41, 59, 0.6)', border: '1px solid var(--border-glow)', padding: '0.85rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-gold)' }}>
                  🛡️ Mecânica Especial: Anular com Pontos
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Gaste 5 Pontos Corporativos para zerar completamente o dano.
                </div>
              </div>
              <span style={{ fontWeight: 800, color: canCancel ? 'var(--accent-emerald)' : 'var(--text-dim)' }}>
                Seus Pontos: {activePlayer?.points ?? 0}
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => resolveCrisis(false)}
              className="btn-neutral"
            >
              Absorver Prejuízo (-R$ 1.500)
            </button>
            <button
              type="button"
              onClick={() => resolveCrisis(true)}
              disabled={!canCancel}
              className="btn-approve"
              style={{ opacity: canCancel ? 1 : 0.4 }}
            >
              <ShieldCheck size={18} /> Usar 5 Pontos (Anular)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. MODAL DE INVESTIMENTO
  if (activeModal.type === 'INVESTMENT') {
    const reqLevel = activeModal.tile?.requiredLevel || 1;
    let effectiveLevel = activePlayer?.level ?? 0;
    if (activePlayer?.alliance) {
      effectiveLevel += 1; // Soma de aliados
    }
    const hasRequiredLevel = effectiveLevel >= reqLevel;

    return (
      <div className="modal-overlay">
        <div className="modal-dialog">
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-icon-bubble">
                <DollarSign size={22} />
              </div>
              <div>
                <h3 className="modal-title">{activeModal.tile?.title || 'Rodada de Investimento'}</h3>
                <span className="modal-sector-tag">Requer Nível Corporativo {reqLevel}</span>
              </div>
            </div>
          </div>

          <div className="modal-body">
            <div className="modal-scenario-box">
              {activeModal.tile?.description}
            </div>

            <div className="modal-consequences-grid">
              <div className="consequence-card penalty">
                <span className="consequence-title">Aporte Financeiro</span>
                <span className="consequence-desc">-R$ 3.000 do Saldo da Empresa</span>
              </div>
              <div className="consequence-card reward">
                <span className="consequence-title">Retorno Estratégico</span>
                <span className="consequence-desc">+3 Mercadorias e +2 Pontos de Prestígio</span>
              </div>
            </div>

            {!hasRequiredLevel && (
              <div style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(244, 63, 94, 0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                ⚠️ Nível insuficiente para esta rodada. Requer Nível {reqLevel} (Seu Nível: {effectiveLevel}).
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={() => resolveInvestment(false)}
              className="btn-neutral"
            >
              Recusar Aporte
            </button>
            <button
              type="button"
              onClick={() => resolveInvestment(true)}
              disabled={!hasRequiredLevel || (activePlayer?.balance ?? 0) < 3000}
              className="btn-approve"
            >
              <Check size={18} /> Realizar Investimento (R$ 3.000)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 6. MODAL DE INFORMAÇÃO GERAL / OPORTUNIDADE
  if (activeModal.type === 'TILE_INFO') {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog">
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-icon-bubble" style={{ color: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}>
                <TrendingUp size={22} />
              </div>
              <div>
                <h3 className="modal-title">{activeModal.tile?.title}</h3>
                <span className="modal-sector-tag">Setor: {activeModal.tile?.sector}</span>
              </div>
            </div>
          </div>

          <div className="modal-body">
            <div className="modal-scenario-box">
              {activeModal.tile?.description}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={closeModal}
              className="btn-approve"
            >
              <Check size={18} /> Concluir e Passar Turno
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 7. MODAL DE INSPEÇÃO DE CASA (QUEM ESTÁ NA CASA & ESTATÍSTICAS DETALHADAS)
  if (activeModal.type === 'INSPECT_TILE') {
    const tile = activeModal.tile;
    const tilePlayers = activeModal.tilePlayers || [];

    return (
      <div className="modal-overlay">
        <div className="modal-dialog" style={{ maxWidth: '620px' }}>
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-icon-bubble">
                <Users size={22} />
              </div>
              <div>
                <h3 className="modal-title">Casa #{tile?.index}: {tile?.title}</h3>
                <span className="modal-sector-tag">Setor {tile?.sector} • {tilePlayers.length} Executivos Presentes</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={closeModal}
              className="pill-remove-btn"
              style={{ fontSize: '1.2rem' }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="modal-body">
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {tile?.description}
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                Executivos Posicionados Nesta Casa:
              </h4>

              {tilePlayers.length === 0 ? (
                <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                  Nenhum executivo posicionado nesta casa no momento.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {tilePlayers.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setInspectedPlayer(inspectedPlayer?.id === p.id ? null : p)}
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: p.color }} />
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</span>
                          <span className="badge-tag level">Nível {p.level}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--accent-emerald)' }}>
                          R$ {p.balance.toLocaleString('pt-BR')}
                        </span>
                      </div>

                      {/* Detalhes expandidos */}
                      {inspectedPlayer?.id === p.id && (
                        <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', fontSize: '0.75rem' }}>
                          <div>Mercadorias: <strong>{p.goods}</strong></div>
                          <div>Funcionários: <strong>{p.employees}</strong></div>
                          <div>Pontos: <strong>{p.points}</strong></div>
                          <div>Clientes: <strong>{p.clients}</strong></div>
                          {p.bankruptcy.inRecovery && (
                            <div style={{ gridColumn: 'span 4', color: 'var(--accent-rose)', fontWeight: 700 }}>
                              ⚠️ Em Recuperação Judicial ({p.bankruptcy.roundsLeft} rodadas restantes)
                            </div>
                          )}
                          {p.alliance && (
                            <div style={{ gridColumn: 'span 4', color: 'var(--accent-purple)', fontWeight: 700 }}>
                              🤝 Aliança Ativa ({p.alliance.roundsLeft} rodadas restantes)
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={closeModal} className="btn-neutral">
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};