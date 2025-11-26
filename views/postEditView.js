import { fetchArticleDetail, updateArticle } from '../api/articles.js';
import { setHelperText, setLoading } from '../utils/dom.js';
import { navigate } from '../core/router.js';
// 에디터가 불안정하여 기본 textarea만 사용

export async function initPostEditView(container) {
  const form = container.querySelector('#postEditForm');
  const helper = container.querySelector('[data-role="post-helper"]');
  const hiddenTextarea = container.querySelector('#postEditContent');
  const editor = null; // 에디터 미사용
  const fileInput = container.querySelector('#postEditImage');
  const removeCheckbox = container.querySelector('#removeImage');
  const imagePreview = container.querySelector('[data-role="image-preview"]');
  let previewUrl = '';
  let currentImage = '';
  if (!form) return;
  if (helper) setHelperText(helper, '');
  if (hiddenTextarea) {
    hiddenTextarea.hidden = false;
    hiddenTextarea.style.display = 'block';
    hiddenTextarea.setAttribute('placeholder', '여기에 내용을 입력해주세요.');
    hiddenTextarea.rows = 14;
  }

  const articleId = getArticleIdFromQuery();
  if (!articleId) {
    setHelperText(helper, '잘못된 접근입니다.');
    form.querySelectorAll('input, textarea, button[type="submit"]').forEach((el) => {
      el.disabled = true;
    });
    return;
  }

  try {
    const response = await fetchArticleDetail(articleId);
    const { data } = response;
    currentImage = data?.image || '';
    populateForm(form, data, hiddenTextarea, imagePreview, currentImage);
  } catch (error) {
    setHelperText(helper, error.message || '게시글 정보를 불러오지 못했습니다.');
    form.querySelectorAll('input, textarea, button[type="submit"]').forEach((el) => {
      el.disabled = true;
    });
    return;
  }

  form.addEventListener('submit', (event) =>
    handleSubmit({
      event,
      form,
      helper,
      articleId,
      hiddenTextarea,
      fileInput,
      removeCheckbox,
      imagePreview,
      previewUrlRef: () => previewUrl
    })
  );

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
        if (removeCheckbox) removeCheckbox.checked = false;
      } else {
        resetPreview(imagePreview, currentImage);
      }
    });
  }
  if (removeCheckbox && imagePreview) {
    removeCheckbox.addEventListener('change', () => {
      if (removeCheckbox.checked) {
        fileInput && (fileInput.value = '');
        resetPreview(imagePreview, '');
      } else {
        resetPreview(imagePreview, currentImage);
      }
    });
  }
}

function populateForm(form, article, textarea, imagePreview, currentImage) {
  form.querySelector('#postEditTitle').value = article?.title ?? '';
  if (textarea) {
    textarea.value = article?.content ?? '';
  }
  if (imagePreview) {
    const img = article?.image;
    if (img) {
      imagePreview.style.backgroundImage = `url(${img})`;
      imagePreview.classList.add('has-image');
      imagePreview.textContent = '';
    } else {
      resetPreview(imagePreview, '');
    }
  }
}

async function handleSubmit({
  event,
  form,
  helper,
  articleId,
  hiddenTextarea,
  fileInput,
  removeCheckbox,
  imagePreview,
  previewUrlRef
}) {
  event.preventDefault();
  const titleInput = form.querySelector('#postEditTitle');
  const title = titleInput.value.trim();
  const contentSource = hiddenTextarea?.value;
  const content = (contentSource || '').trim();

  if (!title) {
    setHelperText(helper, '제목을 입력해주세요.');
    titleInput.focus();
    return;
  }
  if (!content) {
    setHelperText(helper, '내용을 입력해주세요.');
    hiddenTextarea?.focus();
    return;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  setLoading(submitButton, true);
  try {
    const formData = new FormData();
    formData.append(
      'article',
      new Blob([JSON.stringify({ title, content })], {
        type: 'application/json'
      })
    );
    if (removeCheckbox?.checked) {
      // 서버에서 빈 파트로 이미지를 비우도록 처리
      formData.append('profileImage', new Blob([], { type: 'application/octet-stream' }), '');
    } else if (fileInput?.files?.[0]) {
      formData.append('profileImage', fileInput.files[0]);
    }
    await updateArticle(articleId, formData);
    setHelperText(helper, '게시글이 수정되었습니다.', 'success');
    setTimeout(() => navigate('post', { replace: true }), 800);
  } catch (error) {
    setHelperText(helper, error.message || '게시글 수정에 실패했습니다.');
  } finally {
    setLoading(submitButton, false);
  }
}

function activateFallbackTextarea(editorHost, textarea) {
  if (editorHost) editorHost.style.display = 'none';
  if (!textarea) return;
  textarea.hidden = false;
  textarea.style.display = 'block';
  textarea.setAttribute('placeholder', '여기에 내용을 입력해주세요.');
  textarea.rows = 10;
}

function getArticleIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('article');
  return id ? Number(id) : null;
}

function resetPreview(preview, imgUrl) {
  if (!preview) return;
  if (imgUrl) {
    preview.style.backgroundImage = `url(${imgUrl})`;
    preview.classList.add('has-image');
    preview.textContent = '';
  } else {
    preview.style.backgroundImage = 'none';
    preview.classList.remove('has-image');
    preview.textContent = '미리보기';
  }
}
