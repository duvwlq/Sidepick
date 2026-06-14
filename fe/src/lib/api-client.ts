import { ERROR_CODES } from './error-codes';
import { clearSession } from './session';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8081/api';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly rawMessage?: string;

  constructor(message: string, status: number, code: string, rawMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.rawMessage = rawMessage;
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  errorCode?: string | null;
  traceId?: string | null;
  data: T;
  timestamp?: string;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export async function request<T>(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {};
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : isFormData
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    });
  } catch (networkError) {
    throw new ApiError(
      '네트워크 연결을 확인한 뒤 다시 시도해주세요.',
      0,
      ERROR_CODES.NETWORK_ERROR,
      networkError instanceof Error ? networkError.message : undefined,
    );
  }

  let json: ApiEnvelope<T | { detail?: string }> | null = null;
  try {
    json = (await response.json()) as ApiEnvelope<T | { detail?: string }>;
  } catch {
    json = null;
  }

  if (!response.ok || !json?.success) {
    if (response.status === 401 && options.token) {
      clearSession();
    }

    const detail =
      json &&
      typeof json.data === 'object' &&
      json.data &&
      'detail' in json.data
        ? json.data.detail
        : undefined;

    throw new ApiError(
      json?.message ?? '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요.',
      response.status,
      json?.errorCode ?? fallbackErrorCode(response.status),
      detail ?? json?.message,
    );
  }

  return json.data as T;
}

function fallbackErrorCode(status: number) {
  if (status === 401) {
    return ERROR_CODES.AUTH_REQUIRED;
  }
  if (status === 403) {
    return ERROR_CODES.FORBIDDEN;
  }
  if (status === 404) {
    return ERROR_CODES.EXPERIENCE_NOT_FOUND;
  }
  if (status === 400 || status === 422) {
    return ERROR_CODES.VALIDATION_ERROR;
  }
  if (status === 429) {
    return ERROR_CODES.RATE_LIMITED;
  }
  if (status === 502) {
    return ERROR_CODES.AI_UPSTREAM_ERROR;
  }
  if (status === 504) {
    return ERROR_CODES.ANALYSIS_TIMEOUT;
  }

  return ERROR_CODES.INTERNAL_SERVER_ERROR;
}
