import { hasAuth } from '../state/store.js';
import { initLoginView } from '../views/loginView.js';
import { initSignupView } from '../views/signupView.js';
import { initBoardView } from '../views/boardView.js';
import { initPostCreateView } from '../views/postCreateView.js';
import { initPostDetailView } from '../views/postDetailView.js';
import { initProfileEditView } from '../views/profileEditView.js';
import { initPasswordChangeView } from '../views/passwordChangeView.js';
import { initPostEditView } from '../views/postEditView.js';
import { initHomeView } from '../views/homeView.js';
import { initMyPageView } from '../views/myPageView.js';

const ROUTE_PARAM = 'view';
const templateCache = new Map();
const viewRoot = document.getElementById('app-view');

const routes = {
  login: {
    template: './templates/login.html',
    controller: initLoginView,
    redirectIfAuth: true
  },
  signup: {
    template: './templates/signup.html',
    controller: initSignupView,
    redirectIfAuth: true
  },
  home: {
    template: './templates/home.html',
    controller: initHomeView,
    requiresAuth: true
  },
  board: {
    template: './templates/board.html',
    controller: initBoardView,
    requiresAuth: true
  },
  compose: {
    template: './templates/post-create.html',
    controller: initPostCreateView,
    requiresAuth: true
  },
  edit: {
    template: './templates/post-edit.html',
    controller: initPostEditView,
    requiresAuth: true
  },
  post: {
    template: './templates/post-detail.html',
    controller: initPostDetailView,
    requiresAuth: true
  },
  profile: {
    template: './templates/profile-edit.html',
    controller: initProfileEditView,
    requiresAuth: true
  },
  password: {
    template: './templates/password-change.html',
    controller: initPasswordChangeView,
    requiresAuth: true
  },
  mypage: {
    template: './templates/mypage.html',
    controller: initMyPageView,
    requiresAuth: true
  }
};

const defaultRoute = 'login';

export function setupRouter() {
  window.addEventListener('popstate', () => {
    const routeKey = getRouteFromLocation();
    renderRoute(routeKey, { replace: true, skipHistory: true });
  });

  document.body.addEventListener('click', (event) => {
    const link = event.target.closest('[data-link]');
    if (!link) return;
    const routeKey = link.dataset.route;
    if (!routeKey) return;
    event.preventDefault();
    const params = {};
    if (link.dataset.category) {
      params.category = link.dataset.category;
    }
    if (link.dataset.section) {
      params.section = link.dataset.section;
    }
    navigate(routeKey, { params: Object.keys(params).length ? params : undefined });
  });

  const initialRoute = getRouteFromLocation();
  renderRoute(initialRoute, { replace: true, skipHistory: true });
}

export function navigate(routeKey, options = {}) {
  return renderRoute(routeKey, { replace: options.replace ?? false, params: options.params });
}

async function renderRoute(routeKey, { replace = false, skipHistory = false, params } = {}) {
  let targetKey = normalizeRoute(routeKey);
  const targetConfig = routes[targetKey];

  if (targetConfig.requiresAuth && !hasAuth()) {
    targetKey = defaultRoute;
  } else if (targetConfig.redirectIfAuth && hasAuth()) {
    targetKey = 'home';
  }

  if (!skipHistory || replace) {
    updateHistory(targetKey, replace || skipHistory, params);
  }

  const route = routes[targetKey];
  if (!route) return;

  try {
    const html = await loadTemplate(route.template);
    viewRoot.innerHTML = html;
    route.controller?.(viewRoot);
  } catch (error) {
    viewRoot.innerHTML = `<div class="empty-state">뷰를 불러오지 못했습니다.<br />${error.message}</div>`;
  }
}

function normalizeRoute(routeKey) {
  if (!routeKey) return defaultRoute;
  return routes[routeKey] ? routeKey : defaultRoute;
}

function getRouteFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const key = params.get(ROUTE_PARAM);
  return normalizeRoute(key);
}

function updateHistory(routeKey, replace, params) {
  const url = new URL(window.location.href);
  url.searchParams.set(ROUTE_PARAM, routeKey);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, value);
    });
  }
  const relative = url.pathname + url.search + url.hash;
  if (replace) {
    history.replaceState({}, '', relative);
  } else {
    history.pushState({}, '', relative);
  }
}

async function loadTemplate(path) {
  if (templateCache.has(path)) {
    return templateCache.get(path);
  }
  const templateUrl = resolveTemplateUrl(path);
  const response = await fetch(templateUrl, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`템플릿(${templateUrl})을 불러오지 못했습니다.`);
  }
  const html = await response.text();
  templateCache.set(path, html);
  return html;
}

function resolveTemplateUrl(relativePath) {
  try {
    return new URL(relativePath, window.location.href).toString();
  } catch (error) {
    console.error('템플릿 경로를 계산할 수 없습니다.', error);
    return relativePath;
  }
}
