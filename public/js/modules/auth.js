// Authentication & Store Session Manager
import { state } from './state.js';
import { showToast } from './toast.js';
import { updateUI } from './ui.js';
import { checkRestStatus } from './rest.js';
import { openStoryModal } from './story.js';
import { scheduleNextOrder } from './order-manager.js';
import { showJailModal } from './modals.js';
import { renderOrderTicket } from './workflow.js';

let modalAuth = null;
let formLogin = null;
let formRegister = null;
let tabLogin = null;
let tabRegister = null;
let authError = null;
let elBtnLogout = null;

export async function initStore() {
  setupAuthEvents();

  if (window.API && window.API.token) {
    const res = await window.API.getMe();
    if (res && res.success && res.state) {
      state.storeState = res.state;
      if (modalAuth) modalAuth.style.display = 'none';
      updateUI();

      if (state.storeState.save && state.storeState.save.is_jailed === 1) {
        showJailModal(state.storeState.save.jail_reason);
        return;
      }

      if (checkRestStatus(state.storeState.save)) {
        return;
      }

      // Auto-show story for new player
      const storySeenKey = 'heehee_story_seen_' + (state.storeState.store_code || 'guest');
      if (!localStorage.getItem(storySeenKey)) {
        openStoryModal(0, state.storeState.save.chapter || 1);
        localStorage.setItem(storySeenKey, 'true');
      }

      scheduleNextOrder(1500);
      return;
    } else {
      // Token invalid or session expired: clear stored token
      window.API.token = null;
      localStorage.removeItem('hyhy_session_token');
    }
  }

  // No valid token: open Auth modal
  if (modalAuth) modalAuth.style.display = 'flex';
}

export function setupAuthEvents() {
  modalAuth = document.getElementById('modal-auth');
  formLogin = document.getElementById('form-login');
  formRegister = document.getElementById('form-register');
  tabLogin = document.getElementById('tab-login');
  tabRegister = document.getElementById('tab-register');
  authError = document.getElementById('auth-error');
  elBtnLogout = document.getElementById('btn-logout');

  // Switch to Login Tab
  if (tabLogin) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active');
      tabLogin.style.color = 'var(--gold)';
      tabLogin.style.borderBottom = '2px solid var(--gold)';
      if (tabRegister) {
        tabRegister.classList.remove('active');
        tabRegister.style.color = 'var(--text-muted)';
        tabRegister.style.borderBottom = 'none';
      }
      if (formLogin) formLogin.style.display = 'flex';
      if (formRegister) formRegister.style.display = 'none';
      if (authError) authError.style.display = 'none';
    });
  }

  // Switch to Register Tab
  if (tabRegister) {
    tabRegister.addEventListener('click', () => {
      tabRegister.classList.add('active');
      tabRegister.style.color = 'var(--gold)';
      tabRegister.style.borderBottom = '2px solid var(--gold)';
      if (tabLogin) {
        tabLogin.classList.remove('active');
        tabLogin.style.color = 'var(--text-muted)';
        tabLogin.style.borderBottom = 'none';
      }
      if (formRegister) formRegister.style.display = 'flex';
      if (formLogin) formLogin.style.display = 'none';
      if (authError) authError.style.display = 'none';
    });
  }

  // Quick Play (Chơi ngay với tài khoản khách)
  const btnQuickPlay = document.getElementById('btn-quick-play');
  if (btnQuickPlay) {
    btnQuickPlay.addEventListener('click', async () => {
      btnQuickPlay.disabled = true;
      btnQuickPlay.innerText = 'Đang Vào Quán... 🧋';
      try {
        const res = await window.API.login('Tiệm Trà Sữa HeeHee');
        if (res && (res.session_token || res.save)) {
          if (window.sound) window.sound.bell();
          state.storeState = res;
          if (modalAuth) modalAuth.style.display = 'none';
          showToast('🎉 Chào mừng bạn đến với Tiệm Trà Sữa HeeHee!', 3500);
          updateUI();

          const storySeenKey = 'heehee_story_seen_' + (state.storeState.store_code || 'guest');
          if (!localStorage.getItem(storySeenKey)) {
            openStoryModal(0, state.storeState.save ? state.storeState.save.chapter : 1);
            localStorage.setItem(storySeenKey, 'true');
          }

          scheduleNextOrder(1500);
        } else {
          if (window.sound) window.sound.fail();
          if (authError) {
            authError.innerText = res.error || res.message || 'Không thể tạo phiên chơi nhanh';
            authError.style.display = 'block';
          }
          btnQuickPlay.disabled = false;
          btnQuickPlay.innerText = '⚡ Chơi Ngay (Không Cần Đăng Ký)';
        }
      } catch (err) {
        if (window.sound) window.sound.fail();
        if (authError) {
          authError.innerText = 'Lỗi kết nối máy chủ!';
          authError.style.display = 'block';
        }
        btnQuickPlay.disabled = false;
        btnQuickPlay.innerText = '⚡ Chơi Ngay (Không Cần Đăng Ký)';
      }
    });
  }

  // Handle Login Submit
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (authError) authError.style.display = 'none';
      const accountInput = document.getElementById('login-account');
      const passwordInput = document.getElementById('login-password');
      const account = accountInput ? accountInput.value : '';
      const password = passwordInput ? passwordInput.value : '';

      const res = await window.API.authLogin(account, password);
      if (res && res.success) {
        if (window.sound) window.sound.bell();
        state.storeState = res.state;
        if (modalAuth) modalAuth.style.display = 'none';
        showToast(res.message, 3500);
        updateUI();

        const storySeenKey = 'heehee_story_seen_' + (state.storeState.store_code || 'guest');
        if (!localStorage.getItem(storySeenKey)) {
          openStoryModal(0, state.storeState.save ? state.storeState.save.chapter : 1);
          localStorage.setItem(storySeenKey, 'true');
        }

        scheduleNextOrder(1500);
      } else {
        if (window.sound) window.sound.fail();
        let errMsg = res.message || res.error || 'Đăng nhập không thành công!';
        if (errMsg.includes('không tồn tại')) {
          errMsg += ' (Nếu là người chơi mới, bạn hãy chọn tab "Đăng Ký Mới" hoặc nút "Chơi Ngay" bên dưới)';
        }
        if (authError) {
          authError.innerText = errMsg;
          authError.style.display = 'block';
        }
      }
    });
  }

  // Handle Register Submit
  if (formRegister) {
    formRegister.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (authError) authError.style.display = 'none';
      const usernameInput = document.getElementById('reg-username');
      const storeNameInput = document.getElementById('reg-storename');
      const passwordInput = document.getElementById('reg-password');
      const username = usernameInput ? usernameInput.value : '';
      const storeName = storeNameInput ? storeNameInput.value : '';
      const password = passwordInput ? passwordInput.value : '';

      const res = await window.API.authRegister(username, password, storeName);
      if (res && res.success) {
        if (window.sound) window.sound.coin();
        state.storeState = res.state;
        if (modalAuth) modalAuth.style.display = 'none';
        showToast(res.message, 4000);
        updateUI();

        const storySeenKey = 'heehee_story_seen_' + (state.storeState.store_code || 'guest');
        openStoryModal(0, 1);
        localStorage.setItem(storySeenKey, 'true');

        scheduleNextOrder(2500);
      } else {
        if (window.sound) window.sound.fail();
        if (authError) {
          authError.innerText = res.message || 'Đăng ký không thành công!';
          authError.style.display = 'block';
        }
      }
    });
  }

  // Logout
  if (elBtnLogout) {
    elBtnLogout.addEventListener('click', async () => {
      if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi quán trà sữa không?')) {
        await window.API.authLogout();
        if (state.orderTimerInterval) clearInterval(state.orderTimerInterval);
        state.currentOrder = null;
        renderOrderTicket();
        if (modalAuth) modalAuth.style.display = 'flex';
        showToast('Đã đăng xuất an toàn.');
      }
    });
  }
}

