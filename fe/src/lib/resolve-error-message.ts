import { ApiError } from './api';
import { DEFAULT_ERROR_MESSAGE, mapErrorCodeToMessage } from './error-messages';

function isGarbledMessage(value: string) {
  const normalized = value.normalize('NFKC');
  return normalized.includes('�') || /\?{3,}/.test(normalized);
}

function sanitizeMessage(message: string | undefined | null) {
  if (!message) {
    return null;
  }

  const normalized = message.trim();
  if (!normalized || isGarbledMessage(normalized)) {
    return null;
  }

  return normalized;
}

export function resolveErrorMessage(error: unknown, fallbackMessage = DEFAULT_ERROR_MESSAGE) {
  const safeFallback = sanitizeMessage(fallbackMessage) ?? DEFAULT_ERROR_MESSAGE;

  if (error instanceof ApiError) {
    const safeRawMessage = sanitizeMessage(error.rawMessage);
    if (error.code === 'VALIDATION_ERROR' && safeRawMessage) {
      return safeRawMessage;
    }

    const mappedMessage = sanitizeMessage(mapErrorCodeToMessage(error.code));
    return mappedMessage ?? safeFallback;
  }

  return safeFallback;
}
