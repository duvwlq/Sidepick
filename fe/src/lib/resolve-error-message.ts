import { ApiError } from './api';
import { DEFAULT_ERROR_MESSAGE, mapErrorCodeToMessage } from './error-messages';

export function resolveErrorMessage(error: unknown, fallbackMessage = DEFAULT_ERROR_MESSAGE) {
  if (error instanceof ApiError) {
    if (error.code === 'VALIDATION_ERROR' && error.rawMessage) {
      return error.rawMessage;
    }

    return mapErrorCodeToMessage(error.code);
  }

  return fallbackMessage;
}
