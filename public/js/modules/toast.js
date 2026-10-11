// Toast Notification Helper
let toastTimer = null;

export function showToast(msg, duration = 2000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  toast.innerText = msg;
  toast.style.display = 'block';
  toastTimer = setTimeout(() => {
    toast.style.display = 'none';
    toastTimer = null;
  }, duration);
}


