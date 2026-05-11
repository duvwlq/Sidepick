import { ERROR_CODES, type ErrorCode } from './error-codes';

export const DEFAULT_ERROR_MESSAGE = '잠시 연결이 불안정해요. 다시 시도해주세요.';

const USER_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.ANALYSIS_NOT_READY]: '분석 중이에요. 잠시만 기다려주세요.',
  [ERROR_CODES.ANALYSIS_TIMEOUT]: '잠시 연결이 불안정해요. 다시 시도해주세요.',
  [ERROR_CODES.ANALYSIS_FAILED]: '잠시 연결이 불안정해요. 다시 시도해주세요.',
  [ERROR_CODES.AI_UPSTREAM_ERROR]: '잠시 연결이 불안정해요. 다시 시도해주세요.',
  [ERROR_CODES.AI_PARSE_ERROR]: '잠시 연결이 불안정해요. 다시 시도해주세요.',
  [ERROR_CODES.REPORT_NOT_FOUND]: '분석 결과를 찾을 수 없어요.',
  [ERROR_CODES.EXPERIENCE_NOT_FOUND]: '사례를 찾을 수 없어요.',
  [ERROR_CODES.AUTH_REQUIRED]: '로그인 시간이 만료되었어요. 다시 로그인해주세요.',
  [ERROR_CODES.FORBIDDEN]: '접근 권한이 없어요.',
  [ERROR_CODES.NETWORK_ERROR]: '잠시 연결이 불안정해요. 다시 시도해주세요.',
  [ERROR_CODES.VALIDATION_ERROR]: '정보가 정확하지 않습니다. 다시 확인해주세요',
  [ERROR_CODES.RATE_LIMITED]: '잠시 후 다시 시도해주세요.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: DEFAULT_ERROR_MESSAGE,
  [ERROR_CODES.DB_WRITE_FAILED]: '잠시 연결이 불안정해요. 다시 시도해주세요.',
  [ERROR_CODES.MAIL_DELIVERY_FAILED]: '잠시 연결이 불안정해요. 다시 시도해주세요.',
};

export function mapErrorCodeToMessage(code?: string) {
  if (!code) {
    return DEFAULT_ERROR_MESSAGE;
  }

  return USER_ERROR_MESSAGES[code as ErrorCode] ?? DEFAULT_ERROR_MESSAGE;
}
