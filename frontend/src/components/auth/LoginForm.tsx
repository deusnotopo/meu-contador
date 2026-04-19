import { ErrorService } from "@/services/ErrorService";
import { useAuth } from "@/context/AuthContext";
import { showError, showSuccess } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://meu-contador-iyut.onrender.com");

export const LoginForm = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [domainError, setDomainError] = useState(false);
  const [serverWaking, setServerWaking] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const warmup = async () => {
      try {
        await fetch(`${API_URL}/health`, { method: "GET", signal: AbortSignal.timeout(15000) });
      } catch { /* silent */ }
    };
    warmup();
  }, []);

  useEffect(() => {
    setTimeout(() => emailRef.current?.focus(), 400);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return showError("Preencha todos os campos.");

    setLoading(true);
    setServerWaking(false);
    try {
      if (isRegistering) {
        await register(email, password, name || undefined);
        showSuccess("Conta criada! Bem-vindo ao FinApp 🎉");
      } else {
        await login(email, password);
        showSuccess("Bem-vindo de volta!");
      }
    } catch (err: unknown) {
      console.error("Auth Error:", err);
      const appError = ErrorService.normalize(err);
      
      // Caso especial para despertar o servidor (503/Timeout)
      if (appError.category === 'SERVER' || appError.category === 'NETWORK') {
        setServerWaking(true);
      }
      
      showError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setDomainError(false);
    try {
      await loginWithGoogle();
      showSuccess("Conectado com Google!");
    } catch (err: unknown) {
      console.error("Google Login Error:", err);
      const appError = ErrorService.normalize(err);
      
      if (appError.code === "auth/unauthorized-domain") {
        setDomainError(true);
      }
      
      showError(appError.message);
    } finally {
      setLoading(false);
    }
  };

  const inputBase = "w-full h-12 bg-white/[0.055] border-white/[0.11] rounded-2xl text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50";
  const inputFocus = (f: string) => focused === f ? "bg-indigo-500/[0.06] shadow-[0_0_0_3px_rgba(74,139,255,0.08)]" : "";
  const labelCls = "block text-[10px] font-bold text-[var(--t4)] uppercase tracking-wider mb-2";

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes loginPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .login-orb { animation: loginPulse 6s ease-in-out infinite; }
        .login-orb-2 { animation: loginPulse 8s ease-in-out infinite 1s; }
        .login-orb-3 { animation: loginPulse 7s ease-in-out infinite 2s; }
        .login-toggle:hover { color: #F0F4FF !important; }
      `}</style>

      <div className="min-h-screen w-full bg-[#04070F] flex items-center justify-center px-4 py-8 relative overflow-hidden font-[DM_Sans,sans-serif]"
        style={{ backgroundImage: `radial-gradient(ellipse 80% 60% at 10% 10%, rgba(74,139,255,0.04) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 90%, rgba(155,127,255,0.03) 0%, transparent 60%)` }}>

        {/* Ambient orbs */}
        <div className="login-orb pointer-events-none absolute top-[10%] left-[5%] w-80 h-80 rounded-full bg-[radial-gradient(circle,rgba(74,139,255,0.07)_0%,transparent_70%)]" />
        <div className="login-orb-2 pointer-events-none absolute bottom-[8%] right-[3%] w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(155,127,255,0.05)_0%,transparent_70%)]" />
        <div className="login-orb-3 pointer-events-none absolute top-[45%] right-[12%] w-44 h-44 rounded-full bg-[radial-gradient(circle,rgba(0,217,145,0.04)_0%,transparent_70%)]" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[420px] relative z-10"
        >
          {/* Logo & Heading */}
          <div className="text-center mb-9">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
              className="w-20 h-20 rounded-[22px] bg-white/[0.03] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(255,255,255,0.05)] flex items-center justify-center mx-auto mb-6 overflow-hidden"
            >
              <img src="/logo-new.png" alt="Meu Contador" className="w-full h-full object-contain p-2 drop-shadow-lg" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-[30px] font-bold text-[#F0F4FF] tracking-[-0.8px] leading-none mb-1.5"
            >
              Meu Contador
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2"
            >
              <div className="h-px w-7 bg-blue-500/30" />
              <span className="text-[10px] font-bold text-[#3D4F72] uppercase tracking-[0.18em]">Inteligência Financeira</span>
              <div className="h-px w-7 bg-blue-500/30" />
            </motion.div>
          </div>

          {/* Server waking banner */}
          <AnimatePresence>
            {serverWaking && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="bg-amber-500/10 border border-amber-500/25 rounded-[14px] px-3.5 py-3 text-xs text-amber-400 flex items-start gap-2.5"
              >
                <span className="text-lg flex-shrink-0 mt-0.5">⚡</span>
                <div>
                  <div className="font-bold mb-0.5">Servidor iniciando…</div>
                  <div className="text-amber-400/70 text-[11px] leading-snug">O servidor estava em repouso. Aguarde 10–30s e tente novamente.</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="relative overflow-hidden rounded-[28px] p-7 border border-blue-500/[0.15] shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)]"
            style={{ background: "linear-gradient(155deg, #0A1830 0%, #060E1D 50%, #0A1428 100%)" }}
          >
            {/* Decorative glows */}
            <div className="pointer-events-none absolute -top-20 -right-14 w-56 h-56 rounded-full bg-[radial-gradient(circle,rgba(74,139,255,0.09)_0%,transparent_70%)]" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-[radial-gradient(circle,rgba(155,127,255,0.06)_0%,transparent_70%)]" />

            {/* Tab: Login / Cadastro */}
            <div className="flex bg-white/[0.03] border border-white/[0.065] rounded-xl p-1 mb-6 relative z-[1]">
              {["Entrar", "Cadastrar"].map((label, i) => {
                const active = isRegistering ? i === 1 : i === 0;
                return (
                  <Button key={label} type="button" variant={active ? "premium" : "ghost"} onClick={() => { setIsRegistering(i === 1); setServerWaking(false); }} className="flex-1 rounded-lg text-sm font-semibold transition-all">
                    {label}
                  </Button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} className="relative z-[1]">
              {/* Name (register only) */}
              <AnimatePresence>
                {isRegistering && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                    <label className={labelCls}>Nome completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--t4)] z-10" size={16} />
                      <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className={`${inputBase} pl-10 ${inputFocus("name")}`} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} autoComplete="name" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="mb-4">
                <label className={labelCls}>E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--t4)] z-10" size={16} />
                  <Input ref={emailRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={`${inputBase} pl-10 ${inputFocus("email")}`} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} autoComplete="email" required />
                </div>
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className={labelCls}>Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--t4)] z-10" size={16} />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputBase} pl-10 ${inputFocus("password")}`} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} autoComplete={isRegistering ? "new-password" : "current-password"} required />
                </div>
              </div>

              {/* CTA */}
              <Button type="submit" disabled={loading} variant="premium" className="w-full h-12 rounded-xl font-bold text-sm tracking-wide mb-4">
                {loading ? (
                  <><Loader2 className="animate-spin" size={16} /> Aguarde...</>
                ) : (
                  <>{isRegistering ? "Criar Minha Conta" : "Entrar no Painel"} <ArrowRight size={16} /></>
                )}
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] font-bold text-[var(--t4)] uppercase tracking-wider">ou</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Google OAuth */}
              <Button type="button" onClick={handleGoogleLogin} disabled={loading} variant="outline" className="w-full h-11 rounded-xl font-semibold text-sm">
                <img src="https://www.google.com/favicon.ico" className="w-[18px] h-[18px]" alt="Google" />
                Continuar com Google
              </Button>

              {/* Domain error */}
              <AnimatePresence>
                {domainError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-[11px] text-amber-400 leading-snug"
                  >
                    Domínio <strong>meu-contador-one.vercel.app</strong> precisa ser autorizado no Console Firebase para o login Google funcionar.
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Footer toggle */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mt-5">
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setServerWaking(false); }} className="login-toggle bg-transparent border-none cursor-pointer font-[DM_Sans] text-sm text-[var(--t4)] transition-colors">
              {isRegistering ? "Já tem conta? " : "Novo por aqui? "}
              <span className="text-blue-400 font-bold">{isRegistering ? "Fazer login" : "Criar conta grátis"}</span>
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-5 mt-7 opacity-40"
          >
            {[{ icon: "🤖", label: "IA Financeira" }, { icon: "🔒", label: "Segurança Bancária" }, { icon: "🇧🇷", label: "Feito para o Brasil" }].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1 text-[10px] text-[var(--t3)] font-bold uppercase tracking-wide">
                <span className="text-sm">{icon}</span>{label}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};