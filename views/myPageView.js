import { getState } from '../state/store.js';
import { fetchMyArticles, fetchMyComments } from '../api/articles.js';
import { navigate } from '../core/router.js';

export function initMyPageView(container) {
  const { user } = getState();
  const name = container.querySelector('[data-role="mypage-name"]');
  const email = container.querySelector('[data-role="mypage-email"]');
  const avatar = container.querySelector('[data-role="mypage-avatar"]');
  const bio = container.querySelector('[data-role="mypage-bio"]');
  const postList = container.querySelector('[data-role="mypage-post-list"]');
  const commentList = container.querySelector('[data-role="mypage-comment-list"]');
  const pagination = {
    root: container.querySelector('[data-role="mypage-post-pagination"]'),
    prev: container.querySelector('[data-role="mypage-post-prev"]'),
    next: container.querySelector('[data-role="mypage-post-next"]'),
    info: container.querySelector('[data-role="mypage-post-info"]')
  };
  const commentPagination = {
    root: container.querySelector('[data-role="mypage-comment-pagination"]'),
    prev: container.querySelector('[data-role="mypage-comment-prev"]'),
    next: container.querySelector('[data-role="mypage-comment-next"]'),
    info: container.querySelector('[data-role="mypage-comment-info"]')
  };

  if (name) name.textContent = user?.userName ?? 'TrueDev Member';
  if (email) email.textContent = user?.email ?? 'user@truedev.com';
  if (avatar) {
    if (user?.profileImage) {
      avatar.style.backgroundImage = `url(${user.profileImage})`;
      avatar.textContent = '';
    } else {
      avatar.style.backgroundImage = 'none';
      avatar.textContent = user?.userName?.charAt(0)?.toUpperCase() ?? 'T';
    }
  }
  if (bio) {
    bio.textContent = user ? `${user.userName}님의 TrueDev 공간` : '';
  }

  const pageState = { page: 1, totalPages: 1 };
  const commentPageState = { page: 1, totalPages: 1 };
  const goPage = (p) => {
    const target = Math.max(1, Math.min(p, pageState.totalPages || 1));
    if (target === pageState.page) return;
    loadMyArticles(postList, pagination, pageState, target);
  };
  const goCommentPage = (p) => {
    const target = Math.max(1, Math.min(p, commentPageState.totalPages || 1));
    if (target === commentPageState.page) return;
    loadMyComments(commentList, commentPagination, commentPageState, target);
  };

  pagination.prev?.addEventListener('click', () => goPage(pageState.page - 1));
  pagination.next?.addEventListener('click', () => goPage(pageState.page + 1));
  commentPagination.prev?.addEventListener('click', () => goCommentPage(commentPageState.page - 1));
  commentPagination.next?.addEventListener('click', () => goCommentPage(commentPageState.page + 1));

  postList?.addEventListener('click', (event) => {
    const item = event.target.closest('li[data-article-id]');
    if (!item) return;
    const articleId = item.dataset.articleId;
    if (!articleId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('article', articleId);
    history.replaceState({}, '', url);
    navigate('post');
  });
  commentList?.addEventListener('click', (event) => {
    const item = event.target.closest('li[data-article-id]');
    if (!item) return;
    const articleId = item.dataset.articleId;
    if (!articleId) return;
    const url = new URL(window.location.href);
    url.searchParams.set('article', articleId);
    history.replaceState({}, '', url);
    navigate('post');
  });

  loadMyArticles(postList, pagination, pageState, 1);
  loadMyComments(commentList, commentPagination, commentPageState, 1);

  focusSectionFromQuery();
}

async function loadMyArticles(target, pagination, pageState, page) {
  if (!target) return;
  target.innerHTML = '<li>불러오는 중입니다...</li>';
  try {
    const res = await fetchMyArticles(page);
    const data = res?.data;
    pageState.page = data?.page ?? page;
    pageState.totalPages = data?.totalPages ?? 1;
    const items = data?.articles ?? [];
    renderPostList(target, items);
    updatePagination(pagination, pageState);
  } catch (error) {
    target.innerHTML = `<li>${error?.message || '내 게시글을 불러오지 못했습니다.'}</li>`;
    updatePagination(pagination, { page: 1, totalPages: 1 });
  }
}

function renderPostList(target, items) {
  if (!target) return;
  target.innerHTML = '';
  if (!items || items.length === 0) {
    target.innerHTML = '<li>기록이 없습니다.</li>';
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    li.dataset.articleId = item.postId;
    const title = document.createElement('span');
    title.textContent = item.title;
    const meta = document.createElement('em');
    const created = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
    meta.textContent = `댓글 ${item.commentCount ?? 0} • 좋아요 ${item.likeCount ?? 0} • ${created}`;
    li.append(title, meta);
    target.appendChild(li);
  });
}

function updatePagination(pagination, pageState) {
  if (!pagination?.root) return;
  const { page, totalPages } = pageState;
  if (pagination.info) {
    pagination.info.textContent = `${page}/${totalPages || 1}`;
  }
  if (pagination.prev) pagination.prev.disabled = page <= 1;
  if (pagination.next) pagination.next.disabled = page >= (totalPages || 1);
}

async function loadMyComments(target, pagination, pageState, page) {
  if (!target) return;
  target.innerHTML = '<li>불러오는 중입니다...</li>';
  try {
    const res = await fetchMyComments(page);
    const data = res?.data;
    pageState.page = data?.page ?? page;
    pageState.totalPages = data?.totalPages ?? 1;
    const items = data?.comments ?? [];
    renderCommentList(target, items);
    updatePagination(pagination, pageState);
  } catch (error) {
    target.innerHTML = `<li>${error?.message || '내 댓글을 불러오지 못했습니다.'}</li>`;
    updatePagination(pagination, { page: 1, totalPages: 1 });
  }
}

function renderCommentList(target, items) {
  if (!target) return;
  target.innerHTML = '';
  if (!items || items.length === 0) {
    target.innerHTML = '<li>기록이 없습니다.</li>';
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');
    li.dataset.articleId = item.postId;
    const title = document.createElement('span');
    title.textContent = item.content;
    const meta = document.createElement('em');
    const created = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
    meta.textContent = `게시글 ${item.postId} • ${created}`;
    li.append(title, meta);
    target.appendChild(li);
  });
}

function focusSectionFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const section = params.get('section');
  if (!section) return;
  const target = document.getElementById(section === 'comments' ? 'mypageComments' : 'mypagePosts');
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
