const FLASH_TOAST_KEY = 'sidepick.flash-toast';

type FlashToastPayload = {
  message: string;
  tone?: 'error' | 'success' | 'info';
};

export function setFlashToast(message: string, tone: FlashToastPayload['tone'] = 'success') {
  sessionStorage.setItem(FLASH_TOAST_KEY, JSON.stringify({ message, tone }));
}

export function popFlashToast(): FlashToastPayload | null {
  const raw = sessionStorage.getItem(FLASH_TOAST_KEY);
  if (!raw) {
    return null;
  }

  sessionStorage.removeItem(FLASH_TOAST_KEY);

  try {
    return JSON.parse(raw) as FlashToastPayload;
  } catch {
    return null;
  }
}
