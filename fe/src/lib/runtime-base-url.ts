function getHostname() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.hostname;
}

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function resolveApiBaseUrl() {
  const envValue = import.meta.env.VITE_API_BASE_URL;
  if (envValue) {
    return envValue;
  }

  const hostname = getHostname();
  if (!hostname || isLocalHost(hostname)) {
    return 'http://localhost:8081/api';
  }

  return 'https://api.side-pick.app/api';
}

export function resolveAiBaseUrl() {
  const envValue = import.meta.env.VITE_AI_BASE_URL;
  if (envValue) {
    return envValue;
  }

  const hostname = getHostname();
  if (!hostname || isLocalHost(hostname)) {
    return 'http://localhost:8000';
  }

  return 'https://api.side-pick.app';
}
