import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatbotDrawer from './ChatbotDrawer';

export default function ChatbotFab() {
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function openChat() {
    setMenuOpen(false);
    setChatOpen(true);
  }

  function goCreate() {
    setMenuOpen(false);
    navigate('/create');
  }

  return (
    <>
      {menuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          role="presentation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      {menuOpen ? (
        <div
          className="fixed bottom-[70px] right-[20px] z-50 flex flex-col gap-[12px] rounded-[10px] bg-white px-[10px] py-[12px] drop-shadow-[0px_0px_2px_rgba(0,0,0,0.15)]"
          role="menu"
        >
          <button
            type="button"
            onClick={openChat}
            className="flex items-center gap-[8px] text-left"
            role="menuitem"
          >
            <ChatbotIcon />
            <span className="text-[14px] font-medium leading-[1.2] text-[#131416]">
              AI 챗봇
            </span>
          </button>
          <button
            type="button"
            onClick={goCreate}
            className="flex items-center gap-[8px] text-left"
            role="menuitem"
          >
            <EditIcon />
            <span className="text-[14px] font-medium leading-[1.2] text-[#131416]">
              경험 작성
            </span>
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={menuOpen}
        className="fixed bottom-[20px] right-[20px] z-50 flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#5A876E] text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition active:scale-95"
        style={{ display: chatOpen ? 'none' : undefined }}
      >
        {menuOpen ? <CloseIcon /> : <PlusIcon />}
      </button>

      <ChatbotDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[20px] w-[20px]" fill="none" aria-hidden="true">
      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[20px] w-[20px]" fill="none" aria-hidden="true">
      <path
        d="M5 5L15 15M15 5L5 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatbotIcon() {
  return (
    <svg viewBox="0 0 17 17" className="h-[17px] w-[17px]" fill="none" aria-hidden="true">
      <path
        d="M3 4C3 3.44772 3.44772 3 4 3H13C13.5523 3 14 3.44772 14 4V10C14 10.5523 13.5523 11 13 11H7L4 14V11H4C3.44772 11 3 10.5523 3 10V4Z"
        stroke="#131416"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[20px] w-[20px]" fill="none" aria-hidden="true">
      <path
        d="M12 3L17 8L8 17H3V12L12 3Z"
        stroke="#131416"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
