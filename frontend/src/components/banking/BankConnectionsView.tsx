import React, { useEffect, useState } from 'react';
import { useOpenFinance, BankConnection } from '@/hooks/useOpenFinance';
import { PluggyConnect } from 'react-pluggy-connect';
import { Landmark, AlertCircle, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';

export const BankConnectionsView = () => {
  const { connections, isLoading, fetchConnections, getConnectToken, forceSync } = useOpenFinance();
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleConnectNew = async () => {
    try {
      showSuccess('Gerando token seguro de conexão...');
      const token = await getConnectToken();
      setConnectToken(token);
    } catch (err: any) {
      showError(err.message || 'Erro ao conectar Open Finance');
    }
  };

  const handleSync = async (itemId: string) => {
    setIsSyncing(itemId);
    try {
      await forceSync(itemId);
      showSuccess('Sincronização concluída com sucesso!');
    } catch (err: any) {
      showError(err.message);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleOnSuccess = (itemData: any) => {
    console.log("Item conectado com sucesso:", itemData);
    setConnectToken(null);
    showSuccess('Conexão estabelecida! Importando dados em plano de fundo...');
    // Pode forçar sync manual aqui ou deixar que o webhook cuide do `item/updated`
    handleSync(itemData.item.id);
  };

  const handleOnError = (error: any) => {
    console.error("Erro no Widget do Pluggy (Detalhes):", JSON.stringify(error, null, 2));
    setConnectToken(null);
    if (error?.message?.includes('closed') || error?.type === 'USER_ACTION_CANCELED') {
       // Apenas fechou
       return;
    }
    showError(`Erro Oculto do Widget: ${error?.message || 'Cancelado'}`);
  };

  return (
    <div style={{ animation: "fsu 0.25s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div className="eyebrow">Open Finance</div>
          <div className="page-title" style={{ margin: 0, fontSize: "20px" }}>Bancos Conectados</div>
        </div>
        <button 
          onClick={handleConnectNew}
          className="btn-p" 
          style={{ padding: "8px 14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} /> Nova Conexão
        </button>
      </div>

      <div className="istrip" style={{ background: "rgba(74,139,255,0.08)", border: "1px solid rgba(74,139,255,0.2)", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <Landmark size={20} color="var(--blue)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <div style={{ fontSize: "13px", color: "var(--t2)", lineHeight: 1.5 }}>
          Conecte suas contas bancárias de forma segura para importar transações e consolidar seu patrimônio automaticamente.
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t3)", fontSize: "14px", fontFamily: "var(--mono)" }}>Carregando integrações...</div>
      ) : connections.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--glass2)", borderRadius: "16px", border: "1px dashed var(--border)" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🔗</div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--t1)", marginBottom: "6px" }}>Nenhuma conta conectada</div>
          <div style={{ fontSize: "13px", color: "var(--t3)", marginBottom: "20px", maxWidth: "260px", margin: "0 auto 20px" }}>Inicie a jornada Open Finance para automatizar seu fluxo de caixa.</div>
          <button onClick={handleConnectNew} className="btn-p" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <Landmark size={18} /> Conectar Conta Bancária
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {connections.map((conn) => {
            const totalBalance = conn.accounts.reduce((acc, a) => acc + a.balance, 0);
            
            return (
              <div key={conn.id} className="card" style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {conn.accounts[0]?.bankImageUrl ? (
                      <img src={conn.accounts[0].bankImageUrl} alt="Bank Logo" style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid var(--border)" }} />
                    ) : (
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--glass2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t3)" }}>🏦</div>
                    )}
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--t1)" }}>{conn.accounts[0]?.bankName || 'Instituição'}</div>
                      <div style={{ fontSize: "11px", color: "var(--t3)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                        {conn.status === 'UPDATED' ? <CheckCircle2 size={12} color="var(--green)" /> : <AlertCircle size={12} color="var(--amber)" />}
                        {conn.status}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSync(conn.pluggyItemId)}
                    disabled={isSyncing === conn.pluggyItemId}
                    style={{ background: "none", border: "none", color: "var(--blue)", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", opacity: isSyncing === conn.pluggyItemId ? 0.5 : 1 }}
                  >
                    <RefreshCw size={14} className={isSyncing === conn.pluggyItemId ? "spin" : ""} /> Sync
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {conn.accounts.map(acc => (
                    <div key={acc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--bg)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--t1)" }}>{acc.name}</div>
                        <div style={{ fontSize: "10px", color: "var(--t3)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "1px" }}>{acc.type} • {acc.subtype}</div>
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--t1)", fontFamily: "var(--mono)" }}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: (acc as any).currencyCode || 'BRL' }).format(acc.balance)}
                      </div>
                    </div>
                  ))}
                </div>
                
                {conn.lastSyncAt && (
                  <div style={{ fontSize: "10.5px", color: "var(--t3)", marginTop: "12px", textAlign: "right" }}>
                    Última sincronização: {new Date(conn.lastSyncAt).toLocaleString('pt-BR')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Renderiza o Widget do Pluggy se tiver hook aprovado */}
      {connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={handleOnSuccess}
          onError={handleOnError}
          {...( { onClose: () => setConnectToken(null) } as any )}
        />
      )}
    </div>
  );
};
