import { ERROR_CODES, type ErrorCode } from './error-codes';

export const DEFAULT_ERROR_MESSAGE =
  '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';

const USER_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.ANALYSIS_NOT_READY]: '분석이 아직 진행 중입니다. 잠시만 기다려 주세요.',
  [ERROR_CODES.ANALYSIS_TIMEOUT]:
    '분석 시간이 예상보다 오래 걸리고 있습니다. 잠시 후 다시 확인해 주세요.',
  [ERROR_CODES.ANALYSIS_FAILED]:
    '분석 요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  [ERROR_CODES.AI_UPSTREAM_ERROR]:
    '분석 요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  [ERROR_CODES.AI_PARSE_ERROR]:
    '분석 결과를 준비하는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  [ERROR_CODES.REPORT_NOT_FOUND]: '요청한 분석 결과를 찾을 수 없습니다.',
  [ERROR_CODES.EXPERIENCE_NOT_FOUND]: '요청한 경험을 찾을 수 없습니다.',
  [ERROR_CODES.AUTH_REQUIRED]: '로그인이 필요한 서비스입니다.',
  [ERROR_CODES.FORBIDDEN]: '접근 권한이 없습니다.',
  [ERROR_CODES.NETWORK_ERROR]: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
  [ERROR_CODES.VALIDATION_ERROR]: '입력한 내용을 다시 확인해 주세요.',
  [ERROR_CODES.RATE_LIMITED]: '요청이 많습니다. 잠시 후 다시 시도해 주세요.',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: DEFAULT_ERROR_MESSAGE,
  [ERROR_CODES.DB_WRITE_FAILED]: '저장 중 문제가 발생했습니다. 다시 시도해 주세요.',
  [ERROR_CODES.MAIL_DELIVERY_FAILED]:
    '인증 메일 전송에 실패했습니다. 로컬 환경이라면 개발용 인증코드를 확인해 주세요.',
};

export function mapErrorCodeToMessage(code?: string) {
  if (!code) {
    return DEFAULT_ERROR_MESSAGE;
  }

  return USER_ERROR_MESSAGES[code as ErrorCode] ?? DEFAULT_ERROR_MESSAGE;
}
