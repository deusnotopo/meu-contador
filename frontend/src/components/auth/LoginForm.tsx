import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { showError, showSuccess } from "@/lib/toast";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import React, { useState } from "react";

export const LoginForm = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [domainError, setDomainError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return showError("Preencha todos os campos.");

    setLoading(true);
    try {
      if (isRegistering) {
        await register(email, password);
        showSuccess(`Conta criada com sucesso!`);
      } else {
        await login(email, password);
        showSuccess(`Bem-vindo de volta!`);
      }
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      console.error("Auth Error:", e);

      if (e.code === "auth/email-already-in-use") {
        showError("Este e-mail já está cadastrado. Tente fazer login.");
        setIsRegistering(false); // Automatically switch to login mode
      } else if (
        e.code === "auth/invalid-credential" ||
        e.code === "auth/wrong-password"
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
      showSuccess(`Conectado com Google!`);
    } catch (err: unknown) {
      const e = err as { message?: string; code?: string };
      console.error("Google Login Error:", e);
      if (
        e.code === "auth/unauthorized-domain" ||
        e.message?.includes("domain is not authorized")
      ) {
        setDomainError(true);
        showError("Domínio não autorizado no Firebase.");
      } else {
        showError(e.message || "Erro ao conectar com Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#020617] text-white p-6 relative overflow-hidden">
      {/* Premium Background Ambiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[440px] z-10 space-y-8"
      >
        {/* Logo Section - Clean & Integrated */}
        <div className="flex flex-col items-center space-y-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative p-2"
          >
            {/* Soft glow behind logo */}
            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
            <img
              src="/logo-new.png"
              className="w-32 h-32 relative z-10 object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              alt="Logo Meu Contador"
            />
          </motion.div>
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
              Meu Contador
            </h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="h-[1px] w-4 bg-indigo-500/50" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-indigo-400/80">
                Inteligência Financeira
              </span>
              <div className="h-[1px] w-4 bg-indigo-500/50" />
            </div>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          {/* Subtle border highlight */}
          <div className="absolute inset-0 border border-indigo-500/10 rounded-[2.5rem] pointer-events-none group-hover:border-indigo-500/20 transition-colors" />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">
                  Email
                </Label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-3.5 text-slate-500"
                    size={18}
                  />
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-11 bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-600 font-medium"
                    placeholder="seu@parceiro.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 ml-1 uppercase tracking-wider">
                  Senha
                </Label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-3.5 text-slate-500"
                    size={18}
                  />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-11 bg-white/5 border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-600 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  {isRegistering ? "Criar Minha Conta" : "Entrar no Painel"}{" "}
                  <ArrowRight size={18} />
                </span>
              )}
            </Button>

            <div className="relative flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-white/5" />
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Ou
              </span>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-12 bg-white text-black hover:bg-slate-100 border-none font-bold rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  className="w-5 h-5"
                  alt="Google"
                />
                Continuar com Google
              </Button>

              {domainError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2"
                >
                  <p className="text-[11px] text-amber-200 leading-tight">
                    Domínio <strong>meu-contador-one.vercel.app</strong> precisa
                    ser autorizado no Console do Firebase para o login Google
                    funcionar.
                  </p>
                  <a
                    href="https://console.firebase.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] flex items-center gap-1 text-amber-400 font-bold hover:underline"
                  >
                    Abrir Console Firebase <ExternalLink size={10} />
                  </a>
                </motion.div>
              )}
            </div>
          </form>

          <div className="mt-8 text-center pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              {isRegistering ? "Já tem acesso? " : "Novo por aqui? "}
              <span className="text-indigo-400 font-bold hover:underline">
                {isRegistering ? "Fazer Login" : "Começar Agora"}
              </span>
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              IA Financeira
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={12} className="text-slate-400" />
            <span className="text-[9px] font-bold uppercase tracking-widest">
              Segurança Bancária
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
