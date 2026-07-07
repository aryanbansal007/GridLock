import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type ToastKind = 'error' | 'success' | 'info';
interface ToastItem { id: number; message: string; kind: ToastKind }
interface ToastContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const KIND_STYLE: Record<ToastKind, { icon: string; accent: string; border: string }> = {
  error: { icon: '⚠️', accent: '#e10600', border: 'rgba(225,6,0,0.35)' },
  success: { icon: '✅', accent: '#22c55e', border: 'rgba(34,197,94,0.35)' },
  info: { icon: 'ℹ️', accent: '#ffffff', border: 'rgba(255,255,255,0.15)' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, kind: ToastKind = 'error') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, message, kind }]);
    setTimeout(() => dismiss(id), 6000);
  }, [dismiss]);

  const value: ToastContextValue = {
    showError: (message) => showToast(message, 'error'),
    showSuccess: (message) => showToast(message, 'success'),
    showToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div style={{ position: 'fixed', top: 76, right: 20, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
        {toasts.map(t => {
          const s = KIND_STYLE[t.kind];
          return (
            <div
              key={t.id}
              role="alert"
              style={{
                pointerEvents: 'auto', minWidth: 280, maxWidth: 380,
                background: 'rgba(10,10,12,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${s.border}`, borderLeft: `3px solid ${s.accent}`,
                borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10,
                boxShadow: '0 20px 48px rgba(0,0,0,0.5)', animation: 'gl-toast-in 0.25s ease',
              }}
            >
              <span style={{ fontSize: 15, lineHeight: '18px', flexShrink: 0 }}>{s.icon}</span>
              <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1.4 }}>{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1, padding: 2, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes gl-toast-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </ToastContext.Provider>
  );
}
