import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as requestLogin } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [helper, setHelper] = useState({ message: '', success: false });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password) {
      setHelper({ message: '이메일과 비밀번호를 입력해주세요.', success: false });
      return;
    }
    if (!isValidEmail(email)) {
      setHelper({ message: '올바른 이메일 형식을 입력해주세요.', success: false });
      return;
    }
    if (!isValidLoginPassword(password)) {
      setHelper({ message: '비밀번호는 4~18자 사이여야 합니다.', success: false });
      return;
    }
    setLoading(true);
    try {
      const response = await requestLogin({ email: email.trim(), password });
      const { token, user } = response?.data ?? {};
      const normalizedUser = {
        userName: user?.userName ?? '',
        email: user?.userEmail ?? '',
        profileImage: user?.profileImage ?? ''
      };
      auth.login({
        token: token?.accessToken,
        refreshToken: token?.refreshToken,
        user: normalizedUser
      });
      setHelper({ message: '로그인 성공! 게시판으로 이동합니다.', success: true });
      setTimeout(() => navigate('/home', { replace: true }), 600);
    } catch (error) {
      const msg = (error?.message || '').toLowerCase();
      const isAuthError =
        error?.status === 401 ||
        error?.status === 400 ||
        msg.includes('invalid_credentials') ||
        msg.includes('unauthorized') ||
        msg.includes('invalid_request');
      if (isAuthError) {
        setHelper({ message: '이메일 또는 비밀번호가 올바르지 않습니다.', success: false });
      } else {
        setHelper({ message: '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.', success: false });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view">
      <div className="view-panel">
        <div className="view-heading">
          <p className="eyebrow">TrueDev</p>
          <h2>로그인</h2>
          <p className="sub">반가워요! 계정 정보를 입력해주세요.</p>
        </div>
        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>이메일</span>
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>비밀번호</span>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <p className={`helper-text ${helper.success ? 'is-success' : ''}`}>{helper.message}</p>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? '잠시만요...' : '로그인'}
          </button>
        </form>
        <div className="view-actions">
          <span>아직 회원이 아니신가요?</span>
          <Link to="/signup" className="ghost-button">
            회원가입
          </Link>
        </div>
      </div>
    </section>
  );
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidLoginPassword(value) {
  return typeof value === 'string' && value.length >= 4 && value.length <= 18;
}
