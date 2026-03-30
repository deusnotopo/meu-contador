import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

import type { TabType } from '@/types/navigation';

interface FunctionsHubProps {
  onNavigate?: (tab: TabType) => void;

}

export const FunctionsHub: React.FC<FunctionsHubProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [clock, setClock] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setClock(`${h}:${m}:${s}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);



  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      className="functions-hub"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        background: 'var(--bg)',
        minHeight: '100%',
        padding: '0 24px 80px',
        position: 'relative',
        zIndex: 1
      }}
    >
      {/* Background effects */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: `
          radial-gradient(ellipse 70% 50% at 15% 10%, rgba(74,139,255,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 50% 40% at 85% 80%, rgba(155,127,255,0.05) 0%, transparent 60%),
          radial-gradient(ellipse 30% 30% at 50% 50%, rgba(0,214,143,0.03) 0%, transparent 70%)
        `,
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Drag Indicator (UX) */}
      <div className="modal-handle" style={{ marginTop: '-12px', marginBottom: '24px' }} />

      {/* Header */}
      <motion.header 
        variants={itemVariants}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0 20px',
          borderBottom: '1px solid var(--line)',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2F62D9, #5048E8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '17px',
            boxShadow: '0 0 0 1px rgba(80,72,232,0.4), 0 4px 16px rgba(80,72,232,0.3)'
          }}>💎</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--t1)',
              letterSpacing: '-0.4px'
            }}>Meu Contador</div>
            <div style={{
              fontSize: '11px',
              color: 'var(--t3)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.04em'
            }}>Central de funções</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--t3)',
            letterSpacing: '0.06em',
            padding: '5px 12px',
            border: '1px solid var(--line2)',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.02)'
          }}>{clock}</div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--t3)',
            letterSpacing: '0.04em'
          }}>
            <div style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: 'var(--green)',
              boxShadow: '0 0 8px var(--green)',
              animation: 'blink 2.5s ease infinite'
            }} />
            {user?.name?.split(' ')[0] || 'Usuário'}
          </div>
        </div>
      </motion.header>

      {/* Section 01: Fluxo Diário */}
      <motion.section variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '14px',
          marginBottom: '16px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--t4)',
            letterSpacing: '0.1em',
            padding: '2px 7px',
            border: '1px solid var(--t4)',
            borderRadius: '4px'
          }}>01</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--t3)'
          }}>Fluxo diário</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        {/* Dashboard Hero Card */}
        <div 
          onClick={() => onNavigate?.('inicio')}
          style={{
            background: 'linear-gradient(145deg, #080E1F 0%, #04090F 60%, #060B18 100%)',
            border: '1px solid rgba(74,139,255,0.18)',
            borderRadius: '20px',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            marginBottom: '10px',
            transition: 'all 0.25s'
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="chip chip-blue" style={{ fontSize: '9px', padding: '3px 10px' }}>Principal</span>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--t1)',
                  letterSpacing: '-0.8px',
                  marginTop: '10px',
                  lineHeight: 1.05
                }}>Dashboard<br/>de controle</div>
              </div>
              <div style={{ fontSize: '36px', opacity: 0.9 }}>🏠</div>
            </div>
            <p style={{
              fontSize: '12px',
              color: 'var(--t2)',
              lineHeight: 1.6,
              fontWeight: 300,
              marginBottom: '16px'
            }}>
              Visão completa do seu estado financeiro: patrimônio, fluxo do mês, alertas, gráficos e gasto diário sustentável.
            </p>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span className="chip chip-green">Tempo real</span>
              <span className="chip chip-blue">Patrimônio</span>
              <span className="chip chip-amber">Alertas</span>
            </div>
          </div>
        </div>

        {/* Lançar Gasto / Receita */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div 
            onClick={() => onNavigate?.('launch')}
            className="fn-card fn-card-blue"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '11px',
                background: 'var(--red-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>💸</div>
              <span className="chip chip-red" style={{ fontSize: '8px' }}>FAB +</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>Lançar Gasto</div>
            <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>Registra uma saída de dinheiro. Categoria, descrição, data e envelope.</div>
          </div>

          <div 
            onClick={() => onNavigate?.('launch')}
            className="fn-card fn-card-green"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '11px',
                background: 'var(--green-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>💰</div>
              <span className="chip chip-green" style={{ fontSize: '8px' }}>Entrada</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>Lançar Receita</div>
            <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>Registra qualquer entrada: salário, freelance, bônus.</div>
          </div>
        </div>
      </motion.section>

      {/* Section 02: Orçamento */}
      <motion.section variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '14px',
          marginBottom: '16px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--t4)',
            letterSpacing: '0.1em',
            padding: '2px 7px',
            border: '1px solid var(--t4)',
            borderRadius: '4px'
          }}>02</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--t3)'
          }}>Orçamento zero-based</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div 
            onClick={() => onNavigate?.('budget')}
            className="fn-card fn-card-blue"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '11px',
                background: 'var(--blue-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>✉️</div>
              <span className="chip chip-blue" style={{ fontSize: '8px' }}>50/30/20</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>Envelopes</div>
            <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>Orçamento zero-based com 12 envelopes em 3 grupos.</div>
          </div>

          <div 
            onClick={() => onNavigate?.('cash_flow')}
            className="fn-card fn-card-amber"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '11px',
                background: 'var(--amber-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>🗓️</div>
              <span className="chip chip-amber" style={{ fontSize: '8px' }}>30 dias</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>Calendário de caixa</div>
            <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>Saldo seguro, saídas previstas, compromissos e próximos dias críticos.</div>
          </div>

          <div 
            onClick={() => onNavigate?.('planning')}
            className="fn-card fn-card-green"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '11px',
                background: 'var(--green-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>🔐</div>
              <span className="chip chip-green" style={{ fontSize: '8px' }}>Proteção</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>Ulysses Contract</div>
            <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>Regras pré-competidas que protegem seu futuro.</div>
          </div>
        </div>
      </motion.section>

      {/* Section 03: Patrimônio */}
      <motion.section variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '14px',
          marginBottom: '16px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--t4)',
            letterSpacing: '0.1em',
            padding: '2px 7px',
            border: '1px solid var(--t4)',
            borderRadius: '4px'
          }}>03</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--t3)'
          }}>Patrimônio & investimentos</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
          {[
            { icon: '📈', name: 'Patrimônio geral', desc: 'Visão consolidada com sparkline e alocação.', color: 'blue', tab: 'investments' as TabType },
            { icon: '🧮', name: 'Juros compostos', desc: 'Calculadora com sliders de aporte, taxa e período.', color: 'blue', tab: 'invest_compostos' as TabType },
            { icon: '💳', name: 'Dívidas', desc: 'Mapa de passivos com estratégia avalanche ou bola de neve.', color: 'red', tab: 'invest_dividas' as TabType }
          ].map((item, i) => (
            <div 
              key={i}
              onClick={() => onNavigate?.(item.tab)}
              className={`fn-card fn-card-${item.color}`}
              style={{ padding: '16px' }}
            >
              <div style={{ fontSize: '20px', marginBottom: '10px' }}>{item.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '12px', fontWeight: 700, color: 'var(--t1)', marginBottom: '5px' }}>{item.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Section 04: Futuro & FIRE */}
      <motion.section variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '14px',
          marginBottom: '16px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--t4)',
            letterSpacing: '0.1em',
            padding: '2px 7px',
            border: '1px solid var(--t4)',
            borderRadius: '4px'
          }}>04</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--t3)'
          }}>Futuro & independência financeira</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div 
            onClick={() => onNavigate?.('retirement')}
            className="fn-card fn-card-amber"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '11px',
                background: 'var(--amber-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>⏱</div>
              <span className="chip chip-amber" style={{ fontSize: '8px' }}>3,2% BR</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>Aposentadoria</div>
            <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>Data FIRE, meta patrimonial e 3 cenários de projeção.</div>
          </div>

          <div 
            onClick={() => onNavigate?.('retire_fire')}
            className="fn-card fn-card-amber"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '11px',
                background: 'var(--amber-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>🔥</div>
              <span className="chip chip-amber" style={{ fontSize: '8px' }}>Interativa</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>Calculadora FIRE</div>
            <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>Sliders de despesa e aporte com meta calculada.</div>
          </div>
        </div>
      </motion.section>

      {/* Section 05: Diagnóstico */}
      <motion.section variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '14px',
          marginBottom: '16px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--t4)',
            letterSpacing: '0.1em',
            padding: '2px 7px',
            border: '1px solid var(--t4)',
            borderRadius: '4px'
          }}>05</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--t3)'
          }}>Diagnóstico & bem-estar</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        <div 
          onClick={() => onNavigate?.('health')}
          className="fn-card fn-card-purple"
          style={{ marginBottom: '10px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '11px',
              background: 'var(--purple-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>💎</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="chip chip-purple" style={{ fontSize: '8px' }}>Score 360°</span>
              <span className="chip chip-green" style={{ fontSize: '8px' }}>7 dimensões</span>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>Saúde financeira</div>
          <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>Score multidimensional em 7 dimensões: liquidez, poupança, dívidas, diversificação, proteção, trajetória e bem-estar.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
          {[
            { icon: '📉', name: 'Inflação pessoal', desc: 'Sua inflação real vs. IPCA oficial.', color: 'red', tab: 'personal_inflation' as TabType },
            { icon: '🧘', name: 'Check-in', desc: 'Estresse financeiro subjetivo mensal.', color: 'purple', tab: 'financial_checkin' as TabType },
            { icon: '🔔', name: 'Notificações', desc: 'Alertas, nudges e oportunidades.', color: 'blue', tab: 'notifications' as TabType }
          ].map((item, i) => (
            <div 
              key={i}
              onClick={() => onNavigate?.(item.tab)}
              className={`fn-card fn-card-${item.color}`}
              style={{ padding: '14px' }}
            >
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>{item.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '11px', fontWeight: 700, color: 'var(--t1)', marginBottom: '4px' }}>{item.name}</div>
              <div style={{ fontSize: '9px', color: 'var(--t2)', lineHeight: 1.4, fontWeight: 300 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Section 06: Educação */}
      <motion.section variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '14px',
          marginBottom: '16px'
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--t4)',
            letterSpacing: '0.1em',
            padding: '2px 7px',
            border: '1px solid var(--t4)',
            borderRadius: '4px'
          }}>06</span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--t3)'
          }}>Academia — educação financeira</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--line)' }} />
        </div>

        <div 
          onClick={() => onNavigate?.('academia')}
          className="fn-card fn-card-cyan"
          style={{ marginBottom: '10px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '11px',
              background: 'var(--cyan-d)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
            }}>🎓</div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span className="chip chip-cyan" style={{ fontSize: '8px' }}>Micro-aulas</span>
              <span className="chip chip-amber" style={{ fontSize: '8px' }}>Gamificação</span>
              <span className="chip chip-blue" style={{ fontSize: '8px' }}>XP</span>
            </div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '14px', fontWeight: 700, color: 'var(--t1)', marginBottom: '6px' }}>Academia de finanças</div>
          <div style={{ fontSize: '11px', color: 'var(--t2)', lineHeight: 1.5, fontWeight: 300 }}>6 micro-aulas em 4 trilhas com XP, streak e conquistas desbloqueáveis.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(78px, 1fr))', gap: '10px' }}>
          {[
            { icon: '💰', name: 'Juros compostos', status: '✓', color: 'blue' },
            { icon: '✉️', name: 'Envelopes', status: '✓', color: 'green' },
            { icon: '🔥', name: 'Método FIRE', status: 'Nova', color: 'amber' },
            { icon: '🏔️', name: 'Matar dívidas', status: 'Nova', color: 'red' },
            { icon: '🧠', name: 'Vieses', status: 'Nova', color: 'purple' },
            { icon: '🌍', name: 'ETFs', status: 'Nova', color: 'cyan' },
            { icon: '🏆', name: 'Conquistas', status: '2/4', color: 'amber' },
            { icon: '⚡', name: 'XP & níveis', status: 'Nível 4', color: 'blue' }
          ].map((item, i) => (
            <div 
              key={i}
              onClick={() => onNavigate?.('education')}
              className={`fn-card fn-card-${item.color}`}
              style={{ padding: '12px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '16px' }}>{item.icon}</div>
                <span style={{
                  fontSize: '8px',
                  color: item.status === '✓' ? 'var(--green)' : 'var(--blue)',
                  fontFamily: 'var(--font-mono)'
                }}>{item.status}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '10px', fontWeight: 700, color: 'var(--t1)' }}>{item.name}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* AI Assistant */}
      <motion.section variants={itemVariants} style={{ marginBottom: '40px' }}>
        <div 
          onClick={() => onNavigate?.('ai')}
          style={{
            background: 'linear-gradient(145deg, #0D0A1F 0%, #060810 60%, #0A0D18 100%)',
            border: '1px solid rgba(155,127,255,0.2)',
            borderRadius: '20px',
            padding: '24px',
            cursor: 'pointer',
            transition: 'all 0.25s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span className="chip chip-purple" style={{ fontSize: '9px' }}>IA Generativa</span>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--t1)',
                letterSpacing: '-0.6px',
                marginTop: '10px',
                lineHeight: 1.05
              }}>Assistente Financeiro</div>
            </div>
            <div style={{ fontSize: '36px', opacity: 0.9 }}>🤖</div>
          </div>
          <p style={{
            fontSize: '12px',
            color: 'var(--t2)',
            lineHeight: 1.6,
            fontWeight: 300,
            marginBottom: '16px'
          }}>
            Converse em linguagem natural sobre suas finanças. Peça para lançar gastos, criar envelopes, analisar padrões ou simular cenários de investimento.
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span className="chip chip-purple">GPT-4</span>
            <span className="chip chip-blue">Ações reais</span>
            <span className="chip chip-green">Contexto financeiro</span>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer 
        variants={itemVariants}
        style={{
          borderTop: '1px solid var(--line)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--t1)',
            marginBottom: '4px'
          }}>FinApp v3.0</div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            color: 'var(--t3)',
            letterSpacing: '0.06em'
          }}>Hub financeiro · {user?.name || 'Usuário'}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="chip chip-green" style={{ fontSize: '9px' }}>v3 — março 2026</span>
          <span className="chip chip-blue" style={{ fontSize: '9px' }}>Planejamento</span>
          <span className="chip chip-amber" style={{ fontSize: '9px' }}>Patrimônio</span>
        </div>
      </motion.footer>
    </motion.div>
  );
};