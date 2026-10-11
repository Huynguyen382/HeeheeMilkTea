/**
 * Coffee Lounge Multiplayer & World Boss Battle System
 * Client Controller & Socket.IO Coordinator
 */

import { state } from './state.js';
import { showToast } from './toast.js';
import { updateUI, updateBuffsUI } from './ui.js';
import { CoffeeRenderer } from '../canvas/coffee-renderer.js';

let socket = null;
let coffeeRenderer = null;
let currentRoomName = 'Lounge-01';
let selectedAmmoType = 'pearl_basic';
let isFiring = false;
let lastFireTime = 0;
let coffeeMenuData = null;
let foodMenuData = null;
let ammoMenuData = null;
let activeStoreState = null;
let isBossBgmPlaying = false;

// Key state for WASD movement
const keysDown = {
  w: false, a: false, s: false, d: false,
  ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
};
let moveInterval = null;

export function initCoffeeModule() {
  const modalLounge = document.getElementById('modal-coffee-lounge');
  const btnOpenHeader = document.getElementById('btn-coffee-header');
  const btnOpenMenu = document.getElementById('btn-open-coffee-menu');
  const btnClose = document.getElementById('close-coffee-lounge');

  if (btnOpenHeader) {
    btnOpenHeader.style.display = 'none';
    btnOpenHeader.addEventListener('click', openCoffeeLounge);
  }
  if (btnOpenMenu) {
    btnOpenMenu.style.display = 'none';
    btnOpenMenu.addEventListener('click', () => {
      const menuModal = document.getElementById('modal-game-menu');
      if (menuModal) menuModal.style.display = 'none';
      openCoffeeLounge();
    });
  }
  if (btnClose) {
    btnClose.addEventListener('click', closeCoffeeLounge);
  }

  // Setup sub-modal buttons & event listeners
  setupSubmodalControls();
  setupCombatControls();

  // Coffee feature UI is hidden
  checkGlobalCoffeeHUD();
}

/**
 * Open Coffee Lounge Modal & Connect Socket
 */
export async function openCoffeeLounge() {
  const modal = document.getElementById('modal-coffee-lounge');
  if (!modal) return;

  modal.style.display = 'flex';

  // 1. Initialize Canvas Renderer
  const canvas = document.getElementById('coffee-stage-canvas');
  if (canvas && !coffeeRenderer) {
    coffeeRenderer = new CoffeeRenderer(canvas);
  }
  if (coffeeRenderer) {
    coffeeRenderer.start();
  }

  // 2. Fetch Initial State & Menus from REST API
  await loadCoffeeData();

  // 3. Connect Socket.IO
  connectCoffeeSocket();

  // 4. Start Key Listener
  startMovementListeners();
}

/**
 * Close Coffee Lounge Modal & Disconnect Socket
 */
export function closeCoffeeLounge() {
  const modal = document.getElementById('modal-coffee-lounge');
  if (modal) modal.style.display = 'none';

  if (coffeeRenderer) {
    coffeeRenderer.stop();
  }

  stopMovementListeners();

  if (isBossBgmPlaying && window.sound && window.sound.restorePreviousBGM) {
    window.sound.restorePreviousBGM();
    isBossBgmPlaying = false;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Setup Socket.IO Gateway Client
 */
function connectCoffeeSocket() {
  if (typeof window.io === 'undefined') {
    console.warn('[CoffeeModule] Socket.IO client library not loaded, using REST fallback.');
    return;
  }

  if (socket && socket.connected) return;

  socket = window.io();

  const storeId = state.storeState?.store?.id || 1;
  const storeName = state.storeState?.store?.store_name || 'Tiệm Trà Sữa HeeHee';
  const title = (activeStoreState?.bossTitles && activeStoreState.bossTitles[0]) || 'Barista Tập Sự';

  socket.on('connect', () => {
    console.log('[CoffeeSocket] Connected to server!');
    socket.emit('coffee:join_room', {
      storeId,
      storeName,
      avatarId: 1,
      title
    });
  });

  // Room State received
  socket.on('coffee:room_state', (data) => {
    currentRoomName = data.roomName;
    updateRoomBadge(data.roomName, data.playerCount, data.maxPlayers);

    if (coffeeRenderer) {
      if (data.you) {
        coffeeRenderer.localPlayer = { ...coffeeRenderer.localPlayer, ...data.you };
      }
      coffeeRenderer.remotePlayers.clear();
      data.players.forEach(p => {
        if (p.socketId !== socket.id) {
          coffeeRenderer.remotePlayers.set(p.socketId, p);
        }
      });
      if (data.bossState) {
        updateBossState(data.bossState);
      }
    }

    if (data.storeState) {
      activeStoreState = data.storeState;
      updateAmmoBar(data.storeState.bossPearlInventory);
    }
  });

  // Player Joined
  socket.on('coffee:player_joined', (data) => {
    if (coffeeRenderer && data.player) {
      coffeeRenderer.remotePlayers.set(data.player.socketId, data.player);
      updateRoomBadge(data.roomName, data.playerCount, 20);
      showToast(`👋 ${data.player.storeName} vừa bước vào quán!`, 3000);
    }
  });

  // Player Left
  socket.on('coffee:player_left', (data) => {
    if (coffeeRenderer) {
      coffeeRenderer.remotePlayers.delete(data.socketId);
      updateRoomBadge(currentRoomName, data.playerCount, 20);
    }
  });

  // Player Moved
  socket.on('coffee:player_moved', (data) => {
    if (coffeeRenderer && coffeeRenderer.remotePlayers.has(data.socketId)) {
      const p = coffeeRenderer.remotePlayers.get(data.socketId);
      p.x = data.x;
      p.y = data.y;
      p.state = data.state;
      p.direction = data.direction;
      p.sitting = data.sitting;
    }
  });

  // Player Chat
  socket.on('coffee:player_chat', (data) => {
    if (coffeeRenderer) {
      if (data.socketId === socket.id) {
        coffeeRenderer.localPlayer.lastChat = data.message;
        coffeeRenderer.localPlayer.lastChatTime = data.timestamp;
      } else if (coffeeRenderer.remotePlayers.has(data.socketId)) {
        const p = coffeeRenderer.remotePlayers.get(data.socketId);
        p.lastChat = data.message;
        p.lastChatTime = data.timestamp;
      }
    }
  });

  // Player Emoted
  socket.on('coffee:player_emoted', (data) => {
    if (coffeeRenderer) {
      if (data.socketId === socket.id) {
        coffeeRenderer.localPlayer.lastEmote = data.emote;
        coffeeRenderer.localPlayer.lastEmoteTime = data.timestamp;
      } else if (coffeeRenderer.remotePlayers.has(data.socketId)) {
        const p = coffeeRenderer.remotePlayers.get(data.socketId);
        p.lastEmote = data.emote;
        p.lastEmoteTime = data.timestamp;
      }
    }
  });

  // Coffee Drank Broadcast
  socket.on('coffee:player_drank', (data) => {
    if (coffeeRenderer) {
      if (data.socketId === socket.id) {
        coffeeRenderer.localPlayer.coffeeSteam = true;
        coffeeRenderer.localPlayer.drinkAnimTimer = 75;
      } else if (coffeeRenderer.remotePlayers.has(data.socketId)) {
        const p = coffeeRenderer.remotePlayers.get(data.socketId);
        p.coffeeSteam = true;
        p.drinkAnimTimer = 75;
      }
    }
    showToast(`☕ ${data.playerName} đang thưởng thức ly cà phê và nhận Buff: [${data.buffName}]!`, 4000);
  });

  // Local Drink Success
  socket.on('coffee:drink_success', (result) => {
    if (window.sound && window.sound.coffeeDrink) window.sound.coffeeDrink();
    showToast(`✨ ${result.message}`, 5000);
    if (coffeeRenderer && coffeeRenderer.localPlayer) {
      coffeeRenderer.localPlayer.drinkAnimTimer = 75;
      coffeeRenderer.localPlayer.coffeeSteam = true;
    }
    // Refresh main game buffs
    if (state.storeState && state.storeState.save) {
      if (!state.storeState.save.active_buffs) state.storeState.save.active_buffs = {};
      state.storeState.save.active_buffs[result.buff.id] = result.buff;
      updateBuffsUI(state.storeState.save.active_buffs);
      updateUI();
    }
    loadCoffeeData();
  });

  // Boss Spawned Siren
  socket.on('boss:spawn', (data) => {
    if (window.sound && window.sound.bossWarning) window.sound.bossWarning();
    showToast(`🚨 ${data.message}`, 6000);
    if (data.bossState) updateBossState(data.bossState);
  });

  // Boss Countdown
  socket.on('boss:countdown', (data) => {
    const timerBadge = document.getElementById('coffee-boss-timer');
    if (timerBadge) {
      timerBadge.style.display = 'flex';
      const mins = Math.floor(data.remainingSec / 60);
      const secs = data.remainingSec % 60;
      timerBadge.innerHTML = `⏰ Sắp Ra Boss: ${mins}:${secs.toString().padStart(2, '0')}`;
    }
    const hudBadge = document.getElementById('hud-coffee-badge');
    if (hudBadge) {
      hudBadge.style.display = 'inline-block';
      hudBadge.style.background = '#f59e0b';
      hudBadge.style.color = '#ffffff';
      hudBadge.innerText = '⏰ 15p';
    }
  });

  // Boss Projectile flying
  socket.on('boss:projectile', (data) => {
    if (coffeeRenderer) {
      coffeeRenderer.addProjectile(data);
      if (data.socketId === socket.id) {
        coffeeRenderer.localPlayer.shootAnimTimer = 10;
      } else if (coffeeRenderer.remotePlayers.has(data.socketId)) {
        coffeeRenderer.remotePlayers.get(data.socketId).shootAnimTimer = 10;
      }
    }
  });

  // Boss Damage Update & HP Bar
  socket.on('boss:damage_update', (data) => {
    updateBossHPBar(data.currentHp, data.maxHp, data.hpPercent, data.phase);
    updateLiveLeaderboard(data.leaderboard);
  });

  // Shoot Feedback (ammo sync)
  socket.on('boss:shoot_feedback', (data) => {
    if (data.ammoInventory) {
      updateAmmoBar(data.ammoInventory);
    }
  });

  // Boss Victory or Timeout (End of battle)
  socket.on('boss:victory_or_timeout', (data) => {
    if (window.sound && window.sound.bossVictory) window.sound.bossVictory();
    if (isBossBgmPlaying && window.sound && window.sound.restorePreviousBGM) {
      window.sound.restorePreviousBGM();
      isBossBgmPlaying = false;
    }
    openRewardsModal(data);
    checkGlobalCoffeeHUD();
  });

  socket.on('coffee:error', (err) => {
    showToast(`⚠️ ${err.message}`, 4000);
  });
}

/**
 * Fetch Coffee & Boss Data from REST API
 */
async function loadCoffeeData() {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const [menuRes, stateRes] = await Promise.all([
      fetch('/api/coffee/menu', { headers }),
      fetch('/api/coffee/state', { headers })
    ]);

    if (menuRes.ok) {
      const data = await menuRes.json();
      coffeeMenuData = data.coffeeMenu;
      foodMenuData = data.foodMenu;
      ammoMenuData = data.ammoMenu;
    }

    if (stateRes.ok) {
      const data = await stateRes.json();
      activeStoreState = data;
      updateAmmoBar(data.bossPearlInventory);
      if (data.bossState) {
        updateBossState(data.bossState);
      }
    }
  } catch (err) {
    console.warn('[CoffeeModule] Failed to fetch REST state:', err);
  }
}

/**
 * Update Boss State HUD & Global Header Badges
 */
function updateBossState(bossState) {
  if (coffeeRenderer) {
    coffeeRenderer.bossState = bossState;
  }

  const hpWrapper = document.getElementById('coffee-boss-hp-wrapper');
  const timerBadge = document.getElementById('coffee-boss-timer');
  const hudBadge = document.getElementById('hud-coffee-badge');
  const btnHeader = document.getElementById('btn-coffee-header');

  if (bossState.isActive && !bossState.isDefeated) {
    if (hpWrapper) hpWrapper.style.display = 'flex';
    if (timerBadge) {
      timerBadge.style.display = 'flex';
      const m = Math.floor(bossState.remainingSec / 60);
      const s = bossState.remainingSec % 60;
      timerBadge.innerHTML = `⏰ BOSS: ${m}:${s.toString().padStart(2, '0')}`;
    }
    updateBossHPBar(bossState.currentHp, bossState.maxHp, bossState.hpPercent, bossState.phase);
    updateLiveLeaderboard(bossState.leaderboard);

    // Global Header Alert (hidden while coffee feature is disabled)
    if (hudBadge) {
      hudBadge.style.display = 'none';
    }
    if (btnHeader) {
      btnHeader.style.display = 'none';
    }
  } else {
    if (hpWrapper) hpWrapper.style.display = 'none';
    if (timerBadge) {
      timerBadge.innerHTML = '⏰ Boss: 20h00 T4 & CN';
    }
    if (btnHeader) {
      btnHeader.style.display = 'none';
    }
  }

  syncBossBGM(bossState);
}

export async function checkGlobalCoffeeHUD() {
  const badge = document.getElementById('hud-coffee-badge');
  const btnHeader = document.getElementById('btn-coffee-header');
  if (badge) badge.style.display = 'none';
  if (btnHeader) btnHeader.style.display = 'none';
}

function syncBossBGM(bossState) {
  const modal = document.getElementById('modal-coffee-lounge');
  const isLoungeOpen = modal && modal.style.display !== 'none';

  if (isLoungeOpen && bossState && bossState.isActive && !bossState.isDefeated) {
    if (!isBossBgmPlaying && window.sound && window.sound.playBossBGM) {
      window.sound.playBossBGM();
      isBossBgmPlaying = true;
    }
  } else if (!bossState || !bossState.isActive || bossState.isDefeated) {
    if (isBossBgmPlaying && window.sound && window.sound.restorePreviousBGM) {
      window.sound.restorePreviousBGM();
      isBossBgmPlaying = false;
    }
  }
}

function updateBossHPBar(curHp, maxHp, percent, phase) {
  const fill = document.getElementById('coffee-boss-hp-fill');
  const text = document.getElementById('coffee-boss-hp-text');
  const phasePill = document.getElementById('coffee-boss-phase-pill');

  if (fill) fill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
  if (text) text.innerText = `${percent}% (${curHp.toLocaleString()} / ${maxHp.toLocaleString()} HP)`;
  if (phasePill) {
    const titles = {
      1: 'Phase 1: Quẩy Xúc Tu',
      2: 'Phase 2: Xúc Tu Cuồng Nộ 🔥',
      3: 'Phase 3: Bọt Biển Oolong ⚡'
    };
    phasePill.innerText = titles[phase] || `Phase ${phase}`;
  }
}

function updateRoomBadge(roomName, count, max) {
  const badge = document.getElementById('coffee-room-badge');
  if (badge) {
    badge.innerHTML = `☕ <b>${roomName}</b> (${count}/${max} Baristas)`;
  }
}

function updateAmmoBar(ammoInv) {
  if (!ammoInv) return;
  const types = ['pearl_basic', 'pearl_flame', 'pearl_golden', 'pearl_frost', 'pearl_cosmic'];
  types.forEach(t => {
    const el = document.getElementById(`ammo-qty-${t}`);
    if (el) {
      el.innerText = `x${ammoInv[t] || 0}`;
    }
  });
}

function updateLiveLeaderboard(ranks) {
  const box = document.getElementById('coffee-leaderboard-box');
  const list = document.getElementById('coffee-leaderboard-list');
  if (!box || !list) return;

  if (ranks && ranks.length > 0) {
    box.style.display = 'block';
    list.innerHTML = ranks.map((r, i) => {
      const cls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
      return `<div class="coffee-rank-item ${cls}">
        <span>#${r.rank}. ${r.playerName}</span>
        <span><b>${r.totalDamage.toLocaleString()}</b> DMG</span>
      </div>`;
    }).join('');
  } else {
    box.style.display = 'none';
  }
}

/**
 * Setup Controls for Shooting & Emotes & Chat
 */
function setupCombatControls() {
  const canvas = document.getElementById('coffee-stage-canvas');

  // Click on Canvas to shoot pearl at boss or interact with scenery
  if (canvas) {
    canvas.addEventListener('click', (e) => {
      if (!coffeeRenderer) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = coffeeRenderer.width / rect.width;
      const scaleY = coffeeRenderer.height / rect.height;
      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      // 1. Quầy Espresso Bar Chị Thảo (Click to order drinks)
      if (clickX >= 320 && clickX <= 640 && clickY <= 170) {
        openDrinksModal();
        return;
      }

      // 2. If Boss is Active & not defeated: Click Bé Trà to get supplies or shoot Boss
      if (coffeeRenderer.bossState && coffeeRenderer.bossState.isActive && !coffeeRenderer.bossState.isDefeated) {
        const beTra = coffeeRenderer.npcs?.find(n => n.id === 'be_tra');
        if (beTra && Math.hypot(clickX - beTra.x, clickY - beTra.y) < 45) {
          interactBeTraSupply();
          return;
        }
        firePearl(clickX, clickY);
        return;
      }

      // 3. Ban Công Hoàng Hôn (Sunset Balcony)
      if (clickX >= 740 && clickY <= 260) {
        interactBalcony();
        return;
      }

      // 4. Oak Dining Tables (Sit down / Stand up)
      const tables = [
        { x: 180, y: 380 },
        { x: 480, y: 460 },
        { x: 780, y: 380 }
      ];
      for (const t of tables) {
        if (Math.hypot(clickX - t.x, clickY - t.y) < 50) {
          toggleSitAtTable(t);
          return;
        }
      }

      // 5. Walk to clicked location
      targetWalkX = Math.max(60, Math.min(900, clickX));
      targetWalkY = Math.max(220, Math.min(500, clickY));
    });
  }

  // Ammo slot selection
  const ammoSlots = document.querySelectorAll('.ammo-item-slot');
  ammoSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      ammoSlots.forEach(s => s.classList.remove('active'));
      slot.classList.add('active');
      selectedAmmoType = slot.getAttribute('data-ammo-type') || 'pearl_basic';
    });
  });

  // Chat input
  const chatInput = document.getElementById('coffee-chat-input');
  const btnSendChat = document.getElementById('btn-coffee-send-chat');

  function sendChat() {
    if (!chatInput) return;
    const msg = chatInput.value.trim();
    if (!msg) return;

    if (socket && socket.connected) {
      socket.emit('coffee:chat', { message: msg });
    } else if (coffeeRenderer) {
      coffeeRenderer.localPlayer.lastChat = msg;
      coffeeRenderer.localPlayer.lastChatTime = Date.now();
    }
    chatInput.value = '';
  }

  if (btnSendChat) btnSendChat.addEventListener('click', sendChat);
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendChat();
    });
  }

  // Emote buttons
  const emoteBtns = document.querySelectorAll('.btn-coffee-emote');
  emoteBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const emote = btn.getAttribute('data-emote') || 'wave';
      if (socket && socket.connected) {
        socket.emit('coffee:emote', { emote });
      } else if (coffeeRenderer) {
        coffeeRenderer.localPlayer.lastEmote = emote;
        coffeeRenderer.localPlayer.lastEmoteTime = Date.now();
      }
    });
  });

  // Test Boss Trigger Button (Admin / Player Testing)
  const btnTestBoss = document.getElementById('btn-coffee-test-boss');
  if (btnTestBoss) {
    btnTestBoss.addEventListener('click', async () => {
      try {
        if (socket && socket.connected) {
          socket.emit('boss:admin_trigger', { durationSec: 900 });
        } else {
          const res = await fetch('/api/coffee/boss/trigger', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ durationSec: 900 })
          });
          const data = await res.json();
          if (data.event) updateBossState(data.event);
        }
        showToast('🚀 Đã triệu hồi Quái Vật Hưng Răm (#52) xuất hiện ngay lập tức!', 4000);
      } catch (err) {
        showToast(`⚠️ Không thể triệu hồi Boss: ${err.message}`, 4000);
      }
    });
  }
}

/**
 * Fire selected Boba Pearl towards Boss
 */
function firePearl(targetX, targetY) {
  const now = Date.now();
  // Fire rate limit: 250ms cooldown (reduced if sandwich buff active)
  const cooldown = (activeStoreState?.bossFoodBuffs?.sandwich_cheese) ? 120 : 250;
  if (now - lastFireTime < cooldown) return;
  lastFireTime = now;

  // Sound pew
  if (window.sound && window.sound.bossPew) {
    const sType = selectedAmmoType === 'pearl_cosmic' ? 'cosmic' :
                  selectedAmmoType === 'pearl_golden' ? 'golden' :
                  selectedAmmoType === 'pearl_flame' ? 'flame' : 'basic';
    window.sound.bossPew(sType);
  }

  const startX = coffeeRenderer ? coffeeRenderer.localPlayer.x : 480;
  const startY = coffeeRenderer ? coffeeRenderer.localPlayer.y : 380;
  if (coffeeRenderer && coffeeRenderer.localPlayer) {
    coffeeRenderer.localPlayer.shootAnimTimer = 10;
  }

  if (socket && socket.connected) {
    socket.emit('boss:shoot', {
      pearlType: selectedAmmoType,
      targetX: targetX || 480,
      targetY: targetY || 200,
      timestamp: now
    });
  } else {
    // REST API fallback
    fetch('/api/coffee/boss/shoot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({ pearlType: selectedAmmoType })
    })
      .then(res => res.json())
      .then(res => {
        if (res.error) {
          showToast(res.error, 3000);
          return;
        }
        if (coffeeRenderer) {
          coffeeRenderer.addProjectile({
            startX,
            startY,
            targetX: 480,
            targetY: 200,
            pearlType: selectedAmmoType,
            damage: res.damage,
            isCrit: res.isCrit,
            isCosmic: res.isCosmic,
            isDeflected: res.isDeflected
          });
        }
        updateBossHPBar(res.currentHp, res.maxHp, res.hpPercent, res.phase);
        if (res.ammoInventory) updateAmmoBar(res.ammoInventory);
      })
      .catch(e => console.error(e));
  }
}

/**
 * Setup Movement Listeners (WASD + Touch to Walk)
 */
function startMovementListeners() {
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  if (moveInterval) clearInterval(moveInterval);
  moveInterval = setInterval(updatePlayerPosition, 40);

  // Touch to walk on canvas
  const canvas = document.getElementById('coffee-stage-canvas');
  if (canvas) {
    canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      // Right click to walk
      const rect = canvas.getBoundingClientRect();
      const scaleX = coffeeRenderer.width / rect.width;
      const scaleY = coffeeRenderer.height / rect.height;
      targetWalkX = (e.clientX - rect.left) * scaleX;
      targetWalkY = (e.clientY - rect.top) * scaleY;
    });
  }
}

let targetWalkX = null;
let targetWalkY = null;

function stopMovementListeners() {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  if (moveInterval) {
    clearInterval(moveInterval);
    moveInterval = null;
  }
}

function handleKeyDown(e) {
  if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
  if (e.key === 'e' || e.key === 'E') {
    handleInteractionKey();
    return;
  }
  if (keysDown.hasOwnProperty(e.key)) {
    keysDown[e.key] = true;
  }
}

function handleKeyUp(e) {
  if (keysDown.hasOwnProperty(e.key)) {
    keysDown[e.key] = false;
  }
}

function handleInteractionKey() {
  if (!coffeeRenderer || !coffeeRenderer.localPlayer) return;
  const p = coffeeRenderer.localPlayer;

  // 0. Bé Trà Tiếp Tế Đạn Trân Châu (Khi Boss đang hoạt động)
  if (coffeeRenderer.bossState && coffeeRenderer.bossState.isActive && !coffeeRenderer.bossState.isDefeated) {
    const beTra = coffeeRenderer.npcs?.find(n => n.id === 'be_tra');
    if (beTra && Math.hypot(p.x - beTra.x, p.y - beTra.y) < 65) {
      interactBeTraSupply();
      return;
    }
  }

  // 1. Quầy Bar Chị Thảo (x: 340..520, y < 270)
  if (p.x >= 340 && p.x <= 520 && p.y <= 270) {
    openDrinksModal();
    return;
  }

  // 2. Bàn Tròn Gỗ Sồi
  const tables = [
    { x: 180, y: 380 },
    { x: 480, y: 460 },
    { x: 780, y: 380 }
  ];
  for (const t of tables) {
    if (Math.hypot(p.x - t.x, p.y - t.y) < 60) {
      toggleSitAtTable(t);
      return;
    }
  }

  // 3. Ban Công Hoàng Hôn
  if (p.x >= 740 && p.y <= 270) {
    interactBalcony();
    return;
  }
}

let lastBeTraSupplyClaim = 0;

async function interactBeTraSupply() {
  const now = Date.now();
  const cd = 60000; // 60s cooldown
  const elapsed = now - lastBeTraSupplyClaim;
  if (elapsed < cd) {
    const rem = Math.ceil((cd - elapsed) / 1000);
    showToast(`⏳ Bé Trà đang chuẩn bị mẻ trân châu mới, quay lại sau ${rem}s nhé!`, 3000);
    return;
  }

  lastBeTraSupplyClaim = now;

  // Visual & Sound Feedback
  if (coffeeRenderer) {
    const beTra = coffeeRenderer.npcs?.find(n => n.id === 'be_tra');
    const bx = beTra ? beTra.x : 330;
    const by = beTra ? beTra.y : 220;
    for (let i = 0; i < 18; i++) {
      coffeeRenderer.addParticle({
        x: bx + (Math.random() - 0.5) * 40,
        y: by + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 3,
        color: '#facc15',
        size: 3,
        life: 30
      });
    }
  }

  if (window.sound && window.sound.chime) {
    window.sound.chime();
  } else if (window.sound && window.sound.waterDrop) {
    window.sound.waterDrop();
  }

  showToast('🧋 Bé Trà: "Cố lên anh/chị ơi! Em tiếp tế thêm 10 Đạn Trân Châu Đen nè!" (+10 Đạn)', 4500);

  if (socket && socket.connected) {
    socket.emit('boss:be_tra_supply');
  } else {
    try {
      const res = await fetch('/api/coffee/boss/supply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      if (data.pearlInventory) updateAmmoBar(data.pearlInventory);
    } catch (e) {
      console.warn('Failed to claim Bé Trà supply:', e);
    }
  }
}

function toggleSitAtTable(table) {
  if (!coffeeRenderer || !coffeeRenderer.localPlayer) return;
  const p = coffeeRenderer.localPlayer;
  p.sitting = !p.sitting;
  if (p.sitting && table) {
    p.x = table.x + (p.x >= table.x ? 35 : -35);
    p.y = table.y;
    p.state = 'idle';
    showToast('☕ Bạn đã ngồi vào bàn thưởng thức ly cà phê ấm nóng!', 3000);
  } else {
    showToast('🚶 Bạn đã đứng dậy.', 2000);
  }

  if (socket && socket.connected) {
    socket.emit('coffee:move', {
      x: p.x,
      y: p.y,
      state: 'idle',
      direction: p.direction,
      sitting: p.sitting
    });
  }
}

function interactBalcony() {
  showToast('🌇 Hoàng hôn buông xuống phố thị... Thưởng thức một ngụm trà sữa HeeHee thật bình yên! 📸', 4500);
  if (coffeeRenderer) {
    for (let i = 0; i < 14; i++) {
      coffeeRenderer.addParticle({
        x: 840 + (Math.random() - 0.5) * 60,
        y: 190 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        color: '#fde047',
        size: 3,
        life: 25
      });
    }
  }
  if (window.sound && window.sound.camera) {
    window.sound.camera();
  } else if (window.sound && window.sound.waterDrop) {
    window.sound.waterDrop();
  }
}

function updatePlayerPosition() {
  if (!coffeeRenderer) return;
  const p = coffeeRenderer.localPlayer;
  const speed = 7;
  let dx = 0;
  let dy = 0;

  if (keysDown.w || keysDown.ArrowUp) dy -= speed;
  if (keysDown.s || keysDown.ArrowDown) dy += speed;
  if (keysDown.a || keysDown.ArrowLeft) dx -= speed;
  if (keysDown.d || keysDown.ArrowRight) dx += speed;

  // Touch to walk interpolation
  if (targetWalkX !== null && targetWalkY !== null) {
    const diffX = targetWalkX - p.x;
    const diffY = targetWalkY - p.y;
    const dist = Math.hypot(diffX, diffY);
    if (dist > 8) {
      dx = (diffX / dist) * speed;
      dy = (diffY / dist) * speed;
    } else {
      targetWalkX = null;
      targetWalkY = null;
    }
  }

  if (dx !== 0 || dy !== 0) {
    p.sitting = false; // Stand up when walking
    p.x = Math.max(60, Math.min(900, p.x + dx));
    p.y = Math.max(220, Math.min(500, p.y + dy));
    p.state = 'walk';
    if (dx !== 0) p.direction = dx > 0 ? 1 : -1;

    // Send coordinates to socket
    if (socket && socket.connected) {
      socket.emit('coffee:move', {
        x: p.x,
        y: p.y,
        state: 'walk',
        direction: p.direction,
        sitting: p.sitting
      });
    }
  } else if (p.state === 'walk') {
    p.state = 'idle';
    if (socket && socket.connected) {
      socket.emit('coffee:move', {
        x: p.x,
        y: p.y,
        state: 'idle',
        direction: p.direction,
        sitting: p.sitting
      });
    }
  }
}

/**
 * Setup Sub-Modals (Drink Coffee, Buy Ammo, Buy Food, View Leaderboard)
 */
function setupSubmodalControls() {
  const btnDrinks = document.getElementById('btn-open-coffee-drinks');
  const btnAmmo = document.getElementById('btn-open-coffee-ammo');
  const btnFood = document.getElementById('btn-open-coffee-food');
  const btnLeaderboard = document.getElementById('btn-open-coffee-leaderboard');

  if (btnDrinks) btnDrinks.addEventListener('click', openDrinksModal);
  if (btnAmmo) btnAmmo.addEventListener('click', openAmmoModal);
  if (btnFood) btnFood.addEventListener('click', openFoodModal);
  if (btnLeaderboard) btnLeaderboard.addEventListener('click', openLeaderboardModal);

  // Close buttons for submodals
  document.querySelectorAll('.coffee-submodal-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.coffee-submodal').forEach(m => m.style.display = 'none');
    });
  });
}

function openDrinksModal() {
  const modal = document.getElementById('submodal-coffee-drinks');
  const grid = document.getElementById('coffee-drinks-grid');
  if (!modal || !grid) return;

  const drinks = coffeeMenuData || [];
  grid.innerHTML = drinks.map(d => `
    <div class="coffee-card-item">
      <div>
        <div class="coffee-card-title">${d.icon} ${d.name}</div>
        <div class="coffee-card-buff">🎁 Buff: ${d.buffName}</div>
        <div class="coffee-card-desc">${d.buffDesc}</div>
      </div>
      <div class="coffee-card-bottom">
        <div class="coffee-card-price">${d.currency === 'teacoin' ? `${d.price} 🍵 TeaCoin` : `${d.price.toLocaleString()}đ`}</div>
        <button class="btn-coffee-buy" onclick="window.orderCoffee('${d.id}')">Thưởng Thức</button>
      </div>
    </div>
  `).join('');

  modal.style.display = 'flex';
}

function openAmmoModal() {
  const modal = document.getElementById('submodal-coffee-ammo');
  const grid = document.getElementById('coffee-ammo-grid');
  if (!modal || !grid) return;

  const ammo = ammoMenuData || [];
  grid.innerHTML = ammo.map(a => `
    <div class="coffee-card-item">
      <div>
        <div class="coffee-card-title">${a.icon} ${a.name}</div>
        <div class="coffee-card-desc">${a.desc}</div>
      </div>
      <div class="coffee-card-bottom">
        <div class="coffee-card-price">${a.currency === 'teacoin' ? `${a.price} 🍵 TeaCoin` : `${a.price.toLocaleString()}đ`} / ${a.quantity}v</div>
        <button class="btn-coffee-buy" onclick="window.buyBobaAmmo('${a.id}')">Nạp Đạn</button>
      </div>
    </div>
  `).join('');

  modal.style.display = 'flex';
}

function openFoodModal() {
  const modal = document.getElementById('submodal-coffee-food');
  const grid = document.getElementById('coffee-food-grid');
  if (!modal || !grid) return;

  const foods = foodMenuData || [];
  grid.innerHTML = foods.map(f => `
    <div class="coffee-card-item">
      <div>
        <div class="coffee-card-title">${f.icon} ${f.name}</div>
        <div class="coffee-card-desc">${f.desc} (${f.durationMin} phút)</div>
      </div>
      <div class="coffee-card-bottom">
        <div class="coffee-card-price">${f.currency === 'teacoin' ? `${f.price} 🍵 TeaCoin` : `${f.price.toLocaleString()}đ`}</div>
        <button class="btn-coffee-buy" onclick="window.buyCombatFood('${f.id}')">Tiếp Sức</button>
      </div>
    </div>
  `).join('');

  modal.style.display = 'flex';
}

function openLeaderboardModal() {
  const modal = document.getElementById('submodal-coffee-leaderboard');
  const content = document.getElementById('coffee-leaderboard-full-list');
  if (!modal || !content) return;

  const bossState = coffeeRenderer ? coffeeRenderer.bossState : null;
  const ranks = bossState?.leaderboard || [];

  if (ranks.length === 0) {
    content.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 20px;">Chưa có sát thương nào được ghi nhận. Hãy nã trân châu vào Boss!</div>';
  } else {
    content.innerHTML = ranks.map(r => `
      <div style="display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #451a03; align-items: center;">
        <span style="font-weight: 700; color: #fde047;">#${r.rank} - ${r.playerName}</span>
        <span style="color: #38bdf8; font-weight: 800;">${r.totalDamage.toLocaleString()} DMG (${r.pearlsShot} phát bắn)</span>
      </div>
    `).join('');
  }

  modal.style.display = 'flex';
}

function openRewardsModal(data) {
  const modal = document.getElementById('submodal-coffee-rewards');
  const body = document.getElementById('coffee-rewards-body');
  if (!modal || !body) return;

  const isDefeated = data.bossDefeated;
  const ranks = data.finalRanks || [];

  body.innerHTML = `
    <div style="text-align: center; margin-bottom: 16px;">
      <div style="font-size: 2.2rem;">${isDefeated ? '🎉🏆' : '⏰⌛'}</div>
      <div style="font-size: 1.2rem; font-weight: 800; color: ${isDefeated ? '#facc15' : '#fb923c'}; margin-top: 4px;">
        ${isDefeated ? 'ĐÃ TIÊU DIỆT QUÁI VẬT HƯNG RĂM (#52)!' : 'HẾT GIỜ CHIẾN ĐẤU - BOSS RÚT LUI!'}
      </div>
      <div style="font-size: 0.8rem; color: #cbd5e1; margin-top: 4px;">Phần thưởng TeaCoin, Danh hiệu & Tiền mặt đã được tự động chuyển vào Ví của Quán!</div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${ranks.map(r => `
        <div style="background: rgba(45, 20, 48, 0.8); border: 1.5px solid #d97706; border-radius: 8px; padding: 10px;">
          <div style="display: flex; justify-content: space-between; font-weight: 800; color: #fde047;">
            <span>Hạng #${r.rank}: ${r.playerName}</span>
            <span style="color: #00cec9;">+${r.teacoin} 🍵 TeaCoin</span>
          </div>
          <div style="font-size: 0.76rem; color: #e2e8f0; margin-top: 4px;">
            🎖️ Danh hiệu: <b>${r.title}</b> | 💰 Tiền: <b>+${r.money.toLocaleString()}đ</b>
          </div>
          <div style="font-size: 0.74rem; color: #a855f7; margin-top: 2px;">🎁 Vật phẩm: ${r.specialItem}</div>
        </div>
      `).join('')}
    </div>
  `;

  modal.style.display = 'flex';
}

// Global helper bridges for HTML buttons
window.orderCoffee = async function(coffeeId) {
  try {
    if (socket && socket.connected) {
      socket.emit('coffee:drink', { coffeeId });
    } else {
      const res = await fetch('/api/coffee/drink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ coffeeId })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (window.sound && window.sound.coffeeDrink) window.sound.coffeeDrink();
      if (coffeeRenderer && coffeeRenderer.localPlayer) {
        coffeeRenderer.localPlayer.drinkAnimTimer = 75;
        coffeeRenderer.localPlayer.coffeeSteam = true;
      }
      showToast(`✨ ${data.message}`, 5000);
      loadCoffeeData();
    }
    document.querySelectorAll('.coffee-submodal').forEach(m => m.style.display = 'none');
  } catch (err) {
    showToast(`⚠️ ${err.message}`, 4000);
  }
};

window.buyBobaAmmo = async function(pearlType) {
  try {
    const res = await fetch('/api/coffee/buy-ammo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({ pearlType, packs: 1 })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    showToast(`🧋 ${data.message}`, 4000);
    if (data.pearlInventory) updateAmmoBar(data.pearlInventory);
    loadCoffeeData();
  } catch (err) {
    showToast(`⚠️ ${err.message}`, 4000);
  }
};

window.buyCombatFood = async function(foodId) {
  try {
    if (socket && socket.connected) {
      socket.emit('boss:eat_food', { foodId });
    } else {
      const res = await fetch('/api/coffee/buy-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ foodId })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      showToast(`🥐 ${data.message}`, 4000);
      loadCoffeeData();
    }
    document.querySelectorAll('.coffee-submodal').forEach(m => m.style.display = 'none');
  } catch (err) {
    showToast(`⚠️ ${err.message}`, 4000);
  }
};

