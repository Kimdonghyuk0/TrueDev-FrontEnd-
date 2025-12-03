import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../api/auth.js';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [helper, setHelper] = useState({ message: '', success: false });
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email || !password || !name) {
      setHelper({ message: '필수 항목을 모두 입력해주세요.', success: false });
      return;
    }
    if (!isValidEmail(email)) {
      setHelper({ message: '올바른 이메일 형식을 입력해주세요.', success: false });
      return;
    }
    if (!isValidSignupPassword(password)) {
      setHelper({ message: '비밀번호는 8~72자 사이여야 합니다.', success: false });
      return;
    }
    if (password !== confirm) {
      setHelper({ message: '비밀번호가 일치하지 않습니다.', success: false });
      return;
    }
    if (!isValidName(name)) {
      setHelper({ message: '닉네임은 2~20글자 사이여야 합니다.', success: false });
      return;
    }

    const formData = new FormData();
    formData.append(
      'user',
      new Blob([JSON.stringify({ email, password, name })], {
        type: 'application/json'
      })
    );
    if (fileInputRef.current?.files?.[0]) {
      formData.append('profileImage', fileInputRef.current.files[0]);
    }

    setLoading(true);
    try {
      await signup(formData);
      setHelper({ message: '회원가입이 완료되었습니다. 로그인 해주세요.', success: true });
      setEmail('');
      setPassword('');
      setConfirm('');
      setName('');
      resetPreview();
      setTimeout(() => navigate('/login', { replace: true }), 800);
    } catch (error) {
      setHelper({ message: error.message || '회원가입에 실패했습니다.', success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view">
      <div className="view-panel">
        <div className="view-heading">
          <p className="eyebrow">TrueDev</p>
          <h2>회원가입</h2>
          <p className="sub">정보를 입력하고 새로운 계정을 만들어 보세요.</p>
        </div>
        <div className="profile-upload">
          <label
            className={`profile-dropzone ${previewUrl ? 'has-image' : ''}`}
            data-role="profile-dropzone"
            tabIndex={0}
            style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
          >
            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
            <span className="plus">{previewUrl ? '' : '+'}</span>
          </label>
        </div>
        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>이메일*</span>
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>비밀번호*</span>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>비밀번호 확인*</span>
            <input
              type="password"
              placeholder="비밀번호를 한번 더 입력하세요"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>닉네임*</span>
            <input
              type="text"
              placeholder="닉네임을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <p className={`helper-text ${helper.success ? 'is-success' : ''}`}>{helper.message}</p>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? '잠시만요...' : '회원가입'}
          </button>
        </form>
        <div className="view-actions">
          <span>이미 계정이 있으신가요?</span>
          <Link to="/login" className="ghost-button">
            로그인
          </Link>
        </div>
      </div>
    </section>
  );
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidSignupPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 72;
}

function isValidName(value) {
  return typeof value === 'string' && value.length >= 2 && value.length <= 20;
}
