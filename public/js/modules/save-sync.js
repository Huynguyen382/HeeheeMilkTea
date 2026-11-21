/**
 * Save & Sync Manager (Local-First, Delta Tracking, Debounced Sync)
 * 
 * Responsibilities:
 * - Local-First persistence in localStorage (fast UI updates, zero lost data).
 * - Tracks dirty fields (inventory, customPrices, dailyQuests, decorations, farmData).
 * - Debounces and batches saves to at most once every 30-45 seconds.
 * - Guarantees data sync on tab hide (visibilitychange) and close (beforeunload with keepalive).
 */

import { state } from './state.js';

const CACHE_KEY_PREFIX = 'hyhy_cached_state_';
const SYNC_DEBOUNCE_MS = 30000; // 30 seconds debounce
const PERIODIC_SYNC_MS = 60000; // 60 seconds periodic sync check

let dirtyFields = {};
let pendingServedOrders = [];
let syncTimeout = null;
let periodicInterval = null;
let isSyncing = false;

/**
 * Get active storage key for current store
 */
function getStorageKey() {
  const storeId = state.storeState?.store_id || state.storeState?.save?.store_id || 'default';
  return `${CACHE_KEY_PREFIX}${storeId}`;
}

/**
 * Save current state to localStorage (Local-First)
 */
export function saveLocalGameState() {
  if (!state.storeState) return;
  try {
    const key = getStorageKey();
    const serialized = JSON.stringify({
      storeState: state.storeState,
      savedAt: Date.now()
    });
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn('[SaveSync] LocalStorage write failed (quota exceeded?):', err);
  }
}

/**
 * Load cached state from localStorage on startup
 */
export function loadLocalGameState() {
  try {
    const key = getStorageKey();
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.storeState) {
      console.log('[SaveSync] Loaded cached state from localStorage (savedAt:', new Date(parsed.savedAt).toLocaleTimeString(), ')');
      return parsed.storeState;
    }
  } catch (err) {
    console.warn('[SaveSync] Failed to parse cached local state:', err);
  }
  return null;
}

/**
 * Cleanly patch local state and update localStorage without making server API calls
 * @param {object} updates 
 */
export function patchLocalSave(updates) {
  if (!state.storeState) state.storeState = {};
  if (!state.storeState.save) state.storeState.save = {};
  const save = state.storeState.save;

  for (const [key, val] of Object.entries(updates)) {
    if (val === undefined || val === null) continue;
    if (typeof val === 'object' && !Array.isArray(val) && typeof save[key] === 'object' && !Array.isArray(save[key])) {
      save[key] = { ...save[key], ...val };
    } else {
      save[key] = val;
    }
  }

  saveLocalGameState();
}

/**
 * Mark a specific state field as dirty for batching and debounced sync
 * @param {string} fieldName - e.g. 'inventory', 'customPrices', 'dailyQuests', 'decorations', 'farmData'
 * @param {any} value - updated field value
 */
export function markDirty(fieldName, value) {
  dirtyFields[fieldName] = value;
  patchLocalSave({ [fieldName]: value });
  scheduleDebouncedSync();
}

/**
 * Queue a completed drink order for batched settlement
 * @param {object} orderData
 */
export function queueServedOrder(orderData) {
  pendingServedOrders.push(orderData);
  // Auto-flush when batch hits 6 orders or debounce 20s
  if (pendingServedOrders.length >= 6) {
    flushSync();
  } else {
    scheduleDebouncedSync(20000);
  }
}

/**
 * Schedule a debounced flush of all pending dirty fields and orders
 */
export function scheduleDebouncedSync(delay = SYNC_DEBOUNCE_MS) {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    flushSync();
  }, delay);
}

/**
 * Flush all dirty changes and served orders to the server
 * @param {object} options
 * @param {boolean} [options.keepalive=false] - For beforeunload/visibilitychange
 */
export async function flushSync({ keepalive = false } = {}) {
  const fieldsToSync = { ...dirtyFields };
  const ordersToSync = [...pendingServedOrders];
  const keys = Object.keys(fieldsToSync);
  if (keys.length === 0 && ordersToSync.length === 0) return;

  if (isSyncing && !keepalive) {
    // Already in flight; reschedule after current finishes
    scheduleDebouncedSync(10000);
    return;
  }

  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }

  // Clear in-memory queues so mutations during in-flight request can accumulate
  for (const k of keys) {
    delete dirtyFields[k];
  }
  pendingServedOrders = [];

  const token = localStorage.getItem('hyhy_session_token') || (window.API && window.API.token);
  if (!token) return;

  if (keepalive) {
    // Modern browser keepalive fetch during tab unload
    if (ordersToSync.length > 0) {
      try {
        fetch('/api/game/serve-batch', {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            'x-session-token': token
          },
          body: JSON.stringify({ orders: ordersToSync })
        });
        console.log('[SaveSync] Sent keepalive served orders batch:', ordersToSync.length);
      } catch (err) {
        console.warn('[SaveSync] Keepalive batch serve failed:', err);
      }
    }
    if (keys.length > 0) {
      try {
        fetch('/api/store/sync', {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            'x-session-token': token
          },
          body: JSON.stringify(fieldsToSync)
        });
        console.log('[SaveSync] Sent keepalive state sync on unload:', keys);
      } catch (err) {
        console.warn('[SaveSync] Keepalive state sync failed:', err);
      }
    }
    return;
  }

  isSyncing = true;
  try {
    // 1. Sync Batched Orders
    if (ordersToSync.length > 0 && window.API && typeof window.API.serveBatchOrders === 'function') {
      const orderRes = await window.API.serveBatchOrders(ordersToSync);
      if (orderRes && orderRes.success) {
        console.log('[SaveSync] Batched served orders settled:', ordersToSync.length, orderRes);
        if (state.storeState && state.storeState.save) {
          const updates = {};
          if (typeof orderRes.newMoney === 'number') updates.money = orderRes.newMoney;
          if (typeof orderRes.reputation === 'number') updates.reputation = orderRes.reputation;
          if (orderRes.inventory) updates.inventory = orderRes.inventory;
          patchLocalSave(updates);
        }
        if (state.storeState && state.storeState.daily_stats) {
          if (typeof orderRes.dailyEarned === 'number') state.storeState.daily_stats.earned_today = orderRes.dailyEarned;
          if (typeof orderRes.ordersServed === 'number') state.storeState.daily_stats.orders_served = orderRes.ordersServed;
        }
      } else {
        // Re-queue failed orders
        pendingServedOrders.unshift(...ordersToSync);
        scheduleDebouncedSync(15000);
      }
    }

    // 2. Sync Dirty Fields
    if (keys.length > 0 && window.API && typeof window.API.syncState === 'function') {
      const res = await window.API.syncState(fieldsToSync);
      if (res && res.success) {
        console.log('[SaveSync] Batched state sync completed successfully:', keys);
        if (res.state && state.storeState && res.state.save) {
          patchLocalSave(res.state.save);
        }
      } else {
        for (const [k, v] of Object.entries(fieldsToSync)) {
          if (!dirtyFields[k]) dirtyFields[k] = v;
        }
        scheduleDebouncedSync(15000);
      }
    }
  } catch (err) {
    console.warn('[SaveSync] Network error during sync, re-queueing:', err);
    pendingServedOrders.unshift(...ordersToSync);
    for (const [k, v] of Object.entries(fieldsToSync)) {
      if (!dirtyFields[k]) dirtyFields[k] = v;
    }
    scheduleDebouncedSync(20000);
  } finally {
    isSyncing = false;
  }
}

/**
 * Initialize Save & Sync lifecycle listeners
 */
export function initSaveSync() {
  console.log('[SaveSync] Initializing local-first save & debounced sync manager...');

  // 1. Periodic background sync check (60s)
  if (periodicInterval) clearInterval(periodicInterval);
  periodicInterval = setInterval(() => {
    if (document.visibilityState === 'visible' && Object.keys(dirtyFields).length > 0) {
      flushSync();
    }
  }, PERIODIC_SYNC_MS);

  // 2. Sync on tab hide
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushSync({ keepalive: true });
    } else {
      // Re-check periodic timer when coming back
      saveLocalGameState();
    }
  });

  // 3. Sync on page unload
  window.addEventListener('beforeunload', () => {
    flushSync({ keepalive: true });
  });

  // Expose on window for modules/debugging
  if (typeof window !== 'undefined') {
    window.saveSync = {
      markDirty,
      flushSync,
      patchLocalSave,
      saveLocalGameState,
      loadLocalGameState,
      queueServedOrder
    };
  }
}
