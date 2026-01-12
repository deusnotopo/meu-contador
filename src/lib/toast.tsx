import toast, { Toaster } from "react-hot-toast";

// Toast configurations
const toastConfig = {
  success: {
    duration: 3000,
    style: {
      background: "hsl(var(--success))",
      color: "hsl(var(--success-foreground))",
      fontWeight: "600",
      padding: "16px",
      borderRadius: "12px",
    },
    iconTheme: {
      primary: "hsl(var(--success-foreground))",
      secondary: "hsl(var(--success))",
    },
  },
  error: {
    duration: 4000,
    style: {
      background: "hsl(var(--danger))",
      color: "hsl(var(--danger-foreground))",
      fontWeight: "600",
      padding: "16px",
      borderRadius: "12px",
    },
    iconTheme: {
      primary: "hsl(var(--danger-foreground))",
      secondary: "hsl(var(--danger))",
    },
  },
  loading: {
    style: {
      background: "hsl(var(--card))",
      color: "hsl(var(--foreground))",
      fontWeight: "600",
      padding: "16px",
      borderRadius: "12px",
      border: "1px solid hsl(var(--border))",
    },
  },
};

// Toast helper functions
export const showSuccess = (message) => {
  toast.success(message, toastConfig.success);
};

export const showError = (message) => {
  toast.error(message, toastConfig.error);
};

export const showLoading = (message) => {
  return toast.loading(message, toastConfig.loading);
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const showPromise = (promise, messages) => {
  return toast.promise(promise, messages, {
    loading: toastConfig.loading,
    success: toastConfig.success,
    error: toastConfig.error,
  });
};

// Toaster component to be added to App
export const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        className: "shadow-elevated",
      }}
    />
  );
};
