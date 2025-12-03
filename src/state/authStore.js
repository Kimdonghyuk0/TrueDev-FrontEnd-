const STORAGE_TOKEN = 'lucas_auth_token';
const STORAGE_REFRESH_TOKEN = 'lucas_refresh_token';
const STORAGE_USER = 'lucas_auth_user';

const listeners = new Set();
const unauthorizedListeners = new Set();

const persistedUser = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_USER);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to parse stored user', error);
    return null;
  }
})();

let authState = {
  token: localStorage.getItem(STORAGE_TOKEN) || '',
  refreshToken: localStorage.getItem(STORAGE_REFRESH_TOKEN) || '',
  user: persistedUser
};

function notify() {
  listeners.forEach((listener) => {
    try {
      listener({ ...authState });
    } catch (error) {
      console.warn('Auth listener failed', error);
    }
  });
}

function persist() {
  localStorage.setItem(STORAGE_TOKEN, authState.token ?? '');
  localStorage.setItem(STORAGE_REFRESH_TOKEN, authState.refreshToken ?? '');
  if (authState.user) {
    localStorage.setItem(STORAGE_USER, JSON.stringify(authState.user));
  } else {
    localStorage.removeItem(STORAGE_USER);
  }
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function subscribeUnauthorized(listener) {
  unauthorizedListeners.add(listener);
  return () => unauthorizedListeners.delete(listener);
}

export function emitUnauthorized() {
  unauthorizedListeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn('Unauthorized listener failed', error);
    }
  });
}

export function getAuthState() {
  return { ...authState };
}

export function hasAuth() {
  return Boolean(authState.token && authState.user);
}

export function setAuth({ token, refreshToken, user }) {
  authState = {
    token: token ?? '',
    refreshToken: refreshToken ?? '',
    user: user ?? null
  };
  persist();
  notify();
}

export function updateTokens({ accessToken, refreshToken }) {
  authState = {
    ...authState,
    token: accessToken ?? authState.token,
    refreshToken: refreshToken ?? authState.refreshToken
  };
  persist();
  notify();
}

export function setUser(user) {
  authState = { ...authState, user: user ?? null };
  persist();
  notify();
}

export function clearAuth() {
  authState = { token: '', refreshToken: '', user: null };
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_USER);
  notify();
}
