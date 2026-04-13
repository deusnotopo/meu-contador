import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { Lock, FileCode } from 'lucide-react';
import { OFXImporterModal } from './transactions/OFXImporterModal';
import { Button } from "@/components/ui/button";
import type { TabType } from '@/types/navigation';

interface FunctionsHubProps {
  onNavigate?: (tab: TabType) => void;
}

interface HubActionCardProps {
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  ariaLabel: string;
}

const HubActionCard: React.FC<HubActionCardProps> = ({ onClick, className, style, children, ariaLabel }) => (
  <Button
    variant="glossy"
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    style={style}
    className={`w-full text-left h-auto p-0 justify-start hover:scale-[1.01] active:scale-[0.99] ${className ?? ''}`}
  >
    {children}
  </Button>
);

/** Section header: "01 · FLUXO DIÁRIO ─────" */
const SectionHeader = ({ num, title }: { num: string; title: string }) => (
  <div className="flex items-baseline gap-3.5 mb-4">
    <span className="font-mono text-[10px] text-[var(--t4)] tracking-[0.1em] px-1.5 py-0.5 border border-[var(--t4)] rounded">
      {num}
    </span>
    <span className="font-display text-[11px] font-bold tracking-[0.16em] uppercase text-[var(--t3)]">
      {title}
    </span>
    <div className="flex-1 h-px bg-[var(--line)]" />
  </div>
);

/** Mini icon box for fn-card icons */
const IconBox = ({ bg, children }: { bg: string; children: React.ReactNode }) => (
  <div className={`w-[42px] h-[42px] rounded-[11px] flex items-center justify-center text-[20px] ${bg}`}>
    {children}
  </div>
);

/** Card title + desc */
const CardBody = ({ title, desc, size = "14px" }: { title: string; desc: string; size?: string }) => (
  <>
    <div className={`font-display font-bold text-[var(--t1)] mb-1.5 text-[${size}]`}>{title}</div>
    <div className="text-[11px] text-[var(--t2)] leading-[1.5] font-light">{desc}</div>
  </>
);

export const FunctionsHub: React.FC<FunctionsHubProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const [clock, setClock] = useState('');
  const [showOFX, setShowOFX] = useState(false);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div
      className="functions-hub relative z-[1] min-h-full bg-[var(--bg)] px-6 pb-20"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ background: `radial-gradient(ellipse 70% 50% at 15% 10%, rgba(74,139,255,0.07) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 85% 80%, rgba(155,127,255,0.05) 0%, transparent 60%)` }}
      />

      {/* Drag handle */}
      <div className="modal-handle -mt-3 mb-6" />

      {/* ── Header ── */}
      <motion.header
        variants={itemVariants}
        className="flex justify-between items-center py-2.5 border-b border-[var(--line)] mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[17px] shadow-[0_0_0_1px_rgba(80,72,232,0.4),0_4px_16px_rgba(80,72,232,0.3)]"
            style={{ background: 'linear-gradient(135deg, #2F62D9, #5048E8)' }}>
            💎
          </div>
          <div>
            <div className="font-display text-[18px] font-bold text-[var(--t1)] tracking-[-0.4px]">Meu Contador</div>
            <div className="text-[11px] text-[var(--t3)] font-mono tracking-[0.04em]">Central de funções</div>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="font-mono text-[12px] text-[var(--t3)] tracking-[0.06em] px-3 py-1.5 border border-[var(--line2)] rounded-md bg-white/[0.02]">
            {clock}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[var(--t3)] tracking-[0.04em]">
            <div className="w-[7px] h-[7px] rounded-full bg-[var(--green)] shadow-[0_0_8px_var(--green)] animate-pulse" />
            {user?.name?.split(' ')[0] || 'Usuário'}
          </div>
        </div>
      </motion.header>

      {/* ── 01: Fluxo Diário ── */}
      <motion.section variants={itemVariants} className="mb-10">
        <SectionHeader num="01" title="Fluxo diário" />

        {/* Hero dashboard card */}
        <HubActionCard onClick={() => onNavigate?.('inicio')} ariaLabel="Abrir dashboard de controle"
          className="fn-card border border-blue-500/[0.18] rounded-[20px] p-6 mb-2.5 overflow-hidden relative"
          style={{ background: 'linear-gradient(145deg, #080E1F 0%, #04090F 60%, #060B18 100%)' } as React.CSSProperties}
        >
          <div className="relative z-[1]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="chip chip-blue text-[9px] py-[3px] px-2.5">Principal</span>
                <div className="font-display text-[24px] font-extrabold text-[var(--t1)] tracking-[-0.8px] mt-2.5 leading-[1.05]">
                  Dashboard<br/>de controle
                </div>
              </div>
              <div className="text-[36px] opacity-90">🏠</div>
            </div>
            <p className="text-[12px] text-[var(--t2)] leading-[1.6] font-light mb-4">
              Visão completa do seu estado financeiro: patrimônio, fluxo do mês, alertas, gráficos e gasto diário sustentável.
            </p>
            <div className="flex gap-1.5 flex-wrap">
              <span className="chip chip-green">Tempo real</span>
              <span className="chip chip-blue">Patrimônio</span>
              <span className="chip chip-amber">Alertas</span>
            </div>
          </div>
        </HubActionCard>

        {/* Gasto / Receita */}
        <div className="grid grid-cols-2 gap-2.5">
          <HubActionCard onClick={() => onNavigate?.('launch')} className="fn-card fn-card-blue" ariaLabel="Lançar novo gasto">
            <div className="flex justify-between mb-3"><IconBox bg="bg-[var(--red-d)]">💸</IconBox><span className="chip chip-red text-[8px]">FAB +</span></div>
            <CardBody title="Lançar Gasto" desc="Registra uma saída de dinheiro. Categoria, descrição, data e envelope." />
          </HubActionCard>

          <HubActionCard onClick={() => onNavigate?.('launch')} className="fn-card fn-card-green" ariaLabel="Lançar nova receita">
            <div className="flex justify-between mb-3"><IconBox bg="bg-[var(--green-d)]">💰</IconBox><span className="chip chip-green text-[8px]">Entrada</span></div>
            <CardBody title="Lançar Receita" desc="Registra qualquer entrada: salário, freelance, bônus." />
          </HubActionCard>
        </div>

        {/* OFX Importer */}
        <HubActionCard
          onClick={() => setShowOFX(true)}
          ariaLabel="Importar OFX do banco"
          className="fn-card mt-2.5 rounded-2xl p-4 overflow-hidden relative border-[rgba(139,92,246,0.2)]"
          style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.1) 0%, rgba(139,92,246,0.02) 100%)' } as React.CSSProperties}
        >
          <div className="flex items-center gap-4">
            <div className="w-[46px] h-[46px] rounded-[12px] bg-[rgba(139,92,246,0.15)] flex items-center justify-center text-[#a78bfa]">
              <FileCode size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display text-[15px] font-bold text-[var(--t1)]">Importar OFX</span>
                <span className="chip text-[8px] py-[2px] px-1.5" style={{ background: 'rgba(139,92,246,0.2)', color: '#d8b4fe' }}>NOVO</span>
              </div>
              <div className="text-[12px] text-[var(--t2)] leading-[1.4]">Arraste o extrato do seu banco. A IA formata e categoriza o lote.</div>
            </div>
          </div>
        </HubActionCard>
      </motion.section>

      {/* ── 02: Orçamento ── */}
      <motion.section variants={itemVariants} className="mb-10">
        <SectionHeader num="02" title="Orçamento zero-based" />
        <div className="grid grid-cols-2 gap-2.5">
          <HubActionCard onClick={() => onNavigate?.('budget')} className="fn-card fn-card-blue" ariaLabel="Abrir envelopes">
            <div className="flex justify-between mb-3"><IconBox bg="bg-[var(--blue-d)]">✉️</IconBox><span className="chip chip-blue text-[8px]">50/30/20</span></div>
            <CardBody title="Envelopes" desc="Orçamento zero-based com 12 envelopes em 3 grupos." />
          </HubActionCard>

          <HubActionCard onClick={() => onNavigate?.('cash_flow')} className="fn-card fn-card-amber" ariaLabel="Abrir calendário de caixa">
            <div className="flex justify-between mb-3"><IconBox bg="bg-[var(--amber-d)]">🗓️</IconBox><span className="chip chip-amber text-[8px]">30 dias</span></div>
            <CardBody title="Calendário de caixa" desc="Saldo seguro, saídas previstas e próximos dias críticos." />
          </HubActionCard>

          <HubActionCard onClick={() => onNavigate?.('planning')} className="fn-card fn-card-green" ariaLabel="Abrir planejamento">
            <div className="flex justify-between mb-3"><IconBox bg="bg-[var(--green-d)]">🔐</IconBox><span className="chip chip-green text-[8px]">Proteção</span></div>
            <CardBody title="Ulysses Contract" desc="Regras pré-comprometidas que protegem seu futuro." />
          </HubActionCard>
        </div>
      </motion.section>

      {/* ── 03: Patrimônio ── */}
      <motion.section variants={itemVariants} className="mb-10">
        <SectionHeader num="03" title="Patrimônio & investimentos" />
        <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
          {[
            { icon: '📈', name: 'Patrimônio', desc: 'Visão consolidada com sparkline e alocação.', color: 'blue', tab: 'investments' as TabType, premium: true },
            { icon: '🧮', name: 'Juros compostos', desc: 'Sliders de aporte, taxa e período.', color: 'blue', tab: 'invest_compostos' as TabType, premium: true },
            { icon: '💳', name: 'Dívidas', desc: 'Avalanche ou bola de neve.', color: 'red', tab: 'invest_dividas' as TabType, premium: true }
          ].map((item) => {
            const locked = item.premium && !isEnabled('investments');
            return (
              <HubActionCard key={item.name} onClick={() => onNavigate?.(item.tab)}
                className={`fn-card fn-card-${item.color} p-4 relative`}
                style={{ opacity: locked ? 0.7 : 1 } as React.CSSProperties}
                ariaLabel={`Abrir ${item.name}`}
              >
                {locked && (
                  <div className="absolute top-3 right-3 bg-amber-500/20 text-amber-400 px-1.5 py-[2px] rounded text-[8px] font-bold flex items-center gap-1">
                    <Lock size={8} /> PRO
                  </div>
                )}
                <div className="text-[20px] mb-2.5">{item.icon}</div>
                <div className="font-display text-[12px] font-bold text-[var(--t1)] mb-1.5">{item.name}</div>
                <div className="text-[10px] text-[var(--t2)] leading-[1.5] font-light">{item.desc}</div>
              </HubActionCard>
            );
          })}
        </div>
      </motion.section>

      {/* ── 04: Futuro & FIRE ── */}
      <motion.section variants={itemVariants} className="mb-10">
        <SectionHeader num="04" title="Futuro & independência financeira" />
        <div className="grid grid-cols-2 gap-2.5">
          <HubActionCard onClick={() => onNavigate?.('retirement')} className="fn-card fn-card-amber" ariaLabel="Abrir aposentadoria">
            <div className="flex justify-between mb-3"><IconBox bg="bg-[var(--amber-d)]">⏱</IconBox><span className="chip chip-amber text-[8px]">FIRE</span></div>
            <CardBody title="Aposentadoria" desc="Data FIRE, meta patrimonial e 3 cenários." />
          </HubActionCard>

          <HubActionCard onClick={() => onNavigate?.('retire_fire')} className="fn-card fn-card-amber" ariaLabel="Calculadora FIRE">
            <div className="flex justify-between mb-3"><IconBox bg="bg-[var(--amber-d)]">🔥</IconBox><span className="chip chip-amber text-[8px]">Interativa</span></div>
            <CardBody title="Calculadora FIRE" desc="Sliders de despesa e aporte com meta calculada." />
          </HubActionCard>
        </div>
      </motion.section>

      {/* ── 05: Diagnóstico ── */}
      <motion.section variants={itemVariants} className="mb-10">
        <SectionHeader num="05" title="Diagnóstico & bem-estar" />

        <HubActionCard onClick={() => onNavigate?.('health')} className="fn-card fn-card-purple mb-2.5" ariaLabel="Abrir saúde financeira">
          <div className="flex justify-between mb-3">
            <IconBox bg="bg-[var(--purple-d)]">💎</IconBox>
            <div className="flex gap-1.5">
              <span className="chip chip-purple text-[8px]">Score 360°</span>
              <span className="chip chip-green text-[8px]">7 dimensões</span>
            </div>
          </div>
          <CardBody title="Saúde financeira" desc="Score multidimensional em 7 dimensões: liquidez, poupança, dívidas, diversificação, proteção, trajetória e bem-estar." />
        </HubActionCard>

        <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(110px,1fr))]">
          {[
            { icon: '📉', name: 'Inflação pessoal', desc: 'Sua inflação real vs. IPCA.', color: 'red', tab: 'personal_inflation' as TabType },
            { icon: '🧘', name: 'Check-in', desc: 'Estresse financeiro mensal.', color: 'purple', tab: 'financial_checkin' as TabType },
            { icon: '🔔', name: 'Notificações', desc: 'Alertas, nudges e oportunidades.', color: 'blue', tab: 'notifications' as TabType },
          ].map((item) => (
            <HubActionCard key={item.name} onClick={() => onNavigate?.(item.tab)}
              className={`fn-card fn-card-${item.color} p-[14px]`} ariaLabel={`Abrir ${item.name}`}>
              <div className="text-[18px] mb-2">{item.icon}</div>
              <div className="font-display text-[11px] font-bold text-[var(--t1)] mb-1">{item.name}</div>
              <div className="text-[9px] text-[var(--t2)] leading-[1.4] font-light">{item.desc}</div>
            </HubActionCard>
          ))}
        </div>
      </motion.section>

      {/* ── 06: Educação ── */}
      <motion.section variants={itemVariants} className="mb-10">
        <SectionHeader num="06" title="Aprender — educação financeira" />

        <HubActionCard onClick={() => onNavigate?.('academia')} className="fn-card fn-card-cyan mb-2.5" ariaLabel="Abrir área Aprender">
          <div className="flex justify-between mb-3">
            <IconBox bg="bg-[var(--cyan-d)]">🎓</IconBox>
            <div className="flex gap-1.5">
              <span className="chip chip-cyan text-[8px]">Micro-aulas</span>
              <span className="chip chip-amber text-[8px]">Gamificação</span>
              <span className="chip chip-blue text-[8px]">XP</span>
            </div>
          </div>
          <CardBody title="Aprender finanças" desc="Trilhas práticas com aulas curtas, XP, sequência e recomendações personalizadas." />
        </HubActionCard>

        <div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(78px,1fr))]">
          {[
            { icon: '💰', name: 'Juros compostos', status: '✓', color: 'blue' },
            { icon: '✉️', name: 'Envelopes', status: '✓', color: 'green' },
            { icon: '🔥', name: 'Método FIRE', status: 'Nova', color: 'amber' },
            { icon: '🏔️', name: 'Matar dívidas', status: 'Nova', color: 'red' },
            { icon: '🧠', name: 'Vieses', status: 'Nova', color: 'purple' },
            { icon: '🌍', name: 'ETFs', status: 'Nova', color: 'cyan' },
            { icon: '🏆', name: 'Conquistas', status: '2/4', color: 'amber' },
            { icon: '⚡', name: 'XP & níveis', status: 'Nível 4', color: 'blue' },
          ].map((item) => (
            <HubActionCard key={item.name} onClick={() => onNavigate?.('education')}
              className={`fn-card fn-card-${item.color} p-3`} ariaLabel={`Abrir ${item.name}`}>
              <div className="flex justify-between mb-2">
                <span className="text-[16px]">{item.icon}</span>
                <span className={`text-[8px] font-mono ${item.status === '✓' ? 'text-[var(--green)]' : 'text-[var(--blue)]'}`}>
                  {item.status}
                </span>
              </div>
              <div className="font-display text-[10px] font-bold text-[var(--t1)]">{item.name}</div>
            </HubActionCard>
          ))}
        </div>
      </motion.section>

      {/* ── AI Assistant ── */}
      <motion.section variants={itemVariants} className="mb-10">
        <HubActionCard
          onClick={() => onNavigate?.('ai')}
          ariaLabel="Abrir assistente financeiro IA"
          className={`fn-card rounded-[20px] p-6 overflow-hidden relative border ${!isEnabled('ai_advisor') ? 'border-amber-500/30 opacity-80' : 'border-[rgba(155,127,255,0.2)]'}`}
          style={{ background: 'linear-gradient(145deg, #0D0A1F 0%, #060810 60%, #0A0D18 100%)' } as React.CSSProperties}
        >
          {!isEnabled('ai_advisor') && (
            <div className="absolute top-5 right-6 bg-amber-400 text-black px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1.5">
              <Lock size={10} /> RECURSO PRO
            </div>
          )}
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="chip chip-purple text-[9px]">IA Generativa</span>
              <div className="font-display text-[22px] font-extrabold text-[var(--t1)] tracking-[-0.6px] mt-2.5 leading-[1.05]">
                Assistente Financeiro
              </div>
            </div>
            <div className="text-[36px] opacity-90">🤖</div>
          </div>
          <p className="text-[12px] text-[var(--t2)] leading-[1.6] font-light mb-4">
            Converse em linguagem natural sobre suas finanças. Peça para lançar gastos, criar envelopes, analisar padrões ou simular cenários de investimento.
          </p>
          <div className="flex gap-1.5 flex-wrap">
            <span className="chip chip-purple">GPT-4</span>
            <span className="chip chip-blue">Ações reais</span>
            <span className="chip chip-green">Contexto financeiro</span>
          </div>
        </HubActionCard>
      </motion.section>

      {/* ── Footer ── */}
      <motion.footer
        variants={itemVariants}
        className="border-t border-[var(--line)] pt-6 flex justify-between items-center flex-wrap gap-4"
      >
        <div>
          <div className="font-display text-[14px] font-bold text-[var(--t1)] mb-1">Meu Contador v3.0</div>
          <div className="font-mono text-[10px] text-[var(--t3)] tracking-[0.06em]">
            Hub financeiro · {user?.name || 'Usuário'}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="chip chip-green text-[9px]">v3 — 2026</span>
          <span className="chip chip-blue text-[9px]">Planejamento</span>
          <span className="chip chip-amber text-[9px]">Patrimônio</span>
        </div>
      </motion.footer>

      <OFXImporterModal isOpen={showOFX} onClose={() => setShowOFX(false)} />
    </motion.div>
  );
};