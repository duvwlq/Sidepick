import { useEffect, type ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

export default function BottomSheet({
  open,
  title,
  onClose,
  children,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;

    const originalStyle = window.document.body.style.overflow;
    window.document.body.style.overflow = 'hidden';

    return () => {
      window.document.body.style.overflow = originalStyle;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="바텀시트 닫기"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-[430px] rounded-t-3xl bg-white px-5 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#d9d9d9]" />

        {title && (
          <h2 className="mb-4 text-center text-base font-semibold text-black">
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
}
