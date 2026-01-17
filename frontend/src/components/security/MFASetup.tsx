import { useState, useEffect } from "react";
import { MFAService } from "@/lib/mfa-service";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/lib/toast";
import { ShieldCheck, Phone, Loader2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const MFASetup = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [step, setStep] = useState<"init" | "verify" | "complete">("init");
  const [isLoading, setIsLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);

  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible'
    });
    setRecaptchaVerifier(verifier);
    return () => verifier.clear();
  }, []);

  const handleStartEnrollment = async () => {
    if (!phoneNumber) return showError("Digite um número válido");
    setIsLoading(true);
    try {
      const vid = await MFAService.startPhoneEnrollment(phoneNumber, recaptchaVerifier);
      setVerificationId(vid);
      setStep("verify");
      showSuccess("Código enviado!");
    } catch (error) {
      showError("Erro ao iniciar autenticação.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishEnrollment = async () => {
    if (!verificationCode) return showError("Digite o código de 6 dígitos");
    setIsLoading(true);
    try {
      await MFAService.finishEnrollment(verificationId, verificationCode, "Celular Pessoal");
      setStep("complete");
      showSuccess("MFA ativado com sucesso!");
    } catch (error) {
      showError("Código inválido ou expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="premium-card p-8 space-y-8 relative overflow-hidden">
      <div id="recaptcha-container"></div>
      
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">
            Segurança <span className="text-emerald-400">2FA</span>
          </h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Proteção de Nível Bancário
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "init" && (
          <motion.div
            key="init"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Número do Celular (com DDD)
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  type="tel"
                  placeholder="+55 11 99999-9999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="h-14 pl-12 bg-white/5 border-white/5 rounded-2xl text-white font-medium"
                />
              </div>
            </div>

            <Button
              onClick={handleStartEnrollment}
              disabled={isLoading || !phoneNumber}
              className="w-full h-14 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-white/90 shadow-xl"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Enviar Código SMS"}
              {!isLoading && <ArrowRight size={18} className="ml-2" />}
            </Button>
          </motion.div>
        )}

        {step === "verify" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Código de Verificação
              </label>
              <Input
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="h-14 px-6 bg-white/5 border-white/5 rounded-2xl text-white text-center font-black tracking-[0.5em] text-xl"
              />
            </div>

            <Button
              onClick={handleFinishEnrollment}
              disabled={isLoading || verificationCode.length < 6}
              className="w-full h-14 bg-emerald-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-500/20"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Verificar e Ativar"}
            </Button>
          </motion.div>
        )}

        {step === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-4"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto border-4 border-emerald-500/20">
              <ShieldCheck size={40} />
            </div>
            <h4 className="text-lg font-black text-white uppercase tracking-tight">
              MFA Ativado com Sucesso
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Sua conta agora está protegida por verificação em duas etapas.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
