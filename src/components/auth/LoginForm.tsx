import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { showError, showSuccess } from "@/lib/toast";
import { Loader2, Lock, Mail, Sparkles, Wallet } from "lucide-react";
import React, { useState } from "react";

export const LoginForm = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

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
    } catch (e: any) {
      showError(e.message || "Erro ao fazer login. Verifique seus dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      showSuccess(`Conectado com Google!`);
    } catch (e: any) {
      showError(e.message || "Erro ao conectar com Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-purple-500/10">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 gradient-primary rounded-3xl shadow-elevated mb-4">
            <Wallet className="text-primary-foreground" size={40} />
          </div>
          <h1 className="text-4xl font-black tracking-tight">Meu Contador</h1>
          <p className="text-muted-foreground font-medium">
            {isRegistering
              ? "Crie sua conta profissional"
              : "Sua jornada financeira começa aqui."}
          </p>
        </div>

        <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-bold ml-1">
                    E-mail
                  </Label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 pl-12 rounded-2xl border-2 focus:border-primary transition-all text-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-base font-bold ml-1"
                  >
                    Senha
                  </Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-14 pl-12 rounded-2xl border-2 focus:border-primary transition-all text-lg"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl text-lg font-black gradient-primary shadow-elevated border-0 mt-4"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : isRegistering ? (
                  "Criar Conta"
                ) : (
                  "Entrar no App"
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {isRegistering
                    ? "Já tenho uma conta. Entrar."
                    : "Não tenho conta? Cadastre-se agora."}
                </button>
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground font-bold">
                    Ou continue com
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="h-14 rounded-2xl font-bold border-2 hover:bg-muted/50 gap-3"
                >
                  <img
                    src="https://www.google.com/favicon.ico"
                    className="w-5 h-5"
                    alt="Google"
                  />
                  Google
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Sparkles size={18} />
            <span className="text-xs font-black uppercase tracking-widest">
              IA Financeira Ativada
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
