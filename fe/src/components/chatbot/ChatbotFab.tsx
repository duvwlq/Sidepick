import { useState } from 'react';
import ChatbotDrawer from './ChatbotDrawer';

export default function ChatbotFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="사이드픽 챗봇 열기"
        className="fixed bottom-[130px] right-[20px] z-40 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#131416] text-[22px] text-white shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition hover:bg-black active:scale-95"
        style={{ display: open ? 'none' : undefined }}
      >
        💬
      </button>
      <ChatbotDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
