/**
 * OpenFinanceSandbox.tsx
 * ──────────────────────
 * Simula o fluxo OAuth do Open Finance (Banco Central) para demonstrações
 * enterprise sem necessidade de CNPJ/credenciais reais.
 *
 * O fluxo cobre: Seleção de banco → Consent screen → Sincronização → Dashboard
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, CheckCircle2, Loader2, AlertCircle,
  Wifi, Lock, ChevronRight, RefreshCw, X, ArrowRight,
  CreditCard, TrendingUp, Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showSuccess } from '@/lib/toast';

interface Bank {
  id: string;
  name: string;
  logo: string;
  color: string;
}

interface SandboxAccount {
  bank: string;
  type: string;
  balance: number;
  agency: string;
  account: string;
}

const SANDBOX_BANKS: Bank[] = [
  { id: 'bb', name: 'Banco do Brasil', logo: '🏦', color: '#F9CB28' },
  { id: 'itau', name: 'Itaú Unibanco', logo: '🦁', color: '#EC7000' },
  { id: 'bradesco', name: 'Bradesco', logo: '🌹', color: '#CC092F' },
  { id: 'nubank', name: 'Nubank', logo: '💜', color: '#8A05BE' },
  { id: 'caixa', name: 'Caixa Econômica', logo: '🏛', color: '#005CA9' },
  { id: 'santander', name: 'Santander', logo: '🔴', color: '#EC0000' },
];

type FlowStep = 'select' | 'consent' | 'authenticating' | 'syncing' | 'done' | 'error';

interface OpenFinanceSandboxProps {
  onClose: () => void;
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export const OpenFinanceSandbox = ({ onClose }: OpenFinanceSandboxProps) => {
  const [step, setStep] = useState<FlowStep>('select');
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [progress, setProgress] = useState(0);
  const [accounts, setAccounts] = useState<SandboxAccount[]>([]);

  // Sandbox data gerada com base no banco selecionado
  const generateSandboxAccounts = (bank: Bank): SandboxAccount[] => [
    {
      bank: bank.name,
      type: 'Conta Corrente PJ',
      balance: Math.round(18000 + Math.random() * 30000),
      agency: '0001',
      account: `${Math.floor(10000 + Math.random() * 89999)}-${Math.floor(1 + Math.random() * 9)}`,
    },
    {
      bank: bank.name,
      type: 'Poupança PJ',
      balance: Math.round(5000 + Math.random() * 12000),
      agency: '0001',
      account: `${Math.floor(10000 + Math.random() * 89999)}-${Math.floor(1 + Math.random() * 9)}`,
    },
    {
      bank: bank.name,
      type: 'Cartão de Crédito',
      balance: -(Math.round(1500 + Math.random() * 4000)),
      agency: 'N/A',
      account: `•••• •••• •••• ${Math.floor(1000 + Math.random() * 8999)}`,
    },
  ];

  // Step: Autenticando (simula chamada OAuth)
  useEffect(() => {
    if (step !== 'authenticating') return;
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep('syncing'), 300);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [step]);

  // Step: Sincronizando contas
  useEffect(() => {
    if (step !== 'syncing') return;
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(interval);
        if (selectedBank) {
          setAccounts(generateSandboxAccounts(selectedBank));
        }
        setTimeout(() => {
          setStep('done');
          showSuccess('Contas conectadas via Open Finance! (Sandbox)');
        }, 400);
      }
    }, 250);
    return () => clearInterval(interval);
  }, [step, selectedBank]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-[#080e1f] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-black/60"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Wifi size={18} className="text-blue-400" />
            </div>
            <div>
              <div className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Banco Central do Brasil</div>
              <div className="text-[15px] font-black text-white">Open Finance Sandbox</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-full">
              DEMO
            </span>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1 — Selecionar Banco */}
            {step === 'select' && (
              <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-[13px] text-white/60 mb-5 leading-relaxed">
                  Selecione a instituição financeira para autorizar o compartilhamento de dados via Open Finance.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {SANDBOX_BANKS.map(bank => (
                    <button
                      key={bank.id}
                      onClick={() => { setSelectedBank(bank); setStep('consent'); }}
                      className="flex items-center gap-3 px-4 py-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all text-left group"
                    >
                      <span className="text-2xl">{bank.logo}</span>
                      <span className="text-[12px] font-bold text-white/80 group-hover:text-white transition-colors">{bank.name}</span>
                      <ChevronRight size={12} className="text-white/30 group-hover:text-white/60 ml-auto transition-colors" />
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-2 text-[11px] text-white/30">
                  <Lock size={11} />
                  <span>Conexão criptografada · Padrão BACEN 2024</span>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Tela de Consentimento */}
            {step === 'consent' && selectedBank && (
              <motion.div key="consent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                  <span className="text-3xl">{selectedBank.logo}</span>
                  <div>
                    <div className="text-[13px] font-black text-white">{selectedBank.name}</div>
                    <div className="text-[11px] text-white/50">Aguardando sua autorização</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[12px] text-white/60 font-bold uppercase tracking-widest">O Meu Contador irá acessar:</p>
                  {[
                    { icon: Banknote, label: 'Saldo e extrato de contas' },
                    { icon: CreditCard, label: 'Faturas de cartão de crédito' },
                    { icon: TrendingUp, label: 'Movimentações financeiras (90 dias)' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                      <Icon size={14} className="text-blue-400 shrink-0" />
                      <span className="text-[12px] text-white/70">{label}</span>
                      <CheckCircle2 size={12} className="text-emerald-400 ml-auto shrink-0" />
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-white/35 leading-relaxed">
                  Esta autorização expira em 12 meses. Você pode revogar a qualquer momento nas configurações.
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep('select')} className="flex-1 border-white/10 text-white/60 hover:text-white rounded-2xl h-12">
                    Voltar
                  </Button>
                  <Button onClick={() => setStep('authenticating')} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl h-12">
                    Autorizar <ArrowRight size={14} className="ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Autenticando */}
            {step === 'authenticating' && (
              <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Loader2 size={36} className="text-blue-400 animate-spin" />
                </div>
                <div>
                  <p className="text-[16px] font-black text-white">Autenticando via OAuth 2.0...</p>
                  <p className="text-[12px] text-white/40 mt-1">Redirecionando para {selectedBank?.name}</p>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <div className="flex items-center justify-center gap-2 text-[11px] text-white/30">
                  <Shield size={11} />
                  <span>Conexão segura TLS 1.3 · {selectedBank?.name}</span>
                </div>
              </motion.div>
            )}

            {/* Step 4 — Sincronizando Contas */}
            {step === 'syncing' && (
              <motion.div key="sync" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8 text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <RefreshCw size={36} className="text-emerald-400 animate-spin" />
                </div>
                <div>
                  <p className="text-[16px] font-black text-white">Sincronizando contas...</p>
                  <p className="text-[12px] text-white/40 mt-1">Importando dados bancários</p>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    style={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 5 — Concluído */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[16px] font-black text-white">Contas conectadas!</p>
                    <p className="text-[11px] text-white/40">{selectedBank?.name} · Open Finance • Sandbox</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {accounts.map((acc, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03] border border-white/10">
                      <div>
                        <div className="text-[12px] font-black text-white">{acc.type}</div>
                        <div className="text-[10px] text-white/40 mt-0.5">Ag: {acc.agency} · Cc: {acc.account}</div>
                      </div>
                      <div className={`text-[14px] font-black font-mono ${acc.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {fmtBRL(acc.balance)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/30">
                  <AlertCircle size={10} />
                  <span>Dados sandbox fictícios — nenhuma informação real foi acessada</span>
                </div>
                <Button onClick={onClose} className="w-full bg-emerald-600 hover:bg-emerald-500 font-black rounded-2xl h-12">
                  Fechar — Contas Integradas
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
