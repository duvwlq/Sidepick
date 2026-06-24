import { ERROR_CODES, type ErrorCode } from './error-codes';

export const DEFAULT_ERROR_MESSAGE = '잠시 후 다시 시도해주세요.';

const USER_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.ANALYSIS_NOT_READY]: '분석 중이에요. 잠시만 기다려주세요.',
  [ERROR_CODES.ANALYSIS_TIMEOUT]: '응답이 지연되고 있어요. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.ANALYSIS_FAILED]: '분석에 실패했어요. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.AI_UPSTREAM_ERROR]: 'AI 서버 연결이 불안정해요. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.AI_PARSE_ERROR]: '분석 결과를 정리하지 못했어요. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.REPORT_NOT_FOUND]: '분석 결과를 찾을 수 없어요.',
  [ERROR_CODES.EXPERIENCE_NOT_FOUND]: '사례를 찾을 수 없어요.',
  [ERROR_CODES.AUTH_REQUIRED]: '로그인 시간이 만료됐어요. 다시 로그인해주세요.',
  [ERROR_CODES.FORBIDDEN]: '접근 권한이 없어요.',
  [ERROR_CODES.NETWORK_ERROR]: '네트워크 연결을 확인한 뒤 다시 시도해주세요.',
  [ERROR_CODES.VALIDATION_ERROR]: '입력한 정보가 올바르지 않아요. 다시 확인해주세요.',
  [ERROR_CODES.RATE_LIMITED]: '요청이 많아요. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: DEFAULT_ERROR_MESSAGE,
  [ERROR_CODES.DB_WRITE_FAILED]: '저장에 실패했어요. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.MAIL_DELIVERY_FAILED]: '메일 전송에 실패했어요. 잠시 후 다시 시도해주세요.',
};

export function mapErrorCodeToMessage(code?: string) {
  if (!code) {
    return DEFAULT_ERROR_MESSAGE;
  }

  return USER_ERROR_MESSAGES[code as ErrorCode] ?? DEFAULT_ERROR_MESSAGE;
}
