/**
 * WealthIntelligenceService
 * ─────────────────────────
 * The "Brain" of the application. Aggregates data from all domains
 * to provide a high-fidelity unified state for the user experience.
 *
 * AKITA FIX: Uses Promise.allSettled so a partial failure in one service
 * (e.g. Gamification) does not take down the entire dashboard endpoint.
 * Failed sub-responses are replaced with safe nulls and logged.
 */

import * as IntelligenceService from "./IntelligenceService.js";
import * as EducationService from "./EducationService.js";
import * as GamificationService from "./GamificationService.js";

export async function getUnifiedDashboardState(userId: string) {
  const [financialResult, educationResult, gamificationResult] =
    await Promise.allSettled([
      IntelligenceService.getDashboardSummary(userId),
      EducationService.getEducationData(userId),
      GamificationService.getState(userId),
    ]);

  // Log any partial failures without surfacing a 500
  if (financialResult.status === "rejected") {
    console.error("[WealthIntelligence] financial summary failed:", financialResult.reason);
  }
  if (educationResult.status === "rejected") {
    console.error("[WealthIntelligence] education data failed:", educationResult.reason);
  }
  if (gamificationResult.status === "rejected") {
    console.error("[WealthIntelligence] gamification state failed:", gamificationResult.reason);
  }

  return {
    financial:      financialResult.status === "fulfilled"    ? financialResult.value    : null,
    education:      educationResult.status === "fulfilled"    ? educationResult.value    : null,
    gamification:   gamificationResult.status === "fulfilled" ? gamificationResult.value : null,
    serverTime:     new Date().toISOString(),
    // Expose partial failure signal to the frontend so it can show graceful degraded state
    partialFailure: [financialResult, educationResult, gamificationResult].some(
      (r) => r.status === "rejected"
    ),
  };
}
