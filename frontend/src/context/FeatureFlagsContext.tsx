import { createContext, useContext, ReactNode, useState } from 'react';
import { useAuth } from './AuthContext';

type FeatureFlag = 'premium_analytics' | 'ai_advisor' | 'multi_currency' | 'investments' | 'invoices';

interface FeatureFlagsContextType {
  isEnabled: (feature: FeatureFlag) => boolean;
  setOverride: (feature: FeatureFlag, value: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { isPro } = useAuth();
  // Can be connected to remote configuration (Firebase Remote Config, LaunchDarkly, etc.)
  const [overrides, setOverrides] = useState<Record<string, boolean>>({}); // eslint-disable-line

  const isEnabled = (feature: FeatureFlag): boolean => {
    if (overrides[feature] !== undefined) return overrides[feature] ?? false;
    
    // Default flags configuration
    const flags: Record<FeatureFlag, boolean> = {
      premium_analytics: isPro,
      ai_advisor: isPro,
      multi_currency: false,
      investments: isPro,
      invoices: isPro,
    };

    return flags[feature] ?? false;
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
