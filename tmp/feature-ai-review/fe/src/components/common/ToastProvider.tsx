import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ToastContext, type ToastTone } from './toast-context';

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, tone: ToastTone = 'error') => {
    const nextId = nextIdRef.current++;
    setToasts((current) => [...current, { id: nextId, message, tone }].slice(-3));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-[16px] z-[100] flex flex-col items-center gap-[8px] px-[16px]">
        {toasts.map((toast) => (
          <ToastMessage key={toast.id} toast={toast} onDone={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastMessage({
  toast,
  onDone,
}: {
  toast: ToastItem;
  onDone: () => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onDone, 2600);
    return () => window.clearTimeout(timeout);
  }, [onDone]);

  const toneClassName =
    toast.tone === 'success'
      ? 'border-[#D6E9DA] bg-[#F5FBF6] text-[#256A34]'
      : toast.tone === 'info'
        ? 'border-[#D8E4F8] bg-[#F6F9FF] text-[#32548F]'
        : 'border-[#F3D1D1] bg-[#FFF6F6] text-[#B42318]';

  return (
    <div
      className={`pointer-events-auto w-full max-w-[430px] rounded-[14px] border px-[14px] py-[12px] shadow-[0_8px_24px_rgba(0,0,0,0.08)] ${toneClassName}`}
      role="status"
      aria-live="polite"
    >
      <p className="break-words text-[13px] font-[500] leading-[18px]">{toast.message}</p>
    </div>
  );
}
