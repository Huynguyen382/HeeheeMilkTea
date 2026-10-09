/**
 * Live Sync Client Manager
 * Connects to Server-Sent Events (SSE) `/api/game/live-stream`
 * and runs periodic lightweight polling `/api/game/heartbeat` with `since` timestamp.
 * Receives instant admin events without requiring manual browser page reload:
 * - Admin triggers festival/event -> Instant buff bar update, toast, sound effect
 * - Admin changes weather / lightning -> Instant weather badge & canvas sky change & thunder
 * - Admin summons specific NPC -> Instant customer arrival at counter
 * - Admin updates stats/inventory/recipes/upgrades -> Instant UI re-render
 */

import { state } from './state.js';
import { updateUI, updateBuffsUI } from './ui.js';
import { updateWeatherUI } from './weather.js';
import { insertCustomOrderIntoQueue } from './order-manager.js';
import { showToast } from './toast.js';

let sseSource = null;
let heartbeatInterval = null;
let lastSyncTimestamp = Date.now();
let isConnecting = false;

/**
 * Handle incoming live event payload
 * @param {string} eventType 
 * @param {object} data 
 */
export function handleLiveEvent(eventType, data) {
  if (!data) return;

  console.log(`[LiveSync] Received event: ${eventType}`, data);

  switch (eventType) {
    case 'event_triggered': {
      const evt = data.event;
      if (evt) {
        if (!state.storeState) state.storeState = {};
        if (!state.storeState.save) state.storeState.save = {};
        if (!state.storeState.save.active_buffs) state.storeState.save.active_buffs = {};

        const expiresAt = data.expiresAt || (Date.now() + (evt.durationSec ? evt.durationSec * 1000 : 90000));
        state.storeState.save.active_buffs.current_event = {
          id: evt.id,
          name: evt.name,
          icon: evt.icon,
          effects: evt.effects,
          started_at: Date.now(),
          expires_at: expiresAt
        };

        updateBuffsUI(state.storeState.save.active_buffs);
        updateUI();

        if (window.sound && window.sound.bell) window.sound.bell();
        showToast(data.message || `📢 Sự kiện mới: ${evt.name}!`, 5000);
      }
      break;
    }

    case 'weather_changed': {
      const weather = data.weather;
      if (weather) {
        if (!state.storeState) state.storeState = {};
        state.storeState.weather = weather;
        updateWeatherUI(weather);

        if (weather.isStorm || weather.id === 'stormy') {
          if (window.sound && typeof window.sound.thunder === 'function') {
            window.sound.thunder();
          }
          if (state.canvas && typeof state.canvas.triggerLightning === 'function') {
            state.canvas.triggerLightning();
          }
        }

        showToast(data.message || `🌤️ Thời tiết đã đổi thành: [${weather.icon} ${weather.name}]!`, 4000);
      }
      break;
    }

    case 'npc_spawned': {
      const order = data.order;
      const cust = data.customer;
      if (order) {
        insertCustomOrderIntoQueue(order);
        if (window.sound && window.sound.bell) window.sound.bell();
        showToast(data.message || `🎉 Khách mời đặc biệt [${cust ? cust.name : 'Khách'}] vừa ghé tiệm!`, 4500);
      }
      break;
    }

    case 'state_updated': {
      if (data.state) {
        state.storeState = data.state;
        updateUI();
        if (state.storeState.weather) {
          updateWeatherUI(state.storeState.weather);
        }
        if (data.message) {
          showToast(data.message, 3500);
        }
      }
      break;
    }

    case 'sabotaged': {
      // Immediate impact when another store uses a Sabotage Card against this store!
      if (!state.storeState) state.storeState = {};
      if (!state.storeState.save) state.storeState.save = {};
      if (data.buffs) {
        state.storeState.save.active_buffs = data.buffs;
      }
      updateBuffsUI(state.storeState.save.active_buffs);
      updateUI();

      // Trigger siren sound and alarm floating text
      if (window.sound && typeof window.sound.siren === 'function') {
        window.sound.siren();
      }

      const isMarket = data.sabotageType === 'market_inspection';
      if (state.canvas && state.canvas.floatingTexts) {
        state.canvas.floatingTexts.push({
          text: isMarket ? '🚨 QUẢN LÝ THỊ TRƯỜNG NIÊM PHONG!' : '📉 BỊ BÓC PHỐT TRIỆU VIEW!',
          x: 45,
          y: 70,
          alpha: 1.0,
          color: '#ff5555'
        });
      }

      showToast(`⚠️ [${data.title}]: ${data.message} (Thực hiện bởi: ${data.attackerName || 'Đối thủ'})`, 8000);
      break;
    }

    default:
      console.log(`[LiveSync] Unhandled event type: ${eventType}`, data);
      break;
  }
}

/**
 * Initialize SSE Connection
 */
function connectSSE() {
  if (sseSource || isConnecting) return;
  const token = localStorage.getItem('heehee_token') || localStorage.getItem('token');
  if (!token) return;

  isConnecting = true;

  try {
    // SSE with token parameter if needed or cookies/headers
    // In browser EventSource doesn't support custom headers easily, so we use fallback query or fallback polling
    const sseUrl = `/api/game/live-stream?token=${encodeURIComponent(token)}`;
    sseSource = new EventSource(sseUrl);

    sseSource.addEventListener('connected', (e) => {
      console.log('[LiveSync] SSE Connected to server!');
      isConnecting = false;
    });

    sseSource.addEventListener('event_triggered', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleLiveEvent('event_triggered', data);
      } catch (err) {}
    });

    sseSource.addEventListener('weather_changed', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleLiveEvent('weather_changed', data);
      } catch (err) {}
    });

    sseSource.addEventListener('npc_spawned', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleLiveEvent('npc_spawned', data);
      } catch (err) {}
    });

    sseSource.addEventListener('state_updated', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleLiveEvent('state_updated', data);
      } catch (err) {}
    });

    sseSource.addEventListener('sabotaged', (e) => {
      try {
        const data = JSON.parse(e.data);
        handleLiveEvent('sabotaged', data);
      } catch (err) {}
    });

    sseSource.onerror = (err) => {
      console.warn('[LiveSync] SSE connection interrupted, will retry. Polling fallback active.', err);
      if (sseSource) {
        sseSource.close();
        sseSource = null;
      }
      isConnecting = false;
    };
  } catch (err) {
    console.warn('[LiveSync] Failed to initialize SSE, relying on polling heartbeat:', err);
    isConnecting = false;
  }
}

/**
 * Fast polling heartbeat fallback (checks every 2.5 seconds)
 */
async function pollHeartbeat() {
  if (!state.storeState) return;

  try {
    const res = await window.API.heartbeat(lastSyncTimestamp);
    if (res && res.success) {
      if (res.timestamp) {
        lastSyncTimestamp = res.timestamp;
      }
      if (Array.isArray(res.events) && res.events.length > 0) {
        for (const evt of res.events) {
          handleLiveEvent(evt.type, evt.payload);
        }
      }
    }
  } catch (err) {
    // Silent fail for network blips
  }
}

/**
 * Start Live Sync Subsystem
 */
export function initLiveSync() {
  console.log('[LiveSync] Starting real-time admin sync subsystem...');
  lastSyncTimestamp = Date.now() - 5000;

  // 1. Try initial SSE connection
  connectSSE();

  // 2. Continuous 2.5-second heartbeat poll for ultra-reliable instant delivery
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = setInterval(pollHeartbeat, 2500);

  // 3. Reconnect SSE if tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pollHeartbeat();
      if (!sseSource) connectSSE();
    }
  });
}

