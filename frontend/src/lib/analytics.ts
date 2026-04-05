import { logEvent } from "firebase/analytics";
import { analytics } from "./firebase";
import { logger } from "./logger";

/**
 * Custom Analytics tracking for financial events
 */
export const trackEvent = (eventName: string, params?: Record<string, string | number | boolean | null | undefined>) => {
  if (analytics) {
    try {
      logEvent(analytics, eventName, params);
      logger.info(`[Analytics] ${eventName}`, params);
    } catch (error) {
      console.warn("Analytics error", error);
    }
  }
};

// Standard Events helpers
export const analyticsEvents = {
  // Auth
  LOGIN: "login",
  SIGN_UP: "sign_up",
  LOGOUT: "logout",
  
  // Transactions
  ADD_TRANSACTION: "add_transaction",
  EDIT_TRANSACTION: "edit_transaction",
  DELETE_TRANSACTION: "delete_transaction",
  
  // Investments
  ADD_INVESTMENT: "add_investment",
  EDIT_INVESTMENT: "edit_investment",
  
  // AI
  AI_ASSISTANT_OPEN: "ai_assistant_open",
  AI_CHAT_MESSAGE: "ai_chat_message",
  AI_SCENARIO_SIMULATION: "ai_scenario_simulation",
  
  // Profile
  UPDATE_PROFILE: "update_profile",
  TOGGLE_PRIVACY_MODE: "toggle_privacy_mode",
  
  // Onboarding
  WIZARD_COMPLETE: "wizard_complete",
};
