// DEV MODE CONTROLS (Hidden by default, activated via URL or 5-clicks / shortcuts)
import { showToast } from './toast.js';

export function initDevMode() {
  const urlParams = new URLSearchParams(window.location.search);
  let isDevMode = urlParams.get('dev') === '1' || urlParams.get('dev') === 'true' || urlParams.get('debug') === '1';
  if (isDevMode) {
    localStorage.setItem('heehee_dev_mode', 'true');
  } else {
    isDevMode = localStorage.getItem('heehee_dev_mode') === 'true';
  }

  function applyDevMode(active, notify = false) {
    if (active) {
      document.body.classList.add('dev-mode');
      localStorage.setItem('heehee_dev_mode', 'true');
      if (notify) showToast('🛠️ Đã bật Chế độ Dev (Sang ngày, Test cheat)', 3500);
    } else {
      document.body.classList.remove('dev-mode');
      localStorage.removeItem('heehee_dev_mode');
      if (notify) showToast('🔒 Đã ẩn Chế độ Dev (Về chế độ người chơi thường)', 3500);
    }
  }

  applyDevMode(isDevMode);

  // Easter egg: Click 5 times on store name title to toggle Dev Mode
  let titleClicks = 0;
  let titleTimer = null;
  const storeTitleEl = document.getElementById('store-name');
  if (storeTitleEl) {
    storeTitleEl.style.cursor = 'pointer';
    storeTitleEl.title = 'Tiệm Trà Sữa HeeHee';
    storeTitleEl.addEventListener('click', () => {
      titleClicks++;
      clearTimeout(titleTimer);
      titleTimer = setTimeout(() => { titleClicks = 0; }, 2000);
      if (titleClicks >= 5) {
        titleClicks = 0;
        const current = document.body.classList.contains('dev-mode');
        applyDevMode(!current, true);
        if (window.sound) window.sound.bell();
      }
    });
  }

  // Keyboard shortcut: F2 or Ctrl + Shift + D
  window.addEventListener('keydown', (e) => {
    if (e.key === 'F2' || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd')) {
      e.preventDefault();
      const current = document.body.classList.contains('dev-mode');
      applyDevMode(!current, true);
      if (window.sound) window.sound.bell();
    }
  });
}

