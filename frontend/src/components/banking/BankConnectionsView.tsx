import { useEffect, useState } from 'react';
import { useOpenFinance } from '@/hooks/useOpenFinance';
import { PluggyConnect } from 'react-pluggy-connect';
import { Landmark, AlertCircle, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';

interface PluggyWidgetSuccess {
  item: { id: string };
}

interface PluggyWidgetError {
  message?: string;
  type?: string;
}

interface AccountWithCurrencyCode {
  currencyCode?: string;
}

export const BankConnectionsView = () => {
  const { connections, isLoading, fetchConnections, getConnectToken, forceSync } = useOpenFinance();
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  useEffect(() => { fetchConnections(); }, [fetchConnections]);

  const handleConnectNew = async () => {
    try {
      showSuccess('Gerando token seguro de conexão...');
      setConnectToken(await getConnectToken());
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Erro ao conectar Open Finance');
    }
  };

  const handleSync = async (itemId: string) => {
    setIsSyncing(itemId);
    try {
      await forceSync(itemId);
      showSuccess('Sincronização concluída com sucesso!');
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Falha ao sincronizar');
    } finally {
      setIsSyncing(null);
    }
  };

  const handleOnSuccess = (itemData: PluggyWidgetSuccess) => {
    setConnectToken(null);
    showSuccess('Conexão estabelecida! Importando dados em plano de fundo...');
    handleSync(itemData.item.id);
  };

  const handleOnError = (error: PluggyWidgetError) => {
    setConnectToken(null);
    if (error?.message?.includes('closed') || error?.type === 'USER_ACTION_CANCELED') return;
    showError(`Erro Oculto do Widget: ${error?.message || 'Cancelado'}`);
  };

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="eyebrow">Open Finance</div>
          <div className="page-title text-[20px] m-0">Bancos Conectados</div>
        </div>
        <button
          onClick={handleConnectNew}
          className="btn-p flex items-center gap-1.5 px-3.5 py-2 text-[13px]"
        >
          <Plus size={16} /> Nova Conexão
        </button>
      </div>

      {/* Info strip */}
      <div className="istrip mb-5 bg-blue-500/[0.08] border border-blue-500/20 flex gap-3 items-start">
        <Landmark size={20} color="var(--blue)" className="shrink-0 mt-0.5" />
        <div className="text-[13px] text-[var(--t2)] leading-relaxed">
          Conecte suas contas bancárias de forma segura para importar transações e consolidar seu patrimônio automaticamente.
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-10 text-[var(--t3)] text-[14px] font-mono">Carregando integrações...</div>
      ) : connections.length === 0 ? (
        <div className="text-center py-16 px-5 bg-[var(--glass2)] rounded-2xl border border-dashed border-[var(--border)]">
          <div className="text-[40px] mb-4">🔗</div>
          <div className="text-[15px] font-semibold text-[var(--t1)] mb-1.5">Nenhuma conta conectada</div>
          <div className="text-[13px] text-[var(--t3)] mb-5 max-w-[260px] mx-auto">
            Inicie a jornada Open Finance para automatizar seu fluxo de caixa.
          </div>
          <button onClick={handleConnectNew} className="btn-p inline-flex items-center gap-2">
            <Landmark size={18} /> Conectar Conta Bancária
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {connections.map(conn => (
            <div key={conn.id} className="card p-4">
              {/* Connection header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2.5 items-center">
                  {conn.accounts[0]?.bankImageUrl ? (
                    <img
                      src={conn.accounts[0].bankImageUrl}
                      alt="Bank Logo"
                      className="w-9 h-9 rounded-[10px] border border-[var(--border)] object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-[10px] bg-[var(--glass2)] border border-[var(--border)] flex items-center justify-center text-[var(--t3)]">
                      🏦
                    </div>
                  )}
                  <div>
                    <div className="text-[15px] font-bold text-[var(--t1)]">
                      {conn.accounts[0]?.bankName || 'Instituição'}
                    </div>
                    <div className="text-[11px] text-[var(--t3)] flex items-center gap-1 mt-0.5">
                      {conn.status === 'UPDATED'
                        ? <CheckCircle2 size={12} color="var(--green)" />
                        : <AlertCircle size={12} color="var(--amber)" />}
                      {conn.status}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleSync(conn.pluggyItemId)}
                  disabled={isSyncing === conn.pluggyItemId}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--blue)] bg-transparent border-none cursor-pointer font-[var(--font)] disabled:opacity-50 hover:text-blue-300 transition-colors"
                >
                  <RefreshCw size={14} className={isSyncing === conn.pluggyItemId ? "animate-spin" : ""} /> Sync
                </button>
              </div>

              {/* Accounts */}
              <div className="flex flex-col gap-0.5">
                {conn.accounts.map(acc => (
                  <div
                    key={acc.id}
                    className="flex justify-between items-center px-2.5 py-2 bg-[var(--bg)] rounded-lg border border-[var(--border)]"
                  >
                    <div>
                      <div className="text-[13px] font-semibold text-[var(--t1)]">{acc.name}</div>
                      <div className="text-[10px] text-[var(--t3)] uppercase tracking-[0.05em] mt-px">
                        {acc.type} • {acc.subtype}
                      </div>
                    </div>
                    <div className="text-[14px] font-bold text-[var(--t1)] font-mono">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: (acc as AccountWithCurrencyCode).currencyCode || 'BRL',
                      }).format(acc.balance)}
                    </div>
                  </div>
                ))}
              </div>

              {conn.lastSyncAt && (
                <div className="text-[10.5px] text-[var(--t3)] mt-3 text-right">
                  Última sincronização: {new Date(conn.lastSyncAt).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pluggy Widget */}
      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={handleOnSuccess}
          onError={handleOnError}
        />
      )}
    </div>
  );
};
