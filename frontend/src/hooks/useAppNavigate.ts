/**
 * useAppNavigate — Centralizes all app navigation.
 * ─────────────────────────────────────────────────
 * Instead of passing onNavigate/onBack as props through 5 layers,
 * any component can call useAppNavigate() and navigate directly.
 *
 * Uses the existing TAB_PATHS mapping so URLs stay consistent.
 */

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TAB_PATHS } from '@/app/routes';
import type { TabType } from '@/types/navigation';
import { useOverlays } from '@/context/OverlayContext';

export function useAppNavigate() {
  const navigate = useNavigate();
  const { setIsLaunchMenuOpen, setShowFunctions } = useOverlays();

  const navigateTo = useCallback(
    (tab: TabType) => {
      setShowFunctions(false);
      if (tab === "launch") {
        setIsLaunchMenuOpen(true);
        return; // Early return to NOT route for overlays
      }
      const path = TAB_PATHS[tab];
      if (path) navigate(path);
    },
    [navigate, setIsLaunchMenuOpen, setShowFunctions],
  );

  const goBack = useCallback(
    (fallback: TabType = 'inicio') => {
      const path = TAB_PATHS[fallback];
      if (path) navigate(path);
    },
    [navigate],
  );

  return { navigateTo, goBack };
}
