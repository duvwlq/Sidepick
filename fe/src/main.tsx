import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App.tsx';
import { ToastProvider } from './components/common/ToastProvider.tsx';

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>,
);
