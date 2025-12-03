import React from 'react';
import { AI_STATUS, resolveAIStatus } from '../utils/ai.js';
import { formatDate } from '../utils/format.js';

export default function BoardList({ posts, onSelect }) {
  if (!posts || posts.length === 0) {
    return (
      <div className="board-list">
        <div className="empty-state">아직 등록된 게시글이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="board-list" aria-live="polite">
      {posts.map((post) => {
        const status = resolveAIStatus(post);
        const hasImage = Boolean(post.image);
        const aiClass =
          status === AI_STATUS.REVIEWING
            ? 'is-reviewing'
            : status === AI_STATUS.WARNING
              ? 'is-warning'
              : '';
        return (
          <article
            className="board-card"
            key={post.postId}
            data-article-id={post.postId}
            data-category={post.categoryKey ?? 'tech'}
            onClick={() => onSelect?.(post.postId)}
          >
            <div className="board-card__row">
              <div className="board-card__title-block">
                <span className="board-card__category" data-field="category">
                  {post.categoryLabel ?? 'Community'}
                </span>
                <h3 className="board-card__title">{post.title ?? '제목 없음'}</h3>
                <span
                  className={`board-card__badge board-card__badge--image ${hasImage ? '' : 'is-hidden'}`}
                  data-field="has-image"
                >
                  이미지
                </span>
              </div>
              <div className="board-card__meta-right">
                <time className="board-card__date">{formatDate(post.createdAt ?? post.editedAt)}</time>
                <span className={`board-card__ai-status ${aiClass}`} data-field="ai-status">
                  {status}
                </span>
              </div>
            </div>
            <div className="board-card__meta">
              <span>
                좋아요 <strong data-field="likes">{post.likeCount ?? 0}</strong>
              </span>
              <span>
                댓글 <strong data-field="comments">{post.commentCount ?? 0}</strong>
              </span>
              <span>
                조회수 <strong data-field="views">{post.viewCount ?? 0}</strong>
              </span>
            </div>
            <div className="board-card__author">
              <div
                className="avatar"
                data-field="avatar"
                style={
                  post.author?.profileImage
                    ? {
                        backgroundImage: `url(${post.author.profileImage})`,
                        backgroundSize: 'cover'
                      }
                    : undefined
                }
              ></div>
              <div>
                <p className="author-name" data-field="author">
                  {post.author?.userName ?? '익명 작성자'}
                </p>
                <p className="author-desc" data-field="author-desc">
                  TrueDev Member
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
