// STUBBED TOAST IMPLEMENTATION FOR EMERGENCY BUILD
// Removed react-hot-toast dependency to fix build crash.

export const showSuccess = (message: any) => {
  console.log("✅ [Toast Success]:", message);
};

export const showError = (message: any) => {
  console.error("❌ [Toast Error]:", message);
};

export const showLoading = (message: any) => {
  console.log("⏳ [Toast Loading]:", message);
  return "stub-id";
};

export const dismissToast = (toastId: any) => {
  // No-op
};

export const showPromise = (promise: any, messages: any) => {
  console.log("🤞 [Toast Promise]:", messages);
  return promise;
};

// Return empty component to satisfy App.tsx
export const ToastProvider = () => {
  return null;
};
