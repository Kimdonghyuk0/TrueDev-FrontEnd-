import { getState, hasAuth } from '../state/store.js';

const headerAvatar = document.getElementById('headerAvatar');
const profileMenu = document.querySelector('[data-role="profile-menu"]');
const profilePanel = document.querySelector('[data-role="profile-panel"]');
const logoutButton = profilePanel?.querySelector('[data-role="logout-btn"]');

let cleanupDocumentListener = null;

export function initHeaderControls({ onLogout } = {}) {
  if (headerAvatar) {
    headerAvatar.addEventListener('click', handleAvatarClick);
  }
  if (logoutButton && typeof onLogout === 'function') {
    logoutButton.addEventListener('click', () => {
      onLogout();
      closeProfileMenu();
    });
  }
  refreshHeader();
}

function handleAvatarClick(event) {
  event.stopPropagation();
  if (!hasAuth()) return;
  if (profileMenu?.classList.contains('is-open')) {
    closeProfileMenu();
  } else {
    openProfileMenu();
  }
}

function openProfileMenu() {
  if (!profileMenu || !profilePanel) return;
  profileMenu.classList.add('is-open');
  headerAvatar?.setAttribute('aria-expanded', 'true');
  attachOutsideListener();
}

function closeProfileMenu() {
  if (!profileMenu || !profilePanel) return;
  profileMenu.classList.remove('is-open');
  headerAvatar?.setAttribute('aria-expanded', 'false');
  detachOutsideListener();
}

function attachOutsideListener() {
  if (cleanupDocumentListener || !profileMenu) return;
  const listener = (event) => {
    if (!profileMenu.contains(event.target)) {
      closeProfileMenu();
    }
  };
  document.addEventListener('click', listener);
  cleanupDocumentListener = () => {
    document.removeEventListener('click', listener);
    cleanupDocumentListener = null;
  };
}

function detachOutsideListener() {
  cleanupDocumentListener?.();
}

function updateHeaderAvatar() {
  if (!headerAvatar) return;
  const { user } = getState();
  if (user) {
    const initial = user.userName?.trim()?.charAt(0)?.toUpperCase() ?? '?';
    const image = user.profileImage;
    if (image) {
      headerAvatar.style.backgroundImage = `url(${image})`;
      headerAvatar.style.backgroundSize = 'cover';
      headerAvatar.style.backgroundPosition = 'center';
      headerAvatar.textContent = '';
    } else {
      headerAvatar.style.backgroundImage = 'none';
      headerAvatar.style.background = 'linear-gradient(135deg, #8a63ff, #ba7aff)';
      headerAvatar.textContent = initial;
    }
  } else {
    headerAvatar.textContent = '';
    headerAvatar.style.background = '#e0e0e0';
    headerAvatar.style.backgroundImage = 'none';
  }
}

function updateProfileMenuVisibility() {
  if (!profileMenu) return;
  profileMenu.classList.toggle('is-hidden', !hasAuth());
  if (!hasAuth()) {
    closeProfileMenu();
  }
}

export function refreshHeader() {
  updateHeaderAvatar();
  updateProfileMenuVisibility();
}
