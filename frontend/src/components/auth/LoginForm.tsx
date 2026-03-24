import { useAuth } from "@/context/AuthContext";
import { showError, showSuccess } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? "http://localhost:3000"
    : "https://meu-contador-iyut.onrender.com");

// ─── Design tokens from finapp_melhorado_v2 ───────────────────────
const T = {
  bg:      "#04070F",
  bg2:     "#070C18",
  bg3:     "#0B1220",
  glass:   "rgba(255,255,255,0.03)",
  glass2:  "rgba(255,255,255,0.055)",
  glass3:  "rgba(255,255,255,0.085)",
  border:  "rgba(255,255,255,0.065)",
  border2: "rgba(255,255,255,0.11)",
  t1:      "#F0F4FF",
  t2:      "#8899C4",
  t3:      "#3D4F72",
  blue:    "#4A8BFF",
  blue2:   "#6B7CFF",
  blue3:   "rgba(74,139,255,0.12)",
  green:   "#00D991",
  red:     "#FF4F6E",
  redD:    "rgba(255,79,110,0.1)",
  amber:   "#FFAD3B",
  amberD:  "rgba(255,173,59,0.1)",
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

  // Warm up the Render backend on mount
  useEffect(() => {
    const warmup = async () => {
      try {
        await fetch(`${API_URL}/health`, {
          method: "GET",
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        // Silent — just waking the server
      }
    };
    warmup();
  }, []);

  // Auto-focus email on mount
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

  const inputStyle = (field: string): React.CSSProperties => ({
    width: "100%",
    padding: "14px 16px 14px 44px",
    background: focused === field ? "rgba(74,139,255,0.06)" : T.glass2,
    border: `1px solid ${focused === field ? "rgba(74,139,255,0.35)" : T.border2}`,
    borderRadius: 14,
    color: T.t1,
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    outline: "none",
    transition: "all 0.2s",
    boxShadow: focused === field ? "0 0 0 3px rgba(74,139,255,0.08)" : "none",
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: T.t3,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: 8,
    display: "block",
  };

  const iconStyle: React.CSSProperties = {
    position: "absolute",
    left: 14,
    top: "50%",
    transform: "translateY(-50%)",
    color: T.t3,
    pointerEvents: "none",
    fontSize: 16,
  };

  return (
    <>
      {/* Import DM Sans & DM Mono */}
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes loginPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-input::placeholder { color: ${T.t3}; }
        .login-input:autofill,
        .login-input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px rgba(74,139,255,0.06) inset !important;
          -webkit-text-fill-color: ${T.t1} !important;
        }
        .login-btn-primary:active { transform: scale(0.98); }
        .login-btn-google:active { transform: scale(0.98); }
        .login-toggle:hover { color: ${T.t1}; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          background: T.bg,
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 10% 10%, rgba(74,139,255,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 90% 90%, rgba(155,127,255,0.03) 0%, transparent 60%),
            radial-gradient(ellipse 40% 40% at 50% 50%, rgba(0,217,145,0.015) 0%, transparent 70%)
          `,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 16px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Floating orbs */}
        <div
          style={{
            position: "fixed",
            top: "15%",
            left: "8%",
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(74,139,255,0.07) 0%, transparent 70%)",
            animation: "loginPulse 6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "fixed",
            bottom: "10%",
            right: "5%",
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(155,127,255,0.05) 0%, transparent 70%)",
            animation: "loginPulse 8s ease-in-out infinite 1s",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "fixed",
            top: "50%",
            right: "15%",
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,217,145,0.04) 0%, transparent 70%)",
            animation: "loginPulse 7s ease-in-out infinite 2s",
            pointerEvents: "none",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}
        >
          {/* Logo & heading */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            {/* Icon mark */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                background: "linear-gradient(135deg, #0D2060, #1A3A8F)",
                border: "1px solid rgba(74,139,255,0.3)",
                boxShadow: "0 0 0 8px rgba(74,139,255,0.06), 0 16px 48px rgba(74,139,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 32,
              }}
            >
              💰
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: T.t1,
                letterSpacing: "-0.8px",
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              Meu Contador
            </motion.h1>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <div style={{ height: 1, width: 28, background: "rgba(74,139,255,0.3)" }} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: T.t3,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                }}
              >
                Inteligência Financeira
              </span>
              <div style={{ height: 1, width: 28, background: "rgba(74,139,255,0.3)" }} />
            </motion.div>
          </div>

          {/* Server waking banner */}
          <AnimatePresence>
            {serverWaking && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                style={{
                  background: T.amberD,
                  border: `1px solid rgba(255,173,59,0.25)`,
                  borderRadius: 14,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: T.amber,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 3 }}>Servidor iniciando…</div>
                  <div style={{ color: "rgba(255,173,59,0.7)", fontSize: 11, lineHeight: 1.4 }}>
                    O servidor estava em repouso. Aguarde 10–30s e tente novamente.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main glass card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            style={{
              background: "linear-gradient(155deg, #0A1830 0%, #060E1D 50%, #0A1428 100%)",
              border: `1px solid rgba(74,139,255,0.15)`,
              borderRadius: 28,
              padding: 28,
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
            }}
          >
            {/* Decorative glows inside card */}
            <div
              style={{
                position: "absolute",
                top: -80,
                right: -60,
                width: 220,
                height: 220,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(74,139,255,0.09) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -50,
                left: -50,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(155,127,255,0.06) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />

            {/* Tab: Login / Cadastro */}
            <div
              style={{
                display: "flex",
                background: T.glass,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: 4,
                marginBottom: 24,
                position: "relative",
                zIndex: 1,
              }}
            >
              {["Entrar", "Cadastrar"].map((label, i) => {
                const active = isRegistering ? i === 1 : i === 0;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setIsRegistering(i === 1);
                      setServerWaking(false);
                    }}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      borderRadius: 9,
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      color: active ? T.t1 : T.t3,
                      background: active
                        ? "linear-gradient(135deg, rgba(74,139,255,0.2), rgba(107,124,255,0.15))"
                        : "transparent",
                      boxShadow: active ? `0 0 0 1px rgba(74,139,255,0.25)` : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} style={{ position: "relative", zIndex: 1 }}>
              {/* Name field (register only) */}
              <AnimatePresence>
                {isRegistering && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginBottom: 16, overflow: "hidden" }}
                  >
                    <label style={labelStyle}>Nome completo</label>
                    <div style={{ position: "relative" }}>
                      <span style={iconStyle}>👤</span>
                      <input
                        className="login-input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome"
                        style={inputStyle("name")}
                        onFocus={() => setFocused("name")}
                        onBlur={() => setFocused(null)}
                        autoComplete="name"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>E-mail</label>
                <div style={{ position: "relative" }}>
                  <span style={iconStyle}>✉️</span>
                  <input
                    ref={emailRef}
                    className="login-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    style={inputStyle("email")}
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Senha</label>
                <div style={{ position: "relative" }}>
                  <span style={iconStyle}>🔒</span>
                  <input
                    className="login-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={inputStyle("password")}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                    required
                  />
                </div>
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={loading}
                className="login-btn-primary"
                style={{
                  width: "100%",
                  padding: "14px",
                  background: loading
                    ? "rgba(74,139,255,0.3)"
                    : "linear-gradient(135deg, #2F62D9, #5048E8)",
                  border: "none",
                  borderRadius: 14,
                  color: "#fff",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(80,72,232,0.35)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginBottom: 16,
                  letterSpacing: "-0.1px",
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        display: "inline-block",
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTop: "2px solid white",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                      }}
                    />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    Aguarde…
                  </>
                ) : (
                  <>
                    {isRegistering ? "Criar Minha Conta" : "Entrar no Painel"}
                    <span style={{ fontSize: 16 }}>→</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ flex: 1, height: 1, background: T.border }} />
                <span
                  style={{
                    fontSize: 10,
                    color: T.t3,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                  }}
                >
                  ou
                </span>
                <div style={{ flex: 1, height: 1, background: T.border }} />
              </div>

              {/* Google OAuth */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="login-btn-google"
                style={{
                  width: "100%",
                  padding: "13px",
                  background: T.glass2,
                  border: `1px solid ${T.border2}`,
                  borderRadius: 14,
                  color: T.t1,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  style={{ width: 18, height: 18 }}
                  alt="Google"
                />
                Continuar com Google
              </button>

              {/* Domain error */}
              <AnimatePresence>
                {domainError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      marginTop: 12,
                      padding: "10px 14px",
                      background: T.amberD,
                      border: `1px solid rgba(255,173,59,0.25)`,
                      borderRadius: 12,
                      fontSize: 11,
                      color: T.amber,
                      lineHeight: 1.5,
                    }}
                  >
                    Domínio <strong>meu-contador-one.vercel.app</strong> precisa ser
                    autorizado no Console Firebase para o login Google funcionar.
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Footer toggle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ textAlign: "center", marginTop: 20 }}
          >
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setServerWaking(false);
              }}
              className="login-toggle"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 13,
                color: T.t3,
                transition: "color 0.2s",
              }}
            >
              {isRegistering ? "Já tem conta? " : "Novo por aqui? "}
              <span style={{ color: T.blue, fontWeight: 700 }}>
                {isRegistering ? "Fazer login" : "Criar conta grátis"}
              </span>
            </button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              marginTop: 28,
              opacity: 0.4,
            }}
          >
            {[
              { icon: "🤖", label: "IA Financeira" },
              { icon: "🔒", label: "Segurança Bancária" },
              { icon: "🇧🇷", label: "Feito para o Brasil" },
            ].map(({ icon, label }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 10,
                  color: T.t2,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                <span style={{ fontSize: 13 }}>{icon}</span>
                {label}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};
