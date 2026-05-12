import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App.tsx';
import { ToastProvider } from './components/common/ToastProvider.tsx';

function markElementNotranslate(element: Element | null) {
  if (!element) {
    return;
  }

  element.setAttribute('translate', 'no');
  element.classList.add('notranslate');
}

function markTreeNotranslate(root: ParentNode | null) {
  if (!root) {
    return;
  }

  if (root instanceof Element) {
    markElementNotranslate(root);
  }

  root.querySelectorAll?.('*').forEach((node) => {
    markElementNotranslate(node);
  });
}

document.documentElement.lang = 'ko';
markElementNotranslate(document.documentElement);
markElementNotranslate(document.body);

const rootElement = document.getElementById('root');
markTreeNotranslate(rootElement);

createRoot(rootElement!).render(
  <ToastProvider>
    <App />
  </ToastProvider>,
);

queueMicrotask(() => {
  markTreeNotranslate(rootElement);
});

const translationGuard = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) {
        markTreeNotranslate(node);
      }
    });
  }
});

if (rootElement) {
  translationGuard.observe(rootElement, {
    childList: true,
    subtree: true,
  });
}
