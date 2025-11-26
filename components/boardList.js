export function showBoardMessage(target, text) {
  if (!target) return;
  target.innerHTML = `<div class="empty-state">${text}</div>`;
}

export function renderBoardList(posts, target, template) {
  if (!target || !template) return;
  if (!Array.isArray(posts) || posts.length === 0) {
    showBoardMessage(target, '아직 등록된 게시글이 없습니다.');
    return;
  }
  const fragment = document.createDocumentFragment();
  posts.forEach((post) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector('.board-card');
    if (card) {
      card.dataset.articleId = post.postId;
      card.dataset.category = post.categoryKey ?? 'tech';
    }
    node.querySelector('.board-card__title').textContent = post.title ?? '제목 없음';
    node.querySelector('.board-card__date').textContent = formatDate(post.createdAt ?? post.editedAt);
    const categoryNode = node.querySelector('[data-field="category"]');
    if (categoryNode) categoryNode.textContent = post.categoryLabel ?? 'Community';
    const imageBadge = node.querySelector('[data-field="has-image"]');
    if (imageBadge) {
      const hasImage = Boolean(post.image);
      imageBadge.classList.toggle('is-hidden', !hasImage);
    }
    const aiNode = node.querySelector('[data-field="ai-status"]');
    if (aiNode) {
      const statusText = post.aiStatus ?? 'AI REVIEWING';
      aiNode.textContent = statusText;
      aiNode.classList.toggle('is-reviewing', statusText.includes('REVIEW'));
      aiNode.classList.toggle('is-warning', statusText.includes('WARN'));
    }
    node.querySelector('[data-field="likes"]').textContent = post.likeCount ?? 0;
    node.querySelector('[data-field="views"]').textContent = post.viewCount ?? 0;
    node.querySelector('[data-field="comments"]').textContent = post.commentCount ?? 0;

    const authorName = post.author?.userName ?? '익명 작성자';
    node.querySelector('[data-field="author"]').textContent = authorName;
    node.querySelector('[data-field="author-desc"]').textContent = 'TrueDev Member';
    const avatar = node.querySelector('[data-field="avatar"]');
    if (post.author?.profileImage) {
      avatar.style.backgroundImage = `url(${post.author.profileImage})`;
      avatar.style.backgroundSize = 'cover';
    } else {
      avatar.style.backgroundImage = 'none';
    }
    fragment.appendChild(node);
  });
  target.replaceChildren(fragment);
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
