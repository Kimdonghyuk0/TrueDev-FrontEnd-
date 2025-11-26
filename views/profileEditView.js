import { getState, clearAuth } from '../state/store.js';
import { setHelperText, setLoading } from '../utils/dom.js';
import { updateAccount, deleteAccount, logout as requestLogout } from '../api/auth.js';
import { navigate } from '../core/router.js';
import { refreshHeader } from '../components/header.js';

export function initProfileEditView(container) {
  const form = container.querySelector('#profileEditForm');
  const helper = container.querySelector('[data-role="profile-helper"]');
  const preview = container.querySelector('[data-role="profile-preview"]');
  const fileInput = container.querySelector('#profileEditFile');
  const uploadBtn = container.querySelector('[data-role="profile-upload-btn"]');
  let previewUrl = '';
  const withdrawButton = container.querySelector('.profile-edit__withdraw');
  if (!form) return;
  populateForm(form, preview);
  if (helper) setHelperText(helper, '');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit(form, helper, preview, fileInput, () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = '';
      }
    });
  });

  if (withdrawButton) {
    withdrawButton.addEventListener('click', handleWithdraw);
  }

  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = '';
      }
      const file = fileInput.files?.[0];
      if (file) {
        previewUrl = URL.createObjectURL(file);
        if (preview) {
          preview.style.backgroundImage = `url(${previewUrl})`;
          preview.textContent = '';
        }
      } else {
        resetPreview(preview);
      }
    });
  }
}

function populateForm(form, preview) {
  const { user } = getState();
  form.querySelector('#profileEmail').value = user?.email ?? '';
  form.querySelector('#profileNickname').value = user?.userName ?? '';
  if (preview) {
    if (user?.profileImage) {
      preview.style.backgroundImage = `url(${user.profileImage})`;
      preview.textContent = '';
    } else {
      preview.style.backgroundImage = 'none';
      preview.textContent = user?.userName?.charAt(0)?.toUpperCase() ?? '?';
    }
  }
}

async function handleSubmit(form, helper, preview, fileInput, cleanupPreviewUrl) {
  const nickname = form.querySelector('#profileNickname').value.trim();
  if (!nickname) {
    setHelperText(helper, '닉네임을 입력해주세요.');
    return;
  }
  const email = form.querySelector('#profileEmail').value.trim();

  const formData = new FormData();
  formData.append(
    'user',
    new Blob([JSON.stringify({ name: nickname, email })], { type: 'application/json' })
  );
  if (fileInput?.files?.[0]) {
    formData.append('profileImage', fileInput.files[0]);
  }

  const submitButton = form.querySelector('.primary-button');
  setLoading(submitButton, true);
  try {
    const response = await updateAccount(formData);
    const { data } = response;
    const state = getState();
    if (state.user) {
      state.user.userName = data.name;
      state.user.email = data.email;
      state.user.profileImage = data.profileImage || state.user.profileImage;
    }
    if (preview && data.profileImage) {
      preview.style.backgroundImage = `url(${data.profileImage})`;
      preview.textContent = '';
    } else {
      resetPreview(preview);
    }
    setHelperText(helper, '회원 정보가 수정되었습니다.', 'success');
    populateForm(form, preview);
    refreshHeader();
    cleanupPreviewUrl?.();
  } catch (error) {
    setHelperText(helper, error.message || '회원 정보 수정에 실패했습니다.');
  } finally {
    setLoading(submitButton, false);
  }
}

async function handleWithdraw() {
  if (!window.confirm('회원 탈퇴를 진행하시겠습니까?')) return;
  try {
    await deleteAccount();
    await requestLogout();
  } catch (error) {
    window.alert(error.message || '회원 탈퇴 처리에 실패했습니다.');
    return;
  }
  clearAuth();
  window.alert('회원 탈퇴가 완료되었습니다.');
  navigate('login', { replace: true });
}

function resetPreview(preview) {
  const { user } = getState();
  if (!preview) return;
  if (user?.profileImage) {
    preview.style.backgroundImage = `url(${user.profileImage})`;
    preview.textContent = '';
  } else {
    preview.style.backgroundImage = 'none';
    preview.textContent = user?.userName?.charAt(0)?.toUpperCase() ?? '?';
  }
}
