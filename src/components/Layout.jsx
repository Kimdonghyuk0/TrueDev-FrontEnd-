import React, { useEffect, useRef, useState } from 'react';
import Header from './Header.jsx';

const THEME_STORAGE_KEY = 'truedev_theme';

export default function Layout({ children, onLogout }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_STORAGE_KEY) || 'light');
  const [processOpen, setProcessOpen] = useState(false);
  const processPanelRef = useRef(null);
  const processButtonRef = useRef(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!processOpen) return;
      const panel = processPanelRef.current;
      const button = processButtonRef.current;
      if (panel && button && !panel.contains(event.target) && !button.contains(event.target)) {
        setProcessOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [processOpen]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const toggleProcess = () => setProcessOpen((prev) => !prev);

  return (
    <div className="app-background">
      <div className="app-surface">
        <Header onLogout={onLogout} />
        <main id="app-view" className="app-main" aria-live="polite">
          {children}
        </main>
      </div>
      <button
        type="button"
        className="theme-toggle"
        data-role="theme-toggle"
        aria-label="테마 전환"
        onClick={toggleTheme}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <button
        type="button"
        className="info-toggle"
        data-role="process-toggle"
        aria-label="TrueDev 검증 프로세스"
        onClick={toggleProcess}
        ref={processButtonRef}
      >
        ?
      </button>
      <div
        className={`process-panel ${processOpen ? 'is-visible' : ''}`}
        data-role="process-panel"
        ref={processPanelRef}
      >
        <h4>TrueDev 검증 프로세스</h4>
        <p>AI가 정보의 정확성과 커뮤니티 가이드를 동시에 확인합니다.</p>
        <ol className="home-process">
          <li>게시글/댓글 작성</li>
          <li>AI 유해/주제 판별</li>
          <li>AI 검증 및 피드백</li>
          <li>커뮤니티 공개</li>
        </ol>
      </div>
    </div>
  );
}
