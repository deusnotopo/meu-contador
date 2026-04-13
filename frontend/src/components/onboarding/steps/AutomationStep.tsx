import { useOnboarding } from "../OnboardingContext";
import { Switch } from "@/components/ui/switch";
import { Bell, BellRing, Check } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";

export function AutomationStep() {
  const { profile, reminders, setReminders, pushGranted, setPushGranted, preferences, setPreferences, strategyRules } = useOnboarding();
  type PreferenceKey = keyof typeof preferences;

  return (
    <div className="space-y-6 pt-6">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold">Piloto Automático</h2>
        <p className="text-white/50">Ative e edite as contas que a IA vai te lembrar.</p>
      </div>

      <div className="space-y-3 max-h-[360px] overflow-y-auto px-1 pr-2 hide-scrollbar">
        {reminders.map((r, i) => (
          <div
            key={i}
            className={`rounded-2xl border transition-all ${
              r.enabled ? "bg-white/10 border-white/20" : "bg-white/5 border-white/5"
            }`}
          >
            {/* Toggle row */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => {
                const newR = [...reminders];
                if (newR[i]) { newR[i].enabled = !newR[i].enabled; setReminders(newR); }
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.enabled ? "bg-indigo-500" : "bg-white/5"}`}>
                  <Bell size={14} className={r.enabled ? "text-white" : "text-white/20"} />
                </div>
                <div>
                  <p className="font-bold text-sm">{r.name}</p>
                  <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">
                    {(r.amount || 0) > 0 ? `R$ ${(r.amount || 0).toLocaleString('pt-BR')} · ` : ""}Dia {r.dueDay}
                  </p>
                </div>
              </div>
              <Switch checked={r.enabled} onCheckedChange={() => {
                const newR = [...reminders];
                if (newR[i]) { newR[i].enabled = !newR[i].enabled; setReminders(newR); }
              }} />
            </div>

            {/* Editable fields — only when enabled */}
            {r.enabled && (
              <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Nome</label>
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) => {
                      const newR = [...reminders];
                      if (newR[i]) { newR[i].name = e.target.value; setReminders(newR); }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 font-medium"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Valor (R$)</label>
                  <input
                    type="number"
                    value={r.amount || ""}
                    placeholder="0"
                    onChange={(e) => {
                      const newR = [...reminders];
                      if (newR[i]) { newR[i].amount = Number(e.target.value); setReminders(newR); }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 font-medium"
                  />
                </div>
                <div className="col-span-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1 block">Dia Vcto.</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={r.dueDay}
                    onChange={(e) => {
                      const newR = [...reminders];
                      if (newR[i]) { newR[i].dueDay = Number(e.target.value); setReminders(newR); }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/60 font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Adicionar conta personalizada */}
        <button
          type="button"
          onClick={() => {
            setReminders([...reminders, {
              name: "Nova Conta",
              amount: 0,
              dueDay: 10,
              category: "Outros",
              enabled: true,
            }]);
          }}
          className="w-full py-3 rounded-2xl border border-dashed border-white/20 text-white/40 text-sm font-semibold hover:border-indigo-500/50 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-lg">＋</span> Adicionar conta personalizada
        </button>

        {/* ── Push Notification Banner ── */}
        <div className="mt-4 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <BellRing size={20} className="text-indigo-400" />
            </div>
            <div>
              <p className="font-bold text-sm">Notificações Inteligentes</p>
              <p className="text-xs text-white/50">Receba alertas 1 dia antes de cada vencimento</p>
            </div>
          </div>
          {pushGranted ? (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold">
              <Check size={16} /> Notificações ativadas neste aparelho!
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  if (typeof Notification === 'undefined') {
                    showError('Seu navegador não suporta notificações neste momento.');
                    return;
                  }
                  const permission = await Notification.requestPermission();
                  if (permission === 'granted' && 'serviceWorker' in navigator) {
                    setPushGranted(true);
                    showSuccess('Notificações ativadas! Você não vai mais perder nenhum vencimento.');
                  } else if (permission === 'denied') {
                    showError('Permissão negada. Você pode ativar notificações depois nas configurações do navegador.');
                  }
                } catch (_e) {
                  showError('Não foi possível ativar notificações agora.');
                }
              }}
              className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm transition-all active:scale-95"
            >
              🔔 Ativar Alertas Automáticos
            </button>
          )}
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
          <div>
            <p className="font-bold text-sm">Preferências do painel</p>
            <p className="text-xs text-white/45">Escolha o que quer ver logo no primeiro acesso.</p>
          </div>

          {[
            { key: 'showScore', label: 'Mostrar score financeiro', sub: 'Exibe o score e evolução no painel' },
            { key: 'showPredictions', label: 'Mostrar previsões', sub: 'Ativa projeções e sugestões automáticas' },
            { key: 'weeklyReport', label: 'Receber resumo semanal', sub: 'Resumo da semana financeira no app' },
            { key: 'alerts', label: 'Receber alertas importantes', sub: 'Avisos sobre vencimentos e atenção financeira' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 border border-white/5 p-4">
              <div>
                <p className="text-sm font-semibold text-white">{item.label}</p>
                <p className="text-[10px] text-white/40 mt-1">{item.sub}</p>
              </div>
              <Switch
                checked={preferences[item.key as keyof typeof preferences]}
                onCheckedChange={(checked) =>
                  setPreferences((prev: typeof preferences) => ({ ...prev, [item.key as PreferenceKey]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
          <p className="text-xs font-bold text-purple-200">Marco de progresso</p>
          <p className="text-[11px] text-white/60 mt-1">
            Ao concluir esta etapa, você desbloqueia seu painel inicial com lembretes e preferências aplicadas.
          </p>
        </div>
      </div>

      {/* ── Provisões Sazonais IPVA/IPTU ── */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <span className="text-xl">📅</span>
          </div>
          <div>
            <p className="font-bold text-sm">Provisões Sazonais</p>
            <p className="text-xs text-white/50">Reserve mensalmente para não ser pego de surpresa</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { label: 'IPVA (auto)', emoji: '🚗', monthly: Math.round((profile.monthlyIncome || 3000) * 0.02 / 12 * 100) / 100 },
            { label: 'IPTU (imóvel)', emoji: '🏠', monthly: Math.round((profile.monthlyIncome || 3000) * 0.04 / 12 * 100) / 100 },
            { label: 'Matrícula escolar', emoji: '🎒', monthly: Math.round((profile.monthlyIncome || 3000) * 0.03 / 12 * 100) / 100, hide: (profile.dependents || 0) === 0 },
            { label: '13° / Gratificação', emoji: '🎁', monthly: Math.round((profile.monthlyIncome || 3000) / 12 * 100) / 100, clt: true },
          ].filter(p => !p.hide && (!p.clt || profile.employmentType !== 'pj')).map(provision => (
            <div key={provision.label} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <span>{provision.emoji}</span>
                <span>{provision.label}</span>
              </div>
              <div className="text-sm font-black text-amber-300">
                {provision.monthly.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-white/30 text-center">
          Total já incluído na sua alíquota de <strong>Futuro {(strategyRules?.pF * 100 || 20).toFixed(0)}%</strong>
        </p>
      </div>
    </div>
  );
}
