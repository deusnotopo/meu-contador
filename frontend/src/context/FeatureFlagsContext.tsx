import { createContext, useContext, ReactNode, useState } from 'react';
import { useAuth } from './AuthContext';

type FeatureFlag = 'premium_analytics' | 'ai_advisor' | 'multi_currency' | 'investments' | 'invoices';

interface FeatureFlagsContextType {
  isEnabled: (feature: FeatureFlag) => boolean;
  setOverride: (feature: FeatureFlag, value: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const { user, isPro } = useAuth();

  const isEnabled = (feature: FeatureFlag): boolean => {
    if (overrides[feature] !== undefined) return overrides[feature] ?? true;
    
    // O dono douglasedmais@gmail.com tem acesso VIP a tudo, mesmo se isPro for false.
    if (user?.email && user.email.toLowerCase().trim() === 'douglasedmais@gmail.com') {
      return true;
    }

    // Caso contrário, depende do plano da conta
    // Lista explícita de features que exigem Premium
    const premiumFeatures: FeatureFlag[] = ['premium_analytics', 'ai_advisor', 'investments', 'invoices', 'multi_currency'];

    if (premiumFeatures.includes(feature)) {
      return isPro;
    }

    return true;
  };

  const setOverride = (feature: FeatureFlag, value: boolean) => {
    setOverrides(prev => ({ ...prev, [feature]: value }));
  };

  return (
    <FeatureFlagsContext.Provider value={{ isEnabled, setOverride }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  return context;
}
