import React, { useState, useCallback, useRef } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}

interface ShowToastOptions {
  message: string;
  type: 'success' | 'error';
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    visible: false,
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(({ message, type }: ShowToastOptions) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, visible: true });
    timerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  return { toast, showToast };
}

interface ToastDisplayProps {
  toast: ToastState;
}

export const ToastDisplay: React.FC<ToastDisplayProps> = ({ toast }) => {
  const bgClass = toast.type === 'success' ? 'bg-[#10B981]' : 'bg-[#EF4444]';

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] transition-all duration-300 ${
        toast.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className={`${bgClass} text-white rounded-xl px-4 py-3 shadow-lg flex items-center gap-2 min-w-[220px]`}>
        {toast.type === 'success' ? (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <span className="text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
};
