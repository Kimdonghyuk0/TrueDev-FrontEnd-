import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchArticleDetail, updateArticle } from '../api/articles.js';

export default function PostEditPage() {
  const { articleId } = useParams();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [currentImage, setCurrentImage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [removeImage, setRemoveImage] = useState(false);
  const [helper, setHelper] = useState({ message: '', success: false });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!articleId) return;
    const load = async () => {
      setFetching(true);
      setHelper({ message: '', success: false });
      try {
        const response = await fetchArticleDetail(articleId);
        const data = response?.data ?? {};
        setTitle(data.title ?? '');
        setContent(data.content ?? '');
        setCurrentImage(data.image ?? '');
      } catch (error) {
        setHelper({ message: error.message || '게시글 정보를 불러오지 못했습니다.', success: false });
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [articleId]);

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveToggle = (checked) => {
    setRemoveImage(checked);
    if (checked) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
    if (removeImage) {
      formData.append('profileImage', new Blob([], { type: 'application/octet-stream' }), '');
    } else if (fileInputRef.current?.files?.[0]) {
      formData.append('profileImage', fileInputRef.current.files[0]);
    }
    setLoading(true);
    try {
      await updateArticle(articleId, formData);
      setHelper({ message: '게시글이 수정되었습니다.', success: true });
      setTimeout(() => navigate(`/post/${articleId}`, { replace: true }), 800);
    } catch (error) {
      setHelper({ message: error.message || '게시글 수정에 실패했습니다.', success: false });
    } finally {
      setLoading(false);
    }
  };

  const previewStyle = previewUrl
    ? { backgroundImage: `url(${previewUrl})` }
    : currentImage && !removeImage
      ? { backgroundImage: `url(${currentImage})` }
      : undefined;
  const hasImage = Boolean(previewUrl || (currentImage && !removeImage));

  if (!articleId) {
    return (
      <section className="view">
        <div className="empty-state">잘못된 접근입니다.</div>
      </section>
    );
  }

  return (
    <section className="view">
      <div className="view-panel view-panel--editor">
        <div className="view-back">
          <button type="button" className="icon-button icon-button--back" onClick={() => navigate(-1)}>
            &lsaquo;
          </button>
          <span>게시글 수정</span>
        </div>
        <div className="view-heading">
          <p className="eyebrow">게시글 수정</p>
          <h2>게시글 수정</h2>
          <p className="sub">수정할 내용을 입력해 주세요.</p>
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
              disabled={fetching}
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
              disabled={fetching}
            ></textarea>
          </label>
          <div className="form-field">
            <span>이미지 (선택)</span>
            <div className="image-upload">
              <label className="ghost-button" htmlFor="postEditImage">
                이미지 선택
              </label>
              <input
                id="postEditImage"
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={fetching}
              />
              <label className="checkbox-inline">
                <input
                  type="checkbox"
                  checked={removeImage}
                  onChange={(e) => handleRemoveToggle(e.target.checked)}
                  disabled={fetching}
                />
                <span>기존 이미지 삭제</span>
              </label>
            </div>
            <div
              className={`image-preview ${hasImage ? 'has-image' : ''}`}
              data-role="image-preview"
              style={previewStyle}
            >
              {hasImage ? '' : '미리보기'}
            </div>
          </div>
          <p className={`helper-text ${helper.success ? 'is-success' : ''}`}>{helper.message}</p>
          <button type="submit" className="primary-button" disabled={loading || fetching}>
            {loading ? '잠시만요...' : '수정하기'}
          </button>
        </form>
      </div>
    </section>
  );
}
