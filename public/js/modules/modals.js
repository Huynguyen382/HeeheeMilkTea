// Modals Manager: Collab, Debt, Upgrades, Recipes, Jail & Sound Controller
import { state } from './state.js';
import { showToast } from './toast.js';
import { updateUI } from './ui.js';
import { openStoryModal } from './story.js';
import { scheduleNextOrder } from './order-manager.js';
import { openEndShiftModal } from './shift.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

// 1. Anti-cheat Jail Modal
export function showJailModal(reason) {
  if (window.sound) window.sound.siren();
  const modal = document.getElementById('modal-jail');
  const reasonEl = document.getElementById('jail-reason-text');
  if (reasonEl) reasonEl.innerText = reason || 'Phát hiện can thiệp dữ liệu trái phép';
  if (modal) modal.style.display = 'flex';
}

export function initModals() {
  // Jail button handler
  const btnCloseJail = document.getElementById('btn-close-jail');
  if (btnCloseJail) {
    btnCloseJail.addEventListener('click', async () => {
      btnCloseJail.disabled = true;
      btnCloseJail.innerText = 'Đang nộp phạt & mở niêm phong...';

      try {
        const res = await window.API.acceptPenalty();
        if (res && res.success) {
          const modalJail = document.getElementById('modal-jail');
          if (modalJail) modalJail.style.display = 'none';
          if (res.state) {
            state.storeState = res.state;
            updateUI();
          }
          showToast('Đã nộp phạt 50.000.000đ cho Quản lý thị trường! Xe đẩy đã được gỡ niêm phong! 🧋', 4000);
          if (window.sound) window.sound.coin();

          state.orderQueue = [];
          state.currentOrder = null;
          if (state.canvas) {
            state.canvas.setCustomer(false);
          }
          scheduleNextOrder(1500);
        } else {
          showToast(res.message || 'Có lỗi xảy ra khi nộp phạt!');
          const modalJail = document.getElementById('modal-jail');
          if (modalJail) modalJail.style.display = 'none';
          location.reload();
        }
      } catch (err) {
        console.error(err);
        showToast('Lỗi kết nối máy chủ!');
        const modalJail = document.getElementById('modal-jail');
        if (modalJail) modalJail.style.display = 'none';
        location.reload();
      } finally {
        btnCloseJail.disabled = false;
        btnCloseJail.innerText = 'Chấp Nhận Phạt & Làm Lại Từ Đầu';
      }
    });
  }

  // --- COLLAB & FRIENDS MODAL ---
  const modalCollab = document.getElementById('modal-collab');
  const navCollab = document.getElementById('nav-collab');
  const closeCollab = document.getElementById('close-collab');

  // Tabs
  const tabBtnFriends = document.getElementById('tab-btn-friends');
  const tabBtnCollabs = document.getElementById('tab-btn-collabs');
  const tabContentFriends = document.getElementById('tab-content-friends');
  const tabContentCollabs = document.getElementById('tab-content-collabs');

  function switchCollabTab(targetTab) {
    if (targetTab === 'collabs') {
      if (tabBtnFriends) tabBtnFriends.classList.remove('active');
      if (tabBtnCollabs) tabBtnCollabs.classList.add('active');
      if (tabContentFriends) tabContentFriends.style.display = 'none';
      if (tabContentCollabs) tabContentCollabs.style.display = 'block';
      renderCollabModal();
    } else {
      if (tabBtnFriends) tabBtnFriends.classList.add('active');
      if (tabBtnCollabs) tabBtnCollabs.classList.remove('active');
      if (tabContentFriends) tabContentFriends.style.display = 'block';
      if (tabContentCollabs) tabContentCollabs.style.display = 'none';
      renderFriendsTab();
    }
  }

  if (tabBtnFriends) {
    tabBtnFriends.addEventListener('click', () => switchCollabTab('friends'));
  }
  if (tabBtnCollabs) {
    tabBtnCollabs.addEventListener('click', () => switchCollabTab('collabs'));
  }

  async function renderFriendsTab() {
    if (!state.storeState) return;

    // Display user store code
    const myCodeDisp = document.getElementById('friends-my-code-disp');
    if (myCodeDisp) {
      myCodeDisp.innerText = state.storeState.store_code || '---';
    }

    try {
      const res = await window.API.getFriends();
      if (!res || !res.success) return;

      const friendsList = res.friends || [];
      const incomingList = res.incoming || [];
      const outgoingList = res.outgoing || [];

      // Update counters
      const countNum = document.getElementById('friends-count-num');
      if (countNum) countNum.innerText = friendsList.length;

      const totalBadge = document.getElementById('friends-total-badge');
      if (totalBadge) totalBadge.innerText = `${friendsList.length} bạn bè`;

      // 1. Incoming Friend Requests
      const incomingContainer = document.getElementById('friends-incoming-list');
      const incomingBadge = document.getElementById('friends-incoming-badge');
      if (incomingContainer) {
        if (incomingList.length > 0) {
          if (incomingBadge) {
            incomingBadge.innerText = incomingList.length;
            incomingBadge.style.display = 'inline-block';
          }
          incomingContainer.innerHTML = incomingList.map(req => `
            <div style="background: rgba(80, 250, 123, 0.08); border: 1px solid #50fa7b; border-radius: 6px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; color: #50fa7b;">${escapeHtml(req.store_name)} <span style="font-size: 0.75rem; color: var(--text-muted);">(@${escapeHtml(req.username)})</span></div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Mã: ${escapeHtml(req.store_code)} • Uy tín: ⭐${req.reputation || 0}</div>
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="btn-action-sm btn-accept-friend" data-id="${req.id}" style="background: #50fa7b; color: #000; padding: 4px 10px; font-size: 0.82rem; border-radius: 4px; border: none; cursor: pointer; font-weight: bold;">✓ Đồng ý</button>
                <button class="btn-action-sm btn-reject-friend" data-id="${req.id}" style="background: #ff5555; color: #fff; padding: 4px 8px; font-size: 0.82rem; border-radius: 4px; border: none; cursor: pointer;">✕ Từ chối</button>
              </div>
            </div>
          `).join('');
        } else {
          if (incomingBadge) incomingBadge.style.display = 'none';
          incomingContainer.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 6px; text-align: center;">Không có lời mời kết bạn nào.</div>';
        }
      }

      // 2. Active Friends List
      const activeContainer = document.getElementById('friends-active-list');
      if (activeContainer) {
        if (friendsList.length > 0) {
          activeContainer.innerHTML = friendsList.map(friend => `
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 6px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; color: #7fffd4; font-size: 0.95rem;">
                  🧋 ${escapeHtml(friend.store_name)} 
                  <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(@${escapeHtml(friend.username)})</span>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                  Mã: <b style="color: #f1fa8c;">${escapeHtml(friend.store_code)}</b> • Chap ${friend.chapter || 1} • ⭐${friend.reputation || 0}
                </div>
              </div>
              <div style="display: flex; gap: 5px; align-items: center;">
                <button class="btn-action-sm btn-visit-friend-room" data-code="${escapeHtml(friend.store_code)}" data-name="${escapeHtml(friend.store_name)}" style="background: #fdcb6e; color: #000; padding: 4px 8px; font-size: 0.78rem; border-radius: 4px; border: none; cursor: pointer; font-weight: bold;" title="Đến tham quan căn phòng của bạn bè">
                  🏠 Thăm Nhà
                </button>
                <button class="btn-action-sm btn-gift-friend" data-id="${friend.friendship_id}" data-name="${escapeHtml(friend.store_name)}" ${friend.canSendGift ? '' : 'disabled'} style="background: ${friend.canSendGift ? '#ff79c6' : '#4a5568'}; color: #fff; padding: 4px 8px; font-size: 0.78rem; border-radius: 4px; border: none; cursor: ${friend.canSendGift ? 'pointer' : 'not-allowed'}; font-weight: bold;" title="Tặng quà mỗi ngày nhận 10.000đ cho cả hai">
                  ${friend.canSendGift ? '🎁 Tặng Quà' : '✓ Đã Tặng'}
                </button>
                <button class="btn-action-sm btn-invite-collab-shortcut" data-code="${escapeHtml(friend.store_code)}" style="background: #bd93f9; color: #000; padding: 4px 8px; font-size: 0.78rem; border-radius: 4px; border: none; cursor: pointer; font-weight: bold;" title="Mời Collab liên minh quán">
                  🤝 Collab
                </button>
                <button class="btn-action-sm btn-remove-friend" data-id="${friend.friendship_id}" data-name="${escapeHtml(friend.store_name)}" style="background: #4a5568; color: #ff5555; padding: 4px 6px; font-size: 0.78rem; border-radius: 4px; border: none; cursor: pointer;" title="Xóa bạn">
                  ✕
                </button>
              </div>
            </div>
          `).join('');
        } else {
          activeContainer.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 6px; text-align: center;">Chưa có bạn bè nào. Hãy nhập mã quán bạn bè để kết bạn nhé!</div>';
        }
      }

      // 3. Outgoing Friend Requests
      const outgoingContainer = document.getElementById('friends-outgoing-list');
      if (outgoingContainer) {
        if (outgoingList.length > 0) {
          outgoingContainer.innerHTML = outgoingList.map(req => `
            <div style="background: rgba(255, 184, 108, 0.08); border: 1px solid #ffb86c; border-radius: 6px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; color: #ffb86c;">📤 ${escapeHtml(req.store_name)} <span style="font-size: 0.75rem; color: var(--text-muted);">(@${escapeHtml(req.username)})</span></div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Đang chờ đồng ý... (Mã: ${escapeHtml(req.store_code)})</div>
              </div>
              <button class="btn-action-sm btn-cancel-friend-req" data-id="${req.id}" style="background: #6272a4; color: #fff; padding: 4px 8px; font-size: 0.78rem; border-radius: 4px; border: none; cursor: pointer;">Thu hồi</button>
            </div>
          `).join('');
        } else {
          outgoingContainer.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 6px; text-align: center;">Không có lời mời nào đang chờ.</div>';
        }
      }
    } catch (err) {
      console.error('Error rendering friends tab:', err);
    }
  }

  async function renderCollabModal() {
    if (!state.storeState) return;
    const myCodeInput = document.getElementById('my-collab-code');
    if (myCodeInput) myCodeInput.value = state.storeState.store_code || '';

    try {
      const res = await window.API.getCollabs();
      if (!res || !res.success) return;

      const countDisp = document.getElementById('collab-count-disp');
      const boostDisp = document.getElementById('collab-boost-disp');
      const collabTabCount = document.getElementById('collab-tab-count');
      if (countDisp) countDisp.innerText = `${res.activeCount}/3 Quán`;
      if (boostDisp) boostDisp.innerText = `📈 Đang tăng: +${res.bonusPercent}% Doanh Thu`;
      if (collabTabCount) collabTabCount.innerText = `${res.activeCount}/3`;

      // 1. Incoming Requests
      const incomingContainer = document.getElementById('collab-incoming-list');
      const incomingBadge = document.getElementById('incoming-count-badge');
      if (incomingContainer) {
        if (res.incomingRequests && res.incomingRequests.length > 0) {
          if (incomingBadge) {
            incomingBadge.innerText = res.incomingRequests.length;
            incomingBadge.style.display = 'inline-block';
          }
          incomingContainer.innerHTML = res.incomingRequests.map(req => `
            <div style="background: rgba(80, 250, 123, 0.08); border: 1px solid #50fa7b; border-radius: 6px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; color: #50fa7b;">${escapeHtml(req.store_name)}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Mã: ${escapeHtml(req.store_code)}</div>
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="btn-action-sm btn-accept-collab" data-id="${req.id}" style="background: #50fa7b; color: #000; padding: 4px 10px; font-size: 0.82rem; border-radius: 4px; border: none; cursor: pointer; font-weight: bold;">✓ Chấp nhận</button>
                <button class="btn-action-sm btn-decline-collab" data-id="${req.id}" style="background: #ff5555; color: #fff; padding: 4px 8px; font-size: 0.82rem; border-radius: 4px; border: none; cursor: pointer;">✕ Từ chối</button>
              </div>
            </div>
          `).join('');
        } else {
          if (incomingBadge) incomingBadge.style.display = 'none';
          incomingContainer.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 6px; text-align: center;">Không có lời mời nào đang chờ.</div>';
        }
      }

      // 2. Active Collabs
      const activeContainer = document.getElementById('collab-active-list');
      if (activeContainer) {
        if (res.activeCollabs && res.activeCollabs.length > 0) {
          activeContainer.innerHTML = `
            <div style="font-size: 0.76rem; color: #f1fa8c; margin-bottom: 6px; padding: 4px 8px; background: rgba(241, 250, 140, 0.1); border-radius: 4px;">
              ℹ️ Mỗi liên minh kéo dài tối đa <b>3 ngày thực tế</b>. Hết hạn quầy sẽ rời đi, cần Collab lại!
            </div>
          ` + res.activeCollabs.map(item => {
            let remainStr = '⏳ Thời hạn: 3 ngày';
            if (typeof item.remaining_hours === 'number') {
              const d = Math.floor(item.remaining_hours / 24);
              const h = item.remaining_hours % 24;
              remainStr = d > 0 ? `⏳ Còn lại: ${d} ngày ${h} giờ` : `⏳ Còn lại: ${h} giờ (Sắp hết hạn)`;
            }
            return `
            <div style="background: rgba(139, 233, 253, 0.08); border: 1px solid #8be9fd; border-radius: 6px; padding: 8px; margin-bottom: 6px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; color: #8be9fd; font-size: 0.9rem;">🤝 ${escapeHtml(item.partner_name)}</div>
                <div style="font-size: 0.78rem; color: #50fa7b; font-weight: bold;">+10% Doanh Thu • Mã: ${escapeHtml(item.partner_code)}</div>
                <div style="font-size: 0.74rem; color: #f1fa8c; margin-top: 2px;">${remainStr}</div>
              </div>
              <button class="btn-action-sm btn-unlink-collab" data-id="${item.id}" data-name="${escapeHtml(item.partner_name)}" style="background: #e74c3c; color: #fff; padding: 5px 10px; font-size: 0.78rem; font-weight: bold; border-radius: 4px; border: none; cursor: pointer;">Hủy Quầy</button>
            </div>
          `;
          }).join('');
        } else {
          activeContainer.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 6px; text-align: center;">Chưa có đối tác nào. Hãy gửi mã quán cho bạn bè để mở thêm quầy hàng!</div>';
        }
      }

      // 3. Outgoing Requests
      const outgoingContainer = document.getElementById('collab-outgoing-list');
      if (outgoingContainer) {
        if (res.outgoingRequests && res.outgoingRequests.length > 0) {
          outgoingContainer.innerHTML = res.outgoingRequests.map(req => `
            <div style="background: rgba(255, 184, 108, 0.08); border: 1px solid #ffb86c; border-radius: 6px; padding: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; color: #ffb86c;">📤 ${escapeHtml(req.store_name)}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Đang chờ phản hồi... (Mã: ${escapeHtml(req.store_code)})</div>
              </div>
              <button class="btn-action-sm btn-cancel-collab" data-id="${req.id}" style="background: #6272a4; color: #fff; padding: 4px 8px; font-size: 0.78rem; border-radius: 4px; border: none; cursor: pointer;">Thu hồi</button>
            </div>
          `).join('');
        } else {
          outgoingContainer.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; padding: 6px; text-align: center;">Không có lời mời nào đang chờ phản hồi.</div>';
        }
      }
    } catch (err) {
      console.error('Error rendering collab modal:', err);
    }
  }

  if (navCollab) {
    navCollab.addEventListener('click', () => {
      renderFriendsTab();
      renderCollabModal();
      if (modalCollab) modalCollab.style.display = 'flex';
    });
  }

  if (closeCollab) {
    closeCollab.addEventListener('click', () => {
      if (modalCollab) modalCollab.style.display = 'none';
    });
  }

  // Copy friend code
  const btnCopyFriendCode = document.getElementById('btn-copy-friend-code');
  if (btnCopyFriendCode) {
    btnCopyFriendCode.addEventListener('click', () => {
      if (state.storeState && state.storeState.store_code) {
        navigator.clipboard.writeText(state.storeState.store_code);
        showToast('📋 Đã sao chép Mã Quán vào bộ nhớ tạm! Gửi cho bạn bè để kết bạn nhé.');
      }
    });
  }

  // Submit add friend
  const btnSubmitAddFriend = document.getElementById('btn-submit-add-friend');
  if (btnSubmitAddFriend) {
    btnSubmitAddFriend.addEventListener('click', async () => {
      const input = document.getElementById('friend-add-input');
      const targetCode = input ? input.value.trim() : '';
      if (!targetCode) return showToast('Vui lòng nhập Mã Quán hoặc Tên tiệm bạn bè!');

      btnSubmitAddFriend.disabled = true;
      btnSubmitAddFriend.innerText = 'Đang gửi...';

      try {
        const res = await window.API.sendFriendRequest(targetCode);
        if (res && res.success) {
          if (window.sound) window.sound.coin();
          showToast(res.message, 5000);
          if (input) input.value = '';
          renderFriendsTab();
        } else {
          showToast('❌ ' + (res.message || 'Không thể gửi lời mời kết bạn!'));
        }
      } catch (err) {
        showToast('❌ Lỗi kết nối máy chủ!');
      } finally {
        btnSubmitAddFriend.disabled = false;
        btnSubmitAddFriend.innerText = '➕ Kết Bạn';
      }
    });
  }

  const btnCopyCode = document.getElementById('btn-copy-code');
  if (btnCopyCode) {
    btnCopyCode.addEventListener('click', () => {
      if (state.storeState && state.storeState.store_code) {
        navigator.clipboard.writeText(state.storeState.store_code);
        showToast('Đã sao chép Mã Quán vào bộ nhớ tạm! Gửi cho bạn bè để mời Collab nhé.');
      }
    });
  }

  const btnSubmitCollab = document.getElementById('btn-submit-collab');
  if (btnSubmitCollab) {
    btnSubmitCollab.addEventListener('click', async () => {
      const input = document.getElementById('friend-code-input');
      const friendCode = input ? input.value.trim() : '';
      if (!friendCode) return showToast('Vui lòng nhập mã quán bạn bè!');

      btnSubmitCollab.disabled = true;
      btnSubmitCollab.innerText = 'Đang gửi...';

      try {
        const res = await window.API.collab(friendCode);
        if (res && res.success) {
          if (window.sound) window.sound.coin();
          showToast(res.message, 5000);
          if (input) input.value = '';
          renderCollabModal();
          state.storeState = await window.API.getState();
          updateUI();
        } else {
          showToast('❌ ' + (res.message || 'Không thể gửi lời mời Collab!'));
        }
      } catch (err) {
        showToast('❌ Lỗi kết nối máy chủ!');
      } finally {
        btnSubmitCollab.disabled = false;
        btnSubmitCollab.innerText = '📨 Gửi Lời Mời';
      }
    });
  }

  if (modalCollab) {
    modalCollab.addEventListener('click', async (e) => {
      // --- FRIEND ACTIONS ---
      const btnAcceptFr = e.target.closest('.btn-accept-friend');
      if (btnAcceptFr) {
        const id = btnAcceptFr.getAttribute('data-id');
        btnAcceptFr.disabled = true;
        try {
          const res = await window.API.acceptFriendRequest(id);
          if (res && res.success) {
            if (window.sound) window.sound.coin();
            showToast(res.message, 4500);
            renderFriendsTab();
          } else {
            showToast('❌ ' + (res.message || 'Lỗi khi chấp nhận kết bạn!'));
            btnAcceptFr.disabled = false;
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối!');
          btnAcceptFr.disabled = false;
        }
        return;
      }

      const btnRejectFr = e.target.closest('.btn-reject-friend');
      if (btnRejectFr) {
        const id = btnRejectFr.getAttribute('data-id');
        btnRejectFr.disabled = true;
        try {
          const res = await window.API.rejectFriendRequest(id);
          if (res && res.success) {
            showToast(res.message, 3500);
            renderFriendsTab();
          } else {
            showToast('❌ ' + (res.message || 'Lỗi khi từ chối!'));
            btnRejectFr.disabled = false;
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối!');
          btnRejectFr.disabled = false;
        }
        return;
      }

      const btnGiftFr = e.target.closest('.btn-gift-friend');
      if (btnGiftFr) {
        const id = btnGiftFr.getAttribute('data-id');
        btnGiftFr.disabled = true;
        try {
          const res = await window.API.sendFriendGift(id);
          if (res && res.success) {
            if (window.sound) window.sound.coin();
            showToast(res.message, 4500);
            renderFriendsTab();
            state.storeState = await window.API.getState();
            updateUI();
          } else {
            showToast('❌ ' + (res.message || 'Lỗi khi gửi quà!'));
            btnGiftFr.disabled = false;
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối!');
          btnGiftFr.disabled = false;
        }
        return;
      }

      const btnInviteCollab = e.target.closest('.btn-invite-collab-shortcut');
      if (btnInviteCollab) {
        const code = btnInviteCollab.getAttribute('data-code');
        if (!code) return;
        btnInviteCollab.disabled = true;
        try {
          const res = await window.API.collab(code);
          if (res && res.success) {
            if (window.sound) window.sound.coin();
            showToast(res.message, 5000);
            switchCollabTab('collabs');
          } else {
            showToast('❌ ' + (res.message || 'Không thể gửi lời mời Collab!'));
            btnInviteCollab.disabled = false;
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối!');
          btnInviteCollab.disabled = false;
        }
        return;
      }

      const btnVisitFrRoom = e.target.closest('.btn-visit-friend-room');
      if (btnVisitFrRoom) {
        const code = btnVisitFrRoom.getAttribute('data-code');
        if (modalCollab) modalCollab.style.display = 'none';
        import('./room.js').then(roomMod => {
          roomMod.visitFriendRoom(code);
        });
        return;
      }

      const btnRemoveFr = e.target.closest('.btn-remove-friend');
      if (btnRemoveFr) {
        const name = btnRemoveFr.getAttribute('data-name') || 'người bạn này';
        if (!confirm(`Bạn có chắc chắn muốn hủy kết bạn với [${name}] không?`)) return;
        const id = btnRemoveFr.getAttribute('data-id');
        btnRemoveFr.disabled = true;
        try {
          const res = await window.API.removeFriend(id);
          if (res && res.success) {
            showToast(res.message, 3500);
            renderFriendsTab();
          } else {
            showToast('❌ ' + (res.message || 'Lỗi khi hủy kết bạn!'));
            btnRemoveFr.disabled = false;
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối!');
          btnRemoveFr.disabled = false;
        }
        return;
      }

      const btnCancelFr = e.target.closest('.btn-cancel-friend-req');
      if (btnCancelFr) {
        const id = btnCancelFr.getAttribute('data-id');
        btnCancelFr.disabled = true;
        try {
          const res = await window.API.rejectFriendRequest(id);
          if (res && res.success) {
            showToast('Đã thu hồi lời mời kết bạn.', 3500);
            renderFriendsTab();
          } else {
            showToast('❌ ' + (res.message || 'Lỗi khi thu hồi!'));
            btnCancelFr.disabled = false;
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối!');
          btnCancelFr.disabled = false;
        }
        return;
      }

      // --- COLLAB ACTIONS ---
      const btnAccept = e.target.closest('.btn-accept-collab');
      if (btnAccept) {
        const id = btnAccept.getAttribute('data-id');
        btnAccept.disabled = true;
        try {
          const res = await window.API.acceptCollab(id);
          if (res && res.success) {
            if (window.sound) window.sound.coin();
            showToast(res.message, 5000);
            renderCollabModal();
            state.storeState = await window.API.getState();
            updateUI();
          } else {
            showToast('❌ ' + (res.message || 'Lỗi khi chấp nhận lời mời!'));
            btnAccept.disabled = false;
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối!');
          btnAccept.disabled = false;
        }
        return;
      }

      const btnDecline = e.target.closest('.btn-decline-collab');
      if (btnDecline) {
        const id = btnDecline.getAttribute('data-id');
        btnDecline.disabled = true;
        try {
          const res = await window.API.declineCollab(id);
          if (res && res.success) {
            showToast(res.message, 3500);
            renderCollabModal();
          } else {
            showToast('❌ ' + (res.message || 'Lỗi khi từ chối!'));
            btnDecline.disabled = false;
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối!');
          btnDecline.disabled = false;
        }
        return;
      }

      const btnUnlink = e.target.closest('.btn-unlink-collab');
      if (btnUnlink) {
        const partnerName = btnUnlink.getAttribute('data-name') || 'đối tác này';
        if (!confirm(`Bạn có chắc muốn hủy liên kết Collab với "${partnerName}" không?\n\nQuầy hàng của bạn bè sẽ rời khỏi khung cảnh ngay lập tức và bạn sẽ mất +10% doanh thu bonus!`)) return;
        const id = btnUnlink.getAttribute('data-id');
        btnUnlink.disabled = true;
        try {
          const res = await window.API.cancelCollab(id);
          if (res && res.success) {
            showToast(`👋 Đã ngắt Collab với ${partnerName}. Quầy hàng bạn bè đã rời đi!`, 4000);
            renderCollabModal();
            state.storeState = await window.API.getState();
            updateUI();
          } else {
            showToast('❌ ' + (res.message || 'Lỗi khi hủy liên kết!'));
            btnUnlink.disabled = false;
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối!');
          btnUnlink.disabled = false;
        }
        return;
      }

      const btnCancel = e.target.closest('.btn-cancel-collab');
      if (btnCancel) {
        const id = btnCancel.getAttribute('data-id');
        btnCancel.disabled = true;
        try {
          const res = await window.API.cancelCollab(id);
          if (res && res.success) {
            showToast(res.message, 3500);
            renderCollabModal();
          } else {
            showToast('❌ ' + (res.message || 'Lỗi khi thu hồi lời mời!'));
            btnCancel.disabled = false;
          }
        } catch (err) {
          showToast('❌ Lỗi kết nối!');
          btnCancel.disabled = false;
        }
        return;
      }
    });
  }

  // --- DEBT MODAL ---
  const modalDebt = document.getElementById('modal-debt');
  const navDebt = document.getElementById('nav-debt');
  const closeDebt = document.getElementById('close-debt');
  const btnPay500k = document.getElementById('btn-pay-500k');
  const btnPayAll = document.getElementById('btn-pay-all-debt');
  const btnUnlockChap2 = document.getElementById('btn-unlock-chapter-2');

  async function handleDebtResult(res) {
    if (res.success) {
      if (window.sound) window.sound.coin();
      showToast(res.message, 4500);
      const oldChapter = state.storeState?.save ? state.storeState.save.chapter : 1;
      state.storeState = await window.API.getState();
      updateUI();

      if (res.debt_remaining === 0 && oldChapter === 1) {
        // Keep debt modal visible to prompt player to officially unlock Chapter 2
        if (modalDebt) modalDebt.style.display = 'flex';
        showToast('🎉 Đã sạch nợ Anh Bảnh! Hãy nhấn [Mở Khóa Chương 2] để chính thức bước sang bối cảnh Bách Khoa!', 5000);
      } else {
        if (modalDebt) modalDebt.style.display = 'none';
      }
    } else {
      showToast('❌ ' + res.message);
    }
  }

  if (navDebt) {
    navDebt.addEventListener('click', () => {
      const disp = document.getElementById('debt-remaining-disp');
      if (disp && state.storeState && state.storeState.save) {
        disp.innerText = (state.storeState.save.debt_remaining || 0).toLocaleString('vi-VN') + 'đ';
      }
      if (modalDebt) modalDebt.style.display = 'flex';
    });
  }

  if (closeDebt) {
    closeDebt.addEventListener('click', () => {
      if (modalDebt) modalDebt.style.display = 'none';
    });
  }

  if (btnPay500k) {
    btnPay500k.addEventListener('click', async () => {
      const res = await window.API.payDebt(500000);
      handleDebtResult(res);
    });
  }

  if (btnPayAll) {
    btnPayAll.addEventListener('click', async () => {
      const rem = state.storeState?.save?.debt_remaining || 0;
      const res = await window.API.payDebt(rem);
      handleDebtResult(res);
    });
  }

  if (btnUnlockChap2) {
    btnUnlockChap2.addEventListener('click', async () => {
      const curDebt = state.storeState?.save?.debt_remaining || 0;
      if (curDebt > 0) {
        if (window.sound && window.sound.fail) window.sound.fail();
        showToast(`❌ Bạn chưa trả hết nợ (còn nợ ${curDebt.toLocaleString('vi-VN')}đ). Chỉ khi nào trả hết nợ mới có thể mở Chương 2!`);
        return;
      }

      try {
        const res = await window.API.unlockChapter2();
        if (res && res.success) {
          if (window.sound) window.sound.coin();
          showToast(res.message, 5500);
          state.storeState = await window.API.getState();
          if (state.canvas) {
            state.canvas.setChapter(2);
            state.canvas.setSceneSetting('hust');
          }
          localStorage.setItem('hyhy_scene_setting', 'hust');
          updateUI();
          if (modalDebt) modalDebt.style.display = 'none';
          setTimeout(() => {
            openStoryModal(0, 2);
          }, 600);
        } else {
          showToast('❌ ' + (res.message || 'Chưa đủ điều kiện mở khóa Chương 2!'));
        }
      } catch (err) {
        console.error('Unlock chapter 2 error:', err);
        showToast('❌ Lỗi khi mở khóa Chương 2!');
      }
    });
  }

  // --- UPGRADES MODAL ---
  const modalUpgrades = document.getElementById('modal-upgrades');
  const navUpgrades = document.getElementById('nav-upgrades');
  const closeUpgrades = document.getElementById('close-upgrades');

  if (navUpgrades) {
    navUpgrades.addEventListener('click', () => {
      if (modalUpgrades) modalUpgrades.style.display = 'flex';
    });
  }

  if (closeUpgrades) {
    closeUpgrades.addEventListener('click', () => {
      if (modalUpgrades) modalUpgrades.style.display = 'none';
    });
  }

  document.querySelectorAll('[data-buy-upgrade]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const upId = btn.getAttribute('data-buy-upgrade');
      btn.disabled = true;
      try {
        const res = await window.API.buyUpgrade(upId);
        if (res.success) {
          if (window.sound) window.sound.coin();
          showToast(res.message);
          state.storeState = await window.API.getState();
          updateUI();
          if (upId !== 'bua_an_than') {
            btn.innerText = upId.startsWith('recipe_') ? 'Đã Thêm Vào Menu ✅' : 'Đã Sở Hữu ✅';
            if (upId.startsWith('recipe_')) btn.style.background = '#27ae60';
            btn.disabled = true;
          }
        } else {
          showToast('❌ ' + res.message);
          btn.disabled = false;
        }
      } catch (err) {
        showToast('❌ Lỗi kết nối khi mua nâng cấp!');
        btn.disabled = false;
      }
    });
  });

  // --- ADVANCE DAY BUTTON ---
  const btnAdvanceDay = document.getElementById('nav-advance-day');
  if (btnAdvanceDay) {
    btnAdvanceDay.addEventListener('click', () => {
      openEndShiftModal();
    });
  }

  // --- TEST ANTI-CHEAT DEMO BUTTON ---
  const btnTestHack = document.getElementById('nav-test-hack');
  if (btnTestHack) {
    btnTestHack.addEventListener('click', async () => {
      if (confirm('CẢNH BÁO THỬ NGHIỆM: Bạn đang chuẩn bị kích hoạt giả lập HACK TIỀN CLIENT. Hệ thống Anti-cheat của server sẽ phát hiện và tịch thu quán. Bạn có muốn thử nghiệm không?')) {
        const res = await window.API.testTamper();
        if (res.isJailed) {
          showJailModal(res.message);
        }
      }
    });
  }

  // --- SOUND & PLAYLIST CONTROLLER ---
  const btnNavSound = document.getElementById('nav-sound');
  function updateSoundButtonUI(status) {
    if (!btnNavSound) return;
    if (status && status.enabled && status.track) {
      btnNavSound.innerHTML = `🎵 ${status.track.name}`;
      btnNavSound.style.color = '#50fa7b';
    } else {
      btnNavSound.innerHTML = '🔇 Nhạc: Tắt';
      btnNavSound.style.color = 'var(--text-muted)';
    }
  }

  if (btnNavSound && window.sound) {
    const initialTrack = window.sound.getCurrentTrack();
    if (window.sound.bgmEnabled && initialTrack) {
      updateSoundButtonUI({ enabled: true, track: initialTrack });
    } else {
      updateSoundButtonUI({ enabled: false, track: null });
    }

    window.sound.setTrackChangeCallback((newTrack) => {
      updateSoundButtonUI({ enabled: true, track: newTrack });
      showToast(`🎶 Đang phát: ${newTrack.icon} ${newTrack.name} (${newTrack.style})`, 3000);
    });

    btnNavSound.addEventListener('click', () => {
      const result = window.sound.cycleBGM();
      updateSoundButtonUI(result);
      if (result.enabled && result.track) {
        showToast(`🎵 Đổi bài: ${result.track.icon} ${result.track.name} (${result.track.style})`, 3000);
      } else {
        showToast('🔇 Đã tắt nhạc nền.', 2000);
      }
    });
  }

  // --- UNIFIED GAME MENU CONTROLLER ---
  initGameMenu();

  // --- DAILY QUESTS & TEACOIN SYSTEM ---
  initDailyQuests();
}

export function openGameMenu() {
  const modal = document.getElementById('modal-game-menu');
  if (modal) {
    if (window.sound && window.sound.pop) window.sound.pop();
    updateUI();
    modal.style.display = 'flex';
  }
}

export function closeGameMenu() {
  const modal = document.getElementById('modal-game-menu');
  if (modal) modal.style.display = 'none';
}

function initGameMenu() {
  const modalMenu = document.getElementById('modal-game-menu');
  const btnOpenNav = document.getElementById('nav-open-menu');
  const btnOpenTop = document.getElementById('btn-menu-header');
  const btnClose = document.getElementById('close-game-menu');

  if (btnOpenNav) btnOpenNav.addEventListener('click', openGameMenu);
  if (btnOpenTop) btnOpenTop.addEventListener('click', openGameMenu);
  if (btnClose) btnClose.addEventListener('click', closeGameMenu);

  // Close when clicking outside modal-content
  if (modalMenu) {
    modalMenu.addEventListener('click', (e) => {
      if (e.target === modalMenu) closeGameMenu();
    });
  }

  // Quick action shortcuts inside menu
  const btnMenuMarket = document.getElementById('menu-btn-market');
  if (btnMenuMarket) {
    btnMenuMarket.addEventListener('click', () => {
      closeGameMenu();
      const navMarket = document.getElementById('nav-market');
      if (navMarket) navMarket.click();
    });
  }

  const btnMenuUpgrades = document.getElementById('menu-btn-upgrades');
  if (btnMenuUpgrades) {
    btnMenuUpgrades.addEventListener('click', () => {
      closeGameMenu();
      const navUpgrades = document.getElementById('nav-upgrades');
      if (navUpgrades) navUpgrades.click();
    });
  }

  const btnMenuEndShift = document.getElementById('menu-btn-end-shift');
  if (btnMenuEndShift) {
    btnMenuEndShift.addEventListener('click', () => {
      closeGameMenu();
      const navEndShift = document.getElementById('nav-end-shift');
      if (navEndShift) navEndShift.click();
    });
  }

  // Auto-close menu when sub-modals/actions are triggered from menu
  ['nav-debt', 'nav-collab', 'nav-daily-quests', 'nav-invite-tiktoker', 'nav-story', 'btn-toggle-scene', 'btn-logout'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        closeGameMenu();
      });
    }
  });

  // Copy code button inside menu
  const btnCopyMenuCode = document.getElementById('btn-copy-menu-code');
  if (btnCopyMenuCode) {
    btnCopyMenuCode.addEventListener('click', async () => {
      if (!state.storeState || !state.storeState.store_code) return;
      try {
        await navigator.clipboard.writeText(state.storeState.store_code);
        showToast('📋 Đã sao chép Mã Quán: ' + state.storeState.store_code, 2000);
      } catch {
        showToast('📋 Mã Quán: ' + state.storeState.store_code, 2000);
      }
    });
  }
}

// ==========================================
// 8. DAILY QUESTS & TEACOIN SYSTEM CONTROLLER
// ==========================================
export async function renderDailyQuestsModal() {
  const modal = document.getElementById('modal-daily-quests');
  if (!modal) return;

  const balanceEl = document.getElementById('modal-teacoin-balance');
  const counterEl = document.getElementById('quests-progress-counter');
  const listEl = document.getElementById('daily-quests-list');
  const chestIcon = document.getElementById('chest-icon');
  const chestSubtext = document.getElementById('chest-subtext');
  const btnClaimAll = document.getElementById('btn-claim-all-bonus');

  if (balanceEl && state.storeState && state.storeState.save) {
    balanceEl.innerText = `${(state.storeState.save.teacoin || 0).toLocaleString('vi-VN')} TeaCoin`;
  }

  try {
    const res = await window.API.getDailyQuests();
    if (!res || !res.success) {
      showToast(res && res.error ? res.error : 'Không thể tải nhiệm vụ hằng ngày!');
      return;
    }

    const { teacoin, day, quests, allCompleted, allBonusClaimed } = res;

    // Update state save data
    if (state.storeState && state.storeState.save) {
      state.storeState.save.teacoin = teacoin;
      updateUI();
    }

    if (balanceEl) balanceEl.innerText = `${(teacoin || 0).toLocaleString('vi-VN')} TeaCoin`;

    const questList = quests || [];
    const totalCount = questList.length;
    const completedCount = questList.filter(q => q.progress >= q.target).length;

    if (counterEl) {
      counterEl.innerText = `${completedCount}/${totalCount} Hoàn thành`;
    }

    // Update Bonus Chest status
    if (chestIcon && chestSubtext && btnClaimAll) {
      if (allBonusClaimed) {
        chestIcon.innerText = '✨';
        chestSubtext.innerText = 'Đã nhận thưởng rương chuyên cần hôm nay (+25 🍵)!';
        chestSubtext.style.color = '#50fa7b';
        btnClaimAll.disabled = true;
        btnClaimAll.innerText = '✓ Đã Nhận';
        btnClaimAll.style.background = '#4a5568';
        btnClaimAll.style.color = '#a0aec0';
      } else if (allCompleted) {
        chestIcon.innerText = '🎉';
        chestSubtext.innerText = 'Chúc mừng! Đã xong đủ 5/5 nhiệm vụ, sẵn sàng nhận rương!';
        chestSubtext.style.color = '#f1fa8c';
        btnClaimAll.disabled = false;
        btnClaimAll.innerText = 'Mở Rương (+25 🍵)';
        btnClaimAll.style.background = 'linear-gradient(135deg, #00cec9, #0984e3)';
        btnClaimAll.style.color = '#fff';
      } else {
        chestIcon.innerText = '🎁';
        chestSubtext.innerText = `Hoàn thành đủ ${totalCount} nhiệm vụ để nhận thêm +25 TeaCoin (Hiện tại: ${completedCount}/${totalCount})`;
        chestSubtext.style.color = 'var(--text-muted)';
        btnClaimAll.disabled = true;
        btnClaimAll.innerText = '+25 🍵';
        btnClaimAll.style.background = 'var(--gold)';
        btnClaimAll.style.color = '#111';
      }
    }

    // Render Quest Cards
    if (listEl) {
      listEl.innerHTML = questList.map(q => {
        const isDone = q.progress >= q.target;
        const isClaimed = !!q.claimed;
        const pct = Math.min(100, Math.round((q.progress / q.target) * 100));

        let rewardText = `+${q.rewardTeaCoin} 🍵`;
        if (q.rewardMoney) rewardText += ` & +${(q.rewardMoney).toLocaleString('vi-VN')}đ`;

        let actionButtonHtml = '';
        if (isClaimed) {
          actionButtonHtml = `<button class="btn-action-sm" style="background: #2d3748; color: #a0aec0; border: none; padding: 4px 10px; font-size: 0.82rem; border-radius: 4px;" disabled>✓ Đã Nhận</button>`;
        } else if (isDone) {
          actionButtonHtml = `<button class="btn-action-sm btn-claim-quest" data-quest-id="${q.id}" style="background: linear-gradient(135deg, #00cec9, #00b894); color: #111; font-weight: bold; border: none; padding: 5px 12px; font-size: 0.85rem; border-radius: 4px; cursor: pointer; animation: pulse 1.5s infinite;">Nhận Thưởng</button>`;
        } else {
          actionButtonHtml = `<span style="font-size: 0.8rem; color: var(--text-muted);">${q.progress}/${q.target}</span>`;
        }

        return `
          <div style="background: ${isClaimed ? 'rgba(255,255,255,0.02)' : isDone ? 'rgba(0, 206, 201, 0.08)' : 'rgba(255,255,255,0.04)'}; border: 1px solid ${isDone && !isClaimed ? '#00cec9' : 'rgba(255,255,255,0.1)'}; border-radius: 6px; padding: 8px 10px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
              <div>
                <div style="font-weight: bold; font-size: 0.92rem; color: ${isDone ? '#81ecec' : 'var(--milk-cream)'};">${q.icon || '📌'} ${escapeHtml(q.title || q.name)}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(q.desc)}</div>
              </div>
              <div style="text-align: right; margin-left: 8px;">
                <div style="font-size: 0.84rem; font-weight: bold; color: #00cec9; white-space: nowrap; margin-bottom: 4px;">${rewardText}</div>
                ${actionButtonHtml}
              </div>
            </div>
            <!-- Progress Bar -->
            <div style="background: rgba(0,0,0,0.5); border-radius: 3px; height: 5px; width: 100%; overflow: hidden; margin-top: 4px;">
              <div style="background: ${isClaimed ? '#a0aec0' : '#00cec9'}; height: 100%; width: ${pct}%; transition: width 0.3s ease;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

  } catch (err) {
    console.error('Error rendering daily quests modal:', err);
    showToast('❌ Lỗi khi tải danh sách nhiệm vụ!');
  }
}

export function openDailyQuestsModal() {
  const modal = document.getElementById('modal-daily-quests');
  if (modal) {
    if (window.sound && window.sound.pop) window.sound.pop();
    modal.style.display = 'flex';
    renderDailyQuestsModal();
  }
}
window.openDailyQuestsModal = openDailyQuestsModal;

export function closeDailyQuestsModal() {
  const modal = document.getElementById('modal-daily-quests');
  if (modal) modal.style.display = 'none';
}

function initDailyQuests() {
  const btnNav = document.getElementById('nav-daily-quests');
  const btnPill = document.getElementById('hud-teacoin-pill');
  const btnHeader = document.getElementById('btn-daily-quests-header');
  const btnStoryTabQuest = document.getElementById('story-tab-daily-quests');
  const btnMenuTeaCoin = document.getElementById('menu-stat-teacoin');
  const btnClose = document.getElementById('close-daily-quests');
  const modal = document.getElementById('modal-daily-quests');

  if (btnNav) btnNav.addEventListener('click', openDailyQuestsModal);
  if (btnPill) btnPill.addEventListener('click', openDailyQuestsModal);
  if (btnHeader) btnHeader.addEventListener('click', openDailyQuestsModal);
  if (btnMenuTeaCoin) btnMenuTeaCoin.addEventListener('click', openDailyQuestsModal);
  if (btnStoryTabQuest) {
    btnStoryTabQuest.addEventListener('click', () => {
      const modalStory = document.getElementById('modal-story');
      if (modalStory) modalStory.style.display = 'none';
      openDailyQuestsModal();
    });
  }
  if (btnClose) btnClose.addEventListener('click', closeDailyQuestsModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeDailyQuestsModal();
    });

    // Delegate click for claiming individual quests
    modal.addEventListener('click', async (e) => {
      const claimBtn = e.target.closest('.btn-claim-quest');
      if (claimBtn) {
        const questId = claimBtn.dataset.questId;
        claimBtn.disabled = true;
        claimBtn.innerText = 'Đang nhận...';

        try {
          const res = await window.API.claimDailyQuest(questId);
          if (res && res.success) {
            if (window.sound && window.sound.coin) window.sound.coin();
            showToast(res.message || `🎉 Nhận thành công +${res.reward_teacoin || 5} TeaCoin! 🍵`, 3000);
            if (state.storeState && state.storeState.save) {
              state.storeState.save.teacoin = res.teacoin;
              if (res.money !== undefined) state.storeState.save.money = res.money;
              updateUI();
            }
            renderDailyQuestsModal();
          } else {
            showToast('❌ ' + (res && res.error ? res.error : 'Không thể nhận thưởng!'));
            claimBtn.disabled = false;
            claimBtn.innerText = 'Nhận Thưởng';
          }
        } catch (err) {
          console.error('Claim quest error:', err);
          showToast('❌ Lỗi kết nối khi nhận thưởng!');
          claimBtn.disabled = false;
          claimBtn.innerText = 'Nhận Thưởng';
        }
      }
    });
  }

  // Claim all-quests bonus button
  const btnClaimAll = document.getElementById('btn-claim-all-bonus');
  if (btnClaimAll) {
    btnClaimAll.addEventListener('click', async () => {
      btnClaimAll.disabled = true;
      btnClaimAll.innerText = 'Đang mở rương...';

      try {
        const res = await window.API.claimDailyQuest('all_bonus');
        if (res && res.success) {
          if (window.sound && window.sound.levelUp) window.sound.levelUp();
          else if (window.sound && window.sound.coin) window.sound.coin();
          showToast(`🎁 ĐÃ MỞ RƯƠNG CHUYÊN CẦN: +${res.reward_teacoin} TeaCoin! 🍵`, 4000);
          if (state.storeState && state.storeState.save) {
            state.storeState.save.teacoin = res.teacoin;
            updateUI();
          }
          renderDailyQuestsModal();
        } else {
          showToast('❌ ' + (res && res.error ? res.error : 'Không thể mở rương!'));
          btnClaimAll.disabled = false;
          btnClaimAll.innerText = 'Mở Rương (+25 🍵)';
        }
      } catch (err) {
        console.error('Claim all bonus error:', err);
        showToast('❌ Lỗi kết nối khi mở rương!');
        btnClaimAll.disabled = false;
        btnClaimAll.innerText = 'Mở Rương (+25 🍵)';
      }
    });
  }
}


