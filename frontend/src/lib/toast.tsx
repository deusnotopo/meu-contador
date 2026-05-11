import React, { useState, useEffect, createContext, useCallback } from 'react';

import { logger } from '@/lib/logger';
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'loading' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastCallback: ((toast: Omit<Toast, 'id'>) => string) | null = null;

export const ToastProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    const duration = toast.duration ?? (toast.type === 'error' ? 5000 : 3000);
    if (toast.type !== 'loading') {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Register global callback
  useEffect(() => {
    toastCallback = addToast;
    return () => {
      toastCallback = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 80,
      right: 16,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxWidth: 320,
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          onClick={() => onRemove(toast.id)}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: toast.type === 'error' ? 'rgba(255,79,110,0.95)' :
                       toast.type === 'success' ? 'rgba(0,217,145,0.95)' :
                       toast.type === 'loading' ? 'rgba(74,139,255,0.95)' :
                       'rgba(255,255,255,0.95)',
            color: toast.type === 'info' ? '#0a0f1a' : '#fff',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            animation: 'slideIn 0.3s ease-out',
            backdropFilter: 'blur(8px)',
          }}
        >
          {toast.type === 'loading' && '⏳ '}
          {toast.type === 'success' && '✅ '}
          {toast.type === 'error' && '❌ '}
          {toast.type === 'info' && 'ℹ️ '}
          {toast.message}
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to get the callback
const getToastCallback = () => {
  if (!toastCallback) {
    logger.warn('ToastProvider not mounted, falling back to console');
    return null;
  }
  return toastCallback;
};

export const showSuccess = (message: unknown) => {
  const callback = getToastCallback();
  if (callback) {
    callback({ message: String(message), type: 'success' });
  } else {
    logger.info("✅ [Toast Success]:", message);
  }
};

export const showError = (message: unknown) => {
  const callback = getToastCallback();
  if (callback) {
    callback({ message: String(message), type: 'error' });
  } else {
    logger.error("❌ [Toast Error]:", message);
  }
};

export const showLoading = (message: unknown) => {
  const callback = getToastCallback();
  if (callback) {
    return callback({ message: String(message), type: 'loading', duration: 0 });
  } else {
    logger.info("⏳ [Toast Loading]:", message);
    return crypto.randomUUID();
  }
};

export const dismissToast = (toastId: string) => {
  // The auto-removal handles this, but we can trigger immediate removal if needed
  logger.info(" dismissToast called for:", toastId);
};

export const showPromise = async <T,>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) => {
  const loadingId = showLoading(messages.loading);
  
  try {
    const result = await promise;
    dismissToast(loadingId);
    showSuccess(messages.success);
    return result;
  } catch (error) {
    dismissToast(loadingId);
    showError(messages.error);
    throw error;
  }
};
