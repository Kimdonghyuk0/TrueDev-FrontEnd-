import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BoardList from '../components/BoardList.jsx';
import Pagination from '../components/Pagination.jsx';
import { fetchArticles } from '../api/articles.js';
import { useAuth } from '../context/AuthContext.jsx';
import { AI_STATUS, resolveAIStatus } from '../utils/ai.js';

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

function derivePage(paramValue) {
  const numeric = Number(paramValue);
  if (Number.isInteger(numeric) && numeric > 0) {
    return numeric;
  }
  return 1;
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

export default function BoardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('tech');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageState, setPageState] = useState({
    page: 1,
    totalPages: 1,
    totalArticles: 0
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const currentPage = useMemo(() => derivePage(searchParams.get('page')), [searchParams]);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam && CATEGORY_META[categoryParam]) {
      setActiveCategory(categoryParam);
    } else {
      setActiveCategory('tech');
    }
  }, [searchParams]);

  useEffect(() => {
    loadArticles(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const loadArticles = async (page) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchArticles(page);
      const payload = response?.data || {};
      const fetchedPosts = Array.isArray(payload.articles) ? payload.articles : [];
      const enhanced = fetchedPosts.map(enhancePostMetadata);
      setPosts(enhanced);
      setPageState({
        page: payload.page ?? page,
        totalPages: payload.totalPages ?? 1,
        totalArticles: payload.totalArticles ?? fetchedPosts.length
      });
    } catch (err) {
      setError(err.message || '게시글을 불러오지 못했습니다.');
      setPosts([]);
      setPageState({ page: 1, totalPages: 1, totalArticles: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('category', category);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handlePageChange = (page) => {
    const totalPages = Math.max(1, pageState.totalPages || 1);
    const clamped = Math.max(1, Math.min(page, totalPages));
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set('page', String(clamped));
    setSearchParams(nextParams);
  };

  const filteredPosts = useMemo(
    () => posts.filter((post) => post.categoryKey === activeCategory),
    [posts, activeCategory]
  );

  const stats = useMemo(() => {
    const totals = posts.reduce(
      (acc, post) => {
        const status = resolveAIStatus(post);
        if (status === AI_STATUS.VERIFIED) acc.verified += 1;
        else if (status === AI_STATUS.WARNING) acc.failed += 1;
        else acc.pending += 1;
        return acc;
      },
      { verified: 0, pending: 0, failed: 0 }
    );
    return { ...totals, total: pageState.totalArticles || posts.length || 0 };
  }, [posts, pageState.totalArticles]);

  const meta = CATEGORY_META[activeCategory];
  const greeting = `${user?.userName ? `${user.userName}님, ` : ''}${meta.label}에서 깊이 있는 인사이트를 나눠보세요.`;
  const sub = `${meta.description} · AI가 검증한 정보를 확인해 보세요.`;

  return (
    <section className="view">
      <div className="board-wrapper">
        <section className="board-hero">
          <div className="board-hero__intro">
            <p className="greeting" data-role="board-greeting">
              {greeting}
            </p>
            <p className="sub" data-role="board-sub">
              {sub}
            </p>
          </div>
          <div className="board-hero__actions">
            <div className="category-tabs" data-role="category-tabs">
              {CATEGORY_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`category-tab ${key === activeCategory ? 'is-active' : ''}`}
                  data-category={key}
                  onClick={() => handleCategoryChange(key)}
                >
                  {CATEGORY_META[key].label}
                </button>
              ))}
            </div>
            <button className="primary-button" type="button" onClick={() => navigate('/compose')}>
              게시글 작성
            </button>
          </div>
          <div className="board-hero__stats" aria-label="실시간 AI 검증 통계">
            <div className="board-hero__stats-header">
              <h3>실시간 AI 검증 통계</h3>
            </div>
            <div className="board-hero__stats-grid">
              <div className="board-stat">
                <strong data-role="board-stat-verified">{stats.verified}</strong>
                <span>AI 검증 통과 게시글</span>
              </div>
              <div className="board-stat">
                <strong data-role="board-stat-pending">{stats.pending}</strong>
                <span>검증 대기 중</span>
              </div>
              <div className="board-stat">
                <strong data-role="board-stat-failed">{stats.failed}</strong>
                <span>검증 실패</span>
              </div>
              <div className="board-stat">
                <strong data-role="board-stat-total">{stats.total}</strong>
                <span>전체 게시글</span>
              </div>
            </div>
          </div>
        </section>
        <div aria-live="polite">
          {loading && (
            <div className="board-list">
              <div className="empty-state">게시글을 불러오는 중입니다...</div>
            </div>
          )}
          {!loading && error && (
            <div className="board-list">
              <div className="empty-state">{error}</div>
            </div>
          )}
          {!loading && !error && (
            <BoardList
              posts={filteredPosts}
              onSelect={(articleId) => navigate(`/post/${articleId}`)}
            />
          )}
        </div>
        <Pagination
          current={pageState.page}
          total={pageState.totalPages}
          onPageChange={handlePageChange}
          variant="board"
        />
      </div>
    </section>
  );
}
