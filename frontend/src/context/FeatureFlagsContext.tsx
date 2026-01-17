import { createContext, useContext, ReactNode, useState } from 'react';

type FeatureFlag = 'premium_analytics' | 'ai_advisor' | 'multi_currency';

interface FeatureFlagsContextType {
  isEnabled: (feature: FeatureFlag) => boolean;
  setOverride: (feature: FeatureFlag, value: boolean) => void;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | null>(null);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  // Can be connected to remote configuration (Firebase Remote Config, LaunchDarkly, etc.)
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const isEnabled = (feature: FeatureFlag): boolean => {
    if (feature in overrides) return overrides[feature];
    
    // Default flags configuration
    const flags: Record<FeatureFlag, boolean> = {
      premium_analytics: true, // Enabled for demo
      ai_advisor: true,
      multi_currency: false,
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
