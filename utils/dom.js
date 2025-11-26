export function setHelperText(target, message, mode = 'error') {
  if (!target) return;
  target.textContent = message || '';
  if (mode === 'success') {
    target.classList.add('is-success');
  } else {
    target.classList.remove('is-success');
  }
}

export function setLoading(button, isLoading) {
  if (!button) return;
  if (!button.dataset.originalLabel) {
    button.dataset.originalLabel = button.textContent;
  }
  button.disabled = isLoading;
  button.textContent = isLoading ? '잠시만요...' : button.dataset.originalLabel;
}
