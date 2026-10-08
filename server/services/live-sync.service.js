/**
 * Real-time Live Event Hub
 * Allows server (Admin actions, weather changes, NPC spawns, quick edits)
 * to push immediate events to connected player clients via Server-Sent Events (SSE)
 * or instant polling sync.
 */

// Map of storeId -> Set of express res streams
const sseClients = new Map();

// In-memory queue of pending events for stores (for polling fallback / quick pickup)
// storeId -> Array of events { id, type, payload, timestamp }
const pendingEvents = new Map();

// Global broadcast queue (for events that target all stores)
let globalEvents = [];

/**
 * Register an SSE connection for a store
 */
function registerSSE(storeId, res) {
  const sid = Number(storeId);
  if (!sseClients.has(sid)) {
    sseClients.set(sid, new Set());
  }
  sseClients.get(sid).add(res);

  // Send initial ping
  res.write(`event: connected\ndata: ${JSON.stringify({ storeId: sid, time: Date.now() })}\n\n`);

  // Send any pending events immediately upon connect
  const pending = pendingEvents.get(sid) || [];
  if (pending.length > 0) {
    for (const evt of pending) {
      res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt.payload)}\n\n`);
    }
    pendingEvents.set(sid, []);
  }

  // Handle client disconnect
  res.on('close', () => {
    const clients = sseClients.get(sid);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseClients.delete(sid);
      }
    }
  });
}

/**
 * Push an event to a specific store
 * @param {number|string} storeId
 * @param {string} type - e.g. 'event_triggered', 'weather_changed', 'npc_spawned', 'state_updated'
 * @param {object} payload
 */
function pushToStore(storeId, type, payload = {}) {
  const sid = Number(storeId);
  const eventData = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    type,
    payload,
    timestamp: Date.now()
  };

  // 1. Deliver to active SSE streams if available
  const clients = sseClients.get(sid);
  if (clients && clients.size > 0) {
    const sseMessage = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const res of clients) {
      try {
        res.write(sseMessage);
      } catch (e) {
        clients.delete(res);
      }
    }
  }

  // 2. Also keep in pending queue for poll retrieval (fallback / backup)
  if (!pendingEvents.has(sid)) {
    pendingEvents.set(sid, []);
  }
  const q = pendingEvents.get(sid);
  q.push(eventData);
  // Keep only last 20 events
  if (q.length > 20) {
    q.shift();
  }
}

/**
 * Broadcast an event to all connected stores and queue for all future polls
 * @param {string} type
 * @param {object} payload
 */
function broadcast(type, payload = {}) {
  const eventData = {
    id: 'global_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    type,
    payload,
    timestamp: Date.now()
  };

  // 1. Send to all active SSE clients
  const sseMessage = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [sid, clients] of sseClients.entries()) {
    for (const res of clients) {
      try {
        res.write(sseMessage);
      } catch (e) {
        clients.delete(res);
      }
    }
  }

  // 2. Add to globalEvents ring buffer (last 30)
  globalEvents.push(eventData);
  if (globalEvents.length > 30) {
    globalEvents.shift();
  }
}

/**
 * Pull pending events for a store (used by polling fallback)
 * @param {number|string} storeId
 * @param {number} sinceTimestamp
 */
function pullEvents(storeId, sinceTimestamp = 0) {
  const sid = Number(storeId);
  const results = [];

  // Store-specific events
  const storeQueue = pendingEvents.get(sid) || [];
  for (const evt of storeQueue) {
    if (evt.timestamp > sinceTimestamp) {
      results.push(evt);
    }
  }

  // Global events
  for (const evt of globalEvents) {
    if (evt.timestamp > sinceTimestamp) {
      results.push(evt);
    }
  }

  // Sort by timestamp
  results.sort((a, b) => a.timestamp - b.timestamp);
  return results;
}

module.exports = {
  registerSSE,
  pushToStore,
  broadcast,
  pullEvents
};

