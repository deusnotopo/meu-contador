import { createContext, useContext, ReactNode, useState } from 'react';

type FeatureFlag = 'premium_analytics' | 'ai_advisor' | 'multi_currency' | 'investments' | 'invoices';

interface FeatureFlagsContextType {
  isEnabled: (feature: FeatureFlag) => boolean;
  setOverride: (feature: FeatureFlag, value: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  // Todas as features liberadas — usuário paga antes de acessar o app
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const isEnabled = (feature: FeatureFlag): boolean => {
    if (overrides[feature] !== undefined) return overrides[feature] ?? true;
    // Todas as features ativas por padrão
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
