import { clearAuth, emitUnauthorized, getAuthState, updateTokens } from '../state/authStore.js';

const API_BASE_URL = window.API_BASE_URL ?? deriveDefaultBaseUrl();
let isRefreshing = false;

export async function request(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }
  headers.Accept = headers.Accept ?? 'application/json';

  const { token } = getAuthState();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    return await doFetchWithRefresh(path, options, headers);
  } catch (error) {
    if (error.name === 'TypeError') {
      throw new Error('서버에 연결하지 못했습니다. 백엔드가 실행 중인지 확인해주세요.');
    }
    throw error;
  }
}

async function doFetchWithRefresh(path, options, headers) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    body: options.body,
    headers,
    mode: 'cors'
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();
  if (response.ok) return payload;

  const message =
    typeof payload === 'object' && payload?.message ? payload.message : '요청에 실패했습니다.';

  if (response.status === 401 && message !== 'invalid_credentials' && !options.suppressUnauthorizedEvent) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${getAuthState().token}` };
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method ?? 'GET',
        body: options.body,
        headers: retryHeaders,
        mode: 'cors'
      });
      const retryJson = retryResponse.headers.get('content-type')?.includes('application/json');
      const retryPayload = retryJson ? await retryResponse.json() : await retryResponse.text();
      if (retryResponse.ok) return retryPayload;
      const retryMessage =
        typeof retryPayload === 'object' && retryPayload?.message
          ? retryPayload.message
          : '요청에 실패했습니다.';
      const retryError = new Error(retryMessage);
      retryError.status = retryResponse.status;
      retryError.data = retryPayload;
      throw retryError;
    }
    emitUnauthorized();
  }

  const error = new Error(message);
  error.status = response.status;
  error.data = payload;
  throw error;
}

async function tryRefreshToken() {
  if (isRefreshing) return false;
  const { refreshToken } = getAuthState();
  if (!refreshToken) return false;
  isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE_URL}/users/token/refresh`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Refresh-Token': `Bearer ${refreshToken}`
      }
    });
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await res.json() : await res.text();
    if (!res.ok) {
      clearAuth();
      return false;
    }
    const data = payload?.data ?? {};
    updateTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return true;
  } catch (error) {
    clearAuth();
    return false;
  } finally {
    isRefreshing = false;
  }
}

function deriveDefaultBaseUrl() {
  const { protocol, hostname } = window.location;
  const port = 8080;
  return `${protocol}//${hostname}:${port}`;
}
