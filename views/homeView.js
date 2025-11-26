import { getState } from '../state/store.js';
import { fetchArticleStats } from '../api/articles.js';

export function initHomeView(container) {
  const greeting = container.querySelector('[data-role="home-greeting"]');
  const statPosts = container.querySelector('[data-role="stat-posts"]');
  const statReviews = container.querySelector('[data-role="stat-reviews"]');
  const statFailed = container.querySelector('[data-role="stat-failed"]');
  const statMembers = container.querySelector('[data-role="stat-members"]');
  const { user } = getState();

  if (greeting) {
    greeting.textContent = user
      ? `${user.userName}님,\nTrueDev에 오신 것을 환영합니다!`
      : 'AI 검증 기반 커뮤니티\n TrueDev에 오신 것을 환영합니다!';
    greeting.style.whiteSpace = 'pre-line';
  }

  if (statPosts) statPosts.textContent = (Math.floor(Math.random() * 50) + 120).toString();
  if (statReviews) statReviews.textContent = (Math.floor(Math.random() * 10) + 5).toString();
  if (statFailed) statFailed.textContent = (Math.floor(Math.random() * 6) + 2).toString();
  if (statMembers) statMembers.textContent = (Math.floor(Math.random() * 80) + 420).toString();

  fetchArticleStats()
    .then((res) => {
      const data = res?.data;
      if (!data) return;
      if (statPosts) statPosts.textContent = data.verified ?? 0;
      if (statReviews) statReviews.textContent = data.pending ?? 0;
      if (statFailed) statFailed.textContent = data.failed ?? 0;
      if (statMembers) statMembers.textContent = data.total ?? 0;
    })
    .catch(() => {});
}
