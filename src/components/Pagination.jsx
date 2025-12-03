import React from 'react';

function getPageRange(current, total, maxVisible = 5) {
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
  const pages = [];
  for (let i = start; i <= end; i += 1) {
    pages.push(i);
  }
  return pages;
}

export default function Pagination({ current = 1, total = 1, onPageChange, variant = 'board' }) {
  const totalPages = Math.max(1, total);
  if (totalPages <= 1) return null;
  const pageRange = getPageRange(current, totalPages, 5);
  const baseClass = variant === 'comment' ? 'comment-pagination' : 'board-pagination';
  const pageBtnClass = variant === 'comment' ? 'comment-pagination__page-btn' : 'board-pagination__page-btn';
  const controlClass = variant === 'comment' ? 'comment-pagination__control' : 'board-pagination__control';
  const prevLabel = variant === 'comment' ? '이전' : '이전';
  const nextLabel = variant === 'comment' ? '다음' : '다음';

  return (
    <nav className={baseClass} aria-label={variant === 'comment' ? '댓글 페이지' : '게시글 페이지'}>
      <button
        type="button"
        className={`ghost-button ${controlClass}`}
        onClick={() => onPageChange?.(Math.max(1, current - 1))}
        disabled={current <= 1}
      >
        {prevLabel}
      </button>
      <div className={`${baseClass}__pages`}>
        {pageRange.map((page) => (
          <button
            key={page}
            type="button"
            className={`${pageBtnClass} ${page === current ? 'is-active' : ''}`}
            onClick={() => onPageChange?.(page)}
          >
            {page}
          </button>
        ))}
      </div>
      <span className={`${baseClass}__info`}>
        {current} / {totalPages}
      </span>
      <button
        type="button"
        className={`ghost-button ${controlClass}`}
        onClick={() => onPageChange?.(Math.min(totalPages, current + 1))}
        disabled={current >= totalPages}
      >
        {nextLabel}
      </button>
    </nav>
  );
}
