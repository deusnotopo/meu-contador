import { ReactNode, useState } from "react";
import { Lock } from "lucide-react";
import { useFeatureFlags } from "../../context/FeatureFlagsContext";
import { Button } from "./button";
import { UpgradeModal } from "./UpgradeModal";

interface PremiumGateProps {
  children: ReactNode;
  feature: "premium_analytics" | "ai_advisor" | "multi_currency";
  fallback?: ReactNode;
}

export function PremiumGate({ children, feature, fallback }: PremiumGateProps) {
  const { isEnabled } = useFeatureFlags();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const hasAccess = isEnabled(feature);

  // For demo purposes, we might want to simulate "not having access" depending on user role
  // But purely based on feature flags here:
  
  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="relative w-full h-full min-h-[200px] border border-slate-800 rounded-xl overflow-hidden bg-slate-900/50 flex flex-col items-center justify-center p-6 text-center group">
        
        {/* Blurred Content Placeholder */}
        <div className="absolute inset-0 opacity-20 blur-sm pointer-events-none select-none bg-slate-800" aria-hidden="true" />
        
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-slate-800 text-slate-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
            <Lock size={32} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Recurso Premium</h3>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mt-1">
              Faça upgrade para acessar este recurso e muito mais.
            </p>
          </div>
          <Button 
            onClick={() => setShowUpgrade(true)}
            variant="outline" 
            className="mt-2 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 hover:text-white"
          >
            Desbloquear Agora
          </Button>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </>
  );
}
