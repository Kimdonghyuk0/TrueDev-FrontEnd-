import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function generateStats() {
  return {
    posts: Math.floor(Math.random() * 50) + 120,
    reviews: Math.floor(Math.random() * 10) + 5,
    failed: Math.floor(Math.random() * 6) + 2,
    members: Math.floor(Math.random() * 80) + 420
  };
}

export default function HomePage() {
  const { user } = useAuth();
  const stats = useMemo(() => generateStats(), []);
  const greeting = user
    ? `${user.userName}님,\nTrueDev에 오신 것을 환영합니다!`
    : 'AI 검증 기반 커뮤니티\n TrueDev에 오신 것을 환영합니다!';

  return (
    <section className="view home-view">
      <div className="home-hero">
        <div className="home-hero__intro">
          <p className="eyebrow">TrueDev</p>
          <h1 data-role="home-greeting" style={{ whiteSpace: 'pre-line' }}>
            {greeting}
          </h1>
          <p className="sub">신뢰할 수 있는 기술 정보와 커리어 인사이트를 확인해보세요.</p>
          <div className="home-hero__actions">
            <Link className="primary-button" to="/board">
              커뮤니티 둘러보기
            </Link>
          </div>
        </div>
        <div className="home-hero__panel">
          <h3>실시간 AI 검증 통계</h3>
          <ul>
            <li>
              <strong data-role="stat-posts">{stats.posts}</strong>
              <span>AI 검증 통과 게시글</span>
            </li>
            <li>
              <strong data-role="stat-reviews">{stats.reviews}</strong>
              <span>검증 대기 중</span>
            </li>
            <li>
              <strong data-role="stat-failed">{stats.failed}</strong>
              <span>검증 실패</span>
            </li>
            <li>
              <strong data-role="stat-members">{stats.members}</strong>
              <span>가입자 수</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="home-panels home-panels--grid">
        <article className="home-panel home-panel--tiles">
          <p className="eyebrow">바로가기</p>
          <div className="home-tiles">
            <Link className="home-tile" to="/board?category=tech">
              <span>Tech Talk</span>
            </Link>
            <Link className="home-tile" to="/board?category=dev">
              <span>개발자 Talk</span>
            </Link>
            <Link className="home-tile" to="/board?category=career">
              <span>취준생 Talk</span>
            </Link>
            <Link className="home-tile home-tile--accent" to="/mypage">
              <span>마이페이지</span>
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
