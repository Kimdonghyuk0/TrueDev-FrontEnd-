import {
  fetchArticleDetail,
  likeArticle,
  unlikeArticle,
  deleteArticle,
  fetchArticleComments,
  createComment,
  updateComment,
  deleteComment
} from '../api/articles.js';
import { setHelperText, setLoading } from '../utils/dom.js';
import { navigate } from '../core/router.js';
import { renderMarkdown } from '../utils/editor.js';
import { resolveAIStatus, AI_STATUS, parseAiMessage } from '../utils/ai.js';

const CATEGORY_META = {
  tech: 'Tech Talk',
  dev: '개발자 Talk',
  career: '취준생 Talk'
};
const CATEGORY_KEYS = Object.keys(CATEGORY_META);
const AI_MESSAGES = {
  [AI_STATUS.VERIFIED]: 'TrueDev AI가 내용을 검증했습니다. 기술적인 오류가 확인되지 않았어요.',
  [AI_STATUS.REVIEWING]: '현재 AI가 내용을 검증하고 있습니다. 커뮤니티 가이드 준수 여부를 확인 중입니다.',
  [AI_STATUS.WARNING]: 'AI가 사실관계나 커뮤니티 가이드 위반 가능성을 감지했습니다. 추가 확인이 필요해요.'
};

export async function initPostDetailView(container) {
  const articleId = getArticleIdFromQuery();
  if (!articleId) {
    container.innerHTML = '<div class="empty-state">잘못된 접근입니다.</div>';
    return;
  }
  const helper = container.querySelector('[data-role="post-helper"]');
  const commentInput = container.querySelector('[data-role="comment-input"]');
  const commentSubmit = container.querySelector('[data-role="comment-submit"]');
  const commentHelper = container.querySelector('[data-role="comment-helper"]');
  const commentList = container.querySelector('[data-role="comment-list"]');
  const commentPaginationControls = {
    root: container.querySelector('[data-role="comment-pagination"]'),
    prev: container.querySelector('[data-role="comment-page-prev"]'),
    next: container.querySelector('[data-role="comment-page-next"]'),
    pages: container.querySelector('[data-role="comment-pagination-pages"]'),
    info: container.querySelector('[data-role="comment-pagination-info"]')
  };
  const commentPaginationState = {
    page: 1,
    size: 0,
    totalPages: 1,
    totalArticles: 0,
    hasNext: false,
    hasPrev: false
  };
  const commentContext = {
    container,
    articleId,
    paginationControls: commentPaginationControls,
    paginationState: commentPaginationState
  };
  if (commentSubmit && commentInput) {
    commentSubmit.addEventListener('click', () =>
      handleCommentSubmit({
        textarea: commentInput,
        helper: commentHelper,
        button: commentSubmit,
        context: commentContext
      })
    );
  }
  if (commentPaginationControls.prev) {
    commentPaginationControls.prev.addEventListener('click', () =>
      handleCommentPageChange(commentContext, commentPaginationState.page - 1)
    );
  }
  if (commentPaginationControls.next) {
    commentPaginationControls.next.addEventListener('click', () =>
      handleCommentPageChange(commentContext, commentPaginationState.page + 1)
    );
  }
  if (commentPaginationControls.pages) {
    commentPaginationControls.pages.addEventListener('click', (event) => {
      const target = event.target.closest('[data-page-number]');
      if (!target) return;
      const targetPage = Number(target.dataset.pageNumber);
      if (!Number.isNaN(targetPage)) {
        handleCommentPageChange(commentContext, targetPage);
      }
    });
  }
  const commentDeleteModal = container.querySelector('[data-role="comment-delete-modal"]');
  const commentDeleteCancel = commentDeleteModal?.querySelector('[data-role="comment-delete-cancel"]');
  const commentDeleteConfirm = commentDeleteModal?.querySelector('[data-role="comment-delete-confirm"]');
  const commentEditModal = container.querySelector('[data-role="comment-edit-modal"]');
  const commentEditCancel = commentEditModal?.querySelector('[data-role="comment-edit-cancel"]');
  const commentEditConfirm = commentEditModal?.querySelector('[data-role="comment-edit-confirm"]');
  const commentEditInput = commentEditModal?.querySelector('[data-role="comment-edit-input"]');
  const commentEditHelper = commentEditModal?.querySelector('[data-role="comment-edit-helper"]');
  if (commentList) {
    commentList.addEventListener('click', (event) =>
      handleCommentAction(event, {
        context: commentContext,
        commentDeleteModal,
        commentEditModal,
        commentEditInput,
        commentEditHelper
      })
    );
  }
  if (commentDeleteCancel) {
    commentDeleteCancel.addEventListener('click', () => closeCommentDeleteModal(commentDeleteModal));
  }
  if (commentDeleteModal) {
    commentDeleteModal.addEventListener('click', (event) => {
      if (event.target === commentDeleteModal) {
        closeCommentDeleteModal(commentDeleteModal);
      }
    });
  }
  if (commentDeleteConfirm) {
    commentDeleteConfirm.addEventListener('click', () =>
      confirmCommentDelete({ modal: commentDeleteModal, context: commentContext })
    );
  }
  if (commentEditCancel) {
    commentEditCancel.addEventListener('click', () => closeCommentEditModal(commentEditModal));
  }
  if (commentEditModal) {
    commentEditModal.addEventListener('click', (event) => {
      if (event.target === commentEditModal) {
        closeCommentEditModal(commentEditModal);
      }
    });
  }
  if (commentEditConfirm) {
    commentEditConfirm.addEventListener('click', () =>
      confirmCommentEdit({
        modal: commentEditModal,
        context: commentContext,
        input: commentEditInput,
        helper: commentEditHelper,
        button: commentEditConfirm
      })
    );
  }
  const likeButton = container.querySelector('[data-role="like-button"]');
  if (likeButton) {
    likeButton.addEventListener('click', () => handleLikeToggle(likeButton, articleId));
  }
  const editButton = container.querySelector('[data-role="post-edit"]');
  if (editButton) {
    editButton.addEventListener('click', () => navigate('edit'));
  }
  const deleteModal = container.querySelector('[data-role="post-delete-modal"]');
  const deleteTrigger = container.querySelector('[data-role="post-delete-trigger"]');
  const deleteCancel = deleteModal?.querySelector('[data-role="delete-cancel"]');
  const deleteConfirm = deleteModal?.querySelector('[data-role="delete-confirm"]');
  if (deleteTrigger && deleteModal) {
    deleteTrigger.addEventListener('click', () => openDeleteModal(deleteModal));
  }
  if (deleteCancel) {
    deleteCancel.addEventListener('click', () => closeDeleteModal(deleteModal));
  }
  if (deleteConfirm && deleteModal) {
    deleteConfirm.addEventListener('click', () =>
      handleDeleteArticle(deleteConfirm, deleteModal, articleId, helper)
    );
  }
  if (deleteModal) {
    deleteModal.addEventListener('click', (event) => {
      if (event.target === deleteModal) {
        closeDeleteModal(deleteModal);
      }
    });
  }

  try {
    const response = await fetchArticleDetail(articleId);
    const { data } = response;
    populateDetail(container, data);
    // 목록과 동기화: 최신 글 정보를 전파
    document.dispatchEvent(new CustomEvent('article:updated', { detail: data }));
    loadComments({
      container,
      articleId,
      paginationState: commentPaginationState,
      paginationControls: commentPaginationControls
    });
  } catch (error) {
    if (helper) setHelperText(helper, error.message || '게시글을 불러오지 못했습니다.');
  }
}

function populateDetail(container, article) {
  container.querySelector('[data-field="title"]').textContent = article.title || '';
  container.querySelector('[data-field="author"]').textContent = article.author?.userName || '';
  container.querySelector('[data-field="createdAt"]').textContent = article.createdAt || '';
  container.querySelector('[data-field="likeCount"]').textContent = article.likeCount ?? 0;
  container.querySelector('[data-field="viewCount"]').textContent = article.viewCount ?? 0;
  container.querySelector('[data-field="commentCount"]').textContent = article.commentCount ?? 0;
  const authorAvatar = container.querySelector('[data-field="post-avatar"]');
  if (authorAvatar) {
    if (article.author?.profileImage) {
      authorAvatar.style.backgroundImage = `url(${article.author.profileImage})`;
      authorAvatar.style.backgroundSize = 'cover';
      authorAvatar.style.backgroundPosition = 'center';
    } else {
      authorAvatar.style.backgroundImage = 'none';
    }
  }
  const imageBox = container.querySelector('[data-role="post-image"]');
  if (imageBox) {
    if (article.image) {
      imageBox.style.backgroundImage = `url(${article.image})`;
      imageBox.classList.add('has-image');
      imageBox.setAttribute('aria-hidden', 'false');
    } else {
      imageBox.style.backgroundImage = 'none';
      imageBox.classList.remove('has-image');
      imageBox.setAttribute('aria-hidden', 'true');
    }
  }
  populateCategory(container, article);
  populateAIVerdict(container, article);
  const viewer = container.querySelector('[data-role="post-viewer"]');
  if (viewer) {
    renderMarkdown(viewer, article.content || '');
  }
  const actions = container.querySelector('.post-detail__actions');
  if (actions) {
    actions.classList.toggle('is-hidden', article.isAuthor === false);
  }
  const likeButton = container.querySelector('[data-role="like-button"]');
  syncLikeButtonState(likeButton, resolveLikedState(article));
}

function getArticleIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('article');
  return id ? Number(id) : null;
}

function resolveLikedState(article) {
  if (!article || typeof article !== 'object') return false;
  if (typeof article.likedByMe === 'boolean') return article.likedByMe;
  if (typeof article.isLiked === 'boolean') return article.isLiked;
  if (typeof article.liked === 'boolean') return article.liked;
  if (typeof article.isLike === 'boolean') return article.isLike;
  return false;
}

function syncLikeButtonState(button, isLiked) {
  if (!button) return;
  button.classList.toggle('is-liked', isLiked);
  button.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
  button.dataset.liked = isLiked ? 'true' : 'false';
}

function populateAIVerdict(container, article) {
  const statusField = container.querySelector('[data-field="ai-status"]');
  const messageField = container.querySelector('[data-field="ai-message"]');
  const updatedField = container.querySelector('[data-field="ai-updated"]');
  if (!statusField || !messageField) return;
  const parsedAi = parseAiMessage(article.aiMessage);
  const hasResponse = article.isCheck || parsedAi.hasParsed;
  const isVerifiedExplicit = article.isVerified === true;
  const inferredNoMessage = parsedAi.hasParsed && !parsedAi.aiComment;
  const isVerified = isVerifiedExplicit || (hasResponse && inferredNoMessage);
  const status = hasResponse ? (isVerified ? AI_STATUS.VERIFIED : AI_STATUS.WARNING) : AI_STATUS.REVIEWING;
  const aiMsg = cleanAiMessage(article.aiMessage);

  // 상태 배지
  statusField.textContent = status;
  statusField.classList.toggle('is-reviewing', status === AI_STATUS.REVIEWING);
  statusField.classList.toggle('is-warning', status === AI_STATUS.WARNING);
  statusField.classList.toggle('is-verified', status === AI_STATUS.VERIFIED);

  // 메시지
  if (isVerified) {
    statusField.textContent = 'AI VERIFIED';
    // 성공 시에는 파싱 결과와 무관하게 통일된 문구만 노출
    messageField.textContent = 'AI 검증을 통과한 게시글입니다.';
  } else {
    const fallbackMessage = AI_MESSAGES[status] ?? AI_MESSAGES[AI_STATUS.REVIEWING];
    messageField.textContent = aiMsg || fallbackMessage;
  }

  if (updatedField) {
    updatedField.textContent = formatDate(article.editedAt || article.createdAt || new Date().toISOString());
  }
}

function cleanAiMessage(raw) {
  if (!raw) return '';

  // 객체로 올 수도 있으니 먼저 객체 처리
  if (typeof raw === 'object') {
    const aiComment = raw.aiComment ? String(raw.aiComment) : '';
    if (aiComment) return aiComment;
    if (raw.isFact === true) return '';
  }

  if (typeof raw !== 'string') return '';

  let text = raw.trim();
  // ```json ...``` 제거
  if (text.startsWith('```')) {
    text = text.replace(/^```[a-zA-Z]*\s*/m, '').replace(/```$/m, '').trim();
  }

  // 여러 형태로 파싱 시도 (이중 인코딩까지 포함)
  const candidates = [
    text,
    text.replace(/^"(.*)"$/, '$1'),
    text.replace(/\\"/g, '"').replace(/\\\\/g, '\\'),
  ];

  for (const cand of candidates) {
    try {
      const parsed = JSON.parse(cand);
      if (typeof parsed === 'object' && parsed !== null) {
        const aiComment = parsed.aiComment ? String(parsed.aiComment) : '';
        if (aiComment) return aiComment;
        if (parsed.isFact === true) return '';
      }
    } catch (e) {
      // ignore and try next
    }
  }

  // isFact true 패턴이면 aiComment가 비어있다고 보고 빈 문자열로 처리
  const plain = text.replace(/\\"/g, '"');
  const isFactTrue = /"isFact"\s*:\s*true/.test(plain);
  const aiCommentEmpty = /"aiComment"\s*:\s*""/.test(plain) || !/"aiComment"\s*:/.test(plain);
  if (isFactTrue && aiCommentEmpty) {
    return '';
  }
  return plain;
}

function populateCategory(container, article) {
  const label = container.querySelector('[data-role="post-category"]');
  if (!label) return;
  label.textContent = CATEGORY_META.tech ?? 'Tech Talk';
}

function deriveCategoryKey(article) {
  const base = typeof article.postId === 'number'
    ? article.postId
    : typeof article.id === 'number'
      ? article.id
      : Math.floor(Math.random() * 999);
  return CATEGORY_KEYS[base % CATEGORY_KEYS.length];
}

async function handleLikeToggle(button, articleId) {
  if (!button || !articleId || button.disabled) return;
  const isLiked = button.dataset.liked === 'true';
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try {
    if (isLiked) {
      await unlikeArticle(articleId);
      syncLikeButtonState(button, false);
      adjustLikeCount(button, -1);
    } else {
      await likeArticle(articleId);
      syncLikeButtonState(button, true);
      adjustLikeCount(button, 1);
    }
  } catch (error) {
    if (error?.status === 409) {
      window.alert('이미 좋아요를 누른 게시글입니다.');
      syncLikeButtonState(button, true);
    } else {
      window.alert(error.message || '좋아요 처리에 실패했습니다.');
    }
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

function adjustLikeCount(button, delta) {
  if (!button || typeof delta !== 'number') return;
  const target = button.querySelector('[data-field="likeCount"]');
  if (!target) return;
  const current = Number(target.textContent) || 0;
  const next = Math.max(0, current + delta);
  target.textContent = next;
}

async function handleDeleteArticle(confirmButton, modal, articleId, helper) {
  if (!confirmButton || !articleId) return;
  setLoading(confirmButton, true);
  try {
    await deleteArticle(articleId);
    closeDeleteModal(modal);
    if (helper) setHelperText(helper, '게시글이 삭제되었습니다.', 'success');
    setTimeout(() => navigate('board', { replace: true }), 500);
  } catch (error) {
    if (helper) {
      setHelperText(helper, error.message || '게시글 삭제에 실패했습니다.');
    }
  } finally {
    setLoading(confirmButton, false);
  }
}

function openDeleteModal(modal) {
  if (!modal) return;
  modal.classList.remove('is-hidden');
}

function closeDeleteModal(modal) {
  if (!modal) return;
  modal.classList.add('is-hidden');
}

function handleCommentAction(
  event,
  { context, commentDeleteModal, commentEditModal, commentEditInput, commentEditHelper }
) {
  const editButton = event.target.closest('[data-role="comment-edit"]');
  if (editButton) {
    const card = editButton.closest('.comment-card');
    if (card && card.dataset.isAuthor === 'true') {
      handleCommentEdit({
        card,
        modal: commentEditModal,
        input: commentEditInput,
        helper: commentEditHelper
      });
    }
    return;
  }
  const deleteButton = event.target.closest('[data-role="comment-delete"]');
  if (deleteButton) {
    const card = deleteButton.closest('.comment-card');
    if (card && card.dataset.isAuthor === 'true') {
      const commentId = Number(card.dataset.commentId);
      if (commentId) {
        if (commentDeleteModal) {
          openCommentDeleteModal(commentDeleteModal, commentId);
        } else {
          handleCommentDelete({ commentId, context });
        }
      }
    }
  }
}

async function handleCommentSubmit({ textarea, helper, button, context }) {
  if (!textarea || !button || !context?.articleId) return;
  const { container, articleId, paginationState, paginationControls } = context;
  const content = textarea.value.trim();
  if (!content) {
    setHelperText(helper, '댓글을 입력해주세요.');
    textarea.focus();
    return;
  }
  setHelperText(helper, '');
  setLoading(button, true);
  try {
    await createComment(articleId, { content });
    setHelperText(helper, '댓글이 등록되었습니다.', 'success');
    textarea.value = '';
    updateCommentCount(container, 1);
    paginationState.page = 1;
    loadComments({
      container,
      articleId,
      page: 1,
      paginationState,
      paginationControls
    });
  } catch (error) {
    setHelperText(helper, error.message || '댓글 등록에 실패했습니다.');
  } finally {
    setLoading(button, false);
  }
}

async function loadComments({ container, articleId, page = 1, paginationState, paginationControls }) {
  const list = container.querySelector('[data-role="comment-list"]');
  const template = container.querySelector('#comment-item-template');
  if (!list || !template) return;
  showCommentsMessage(list, '댓글을 불러오는 중입니다...');
  try {
    const response = await fetchArticleComments(articleId, page);
    const payload = response?.data || {};
    const comments = Array.isArray(payload.comments) ? payload.comments : [];
    if (paginationState) {
      paginationState.page = payload.page ?? page;
      paginationState.size = payload.size ?? comments.length;
      paginationState.totalPages = payload.totalPages ?? 1;
      paginationState.totalArticles = payload.totalArticles ?? comments.length;
      paginationState.hasNext = Boolean(payload.hasNext);
      paginationState.hasPrev = Boolean(payload.hasPrev);
      if (paginationState.page > paginationState.totalPages && paginationState.totalPages >= 1) {
        return loadComments({
          container,
          articleId,
          page: paginationState.totalPages,
          paginationState,
          paginationControls
        });
      }
    }
    updateCommentPaginationControls(paginationControls, paginationState);
    if (comments.length === 0) {
      showCommentsMessage(list, '등록된 댓글이 없습니다.');
      return;
    }
    const fragment = document.createDocumentFragment();
    comments.forEach((comment) => {
      const node = template.content.cloneNode(true);
      const card = node.querySelector('.comment-card');
      if (card) {
        card.dataset.commentId = comment.id;
        card.dataset.isAuthor = comment.isAuthor ? 'true' : 'false';
      }
      node.querySelector('[data-field="author"]').textContent = comment.author?.userName || '익명';
      node.querySelector('[data-field="createdAt"]').textContent = formatDate(comment.createdAt);
      node.querySelector('[data-field="content"]').textContent = comment.content || '';
      const actions = node.querySelector('[data-role="comment-actions"]');
      if (actions) {
        actions.classList.toggle('is-hidden', comment.isAuthor === false);
      }
      const avatar = node.querySelector('[data-field="avatar"]');
      if (avatar) {
        if (comment.author?.profileImage) {
          avatar.style.backgroundImage = `url(${comment.author.profileImage})`;
          avatar.style.backgroundSize = 'cover';
        } else {
          avatar.style.backgroundImage = 'none';
        }
      }
      fragment.appendChild(node);
    });
    list.replaceChildren(fragment);
  } catch (error) {
    showCommentsMessage(list, error.message || '댓글을 불러오지 못했습니다.');
  }
}

function showCommentsMessage(list, text) {
  if (!list) return;
  list.innerHTML = `<div class="empty-state">${text}</div>`;
}

function formatDate(value) {
  if (!value) return '-';
  try {
    return new Date(value).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return value;
  }
}

function updateCommentCount(container, delta) {
  const target = container.querySelector('[data-field="commentCount"]');
  if (!target || typeof delta !== 'number') return;
  const current = Number(target.textContent) || 0;
  const next = Math.max(0, current + delta);
  target.textContent = next;
}

function handleCommentPageChange(context, targetPage) {
  if (!context?.articleId || !context?.container) return;
  const { paginationState } = context;
  const total = Math.max(1, paginationState?.totalPages || 1);
  const clamped = Math.max(1, Math.min(targetPage, total));
  if (clamped === (paginationState?.page || 1)) return;
  loadComments({
    container: context.container,
    articleId: context.articleId,
    page: clamped,
    paginationState,
    paginationControls: context.paginationControls
  });
}

function updateCommentPaginationControls(controls = {}, state = {}) {
  if (!controls.root || !state) return;
  const totalPages = Math.max(1, state.totalPages || 1);
  const current = Math.min(Math.max(1, state.page || 1), totalPages);
  controls.root.classList.toggle('is-hidden', totalPages <= 1);
  if (controls.prev) controls.prev.disabled = current <= 1;
  if (controls.next) controls.next.disabled = current >= totalPages;
  if (controls.info) controls.info.textContent = `${current} / ${totalPages}`;
  if (controls.pages) {
    const fragment = document.createDocumentFragment();
    const range = getCommentPageRange(current, totalPages);
    range.forEach((page) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'comment-pagination__page-btn';
      if (page === current) button.classList.add('is-active');
      button.dataset.pageNumber = String(page);
      button.textContent = String(page);
      fragment.appendChild(button);
    });
    controls.pages.replaceChildren(fragment);
  }
}

function getCommentPageRange(current, total) {
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

function handleCommentEdit({ card, modal, input, helper }) {
  if (!modal || !input) return;
  const commentId = Number(card?.dataset.commentId);
  if (!commentId) return;
  const contentNode = card.querySelector('[data-field="content"]');
  const currentText = contentNode?.textContent?.trim() ?? '';
  modal.dataset.commentId = commentId;
  input.value = currentText;
  if (helper) helper.textContent = '';
  modal.classList.remove('is-hidden');
}

async function handleCommentDelete({ commentId, context }) {
  if (!commentId || !context?.articleId) return;
  const { container, articleId, paginationState, paginationControls } = context;
  const helper = container.querySelector('[data-role="comment-helper"]');
  try {
    await deleteComment(articleId, commentId);
    if (helper) setHelperText(helper, '댓글이 삭제되었습니다.', 'success');
    updateCommentCount(container, -1);
    const targetPage = Math.min(
      paginationState.page,
      Math.max(1, paginationState.totalPages || paginationState.page)
    );
    loadComments({
      container,
      articleId,
      page: targetPage,
      paginationState,
      paginationControls
    });
  } catch (error) {
    if (helper) setHelperText(helper, error.message || '댓글 삭제에 실패했습니다.');
  }
}

function openCommentDeleteModal(modal, commentId) {
  if (!modal) return;
  modal.dataset.commentId = commentId;
  modal.classList.remove('is-hidden');
}

function closeCommentDeleteModal(modal) {
  if (!modal) return;
  delete modal.dataset.commentId;
  modal.classList.add('is-hidden');
}

function confirmCommentDelete({ modal, context }) {
  if (!modal) return;
  const commentId = Number(modal.dataset.commentId);
  closeCommentDeleteModal(modal);
  handleCommentDelete({ commentId, context });
}

function closeCommentEditModal(modal) {
  if (!modal) return;
  delete modal.dataset.commentId;
  modal.classList.add('is-hidden');
}

async function confirmCommentEdit({ modal, context, input, helper, button }) {
  if (!modal || !input || !button || !context?.articleId) return;
  const { container, articleId, paginationState, paginationControls } = context;
  const commentId = Number(modal.dataset.commentId);
  const content = input.value.trim();
  if (!content) {
    setHelperText(helper, '내용을 입력해주세요.');
    input.focus();
    return;
  }
  setHelperText(helper, '');
  setLoading(button, true);
  try {
    await updateComment(articleId, commentId, { content });
    closeCommentEditModal(modal);
    loadComments({
      container,
      articleId,
      page: paginationState.page,
      paginationState,
      paginationControls
    });
  } catch (error) {
    setHelperText(helper, error.message || '댓글 수정에 실패했습니다.');
  } finally {
    setLoading(button, false);
  }
}
