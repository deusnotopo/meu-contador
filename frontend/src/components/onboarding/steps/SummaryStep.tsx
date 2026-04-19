import { memo, useCallback, useMemo, useState } from 'react';
import { useOnboarding } from '../OnboardingContext';
import { Target, Shield, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { SummaryItem } from '../StepCards';
import { formatCurrency } from '@/lib/formatters';
import { api } from '@/lib/api';
import { showSuccess, showError } from '@/lib/toast';
import { useAuth } from '@/context/AuthContext';

interface AcademySignalResult {
  title: string;
  reason: string;
  emoji: string;
  color: string;
}

function getAcademySignal(profile: {
  hasDebts?: boolean;
  hasEmergencyFund?: boolean;
  employmentType?: string;
  financialGoal?: string;
}): AcademySignalResult {
  if (profile.hasDebts)
    return {
      title: "Quitação Inteligente de Dívidas",
      reason:
        "Você indicou que possui dívidas. Quitar antes de investir é a estratégia mais rentável.",
      emoji: "🛑",
      color: "rose",
    };
  if (!profile.hasEmergencyFund)
    return {
      title: "Construindo sua Reserva de Emergência",
      reason:
        "Sem reserva, qualquer imprevisto vira dívida. Esse é o passo mais importante agora.",
      emoji: "🛡️",
      color: "amber",
    };
  if (profile.employmentType === "pj")
    return {
      title: "Finanças do PJ: Pró-labore e CNPJ",
      reason:
        "Como PJ, separar pessoa física de jurídica protege seu patrimônio e reduz imposto.",
      emoji: "🏢",
      color: "indigo",
    };
  if (
    profile.financialGoal === "invest" ||
    profile.financialGoal === "retire"
  )
    return {
      title: "Primeiro Aporte: Do Zero ao Mercado",
      reason:
        "Você quer investir. Começar pelo básico de renda fixa e tesouro é o caminho mais seguro.",
      emoji: "📈",
      color: "emerald",
    };
  return {
    title: "Orçamento Consciente: Método 50/30/20",
    reason:
      "Uma base financeira sólida começa com um orçamento que você de fato consegue seguir.",
    emoji: "📊",
    color: "indigo",
  };
}

export const SummaryStep = memo(function SummaryStep() {
  const { user } = useAuth();
  const {
    profile,
    strategyRules,
    inviteEmail,
    setInviteEmail,
    inviteSent,
    setInviteSent,
  } = useOnboarding();
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const academySignal = useMemo(
    () =>
      getAcademySignal({
        hasDebts: profile.hasDebts,
        hasEmergencyFund: profile.hasEmergencyFund,
        employmentType: profile.employmentType,
        financialGoal: profile.financialGoal,
      }),
    [
      profile.hasDebts,
      profile.hasEmergencyFund,
      profile.employmentType,
      profile.financialGoal,
    ]
  );

  const isPJ = profile.employmentType === 'pj';
  const hasDebts = !!profile.hasDebts;
  const noReserve = !profile.hasEmergencyFund;
  const savingsCapacity = profile.monthlyIncome * strategyRules.pF;

  const statusLabel = hasDebts
    ? "⚠️ Prioridade: Quitar Dívidas"
    : noReserve
    ? "🛡️ Prioridade: Construir Reserva"
    : "🚀 Pronto para Crescer";
  const statusBg = hasDebts
    ? "bg-rose-500/10 border-rose-500/30"
    : noReserve
    ? "bg-amber-500/10 border-amber-500/30"
    : "bg-emerald-500/10 border-emerald-500/30";
  const statusText = hasDebts
    ? "text-rose-400"
    : noReserve
    ? "text-amber-400"
    : "text-emerald-400";
  const activeWorkspaceId = user?.currentWorkspaceId;
  const canInviteToWorkspace = Boolean(activeWorkspaceId && activeWorkspaceId !== user?.id && activeWorkspaceId !== user?.uid);
  const isInviteEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim());

  const handleInviteEmailChange = useCallback((value: string) => {
    setInviteEmail(value);
  }, [setInviteEmail]);

  const handleSendInvite = useCallback(async () => {
    if (!activeWorkspaceId || !isInviteEmailValid || isSendingInvite) return;
    try {
      setIsSendingInvite(true);
      await api.post(`/workspace/${activeWorkspaceId}/invite`, {
        email: inviteEmail,
        role: "viewer",
      });
      setInviteSent(true);
      showSuccess(`Convite enviado para ${inviteEmail}!`);
    } catch (_e) {
      showError("Não foi possível enviar o convite agora.");
    } finally {
      setIsSendingInvite(false);
    }
  }, [activeWorkspaceId, inviteEmail, isInviteEmailValid, isSendingInvite, setInviteSent]);

  return (
    <div className="space-y-6 pt-6">
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40"
        >
          <Target size={36} className="text-white" />
        </motion.div>
        <h2 className="text-3xl font-black">Diagnóstico Pronto!</h2>
        <p className="text-white/50 text-sm">
          Perfil{" "}
          <span className="font-bold text-white">
            {isPJ ? "Empresário PJ" : "CLT"}
          </span>
          {profile.age ? `, ${profile.age} anos` : ""}
          {(profile.dependents ?? 0) > 0
            ? `, ${profile.dependents} dependente${
                (profile.dependents ?? 0) > 1 ? "s" : ""
              }`
            : ""}
        </p>
      </div>

      {/* Status Banner Contextual */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`p-4 rounded-2xl border flex items-center gap-3 ${statusBg}`}
      >
        <span className={`text-lg font-black ${statusText}`}>
          {statusLabel}
        </span>
      </motion.div>

      {/* Dados Financeiros */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-3"
      >
        <SummaryItem label="Regra de Alocação" value={strategyRules.ruleName} />
        <SummaryItem
          label="Renda Mensal"
          value={formatCurrency(profile.monthlyIncome)}
        />
        <SummaryItem
          label={
            hasDebts ? "⚠️ Direcionar para Dívidas" : "Capacidade de Aporte"
          }
          value={formatCurrency(savingsCapacity)}
          highlight={!hasDebts}
          danger={hasDebts}
        />
        <SummaryItem
          label="Reserva de Emergência"
          value={`${strategyRules.reserveMonths} meses · ${formatCurrency(
            strategyRules.reserveTarget
          )}`}
        />
        {hasDebts && (
          <div className="pt-2 text-xs text-rose-300 flex items-start gap-2 border-t border-white/5">
            <span>🔴</span>
            <span>
              Recomendamos quitar dívidas antes de investir. Cada R$1 em juros é
              prejuízo direto.
            </span>
          </div>
        )}
        {noReserve && !hasDebts && (
          <div className="pt-2 text-xs text-amber-300 flex items-start gap-2 border-t border-white/5">
            <span>⚡</span>
            <span>
              Construir a reserva primeiro protege você de voltar ao zero em
              imprevistos.
            </span>
          </div>
        )}
      </motion.div>

      {/* Card de Recomendação da Academia */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`p-5 rounded-2xl border ${
          academySignal.color === "rose"
            ? "bg-rose-500/10 border-rose-500/20"
            : academySignal.color === "amber"
            ? "bg-amber-500/10 border-amber-500/20"
            : academySignal.color === "emerald"
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-indigo-500/10 border-indigo-500/20"
        }`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{academySignal.emoji}</span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
              Seu primeiro módulo em Aprender
            </p>
            <p className="font-bold text-sm text-white leading-tight mb-1.5">
              {academySignal.title}
            </p>
            <p className="text-xs text-white/50 leading-relaxed">
              {academySignal.reason}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Badge de Segurança e Backup */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
          <Shield size={18} className="text-emerald-400" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-bold text-white">
            Seus dados estão 100% protegidos
          </p>
          <ul className="text-[10px] text-white/40 space-y-0.5">
            <li>• Dados protegidos com controles de segurança da plataforma</li>
            <li>• Tratamento sujeito às políticas de privacidade e LGPD do produto</li>
            <li>• Rotinas de backup e retenção conforme ambiente configurado</li>
            <li>
              • Exclusão completa da conta a qualquer momento (Perfil → Excluir
              Conta)
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Convite de Parceiro ou Sócio */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <span className="text-lg">👥</span>
          </div>
          <div>
            <p className="font-bold text-sm">Gerenciar junto com alguém?</p>
            <p className="text-xs text-white/40">
              Convide seu cônjuge ou sócio para compartilhar o painel
            </p>
          </div>
        </div>
        {inviteSent ? (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
            <Check size={16} /> Convite enviado com sucesso!
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => handleInviteEmailChange(e.target.value)}
              placeholder="email@exemplo.com"
              aria-invalid={inviteEmail.length > 0 && !isInviteEmailValid}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-purple-500/50"
            />
            <button
              type="button"
              disabled={!canInviteToWorkspace || !isInviteEmailValid || isSendingInvite}
              onClick={handleSendInvite}
              className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs transition-all"
            >
              {isSendingInvite ? 'Enviando...' : 'Convidar'}
            </button>
          </div>
        )}
        <p className="text-[10px] text-white/30">
          {canInviteToWorkspace
            ? 'Disponível para o workspace compartilhado ativo.'
            : 'Convites liberados quando houver um workspace compartilhado ativo.'}
        </p>
        {inviteEmail.length > 0 && !isInviteEmailValid && !inviteSent && (
          <p className="text-[10px] text-rose-300">Informe um e-mail válido para enviar o convite.</p>
        )}
      </motion.div>
    </div>
  );
});