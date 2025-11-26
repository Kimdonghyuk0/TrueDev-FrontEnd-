import { setHelperText, setLoading } from '../utils/dom.js';
import { changePassword } from '../api/auth.js';

export function initPasswordChangeView(container) {
  const form = container.querySelector('#passwordChangeForm');
  const helper = container.querySelector('[data-role="password-helper"]');
  if (!form) return;
  if (helper) setHelperText(helper, '');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSubmit(form, helper);
  });
}

async function handleSubmit(form, helper) {
  const current = form.querySelector('#currentPassword').value.trim();
  const next = form.querySelector('#newPassword').value.trim();
  const confirm = form.querySelector('#newPasswordConfirm').value.trim();
  if (!current || !next || !confirm) {
    setHelperText(helper, '모든 비밀번호를 입력해주세요.');
    return;
  }
  if (!isValidPassword(current) || !isValidPassword(next) || !isValidPassword(confirm)) {
    setHelperText(helper, '비밀번호는 8~72자 사이여야 합니다.');
    return;
  }
  if (next !== confirm) {
    setHelperText(helper, '새 비밀번호가 일치하지 않습니다.');
    return;
  }
  const submitButton = form.querySelector('.primary-button');
  setLoading(submitButton, true);
  try {
    await changePassword(current, next);
    setHelperText(helper, '비밀번호가 변경되었습니다.', 'success');
    form.reset();
  } catch (error) {
    if (error?.message === 'currentPassword_unauthorized') {
      setHelperText(helper, '현재 비밀번호가 올바르지 않습니다.');
    } else if (error?.message === 'password_duplicated') {
      setHelperText(helper, '새 비밀번호가 기존 비밀번호와 같습니다.');
    } else {
      setHelperText(helper, error.message || '비밀번호 변경에 실패했습니다.');
    }
  } finally {
    setLoading(submitButton, false);
  }
}

function isValidPassword(value) {
  return typeof value === 'string' && value.length >= 8 && value.length <= 72;
}
