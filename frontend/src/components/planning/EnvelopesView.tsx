import React, { useState } from "react";
import type { TabType } from "@/types/navigation";

interface EnvelopesViewProps {
  onBack?: (tab?: TabType) => void;
  onNavigate?: (tab: TabType) => void;
}

export const EnvelopesView = ({ onBack, onNavigate }: EnvelopesViewProps) => {
  const [selectedEnvelope, setSelectedEnvelope] = useState<string | null>(null);

  const fmt = (n: number) => 'R\u00a0' + Math.round(n).toLocaleString('pt-BR');

  const necessidades = [
    { id: 'moradia', ico: '🏠', name: 'Moradia', spent: 2200, budget: 2200 },
    { id: 'transporte', ico: '🚗', name: 'Transporte', spent: 620, budget: 800 },
    { id: 'mercado', ico: '🛒', name: 'Mercado', spent: 890, budget: 1000 },
    { id: 'saude', ico: '💊', name: 'Saúde', spent: 220, budget: 400 },
  ];

  const desejos = [
    { id: 'delivery', ico: '🍕', name: 'Delivery', spent: 312, budget: 300 },
    { id: 'lazer', ico: '🎬', name: 'Lazer', spent: 180, budget: 400 },
    { id: 'roupas', ico: '👕', name: 'Roupas', spent: 0, budget: 200 },
    { id: 'viagem', ico: '✈️', name: 'Viagem', spent: 450, budget: 600 },
  ];

  const poupanca = [
    { id: 'emergencia', ico: '🛡️', name: 'Emergência', spent: 800, budget: 800 },
    { id: 'investimentos', ico: '📈', name: 'Investimentos', spent: 1200, budget: 1200 },
    { id: 'educacao', ico: '🎓', name: 'Educação', spent: 0, budget: 200 },
    { id: 'imovel', ico: '🏡', name: 'Imóvel', spent: 200, budget: 200 },
  ];

  const totalAlocado = necessidades.reduce((s, e) => s + e.spent, 0) +
                       desejos.reduce((s, e) => s + e.spent, 0) +
                       poupanca.reduce((s, e) => s + e.spent, 0);

  const totalBudget = necessidades.reduce((s, e) => s + e.budget, 0) +
                      desejos.reduce((s, e) => s + e.budget, 0) +
                      poupanca.reduce((s, e) => s + e.budget, 0);

  const disponivel = totalBudget - totalAlocado;

  const renderEnvelope = (env: typeof necessidades[0]) => {
    const pct = Math.min((env.spent / env.budget) * 100, 100);
    const isOver = env.spent > env.budget;
    return (
      <div
        key={env.id}
        className="envelope"
        onClick={() => setSelectedEnvelope(env.id)}
      >
        <div className="env-emoji">{env.ico}</div>
        <div className="env-name">{env.name}</div>
        <div className="env-val" style={isOver ? { color: 'var(--red)' } : {}}>
          {fmt(env.spent)}
        </div>
        <div className="progress-bar" style={{ height: '4px' }}>
          <div
            className="progress-fill"
            style={{
              width: `${pct}%`,
              background: isOver ? 'var(--red)' : pct > 80 ? 'var(--amber)' : 'var(--green)',
            }}
          />
        </div>
        <div className="env-sub" style={isOver ? { color: 'var(--red)' } : {}}>
          {isOver ? `⚠ Estourou em R$ ${Math.abs(env.spent - env.budget)}` : `${fmt(env.spent)} de ${fmt(env.budget)}`}
        </div>
      </div>
    );
  };

  if (selectedEnvelope) {
    const allEnvs = [...necessidades, ...desejos, ...poupanca];
    const env = allEnvs.find((e) => e.id === selectedEnvelope)!;
    const isOver = env.spent > env.budget;
    const pct = Math.min((env.spent / env.budget) * 100, 100);

    return (
      <div style={{ paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
          <button
            onClick={() => setSelectedEnvelope(null)}
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              fontSize: '16px',
              cursor: 'pointer',
              color: 'var(--text2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ←
          </button>
          <div style={{ fontSize: '28px' }}>{env.ico}</div>
          <div>
            <div className="page-title" style={{ fontSize: '22px', margin: 0 }}>
              {env.name}
            </div>
            {isOver && <span className="badge badge-red">⚠ Estourou em R$ {Math.abs(env.spent - env.budget)}</span>}
          </div>
        </div>

        <div className="hero-card">
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
            Gasto vs. limite
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px' }}>
            <span style={{ fontSize: '34px', fontWeight: 700, color: isOver ? 'var(--red)' : 'var(--text1)' }} className="mono">
              {fmt(env.spent)}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text2)' }}>de {fmt(env.budget)}</span>
          </div>
          <div className="progress-bar" style={{ height: '6px' }}>
            <div
              className="progress-fill"
              style={{ width: `${pct}%`, background: isOver ? 'var(--red)' : 'var(--green)' }}
            />
          </div>
          {isOver && (
            <div className="info-strip" style={{ background: 'var(--red-dim)', marginTop: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Custo de oportunidade
              </div>
              Esse extra de R$ {Math.abs(env.spent - env.budget)}/mês = <strong style={{ color: 'var(--text1)' }}>R$ {(Math.abs(env.spent - env.budget) * 12 * 10).toLocaleString('pt-BR')}</strong> em 10 anos investido a 10% a.a.
            </div>
          )}
        </div>

        <div className="section-header">
          <span className="section-title">Realocação proativa</span>
        </div>
        <div className="card">
          <div style={{ fontSize: '13px', color: 'var(--text1)', marginBottom: '14px', lineHeight: 1.4 }}>
            Para qual envelope mover os R$ {Math.abs(env.spent - env.budget)} que faltam?
          </div>
          {desejos.filter((e) => e.id !== env.id && e.spent < e.budget).slice(0, 3).map((e) => (
            <div key={e.id} className="row-item" style={{ cursor: 'pointer' }}>
              <div className="row-icon">{e.ico}</div>
              <div className="row-main">
                <div className="row-title">{e.name}</div>
                <div className="row-sub">Sobra R$ {e.budget - e.spent}</div>
              </div>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid var(--border2)' }} />
            </div>
          ))}
          <button className="btn-primary" style={{ marginTop: '14px' }}>
            Confirmar realocação
          </button>
        </div>

        <div className="section-header">
          <span className="section-title">Transações</span>
        </div>
        <div className="card">
          {[
            ['iFood — Pizza', '12/06', '− R$ 89'],
            ['iFood — Japonês', '08/06', '− R$ 124'],
            ['Rappi', '03/06', '− R$ 67'],
            ['iFood — Hamburguer', '01/06', '− R$ 32'],
          ].map(([ti, dt, am]) => (
            <div key={ti} className="row-item">
              <div className="row-icon" style={{ background: 'var(--amber-dim)' }}>{env.ico}</div>
              <div className="row-main">
                <div className="row-title">{ti}</div>
                <div className="row-sub">{dt}</div>
              </div>
              <div className="row-amount" style={{ color: 'var(--red)' }}>{am}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        {onBack && (
          <button
            className="back-btn"
            onClick={() => onBack()}
          >
            ←
          </button>
        )}
        <div>
          <div className="page-eyebrow">Orçamento mensal</div>
          <div className="page-title" style={{ margin: 0 }}>Envelopes</div>
        </div>
      </div>
      <div className="page-sub" style={{ marginBottom: '14px' }}>
        Zero-based — cada real tem um emprego
      </div>

      <div className="card" style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Disponível para alocar</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--green)' }} className="mono">
            {fmt(disponivel)}
          </div>
        </div>
        <div className="progress-bar" style={{ height: '6px' }}>
          <div
            className="progress-fill"
            style={{
              width: `${(totalAlocado / totalBudget) * 100}%`,
              background: 'linear-gradient(90deg, #22D397, #4F9BFF)',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
          <span className="mono">Alocado: {fmt(totalAlocado)}</span>
          <span className="mono">Total: {fmt(totalBudget)}</span>
        </div>
      </div>

      <div className="section-header">
        <span className="section-title">Necessidades · 50%</span>
      </div>
      <div className="envelope-grid">{necessidades.map(renderEnvelope)}</div>

      <div className="section-header">
        <span className="section-title">Desejos · 30%</span>
      </div>
      <div className="envelope-grid">{desejos.map(renderEnvelope)}</div>

      <div className="section-header">
        <span className="section-title">Poupança · 20%</span>
      </div>
      <div className="envelope-grid">{poupanca.map(renderEnvelope)}</div>

      <div className="section-header">
        <span className="section-title">Ulysses Contract</span>
      </div>
      <div className="nudge-card good">
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--green)', marginBottom: '4px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          ✓ Regra ativa
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text1)', lineHeight: 1.5 }}>
          Se conta-corrente superar <strong>R$ 5.000</strong> no dia 10 → mover excedente para Investimentos automaticamente.
        </div>
        <button className="btn-secondary" style={{ marginTop: '10px', padding: '9px', fontSize: '12px' }}>
          Editar regra (48h carência)
        </button>
      </div>
    </div>
  );
};