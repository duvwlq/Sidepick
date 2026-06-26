import { useNavigate } from 'react-router-dom';
import ChatbotDrawer from '../components/chatbot/ChatbotDrawer';

export default function ChatbotPage() {
  const navigate = useNavigate();

  return <ChatbotDrawer open onClose={() => navigate(-1)} />;
}
