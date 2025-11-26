import { fetchArticles } from '../api/articles.js';
import { renderBoardList, showBoardMessage } from '../components/boardList.js';
import { getState } from '../state/store.js';
import { navigate } from '../core/router.js';
import { resolveAIStatus, AI_STATUS } from '../utils/ai.js';

const CATEGORY_META = {
  tech: {
    label: 'Tech Talk',
    description: '최신 기술과 인사이트를 나누는 공간'
  },
  dev: {
    label: '개발자 Talk',
    description: '개발자의 고민과 자유로운 토론을 위한 공간'
  },
  career: {
    label: '취준생 Talk',
    description: '취업 준비생을 위한 커뮤니티'
  }
};
const CATEGORY_KEYS = Object.keys(CATEGORY_META);
let cachedPosts = [];
let activeCategory = 'tech';
let pageState = {
  page: 1,
  size: 0,
  totalPages: 1,
  totalArticles: 0,
  hasNext: false,
  hasPrev: false
};

export function initBoardView(container) {
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get('category');
  const requestedPage = Number(params.get('page'));
  if (requestedCategory && CATEGORY_META[requestedCategory]) {
    activeCategory = requestedCategory;
  } else {
    activeCategory = 'tech';
  }
  if (Number.isInteger(requestedPage) && requestedPage > 0) {
    pageState.page = requestedPage;
  } else {
    pageState.page = 1;
  }
  const list = container.querySelector('#boardList');
  const template = container.querySelector('#board-card-template');
  const greeting = container.querySelector('[data-role="board-greeting"]');
  const sub = container.querySelector('[data-role="board-sub"]');
  const tabContainer = container.querySelector('[data-role="category-tabs"]');
  const statsNodes = {
    verified: container.querySelector('[data-role="board-stat-verified"]'),
    pending: container.querySelector('[data-role="board-stat-pending"]'),
    failed: container.querySelector('[data-role="board-stat-failed"]'),
    total: container.querySelector('[data-role="board-stat-total"]')
  };
  const paginationControls = {
    root: container.querySelector('[data-role="pagination"]'),
    prev: container.querySelector('[data-role="page-prev"]'),
    next: container.querySelector('[data-role="page-next"]'),
    pages: container.querySelector('[data-role="pagination-pages"]'),
    info: container.querySelector('[data-role="pagination-info"]')
  };
  if (!list || !template) return;
  const handlePageChange = (targetPage) => {
    const totalPages = pageState.totalPages || 1;
    const clamped = Math.max(1, Math.min(targetPage, totalPages));
    if (clamped === pageState.page) return;
    loadArticles(list, template, tabContainer, statsNodes, paginationControls, clamped);
  };

  if (tabContainer) {
    tabContainer.addEventListener('click', (event) => {
      const tab = event.target.closest('.category-tab');
      if (!tab) return;
      const category = tab.dataset.category;
      if (!category || category === activeCategory) return;
      activeCategory = category;
      updateCategoryTabs(tabContainer);
      updateGreeting(greeting, undefined, sub);
      syncQueryParams({ category: activeCategory });
      renderCurrentCategory(list, template);
    });
  }

  if (paginationControls.prev) {
    paginationControls.prev.addEventListener('click', () => handlePageChange(pageState.page - 1));
  }
  if (paginationControls.next) {
    paginationControls.next.addEventListener('click', () => handlePageChange(pageState.page + 1));
  }
  if (paginationControls.pages) {
    paginationControls.pages.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-page-number]');
      if (!btn) return;
      const targetPage = Number(btn.dataset.pageNumber);
      if (Number.isNaN(targetPage)) return;
      handlePageChange(targetPage);
    });
  }

  const { user } = getState();
  updateGreeting(greeting, user, sub);

  list.addEventListener('click', (event) => {
    const card = event.target.closest('.board-card');
    if (!card) return;
    const articleId = card.dataset.articleId;
    if (!articleId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('article', articleId);
    history.replaceState({}, '', url);
    navigate('post');
  });

  loadArticles(list, template, tabContainer, statsNodes, paginationControls, pageState.page);
}

async function loadArticles(list, template, tabContainer, statsNodes, paginationControls, page = 1) {
  showBoardMessage(list, '게시글을 불러오는 중입니다...');
  try {
    const response = await fetchArticles(page);
    const payload = response?.data || {};
    const posts = Array.isArray(payload.articles) ? payload.articles : [];
    cachedPosts = posts.map(enhancePostMetadata);
    pageState = {
      page: payload.page ?? page,
      size: payload.size ?? posts.length,
      totalPages: payload.totalPages ?? 1,
      totalArticles: payload.totalArticles ?? posts.length,
      hasNext: Boolean(payload.hasNext),
      hasPrev: Boolean(payload.hasPrev)
    };
    syncQueryParams({ page: pageState.page });
    if (tabContainer) updateCategoryTabs(tabContainer);
    updateBoardStats(statsNodes);
    updatePaginationControls(paginationControls);
    renderCurrentCategory(list, template);
  } catch (error) {
    showBoardMessage(list, error.message || '게시글을 불러오지 못했습니다.');
  }
}

function enhancePostMetadata(post) {
  const baseId = typeof post.postId === 'number' ? post.postId : Math.floor(Math.random() * 999);
  const categoryKey = CATEGORY_KEYS[baseId % CATEGORY_KEYS.length];
  const aiStatus = resolveAIStatus(post);
  return {
    ...post,
    categoryKey,
    categoryLabel: CATEGORY_META[categoryKey].label,
    aiStatus
  };
}

function filterPostsByCategory(posts) {
  return posts.filter((post) => post.categoryKey === activeCategory);
}

function updateCategoryTabs(tabContainer) {
  if (!tabContainer) return;
  tabContainer.querySelectorAll('.category-tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.category === activeCategory);
  });
}

function updateGreeting(target, user = getState().user, sub) {
  if (!target) return;
  const meta = CATEGORY_META[activeCategory];
  const username = user?.userName ? `${user.userName}님, ` : '';
  target.textContent = `${username}${meta.label}에서 깊이 있는 인사이트를 나눠보세요.`;
  if (sub) {
    sub.textContent = `${meta.description} · AI가 검증한 정보를 확인해 보세요.`;
  }
}

function renderCurrentCategory(list, template) {
  const filtered = filterPostsByCategory(cachedPosts);
  if (filtered.length === 0) {
    showBoardMessage(list, `${CATEGORY_META[activeCategory].label} 카테고리에 아직 게시글이 없습니다.`);
    return;
  }
  renderBoardList(filtered, list, template);
}

function updateBoardStats(statsNodes = {}) {
  if (!statsNodes) return;
  const totals = cachedPosts.reduce(
    (acc, post) => {
      const status = resolveAIStatus(post);
      if (status === AI_STATUS.VERIFIED) acc.verified += 1;
      else if (status === AI_STATUS.WARNING) acc.failed += 1;
      else acc.pending += 1;
      return acc;
    },
    { verified: 0, pending: 0, failed: 0 }
  );
  if (statsNodes.verified) statsNodes.verified.textContent = totals.verified.toString();
  if (statsNodes.pending) statsNodes.pending.textContent = totals.pending.toString();
  if (statsNodes.failed) statsNodes.failed.textContent = totals.failed.toString();
  if (statsNodes.total) {
    const totalArticles = pageState.totalArticles || cachedPosts.length || 0;
    statsNodes.total.textContent = totalArticles.toString();
  }
}

function updatePaginationControls(controls = {}) {
  if (!controls.root) return;
  const totalPages = Math.max(1, pageState.totalPages || 1);
  const current = Math.min(Math.max(1, pageState.page || 1), totalPages);
  controls.root.classList.toggle('is-hidden', totalPages <= 1);
  if (controls.prev) controls.prev.disabled = current <= 1;
  if (controls.next) controls.next.disabled = current >= totalPages;
  if (controls.info) controls.info.textContent = `${current} / ${totalPages}`;
  if (controls.pages) {
    const fragment = document.createDocumentFragment();
    const range = getPageRange(current, totalPages);
    range.forEach((page) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'board-pagination__page-btn';
      if (page === current) button.classList.add('is-active');
      button.dataset.pageNumber = String(page);
      button.textContent = String(page);
      fragment.appendChild(button);
    });
    controls.pages.replaceChildren(fragment);
  }
}

function getPageRange(current, total) {
  const maxVisible = 5;
  let start = Math.max(1, current - 2);
  let end = Math.min(total, current + 2);
  while (end - start + 1 < Math.min(total, maxVisible)) {
    if (start > 1) {
      start -= 1;
    } else if (end < total) {
      end += 1;
    } else {
      break;
    }
  }
  const range = [];
  for (let i = start; i <= end; i += 1) {
    range.push(i);
  }
  return range;
}

function syncQueryParams(newParams = {}) {
  const url = new URL(window.location.href);
  Object.entries(newParams).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  history.replaceState({}, '', url);
}
