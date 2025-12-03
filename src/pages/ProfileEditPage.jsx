import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteAccount, updateAccount } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProfileEditPage() {
  const { user, setUser, logout } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [helper, setHelper] = useState({ message: '', success: false });
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setNickname(user.userName ?? '');
      setEmail(user.email ?? '');
      if (user.profileImage) {
        setPreviewUrl(user.profileImage);
      }
    }
  }, [user]);

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetPreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(user?.profileImage || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!nickname.trim()) {
      setHelper({ message: '닉네임을 입력해주세요.', success: false });
      return;
    }

    const formData = new FormData();
    formData.append(
      'user',
      new Blob([JSON.stringify({ name: nickname.trim(), email: email.trim() })], {
        type: 'application/json'
      })
    );
    if (fileInputRef.current?.files?.[0]) {
      formData.append('profileImage', fileInputRef.current.files[0]);
    }

    setLoading(true);
    try {
      const response = await updateAccount(formData);
      const data = response?.data ?? {};
      setUser({
        userName: data.name ?? nickname,
        email: data.email ?? email,
        profileImage: data.profileImage ?? user?.profileImage
      });
      setHelper({ message: '회원 정보가 수정되었습니다.', success: true });
      if (data.profileImage) {
        setPreviewUrl(data.profileImage);
      } else {
        resetPreview();
      }
    } catch (error) {
      setHelper({ message: error.message || '회원 정보 수정에 실패했습니다.', success: false });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('회원 탈퇴를 진행하시겠습니까?')) return;
    try {
      await deleteAccount();
      await logout({ skipRequest: true });
      window.alert('회원 탈퇴가 완료되었습니다.');
      navigate('/login', { replace: true });
    } catch (error) {
      window.alert(error.message || '회원 탈퇴 처리에 실패했습니다.');
    }
  };

  const avatarStyle = previewUrl
    ? { backgroundImage: `url(${previewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : undefined;

  return (
    <section className="view profile-edit">
      <div className="profile-edit__wrapper">
        <header className="profile-edit__header">
          <button type="button" className="icon-button icon-button--back" onClick={() => navigate(-1)}>
            &lsaquo;
          </button>
          <h2>회원정보수정</h2>
        </header>

        <form className="profile-edit__form" onSubmit={handleSubmit} noValidate>
          <div className="profile-photo">
            <div className="profile-photo__circle" data-role="profile-preview" style={avatarStyle}>
              {!previewUrl && (user?.userName?.charAt(0)?.toUpperCase() ?? '?')}
            </div>
            <input type="file" id="profileEditFile" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
            <button type="button" className="ghost-button" data-role="profile-upload-btn" onClick={() => fileInputRef.current?.click()}>
              변경
            </button>
          </div>

          <label className="form-field">
            <span>이메일</span>
            <input type="email" value={email} readOnly />
          </label>
          <label className="form-field">
            <span>닉네임</span>
            <input
              type="text"
              placeholder="닉네임을 입력해주세요."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>
          <p className={`helper-text ${helper.success ? 'is-success' : ''}`} data-role="profile-helper">
            {helper.message}
          </p>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? '잠시만요...' : '수정완료'}
          </button>
        </form>

        <button type="button" className="ghost-button profile-edit__withdraw" onClick={handleWithdraw}>
          회원 탈퇴
        </button>
      </div>
    </section>
  );
}
