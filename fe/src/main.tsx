import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App.tsx';
import { ToastProvider } from './components/common/ToastProvider.tsx';

document.documentElement.lang = 'ko';
document.documentElement.setAttribute('translate', 'no');
document.documentElement.classList.add('notranslate');
document.body.setAttribute('translate', 'no');
document.body.classList.add('notranslate');
document.getElementById('root')?.setAttribute('translate', 'no');
document.getElementById('root')?.classList.add('notranslate');

createRoot(document.getElementById('root')!).render(
  <ToastProvider>
    <App />
  </ToastProvider>,
);
