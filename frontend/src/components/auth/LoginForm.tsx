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

const T = {
  bg: "#04070F",
  bg2: "#070C18",
  amber: "#FFAD3B",
  amberD: "rgba(255,173,59,0.1)",
  blue: "#4A8BFF",
};

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
      const e = err as { message?: string; code?: string };
      console.error("Auth Error:", e);

      const isServerStarting =
        e.message?.includes("timeout") ||
        e.message?.includes("Failed to fetch") ||
        e.message?.includes("NetworkError") ||
        e.message?.includes("503") ||
        e.message?.includes("Service Unavailable");

      if (isServerStarting) {
        setServerWaking(true);
        showError("Servidor iniciando. Aguarde alguns segundos e tente novamente.");
      } else if (e.code === "auth/email-already-in-use" || e.message === "User already exists") {
        showError("E-mail já cadastrado. Tente fazer login.");
        setIsRegistering(false);
      } else if (
        e.code === "auth/invalid-credential" ||
        e.code === "auth/wrong-password" ||
        e.message === "Invalid credentials"
      ) {
        showError("E-mail ou senha incorretos.");
      } else if (e.code === "auth/weak-password") {
        showError("A senha é muito fraca. Use pelo menos 6 caracteres.");
      } else {
        showError("Erro na autenticação. Tente novamente.");
      }
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
      const e = err as { message?: string; code?: string };
      console.error("Google Login Error:", e);
      if (e.code === "auth/unauthorized-domain" || e.message?.includes("domain is not authorized")) {
        setDomainError(true);
        showError("Domínio não autorizado no Firebase.");
      } else {
        showError(e.message || "Erro ao conectar com Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase = "w-full h-12 bg-white/[0.055] border-white/11 rounded-2xl text-sm transition-all duration-200 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50";
  const inputFocus = (f: string) => focused === f ? "bg-indigo-500/[0.06] shadow-[0_0_0_3px_rgba(74,139,255,0.08)]" : "";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes loginPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-toggle:hover { color: #F0F4FF !important; }
      `}</style>

      <div style={{ minHeight: "100vh", width: "100%", background: T.bg, backgroundImage: `radial-gradient(ellipse 80% 60% at 10% 10%, rgba(74,139,255,0.04) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 90%, rgba(155,127,255,0.03) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 50% 50%, rgba(0,217,145,0.015) 0%, transparent 70%)`, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 16px", fontFamily: "'DM Sans', sans-serif", position: "relative", overflow: "hidden" }}>
        {/* Floating orbs */}
        <div style={{ position: "absolute", top: "10%", left: "5%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,139,255,0.07) 0%, transparent 70%)", animation: "loginPulse 6s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", bottom: "8%", right: "3%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,127,255,0.05) 0%, transparent 70%)", animation: "loginPulse 8s ease-in-out infinite 1s", pointerEvents: "none", zIndex: 0 }} />
        <div style={{ position: "absolute", top: "45%", right: "12%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,217,145,0.04) 0%, transparent 70%)", animation: "loginPulse 7s ease-in-out infinite 2s", pointerEvents: "none", zIndex: 0 }} />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}>
          {/* Logo & heading */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }} transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20, y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }} style={{ width: 80, height: 80, borderRadius: 22, background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", overflow: "hidden", position: "relative" }}>
              <img src="/logo-new.png" alt="Meu Contador" style={{ width: "100%", height: "100%", objectFit: "contain", padding: "8px", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }} />
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ fontSize: 30, fontWeight: 700, color: "#F0F4FF", letterSpacing: "-0.8px", lineHeight: 1, marginBottom: 6 }}>Meu Contador</motion.h1>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ height: 1, width: 28, background: "rgba(74,139,255,0.3)" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#3D4F72", textTransform: "uppercase", letterSpacing: "0.18em" }}>Inteligência Financeira</span>
              <div style={{ height: 1, width: 28, background: "rgba(74,139,255,0.3)" }} />
            </motion.div>
          </div>

          {/* Server waking banner */}
          <AnimatePresence>
            {serverWaking && (
              <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: "auto", marginBottom: 12 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} style={{ background: T.amberD, border: "1px solid rgba(255,173,59,0.25)", borderRadius: 14, padding: "12px 14px", fontSize: 12, color: T.amber, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>Servidor iniciando…</div>
                  <div style={{ color: "rgba(255,173,59,0.7)", fontSize: 11, lineHeight: 1.4 }}>O servidor estava em repouso. Aguarde 10–30s e tente novamente.</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main glass card */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }} style={{ background: "linear-gradient(155deg, #0A1830 0%, #060E1D 50%, #0A1428 100%)", border: "1px solid rgba(74,139,255,0.15)", borderRadius: 28, padding: 28, position: "relative", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)" }}>
            {/* Decorative glows */}
            <div style={{ position: "absolute", top: -80, right: -60, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,139,255,0.09) 0%, transparent 70%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -50, left: -50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,127,255,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

            {/* Tab: Login / Cadastro */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.065)", borderRadius: 12, padding: 4, marginBottom: 24, position: "relative", zIndex: 1 }}>
              {["Entrar", "Cadastrar"].map((label, i) => {
                const active = isRegistering ? i === 1 : i === 0;
                return (
                  <Button key={label} type="button" variant={active ? "premium" : "ghost"} onClick={() => { setIsRegistering(i === 1); setServerWaking(false); }} className="flex-1 rounded-lg text-sm font-semibold transition-all">
                    {label}
                  </Button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} style={{ position: "relative", zIndex: 1 }}>
              {/* Name field (register only) */}
              <AnimatePresence>
                {isRegistering && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                    <label className={labelCls}>Nome completo</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" size={16} />
                      <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" className={`${inputBase} pl-10 ${inputFocus("name")}`} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} autoComplete="name" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div className="mb-4">
                <label className={labelCls}>E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" size={16} />
                  <Input ref={emailRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className={`${inputBase} pl-10 ${inputFocus("email")}`} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} autoComplete="email" required />
                </div>
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className={labelCls}>Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 z-10" size={16} />
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${inputBase} pl-10 ${inputFocus("password")}`} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} autoComplete={isRegistering ? "new-password" : "current-password"} required />
                </div>
              </div>

              {/* Primary CTA */}
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
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ou</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Google OAuth */}
              <Button type="button" onClick={handleGoogleLogin} disabled={loading} variant="outline" className="w-full h-11 rounded-xl font-semibold text-sm">
                <img src="https://www.google.com/favicon.ico" style={{ width: 18, height: 18 }} alt="Google" />
                Continuar com Google
              </Button>

              {/* Domain error */}
              <AnimatePresence>
                {domainError && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: 12, padding: "10px 14px", background: T.amberD, border: "1px solid rgba(255,173,59,0.25)", borderRadius: 12, fontSize: 11, color: T.amber, lineHeight: 1.5 }}>
                    Domínio <strong>meu-contador-one.vercel.app</strong> precisa ser autorizado no Console Firebase para o login Google funcionar.
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Footer toggle */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-center mt-5">
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setServerWaking(false); }} className="login-toggle bg-none border-none cursor-pointer font-sans text-sm text-slate-500 transition-colors">
              {isRegistering ? "Já tem conta? " : "Novo por aqui? "}
              <span className="text-blue-400 font-bold">{isRegistering ? "Fazer login" : "Criar conta grátis"}</span>
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 28, opacity: 0.4 }}>
            {[{ icon: "🤖", label: "IA Financeira" }, { icon: "🔒", label: "Segurança Bancária" }, { icon: "🇧🇷", label: "Feito para o Brasil" }].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                <span className="text-sm">{icon}</span>{label}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};