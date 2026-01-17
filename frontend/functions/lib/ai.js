"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInsights = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Ensure firebase-admin is initialized if used elsewhere, 
// though for this specific pure proxy it might not be strictly needed yet.
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Callable function to generate AI insights.
 * Replaces /api/ai-proxy logic.
 *
 * Usage from client:
 * const generateInsights = httpsCallable(functions, 'generateInsights');
 * generateInsights({ messages, temperature, response_format });
 */
exports.generateInsights = functions.https.onCall(async (data, context) => {
    // 1. Authorization Check (Optional but recommended)
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { messages, temperature, response_format } = data;
    // 2. Configuration / Secrets
    // In production, use defineSecret('MISTRAL_API_KEY') or functions.config().
    // For now, checking process.env which works if .env is present.
    const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
    const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";
    if (!MISTRAL_API_KEY) {
        throw new functions.https.HttpsError("failed-precondition", "API Key not configured on server.");
    }
    // 3. Request Construction
    const body = {
        model: "mistral-small",
        messages,
        temperature: temperature || 0.3,
    };
    if (response_format) {
        body.response_format = response_format;
    }
    try {
        const mistralResponse = await fetch(MISTRAL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${MISTRAL_API_KEY}`,
            },
            body: JSON.stringify(body),
        });
        if (!mistralResponse.ok) {
            const errorText = await mistralResponse.text();
            console.error("Mistral API Error:", errorText);
            throw new functions.https.HttpsError("internal", `AI Provider Error: ${mistralResponse.status}`);
        }
        const responseData = await mistralResponse.json();
        return responseData;
    }
    catch (error) {
        console.error("Proxy Error:", error);
        throw new functions.https.HttpsError("internal", "Internal server error during AI generation.");
    }
});
//# sourceMappingURL=ai.js.map