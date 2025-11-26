import { createArticle } from '../api/articles.js';
import { verifyArticle } from '../api/articles.js';
import { setHelperText, setLoading } from '../utils/dom.js';
import { navigate } from '../core/router.js';
// 에디터가 불안정하여 기본 textarea만 사용

export async function initPostCreateView(container) {
  const form = container.querySelector('#postCreateForm');
  const helper = container.querySelector('[data-role="post-helper"]');
  const hiddenTextarea = container.querySelector('#postContent');
  const fileInput = container.querySelector('#postImage');
  const imagePreview = container.querySelector('[data-role="image-preview"]');
  const clearBtn = container.querySelector('[data-role="image-clear"]');
  let previewUrl = '';
  if (!form) return;
  setHelperText(helper, '');
  // textarea를 기본 입력창으로 사용
  if (hiddenTextarea) {
    hiddenTextarea.hidden = false;
    hiddenTextarea.style.display = 'block';
    hiddenTextarea.setAttribute('placeholder', '여기에 내용을 입력해주세요.');
    hiddenTextarea.rows = 14;
  }

  if (fileInput && imagePreview) {
    fileInput.addEventListener('change', () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = '';
      }
      const file = fileInput.files?.[0];
      if (file) {
        previewUrl = URL.createObjectURL(file);
        imagePreview.style.backgroundImage = `url(${previewUrl})`;
        imagePreview.classList.add('has-image');
        imagePreview.textContent = '';
      } else {
        resetPreview(imagePreview);
      }
    });
  }
  if (clearBtn && fileInput && imagePreview) {
    clearBtn.addEventListener('click', () => {
      fileInput.value = '';
      resetPreview(imagePreview);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = '';
      }
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const title = form.querySelector('#postTitle').value.trim();
    const contentSource = hiddenTextarea?.value;
    const content = (contentSource || '').trim();

    if (!title) {
      setHelperText(helper, '제목을 입력해주세요.');
      return;
    }
    if (!content) {
      setHelperText(helper, '내용을 입력해주세요.');
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    setLoading(submitButton, true);
    try {
      const formData = new FormData();
      formData.append(
        'article',
        new Blob([JSON.stringify({ title, content })], { type: 'application/json' })
      );
      if (fileInput?.files?.[0]) {
        formData.append('profileImage', fileInput.files[0]);
      }
      const res = await createArticle(formData);
      const createdId = res?.data?.postId;
      if (createdId) {
        // 검증 요청은 실패해도 화면 흐름은 유지, 성공 시 최신 글 정보를 전파
        verifyArticle(createdId)
          .then((vr) => {
            if (vr?.data) {
              document.dispatchEvent(new CustomEvent('article:updated', { detail: vr.data }));
            }
          })
          .catch(() => {});
      }
      setHelperText(helper, '게시글이 작성되었습니다.', 'success');
      form.reset();
      hiddenTextarea && (hiddenTextarea.value = '');
      resetPreview(imagePreview);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = '';
      }
      setTimeout(() => navigate('board', { replace: true }), 800);
    } catch (error) {
      setHelperText(helper, error.message || '게시글 작성에 실패했습니다.');
    } finally {
      setLoading(submitButton, false);
    }
  });
}

function activateFallbackTextarea(editorHost, textarea) {
  if (editorHost) editorHost.style.display = 'none';
  if (!textarea) return;
  textarea.hidden = false;
  textarea.style.display = 'block';
  textarea.setAttribute('placeholder', '여기에 내용을 입력해주세요.');
  textarea.rows = 10;
}

function resetPreview(preview) {
  if (!preview) return;
  preview.style.backgroundImage = 'none';
  preview.classList.remove('has-image');
  preview.textContent = '미리보기';
}
