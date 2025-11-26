import { signup } from '../api/auth.js';
import { setHelperText, setLoading } from '../utils/dom.js';
import { navigate } from '../core/router.js';

export function initSignupView(container) {
  const form = container.querySelector('#signupForm');
  const helper = container.querySelector('[data-role="signup-helper"]');
  const fileInput = container.querySelector('#profileFile');
  const dropzone = container.querySelector('[data-role="profile-dropzone"]');
  let previewUrl = '';
  if (!form) return;

  setHelperText(helper, '');

  // 프로필 이미지 선택 시 표시 업데이트
  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') fileInput.click();
    });
    fileInput.addEventListener('change', () => {
      const fileName = fileInput.files?.[0]?.name;
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = '';
      }
      if (fileName && fileInput.files?.[0]) {
        previewUrl = URL.createObjectURL(fileInput.files[0]);
        dropzone.style.backgroundImage = `url(${previewUrl})`;
        dropzone.classList.add('has-image');
      } else {
        dropzone.style.backgroundImage = 'none';
        dropzone.classList.remove('has-image');
      }
      dropzone.querySelector('.plus').textContent = fileName ? '' : '+';
      dropzone.title = fileName || '';
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.querySelector('#signupEmail').value.trim();
    const password = form.querySelector('#signupPassword').value;
    const confirm = form.querySelector('#signupPasswordConfirm').value;
    const name = form.querySelector('#signupName').value.trim();

    if (!email || !password || !name) {
      setHelperText(helper, '필수 항목을 모두 입력해주세요.');
      return;
    }
    if (!isValidEmail(email)) {
      setHelperText(helper, '올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (!isValidSignupPassword(password)) {
      setHelperText(helper, '비밀번호는 8~72자 사이여야 합니다.');
      return;
    }
    if (password !== confirm) {
      setHelperText(helper, '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!isValidName(name)) {
      setHelperText(helper, '닉네임은 2~20글자 사이여야 합니다.');
      return;
    }

    const formData = new FormData();
    formData.append(
      'user',
      new Blob([JSON.stringify({ email, password, name })], {
        type: 'application/json'
      })
    );
    if (fileInput?.files?.[0]) {
      formData.append('profileImage', fileInput.files[0]);
    }

    const submitButton = form.querySelector('[type="submit"]');
    setLoading(submitButton, true);
    try {
      await signup(formData);
      setHelperText(helper, '회원가입이 완료되었습니다. 로그인 해주세요.', 'success');
      form.reset();
      if (dropzone) {
        dropzone.querySelector('.plus').textContent = '+';
        dropzone.title = '';
        dropzone.style.backgroundImage = 'none';
        dropzone.classList.remove('has-image');
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = '';
      }
      setTimeout(() => navigate('login', { replace: true }), 800);
    } catch (error) {
      setHelperText(helper, error.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(submitButton, false);
    }
  });
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
