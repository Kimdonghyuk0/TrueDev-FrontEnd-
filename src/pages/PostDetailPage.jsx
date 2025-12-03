import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  createComment,
  deleteArticle,
  deleteComment,
  fetchArticleComments,
  fetchArticleDetail,
  likeArticle,
  unlikeArticle,
  updateComment
} from '../api/articles.js';
import { AI_STATUS, resolveAIStatus } from '../utils/ai.js';
import { formatDate } from '../utils/format.js';
import Pagination from '../components/Pagination.jsx';

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

function deriveCategoryKey(article) {
  const base =
    typeof article?.postId === 'number'
      ? article.postId
      : typeof article?.id === 'number'
        ? article.id
        : Math.floor(Math.random() * 999);
  return CATEGORY_KEYS[base % CATEGORY_KEYS.length];
}

function resolveLikedState(article) {
  if (!article || typeof article !== 'object') return false;
  if (typeof article.likedByMe === 'boolean') return article.likedByMe;
  if (typeof article.isLiked === 'boolean') return article.isLiked;
  if (typeof article.liked === 'boolean') return article.liked;
  if (typeof article.isLike === 'boolean') return article.isLike;
  return false;
}

export default function PostDetailPage() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [helper, setHelper] = useState('');
  const [likeBusy, setLikeBusy] = useState(false);

  const [commentInput, setCommentInput] = useState('');
  const [commentHelper, setCommentHelper] = useState('');
  const [comments, setComments] = useState([]);
  const [commentState, setCommentState] = useState({ page: 1, totalPages: 1 });
  const [commentLoading, setCommentLoading] = useState(true);
  const [commentDeleteId, setCommentDeleteId] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editHelper, setEditHelper] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!articleId) return;
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    setLoading(true);
    setHelper('');
    try {
      const response = await fetchArticleDetail(articleId);
      const data = response?.data ?? {};
      setArticle(data);
      setLoading(false);
      loadComments(1, data);
    } catch (error) {
      setHelper(error.message || '게시글을 불러오지 못했습니다.');
      setLoading(false);
    }
  };

  const loadComments = async (page = 1) => {
    setCommentLoading(true);
    setCommentHelper('');
    try {
      const response = await fetchArticleComments(articleId, page);
      const payload = response?.data || {};
      const items = Array.isArray(payload.comments) ? payload.comments : [];
      const nextPage = payload.page ?? page;
      const totalPages = payload.totalPages ?? 1;
      const totalArticles = payload.totalArticles ?? items.length;
      if (nextPage > totalPages && totalPages >= 1) {
        setCommentState({ page: totalPages, totalPages });
        setCommentLoading(false);
        loadComments(totalPages);
        return;
      }
      setComments(items);
      setCommentState({ page: nextPage, totalPages, totalArticles });
    } catch (error) {
      setCommentHelper(error.message || '댓글을 불러오지 못했습니다.');
      setComments([]);
      setCommentState({ page: 1, totalPages: 1 });
    } finally {
      setCommentLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!article || likeBusy) return;
    const isLiked = resolveLikedState(article);
    setLikeBusy(true);
    try {
      if (isLiked) {
        await unlikeArticle(articleId);
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                likedByMe: false,
                likeCount: Math.max(0, (prev.likeCount || 0) - 1)
              }
            : prev
        );
      } else {
        await likeArticle(articleId);
        setArticle((prev) =>
          prev
            ? {
                ...prev,
                likedByMe: true,
                likeCount: (prev.likeCount || 0) + 1
              }
            : prev
        );
      }
    } catch (error) {
      if (error?.status === 409) {
        window.alert('이미 좋아요를 누른 게시글입니다.');
        setArticle((prev) => (prev ? { ...prev, likedByMe: true } : prev));
      } else {
        window.alert(error.message || '좋아요 처리에 실패했습니다.');
      }
    } finally {
      setLikeBusy(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!articleId) return;
    try {
      await deleteArticle(articleId);
      setDeleteModalOpen(false);
      setHelper('게시글이 삭제되었습니다.');
      setTimeout(() => navigate('/board', { replace: true }), 500);
    } catch (error) {
      setHelper(error.message || '게시글 삭제에 실패했습니다.');
    }
  };

  const handleCommentSubmit = async () => {
    const content = commentInput.trim();
    if (!content) {
      setCommentHelper('댓글을 입력해주세요.');
      return;
    }
    setCommentHelper('');
    try {
      await createComment(articleId, { content });
      setCommentInput('');
      setArticle((prev) =>
        prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev
      );
      loadComments(1);
    } catch (error) {
      setCommentHelper(error.message || '댓글 등록에 실패했습니다.');
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!commentId) return;
    try {
      await deleteComment(articleId, commentId);
      setArticle((prev) =>
        prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount || 0) - 1) } : prev
      );
      loadComments(Math.min(commentState.page, commentState.totalPages));
    } catch (error) {
      setCommentHelper(error.message || '댓글 삭제에 실패했습니다.');
    } finally {
      setCommentDeleteId(null);
    }
  };

  const handleCommentEditConfirm = async () => {
    if (!editingComment?.id) return;
    const content = editingComment.content.trim();
    if (!content) {
      setEditHelper('내용을 입력해주세요.');
      return;
    }
    setEditBusy(true);
    setEditHelper('');
    try {
      await updateComment(articleId, editingComment.id, { content });
      setEditingComment(null);
      loadComments(commentState.page);
    } catch (error) {
      setEditHelper(error.message || '댓글 수정에 실패했습니다.');
    } finally {
      setEditBusy(false);
    }
  };

  const aiStatus = useMemo(() => resolveAIStatus(article), [article]);
  const aiMessage = AI_MESSAGES[aiStatus] ?? AI_MESSAGES[AI_STATUS.REVIEWING];
  const categoryLabel = article ? CATEGORY_META[deriveCategoryKey(article)] : 'TrueDev Thread';
  const isLiked = resolveLikedState(article);

  if (!articleId) {
    return (
      <section className="view">
        <div className="empty-state">잘못된 접근입니다.</div>
      </section>
    );
  }

  if (!loading && !article) {
    return (
      <section className="view">
        <div className="empty-state">{helper || '게시글을 불러오지 못했습니다.'}</div>
      </section>
    );
  }

  return (
    <section className="view post-detail">
      <div className="post-detail__wrapper">
        <header className="post-detail__header">
          <button type="button" className="icon-button" onClick={() => navigate('/board')}>
            &lsaquo;
          </button>
          <h2 data-role="post-category">{categoryLabel}</h2>
        </header>

        <article className="post-detail__card">
          <div className="post-detail__title-row" data-role="post-helper">
            <div>
              <h3 className="post-detail__title" data-field="title">
                {article?.title ?? ''}
              </h3>
              <div className="post-detail__meta">
                <div className="author">
                  <div
                    className="avatar"
                    data-field="post-avatar"
                    style={
                      article?.author?.profileImage
                        ? { backgroundImage: `url(${article.author.profileImage})`, backgroundSize: 'cover' }
                        : undefined
                    }
                  ></div>
                  <div>
                    <p className="author-name" data-field="author">
                      {article?.author?.userName ?? ''}
                    </p>
                    <p className="timestamp" data-field="createdAt">
                      {formatDate(article?.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className={`post-detail__actions ${article?.isAuthor === false ? 'is-hidden' : ''}`}>
              <button type="button" className="ghost-button" onClick={() => navigate(`/edit/${articleId}`)}>
                수정
              </button>
              <button
                type="button"
                className="ghost-button ghost-button--danger"
                onClick={() => setDeleteModalOpen(true)}
              >
                삭제
              </button>
            </div>
          </div>

          <div
            className={`post-detail__image ${article?.image ? 'has-image' : ''}`}
            data-role="post-image"
            aria-hidden={article?.image ? 'false' : 'true'}
            style={article?.image ? { backgroundImage: `url(${article.image})` } : undefined}
          ></div>
          <div className="post-detail__content" data-role="post-viewer">
            {loading ? (
              <div className="empty-state">게시글을 불러오는 중입니다...</div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{article?.content || ''}</ReactMarkdown>
            )}
          </div>

          <div className="post-detail__stats">
            <button
              type="button"
              className={`post-detail__stat-card post-detail__like-button ${isLiked ? 'is-liked' : ''}`}
              data-role="like-button"
              aria-pressed={isLiked ? 'true' : 'false'}
              aria-label="좋아요 토글"
              onClick={handleLikeToggle}
              disabled={likeBusy}
            >
              <strong data-field="likeCount">{article?.likeCount ?? 0}</strong>
              <span>좋아요</span>
            </button>
            <div className="post-detail__stat-card">
              <strong data-field="viewCount">{article?.viewCount ?? 0}</strong>
              <span>조회수</span>
            </div>
            <div className="post-detail__stat-card">
              <strong data-field="commentCount">{article?.commentCount ?? 0}</strong>
              <span>댓글</span>
            </div>
          </div>
          <section className="ai-verdict" data-role="ai-verdict">
            <header>
              <span
                className={`ai-verdict__badge ${
                  aiStatus === AI_STATUS.REVIEWING ? 'is-reviewing' : aiStatus === AI_STATUS.WARNING ? 'is-warning' : ''
                }`}
                data-field="ai-status"
              >
                {aiStatus}
              </span>
              <p className="ai-verdict__timestamp" data-field="ai-updated">
                {formatDate(article?.editedAt || article?.createdAt || new Date().toISOString())}
              </p>
            </header>
            <p className="ai-verdict__message" data-field="ai-message">
              {aiMessage}
            </p>
          </section>
        </article>

        <section className="comment-box">
          <textarea
            placeholder="댓글을 남겨주세요!"
            data-role="comment-input"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
          ></textarea>
          <div className="comment-box__actions">
            <button type="button" className="primary-button" onClick={handleCommentSubmit} disabled={commentLoading}>
              댓글 등록
            </button>
          </div>
          <p className="helper-text" data-role="comment-helper">
            {commentHelper}
          </p>
        </section>

        <section className="comment-list" data-role="comment-list" aria-live="polite">
          {commentLoading && <div className="empty-state">댓글을 불러오는 중입니다...</div>}
          {!commentLoading && comments.length === 0 && <div className="empty-state">등록된 댓글이 없습니다.</div>}
          {!commentLoading &&
            comments.map((comment) => (
              <article
                className="comment-card"
                key={comment.id}
                data-comment-id={comment.id}
                data-is-author={comment.isAuthor ? 'true' : 'false'}
              >
                <header>
                  <div className="author">
                    <div
                      className="avatar"
                      data-field="avatar"
                      style={
                        comment.author?.profileImage
                          ? { backgroundImage: `url(${comment.author.profileImage})`, backgroundSize: 'cover' }
                          : undefined
                      }
                    ></div>
                    <div>
                      <p className="author-name" data-field="author">
                        {comment.author?.userName || '익명'}
                      </p>
                      <p className="timestamp" data-field="createdAt">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className={`comment-actions ${comment.isAuthor === false ? 'is-hidden' : ''}`}>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        setEditingComment({ id: comment.id, content: comment.content ?? '' })
                      }
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="ghost-button ghost-button--danger"
                      onClick={() => setCommentDeleteId(comment.id)}
                    >
                      삭제
                    </button>
                  </div>
                </header>
                <p data-field="content">{comment.content}</p>
              </article>
            ))}
        </section>
        <Pagination
          variant="comment"
          current={commentState.page}
          total={commentState.totalPages}
          onPageChange={(page) => loadComments(page)}
        />
      </div>

      <div className={`modal ${commentDeleteId ? '' : 'is-hidden'}`} data-role="comment-delete-modal">
        <div className="modal__content">
          <h3 className="modal__title">댓글을 삭제하시겠습니까?</h3>
          <p className="modal__sub">삭제한 내용은 복구할 수 없습니다.</p>
          <div className="modal__actions">
            <button type="button" className="ghost-button" onClick={() => setCommentDeleteId(null)}>
              취소
            </button>
            <button type="button" className="primary-button" onClick={() => handleCommentDelete(commentDeleteId)}>
              확인
            </button>
          </div>
        </div>
      </div>

      <div className={`modal ${editingComment ? '' : 'is-hidden'}`} data-role="comment-edit-modal">
        <div className="modal__content modal__content--form">
          <h3 className="modal__title">댓글을 수정하시겠습니까?</h3>
          <textarea
            data-role="comment-edit-input"
            placeholder="댓글을 입력해주세요."
            value={editingComment?.content ?? ''}
            onChange={(e) => setEditingComment((prev) => (prev ? { ...prev, content: e.target.value } : prev))}
          ></textarea>
          <p className="helper-text" data-role="comment-edit-helper">
            {editHelper}
          </p>
          <div className="modal__actions">
            <button type="button" className="ghost-button" onClick={() => setEditingComment(null)}>
              취소
            </button>
            <button type="button" className="primary-button" onClick={handleCommentEditConfirm} disabled={editBusy}>
              {editBusy ? '잠시만요...' : '확인'}
            </button>
          </div>
        </div>
      </div>

      <div className={`modal ${deleteModalOpen ? '' : 'is-hidden'}`} data-role="post-delete-modal">
        <div className="modal__content">
          <h3 className="modal__title">게시글을 삭제하시겠습니까?</h3>
          <p className="modal__sub">삭제한 내용은 복구할 수 없습니다.</p>
          <div className="modal__actions">
            <button type="button" className="ghost-button" onClick={() => setDeleteModalOpen(false)}>
              취소
            </button>
            <button type="button" className="primary-button" onClick={handleDeleteArticle}>
              확인
            </button>
          </div>
        </div>
      </div>

      {helper && <p className="helper-text" style={{ textAlign: 'center' }}>{helper}</p>}
    </section>
  );
}
