import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChatbotFab() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/chatbot')}
      aria-label="사이드픽 챗봇 열기"
      className="fixed bottom-[130px] right-[20px] z-40 flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#131416] text-white shadow-[0_6px_20px_rgba(0,0,0,0.18)] transition hover:bg-black active:scale-95"
    >
      <MessageCircle size={24} strokeWidth={2.2} />
    </button>
  );
}
