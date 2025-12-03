import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/auth.js';

export default function PasswordChangePage() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [helper, setHelper] = useState({ message: '', success: false });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!current || !next || !confirm) {
      setHelper({ message: '모든 비밀번호를 입력해주세요.', success: false });
      return;
    }
    if (!isValidPassword(current) || !isValidPassword(next) || !isValidPassword(confirm)) {
      setHelper({ message: '비밀번호는 8~72자 사이여야 합니다.', success: false });
      return;
    }
    if (next !== confirm) {
      setHelper({ message: '새 비밀번호가 일치하지 않습니다.', success: false });
      return;
    }
    setLoading(true);
    try {
      await changePassword(current, next);
      setHelper({ message: '비밀번호가 변경되었습니다.', success: true });
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (error) {
      if (error?.message === 'currentPassword_unauthorized') {
        setHelper({ message: '현재 비밀번호가 올바르지 않습니다.', success: false });
      } else if (error?.message === 'password_duplicated') {
        setHelper({ message: '새 비밀번호가 기존 비밀번호와 같습니다.', success: false });
      } else {
        setHelper({ message: error.message || '비밀번호 변경에 실패했습니다.', success: false });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view profile-edit">
      <div className="profile-edit__wrapper">
        <header className="profile-edit__header">
          <button type="button" className="icon-button icon-button--back" onClick={() => navigate(-1)}>
            &lsaquo;
          </button>
          <h2>비밀번호 수정</h2>
        </header>

        <form className="profile-edit__form" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>현재 비밀번호</span>
            <input
              type="password"
              placeholder="현재 비밀번호"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>새 비밀번호</span>
            <input
              type="password"
              placeholder="새 비밀번호"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </label>
          <label className="form-field">
            <span>새 비밀번호 확인</span>
            <input
              type="password"
              placeholder="새 비밀번호 확인"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </label>
          <p className={`helper-text ${helper.success ? 'is-success' : ''}`} data-role="password-helper">
            {helper.message}
          </p>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? '잠시만요...' : '비밀번호 변경'}
          </button>
        </form>
      </div>
    </section>
  );
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 72;
}
