import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/services/AuthService";
import { logger } from "@/lib/logger";
import type { UserProfile } from "@/types";

/**
 * 🛠️ Hook para ações mutativas relacionadas ao usuário.
 * Usa refreshUser() para sincronizar estado após mutações do backend,
 * em vez de manipular setters internos do AuthContext diretamente.
 */
export function useUserActions() {
  const { refreshUser } = useAuth();

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    try {
      await AuthService.updateProfile(data);
      await refreshUser();
    } catch (error) {
      logger.error('[useUserActions] Failed to update profile', error);
      throw error;
    }
  }, [refreshUser]);

  const upgradeToPro = useCallback(async () => {
    try {
      const success = await AuthService.upgradeToPro();
      if (success) {
        await refreshUser();
      }
      return success;
    } catch (error) {
      logger.error('[useUserActions] Failed to upgrade to pro', error);
      throw error;
    }
  }, [refreshUser]);

  return {
    updateProfile,
    upgradeToPro,
  };
}
