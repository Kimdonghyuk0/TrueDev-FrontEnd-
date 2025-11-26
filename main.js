import { setupRouter, navigate } from './core/router.js';
import { initHeaderControls, refreshHeader } from './components/header.js';
import { logout as requestLogout } from './api/auth.js';
import { clearAuth, hasAuth } from './state/store.js';

let forcedLogoutInProgress = false;
const THEME_STORAGE_KEY = 'truedev_theme';

function bootstrap() {
  initHeaderControls({ onLogout: handleLogout });
  initThemeToggle();
  initProcessToggle();
  document.addEventListener('app:unauthorized', handleUnauthorizedSession);
  setupRouter();
}

async function handleLogout({ skipRequest = false } = {}) {
  if (!hasAuth()) return;
  try {
    if (!skipRequest) {
      await requestLogout();
    }
  } catch (error) {
    console.warn('logout_failed', error);
  } finally {
    clearAuth();
    refreshHeader();
    navigate('login', { replace: true });
  }
}

function handleUnauthorizedSession() {
  if (forcedLogoutInProgress) return;
  forcedLogoutInProgress = true;
  window.alert('세션이 만료되었습니다. 다시 로그인해주세요.');
  handleLogout({ skipRequest: true }).finally(() => {
    forcedLogoutInProgress = false;
  });
}

function initThemeToggle() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  setTheme(savedTheme || 'light');
  const toggle = document.querySelector('[data-role="theme-toggle"]');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
    });
  }
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  const toggle = document.querySelector('[data-role="theme-toggle"]');
  if (toggle) {
    toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggle.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
  }
}

function initProcessToggle() {
  const button = document.querySelector('[data-role="process-toggle"]');
  const panel = document.querySelector('[data-role="process-panel"]');
  if (!button || !panel) return;
  const closePanel = () => panel.classList.remove('is-visible');
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    panel.classList.toggle('is-visible');
  });
  document.addEventListener('click', (event) => {
    if (!panel.contains(event.target) && event.target !== button) {
      closePanel();
    }
  });
}

bootstrap();
