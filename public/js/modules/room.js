/**
 * Cozy Home & Room Decoration Module
 * Fullscreen Landscape Mode with Virtual Joystick & Playable Character
 */

import { state } from './state.js';
import { showToast } from './toast.js';
import { RoomRenderer } from '../canvas/room-renderer.js';
import { VirtualJoystick } from '../canvas/joystick.js';

let roomRenderer = null;
let friendRoomRenderer = null;
let myRoomJoystick = null;
let friendRoomJoystick = null;

let modalMyRoom = null;
let modalFriendRoom = null;

let currentRoomData = null;
let currentFriendRoomData = null;

let rotateHintDismissedMyRoom = false;
let rotateHintDismissedFriendRoom = false;

/**
 * Screen Fullscreen & Landscape Orientation Lock Helper
 */
async function enterFullscreenAndLandscape(modalElement) {
  // 1. Fullscreen API
  try {
    const el = modalElement || document.documentElement;
    if (el.requestFullscreen) {
      await el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
    }
  } catch (err) {
    console.warn('Fullscreen request blocked or not supported:', err);
  }

  // 2. Screen Orientation API lock to landscape
  try {
    if (screen.orientation && screen.orientation.lock) {
      await screen.orientation.lock('landscape');
    } else if (screen.lockOrientation) {
      screen.lockOrientation('landscape');
    }
  } catch (err) {
    console.warn('Orientation lock failed or not supported:', err);
  }

  // 3. Check and show rotation hint if needed
  checkOrientationHints();
}

async function exitFullscreenAndOrientation() {
  // 1. Unlock Orientation
  try {
    if (screen.orientation && screen.orientation.unlock) {
      screen.orientation.unlock();
    } else if (screen.unlockOrientation) {
      screen.unlockOrientation();
    }
  } catch (err) {
    console.warn('Unlock orientation error:', err);
  }

  // 2. Exit Fullscreen
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
    }
  } catch (err) {
    console.warn('Exit fullscreen error:', err);
  }
}

/**
 * Check if current viewport is portrait and toggle the rotate reminder overlay
 */
function checkOrientationHints() {
  const isPortrait = window.innerHeight > window.innerWidth;

  // My Room Hint
  const myRoomHint = document.getElementById('room-rotate-hint');
  if (myRoomHint) {
    if (isPortrait && !rotateHintDismissedMyRoom && modalMyRoom && modalMyRoom.style.display === 'flex') {
      myRoomHint.classList.add('show');
    } else {
      myRoomHint.classList.remove('show');
    }
  }

  // Friend Room Hint
  const friendRoomHint = document.getElementById('friend-room-rotate-hint');
  if (friendRoomHint) {
    if (isPortrait && !rotateHintDismissedFriendRoom && modalFriendRoom && modalFriendRoom.style.display === 'flex') {
      friendRoomHint.classList.add('show');
    } else {
      friendRoomHint.classList.remove('show');
    }
  }
}

/**
 * Resize active canvas to fit screen smoothly
 */
function resizeActiveCanvas(canvas, renderer) {
  if (!canvas || !renderer) return;
  const container = canvas.parentElement;
  if (!container) return;

  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || window.innerHeight;

  // Ensure logical aspect ratio is spacious and sharp
  const targetW = Math.max(760, Math.min(1280, Math.floor(w)));
  const targetH = Math.max(380, Math.min(640, Math.floor(h)));

  renderer.resize(targetW, targetH);
}

export function initRoomModule() {
  modalMyRoom = document.getElementById('modal-my-room');
  modalFriendRoom = document.getElementById('modal-friend-room');

  // Nav Button "Căn Phòng" in bottom bar
  const navBtnRoom = document.getElementById('nav-my-room');
  if (navBtnRoom) {
    navBtnRoom.addEventListener('click', () => openMyRoom());
  }

  // Menu button "Căn Phòng" in game control menu
  const menuBtnRoom = document.getElementById('menu-btn-room');
  if (menuBtnRoom) {
    menuBtnRoom.addEventListener('click', () => {
      const menuModal = document.getElementById('modal-game-menu');
      if (menuModal) menuModal.style.display = 'none';
      openMyRoom();
    });
  }

  // Close My Room
  const closeMyRoom = document.getElementById('close-my-room');
  if (closeMyRoom && modalMyRoom) {
    closeMyRoom.addEventListener('click', () => {
      modalMyRoom.style.display = 'none';
      if (roomRenderer) roomRenderer.stop();
      if (myRoomJoystick) myRoomJoystick.disableKeyboard();
      exitFullscreenAndOrientation();
    });
  }

  // Close Friend Room
  const closeFriendRoom = document.getElementById('close-friend-room');
  if (closeFriendRoom && modalFriendRoom) {
    closeFriendRoom.addEventListener('click', () => {
      modalFriendRoom.style.display = 'none';
      if (friendRoomRenderer) friendRoomRenderer.stop();
      if (friendRoomJoystick) friendRoomJoystick.disableKeyboard();
      exitFullscreenAndOrientation();
    });
  }

  // Fullscreen Toggles
  const btnToggleFsMy = document.getElementById('btn-room-fullscreen-toggle');
  if (btnToggleFsMy) {
    btnToggleFsMy.addEventListener('click', () => {
      if (document.fullscreenElement) {
        exitFullscreenAndOrientation();
      } else {
        enterFullscreenAndLandscape(modalMyRoom);
      }
    });
  }

  const btnToggleFsFriend = document.getElementById('btn-friend-room-fullscreen-toggle');
  if (btnToggleFsFriend) {
    btnToggleFsFriend.addEventListener('click', () => {
      if (document.fullscreenElement) {
        exitFullscreenAndOrientation();
      } else {
        enterFullscreenAndLandscape(modalFriendRoom);
      }
    });
  }

  // Decor Shop inside Room (Slide-in Drawer)
  const btnOpenDecorShop = document.getElementById('btn-open-decor-shop');
  const shopDrawer = document.getElementById('room-decor-shop-section');
  const btnCloseDecorShop = document.getElementById('btn-close-decor-shop');

  if (btnOpenDecorShop && shopDrawer) {
    btnOpenDecorShop.addEventListener('click', () => {
      shopDrawer.classList.toggle('open');
    });
  }

  if (btnCloseDecorShop && shopDrawer) {
    btnCloseDecorShop.addEventListener('click', () => {
      shopDrawer.classList.remove('open');
    });
  }

  // Friend Items Drawer Toggle
  const btnFriendItemsToggle = document.getElementById('btn-friend-items-toggle');
  const friendItemsDrawer = document.getElementById('friend-room-items-drawer');
  const btnCloseFriendItems = document.getElementById('btn-close-friend-items');

  if (btnFriendItemsToggle && friendItemsDrawer) {
    btnFriendItemsToggle.addEventListener('click', () => {
      friendItemsDrawer.classList.toggle('open');
    });
  }

  if (btnCloseFriendItems && friendItemsDrawer) {
    btnCloseFriendItems.addEventListener('click', () => {
      friendItemsDrawer.classList.remove('open');
    });
  }

  // Rotation Prompts Dismiss Buttons
  const btnDismissRotate = document.getElementById('btn-dismiss-rotate');
  if (btnDismissRotate) {
    btnDismissRotate.addEventListener('click', () => {
      rotateHintDismissedMyRoom = true;
      checkOrientationHints();
    });
  }

  const btnDismissFriendRotate = document.getElementById('btn-dismiss-friend-rotate');
  if (btnDismissFriendRotate) {
    btnDismissFriendRotate.addEventListener('click', () => {
      rotateHintDismissedFriendRoom = true;
      checkOrientationHints();
    });
  }

  // Invite friends button inside Room
  const btnInviteFriends = document.getElementById('btn-room-invite-friends');
  if (btnInviteFriends) {
    btnInviteFriends.addEventListener('click', () => {
      if (modalMyRoom) modalMyRoom.style.display = 'none';
      if (roomRenderer) roomRenderer.stop();
      exitFullscreenAndOrientation();
      const collabModal = document.getElementById('modal-collab');
      if (collabModal) collabModal.style.display = 'flex';
    });
  }

  // Friend Room Cheer Button
  const btnCheerFriend = document.getElementById('btn-cheer-friend-room');
  if (btnCheerFriend) {
    btnCheerFriend.addEventListener('click', async () => {
      if (!currentFriendRoomData || !currentFriendRoomData.friend) return;
      btnCheerFriend.disabled = true;
      btnCheerFriend.innerText = 'Đang gửi... ❤️';
      try {
        const res = await window.API.cheerFriendRoom(currentFriendRoomData.friend.id, 'Nhà bạn trang trí xinh xắn quá!');
        if (res && res.success) {
          if (window.sound && window.sound.coin) window.sound.coin();
          showToast(res.message, 4000);
          btnCheerFriend.innerText = '❤️ Đã Thả Tim!';
          if (friendRoomRenderer) {
            friendRoomRenderer.spawnParticle(friendRoomRenderer.player.x, friendRoomRenderer.player.y - 18, '❤️', '#ff7675', 0, -2, 16);
          }
        } else {
          showToast(res.error || 'Không thể gửi tim!', 3000);
          btnCheerFriend.disabled = false;
          btnCheerFriend.innerText = '❤️ Thả Tim Nhà Đẹp (+50 TeaCoin)';
        }
      } catch (e) {
        showToast('Lỗi kết nối khi thả tim!', 3000);
        btnCheerFriend.disabled = false;
        btnCheerFriend.innerText = '❤️ Thả Tim Nhà Đẹp (+50 TeaCoin)';
      }
    });
  }

  // Setup Interact Action Buttons
  const btnInteractMy = document.getElementById('btn-room-interact');
  if (btnInteractMy) {
    btnInteractMy.addEventListener('click', () => {
      if (roomRenderer) roomRenderer.interact();
    });
  }

  // Chat / Thoughts button
  const btnChat = document.getElementById('btn-room-chat');
  if (btnChat) {
    btnChat.addEventListener('click', () => {
      if (roomRenderer) {
        const thoughts = [
          'Hôm nay thật là một ngày bình yên! ✨',
          'Trà sữa trân châu vẫn là chân ái 🧋',
          'Căn phòng này ấm cúng quá chừng! 🏠',
          'Ghé tiệm làm một ly trà sữa mát lạnh thôi nào! 🥤',
          'Nghỉ ngơi một chút để nạp lại năng lượng! 💖'
        ];
        const t = thoughts[Math.floor(Math.random() * thoughts.length)];
        roomRenderer.spawnFloatingText(roomRenderer.player.x, roomRenderer.player.y - 32, t, '#ffeaa7');
        roomRenderer.spawnParticle(roomRenderer.player.x, roomRenderer.player.y - 18, '💭', '#ffeaa7');
        if (window.sound && window.sound.pop) window.sound.pop();
      }
    });
  }

  // Quick Shop button
  const btnQuickShop = document.getElementById('btn-room-quick-shop');
  if (btnQuickShop && shopDrawer) {
    btnQuickShop.addEventListener('click', () => {
      shopDrawer.classList.toggle('open');
    });
  }

  const btnInteractFriend = document.getElementById('btn-friend-room-interact');
  if (btnInteractFriend) {
    btnInteractFriend.addEventListener('click', () => {
      if (friendRoomRenderer) friendRoomRenderer.interact();
    });
  }

  // Keyboard shortcut Space / E for interact
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'KeyE') {
      const isMyRoomOpen = modalMyRoom && modalMyRoom.style.display === 'flex';
      const isFriendRoomOpen = modalFriendRoom && modalFriendRoom.style.display === 'flex';
      if (isMyRoomOpen && roomRenderer) {
        e.preventDefault();
        roomRenderer.interact();
      } else if (isFriendRoomOpen && friendRoomRenderer) {
        e.preventDefault();
        friendRoomRenderer.interact();
      }
    }
  });

  // Window resize & orientation change listeners
  window.addEventListener('resize', () => {
    checkOrientationHints();
    if (modalMyRoom && modalMyRoom.style.display === 'flex' && roomRenderer) {
      const canvas = document.getElementById('room-stage-canvas');
      resizeActiveCanvas(canvas, roomRenderer);
    }
    if (modalFriendRoom && modalFriendRoom.style.display === 'flex' && friendRoomRenderer) {
      const canvas = document.getElementById('friend-room-canvas');
      resizeActiveCanvas(canvas, friendRoomRenderer);
    }
  });

  if (screen.orientation) {
    screen.orientation.addEventListener('change', () => {
      checkOrientationHints();
      setTimeout(() => {
        if (modalMyRoom && modalMyRoom.style.display === 'flex' && roomRenderer) {
          const canvas = document.getElementById('room-stage-canvas');
          resizeActiveCanvas(canvas, roomRenderer);
        }
        if (modalFriendRoom && modalFriendRoom.style.display === 'flex' && friendRoomRenderer) {
          const canvas = document.getElementById('friend-room-canvas');
          resizeActiveCanvas(canvas, friendRoomRenderer);
        }
      }, 100);
    });
  }
}

/**
 * Open Player's Room (Fullscreen + Landscape + Joystick)
 */
export async function openMyRoom() {
  if (!modalMyRoom) return;
  rotateHintDismissedMyRoom = false;
  modalMyRoom.style.display = 'flex';

  // Request Fullscreen & Landscape Orientation
  await enterFullscreenAndLandscape(modalMyRoom);

  const canvas = document.getElementById('room-stage-canvas');
  if (canvas && !roomRenderer) {
    roomRenderer = new RoomRenderer(canvas);
  } else if (roomRenderer) {
    roomRenderer.start();
  }

  // Resize canvas to match landscape container
  if (canvas && roomRenderer) {
    resizeActiveCanvas(canvas, roomRenderer);
  }

  // Setup Joystick
  const joyBase = document.getElementById('room-joystick-base');
  const joyStick = document.getElementById('room-joystick-stick');
  if (joyBase && joyStick) {
    if (!myRoomJoystick) {
      myRoomJoystick = new VirtualJoystick({
        baseEl: joyBase,
        stickEl: joyStick,
        onMove: ({ x, y }) => {
          if (roomRenderer) roomRenderer.setInput(x, y);
        }
      });
    } else {
      myRoomJoystick.enableKeyboard();
    }
  }

  // Hook interaction highlight on button
  const btnInteract = document.getElementById('btn-room-interact');
  if (roomRenderer && btnInteract) {
    roomRenderer.setOnInteractChange((target) => {
      if (target) {
        btnInteract.classList.add('highlight');
      } else {
        btnInteract.classList.remove('highlight');
      }
    });
  }

  await refreshMyRoomData();
}

/**
 * Refresh Player's Room data & render
 */
export async function refreshMyRoomData() {
  try {
    const res = await window.API.getRoom();
    if (res && res.cozyPoints !== undefined) {
      currentRoomData = res;
      // Inject current weather from state
      if (state.storeState && state.storeState.weather) {
        currentRoomData.weather = state.storeState.weather;
      }

      // Update Header stats
      const elPoints = document.getElementById('room-cozy-points');
      const elTier = document.getElementById('room-cozy-tier');
      const elTitle = document.getElementById('room-cozy-title');
      if (elPoints) elPoints.innerText = `${res.cozyPoints}⭐`;
      if (elTier) elTier.innerText = res.cozyTier;
      if (elTitle) elTitle.innerText = res.cozyTitle;

      // Update Canvas
      if (roomRenderer) {
        roomRenderer.setData(currentRoomData);
      }

      // Render Furniture Catalog
      renderDecorShop(res.catalog || []);
    }
  } catch (err) {
    console.error('refreshMyRoomData error:', err);
  }
}

/**
 * Render Decor Shop Grid
 */
function renderDecorShop(catalog) {
  const container = document.getElementById('room-decor-grid');
  if (!container) return;

  container.innerHTML = '';
  catalog.forEach(item => {
    const card = document.createElement('div');
    card.className = `decor-card ${item.equipped ? 'equipped' : ''}`;

    let actionBtnHtml = '';
    if (item.owned) {
      actionBtnHtml = `
        <button class="btn-decor-toggle ${item.equipped ? 'active' : ''}" data-decor-id="${item.id}" data-action="toggle">
          ${item.equipped ? '✓ Đang Đặt Trong Phòng' : '+ Đặt Vào Phòng'}
        </button>
      `;
    } else {
      actionBtnHtml = `
        <button class="btn-decor-buy" data-decor-id="${item.id}" data-action="buy">
          Mua (${item.price.toLocaleString('vi-VN')}đ)
        </button>
      `;
    }

    card.innerHTML = `
      <div class="decor-card-top">
        <span class="decor-icon">${item.icon}</span>
        <div class="decor-info">
          <div class="decor-name">${item.name}</div>
          <div class="decor-cozy">+${item.cozyPoints}⭐ Ấm Cúng</div>
        </div>
      </div>
      <div class="decor-effect">${item.effect}</div>
      ${actionBtnHtml}
    `;

    // Buy click
    const btnBuy = card.querySelector('.btn-decor-buy');
    if (btnBuy) {
      btnBuy.addEventListener('click', async () => {
        btnBuy.disabled = true;
        btnBuy.innerText = 'Đang mua...';
        try {
          const res = await window.API.buyRoomDecor(item.id);
          if (res && res.success) {
            if (window.sound && window.sound.coin) window.sound.coin();
            showToast(res.message, 4000);
            if (state.storeState && state.storeState.save) {
              state.storeState.save.money = res.money;
            }
            await refreshMyRoomData();
          } else {
            showToast(res.error || 'Không thể mua vật phẩm!', 3000);
            btnBuy.disabled = false;
            btnBuy.innerText = `Mua (${item.price.toLocaleString('vi-VN')}đ)`;
          }
        } catch (e) {
          showToast(e.message || 'Lỗi kết nối khi mua!', 3000);
          btnBuy.disabled = false;
          btnBuy.innerText = `Mua (${item.price.toLocaleString('vi-VN')}đ)`;
        }
      });
    }

    // Toggle equip click
    const btnToggle = card.querySelector('.btn-decor-toggle');
    if (btnToggle) {
      btnToggle.addEventListener('click', async () => {
        btnToggle.disabled = true;
        try {
          const newStatus = !item.equipped;
          const res = await window.API.equipRoomDecor(item.id, newStatus);
          if (res && res.success) {
            if (window.sound && window.sound.pop) window.sound.pop();
            showToast(res.message, 2500);
            await refreshMyRoomData();
          }
        } catch (e) {
          showToast('Lỗi khi thay đổi bài trí!', 3000);
          btnToggle.disabled = false;
        }
      });
    }

    container.appendChild(card);
  });
}

/**
 * Visit Friend's Room (Fullscreen + Landscape + Joystick)
 */
export async function visitFriendRoom(friendCodeOrId) {
  if (!modalFriendRoom) return;
  rotateHintDismissedFriendRoom = false;
  modalFriendRoom.style.display = 'flex';

  await enterFullscreenAndLandscape(modalFriendRoom);

  const canvas = document.getElementById('friend-room-canvas');
  if (canvas && !friendRoomRenderer) {
    friendRoomRenderer = new RoomRenderer(canvas);
  } else if (friendRoomRenderer) {
    friendRoomRenderer.start();
  }

  if (canvas && friendRoomRenderer) {
    resizeActiveCanvas(canvas, friendRoomRenderer);
  }

  // Setup Joystick for friend room
  const fJoyBase = document.getElementById('friend-room-joystick-base');
  const fJoyStick = document.getElementById('friend-room-joystick-stick');
  if (fJoyBase && fJoyStick) {
    if (!friendRoomJoystick) {
      friendRoomJoystick = new VirtualJoystick({
        baseEl: fJoyBase,
        stickEl: fJoyStick,
        onMove: ({ x, y }) => {
          if (friendRoomRenderer) friendRoomRenderer.setInput(x, y);
        }
      });
    } else {
      friendRoomJoystick.enableKeyboard();
    }
  }

  const btnInteract = document.getElementById('btn-friend-room-interact');
  if (friendRoomRenderer && btnInteract) {
    friendRoomRenderer.setOnInteractChange((target) => {
      if (target) {
        btnInteract.classList.add('highlight');
      } else {
        btnInteract.classList.remove('highlight');
      }
    });
  }

  const elTitle = document.getElementById('friend-room-title');
  const elOwner = document.getElementById('friend-room-owner');
  const elPoints = document.getElementById('friend-room-cozy-points');
  const elTier = document.getElementById('friend-room-cozy-tier');
  const itemsList = document.getElementById('friend-room-items-list');
  const btnCheer = document.getElementById('btn-cheer-friend-room');

  if (btnCheer) {
    btnCheer.disabled = false;
    btnCheer.innerText = '❤️ Thả Tim (+50 TeaCoin)';
  }

  try {
    const res = await window.API.visitFriendRoom(friendCodeOrId);
    if (res && res.success && res.room) {
      currentFriendRoomData = res;
      res.room.isFriend = true;
      res.room.store_name = res.friend.store_name;

      if (elTitle) elTitle.innerText = `🏠 NHÀ: ${res.friend.store_name}`;
      if (elOwner) elOwner.innerText = `@${res.friend.username || 'Bạn bè'} (${res.friend.store_code})`;
      if (elPoints) elPoints.innerText = `${res.room.cozyPoints}⭐`;
      if (elTier) elTier.innerText = res.room.cozyTier;

      if (friendRoomRenderer) {
        friendRoomRenderer.setData(res.room);
      }

      // List furniture items in friend's room
      if (itemsList) {
        itemsList.innerHTML = '';
        const items = res.room.equippedItems || [];
        if (items.length === 0) {
          itemsList.innerHTML = '<div style="color: var(--text-muted); font-style: italic; font-size: 0.85rem;">Bạn ấy chưa bài trí món đồ nào.</div>';
        } else {
          items.forEach(it => {
            const card = document.createElement('div');
            card.className = 'decor-card equipped';
            card.innerHTML = `
              <div class="decor-card-top">
                <span class="decor-icon">${it.icon}</span>
                <div class="decor-info">
                  <div class="decor-name">${it.name}</div>
                  <div class="decor-cozy">+${it.cozyPoints}⭐ Ấm Cúng</div>
                </div>
              </div>
              <div class="decor-effect">${it.effect || ''}</div>
            `;
            itemsList.appendChild(card);
          });
        }
      }
    } else {
      showToast(res.error || 'Không tìm thấy căn phòng của bạn bè!', 3000);
      modalFriendRoom.style.display = 'none';
      exitFullscreenAndOrientation();
    }
  } catch (err) {
    console.error('visitFriendRoom error:', err);
    showToast('Lỗi kết nối khi ghé thăm nhà bạn bè!', 3000);
    modalFriendRoom.style.display = 'none';
    exitFullscreenAndOrientation();
  }
}

/**
 * Synchronize live weather changes with the room window
 */
export function syncRoomWeather(weather) {
  if (roomRenderer && typeof roomRenderer.setWeather === 'function') {
    roomRenderer.setWeather(weather);
  }
  if (friendRoomRenderer && typeof friendRoomRenderer.setWeather === 'function') {
    friendRoomRenderer.setWeather(weather);
  }
}

