import { login } from '../api/auth.js';
import { setHelperText, setLoading } from '../utils/dom.js';
import { persistAuth } from '../state/store.js';
import { refreshHeader } from '../components/header.js';
import { navigate } from '../core/router.js';

export function initLoginView(container) {
  const form = container.querySelector('#loginForm');
  const helper = container.querySelector('[data-role="login-helper"]');
  if (!form) return;
  setHelperText(helper, '');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.querySelector('#loginEmail').value.trim();
    const password = form.querySelector('#loginPassword').value;

    if (!email || !password) {
      setHelperText(helper, '이메일과 비밀번호를 입력해주세요.');
      return;
    }
    if (!isValidEmail(email)) {
      setHelperText(helper, '올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (!isValidLoginPassword(password)) {
      setHelperText(helper, '비밀번호는 4~18자 사이여야 합니다.');
      return;
    }

    const submitButton = form.querySelector('[type="submit"]');
    setLoading(submitButton, true);
    try {
      const response = await login({ email, password });
      const { token, user } = response?.data ?? {};
      const normalizedUser = {
        userName: user?.userName ?? '',
        email: user?.userEmail ?? '',
        profileImage: user?.profileImage ?? ''
      };
      persistAuth(token?.accessToken, normalizedUser, token?.refreshToken);
      refreshHeader();
      setHelperText(helper, '로그인 성공! 게시판으로 이동합니다.', 'success');
      setTimeout(() => navigate('home', { replace: true }), 600);
    } catch (error) {
      const msg = (error?.message || '').toLowerCase();
      const isAuthError =
        error?.status === 401 ||
        error?.status === 400 ||
        msg.includes('invalid_credentials') ||
        msg.includes('unauthorized') ||
        msg.includes('invalid_request');
      if (isAuthError) {
        setHelperText(helper, '이메일 또는 비밀번호가 올바르지 않습니다.');
      } else {
        setHelperText(helper, '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(submitButton, false);
    }
  });
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidLoginPassword(value) {
  return typeof value === 'string' && value.length >= 4 && value.length <= 18;
}
