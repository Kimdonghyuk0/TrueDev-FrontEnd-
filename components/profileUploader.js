import { setProfileImage, clearProfileImage } from '../state/store.js';

export function initProfileUploader(root) {
  const profileInput = root.querySelector('#profileFile');
  const profileDropzone = root.querySelector('[data-role="profile-dropzone"]');
  if (!profileInput || !profileDropzone) {
    return { reset: () => {} };
  }

  profileInput.addEventListener('change', (event) => handleProfileChange(event, profileDropzone));
  profileDropzone.addEventListener('click', () => profileInput.click());
  profileDropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      profileInput.click();
    }
  });

  const reset = () => resetPreview(profileDropzone);

  return { reset };
}

function handleProfileChange(event, dropzone) {
  const [file] = event.target.files;
  if (!file) {
    resetPreview(dropzone);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    setProfileImage(reader.result);
    applyProfilePreview(dropzone, reader.result);
  };
  reader.readAsDataURL(file);
}

function resetPreview(dropzone) {
  clearProfileImage();
  if (!dropzone) return;
  const img = dropzone.querySelector('img');
  if (img) img.remove();
  dropzone.style.borderStyle = 'dashed';
  const plus = dropzone.querySelector('.plus');
  if (plus) plus.style.opacity = '1';
}

function applyProfilePreview(dropzone, src) {
  if (!dropzone) return;
  let img = dropzone.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    dropzone.appendChild(img);
  }
  img.src = src;
  dropzone.style.borderStyle = 'solid';
  const plus = dropzone.querySelector('.plus');
  if (plus) plus.style.opacity = '0';
}
