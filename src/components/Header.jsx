import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header({ onLogout }) {
  const { user, isAuthed } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const avatarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!menuOpen) return;
      if (
        menuRef.current &&
        avatarRef.current &&
        !menuRef.current.contains(event.target) &&
        !avatarRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!isAuthed) {
      setMenuOpen(false);
    }
  }, [isAuthed]);

  const avatarStyle = useMemo(() => {
    if (user?.profileImage) {
      return {
        backgroundImage: `url(${user.profileImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return {};
  }, [user]);

  const avatarText = useMemo(() => {
    if (user?.profileImage) return '';
    return user?.userName?.trim()?.charAt(0)?.toUpperCase() ?? '';
  }, [user]);

  const handleLogout = async () => {
    await onLogout?.();
  };

  return (
    <header className="app-header">
      <div className="brand-block">
        <Link className="brand-link" to={isAuthed ? '/home' : '/login'}>
          TrueDev
        </Link>
        <span className="brand-tagline">AI 검증 기반 개발자 커뮤니티</span>
      </div>
      <div className="header-controls">
        <nav className="header-nav">
          <NavLink to="/home">홈</NavLink>
          <NavLink to="/board">커뮤니티</NavLink>
          <NavLink to="/mypage">마이페이지</NavLink>
        </nav>
        <div
          className={`profile-menu ${!isAuthed ? 'is-hidden' : ''} ${menuOpen ? 'is-open' : ''}`}
          data-role="profile-menu"
          ref={menuRef}
        >
          <button
            type="button"
            className="header-avatar"
            id="headerAvatar"
            aria-haspopup="true"
            aria-expanded={menuOpen ? 'true' : 'false'}
            aria-label="프로필 메뉴 열기"
            onClick={() => isAuthed && setMenuOpen((prev) => !prev)}
            ref={avatarRef}
            style={avatarStyle}
          >
            {avatarText}
          </button>
          <div className="profile-menu__panel" data-role="profile-panel">
            <Link to="/profile">회원정보수정</Link>
            <Link to="/password">비밀번호 수정</Link>
            <button type="button" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
