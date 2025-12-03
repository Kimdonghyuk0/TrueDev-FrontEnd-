import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createArticle } from '../api/articles.js';

export default function PostCreatePage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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
    if (!title.trim()) {
      setHelper({ message: '제목을 입력해주세요.', success: false });
      return;
    }
    if (!content.trim()) {
      setHelper({ message: '내용을 입력해주세요.', success: false });
      return;
    }
    const formData = new FormData();
    formData.append(
      'article',
      new Blob([JSON.stringify({ title: title.trim(), content: content.trim() })], {
        type: 'application/json'
      })
    );
    if (fileInputRef.current?.files?.[0]) {
      formData.append('profileImage', fileInputRef.current.files[0]);
    }
    setLoading(true);
    try {
      await createArticle(formData);
      setHelper({ message: '게시글이 작성되었습니다.', success: true });
      setTitle('');
      setContent('');
      resetPreview();
      setTimeout(() => navigate('/board', { replace: true }), 800);
    } catch (error) {
      setHelper({ message: error.message || '게시글 작성에 실패했습니다.', success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view">
      <div className="view-panel">
        <div className="view-heading">
          <p className="eyebrow">게시글 추가</p>
          <h2>게시글 작성</h2>
          <p className="sub">나누고 싶은 이야기를 적어 주세요.</p>
        </div>
        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <label className="form-field">
            <span>제목*</span>
            <input
              type="text"
              placeholder="제목을 입력해주세요. (최대 26글자)"
              maxLength={50}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="form-field">
            <span>내용*</span>
            <textarea
              rows={12}
              placeholder="내용을 입력해주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            ></textarea>
          </label>
          <div className="form-field">
            <span>이미지 (선택)</span>
            <div className="image-upload">
              <label className="ghost-button" htmlFor="postImage">
                이미지 선택
              </label>
              <input id="postImage" type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleFileChange} />
              <button type="button" className="ghost-button ghost-button--danger" onClick={resetPreview}>
                삭제
              </button>
            </div>
            <div
              className={`image-preview ${previewUrl ? 'has-image' : ''}`}
              data-role="image-preview"
              style={previewUrl ? { backgroundImage: `url(${previewUrl})` } : undefined}
            >
              {previewUrl ? '' : '미리보기'}
            </div>
          </div>
          <p className={`helper-text ${helper.success ? 'is-success' : ''}`}>{helper.message}</p>
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? '잠시만요...' : '완료'}
          </button>
        </form>
      </div>
    </section>
  );
}
