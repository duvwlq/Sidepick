import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { popFlashToast } from '../../lib/flash-toast';
import { useToast } from './useToast';

export default function FlashToastListener() {
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    const payload = popFlashToast();
    if (!payload?.message) {
      return;
    }

    showToast(payload.message, payload.tone);
  }, [location.key, showToast]);

  return null;
}
