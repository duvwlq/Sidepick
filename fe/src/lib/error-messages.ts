import { ERROR_CODES, type ErrorCode } from './error-codes';

export const DEFAULT_ERROR_MESSAGE =
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';

const USER_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.ANALYSIS_NOT_READY]: '경험을 분석하고 있어요. 잠시만 기다려주세요.',
  [ERROR_CODES.ANALYSIS_TIMEOUT]:
    '분석 시간이 예상보다 오래 걸리고 있어요. 잠시 후 다시 확인해주세요.',
  [ERROR_CODES.ANALYSIS_FAILED]:
    '분석 요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.AI_UPSTREAM_ERROR]:
    '분석 요청 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.AI_PARSE_ERROR]:
    '분석 결과를 준비하는 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.REPORT_NOT_FOUND]: '요청한 분석 결과를 찾을 수 없어요.',
  [ERROR_CODES.EXPERIENCE_NOT_FOUND]: '요청한 사례를 찾을 수 없어요.',
  [ERROR_CODES.AUTH_REQUIRED]: '로그인 후 이용할 수 있어요.',
  [ERROR_CODES.FORBIDDEN]: '접근 권한이 없어요.',
  [ERROR_CODES.NETWORK_ERROR]: '네트워크 연결을 확인한 뒤 다시 시도해주세요.',
  [ERROR_CODES.VALIDATION_ERROR]: '입력한 내용을 다시 확인해주세요.',
  [ERROR_CODES.RATE_LIMITED]: '요청이 많아요. 잠시 후 다시 시도해주세요.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: DEFAULT_ERROR_MESSAGE,
  [ERROR_CODES.DB_WRITE_FAILED]: '저장 중 문제가 발생했어요. 다시 시도해주세요.',
};

export function mapErrorCodeToMessage(code?: string) {
  if (!code) {
    return DEFAULT_ERROR_MESSAGE;
  }

  return USER_ERROR_MESSAGES[code as ErrorCode] ?? DEFAULT_ERROR_MESSAGE;
}
