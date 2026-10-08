/**
 * HeeHee Admin Dashboard Controller
 * Full-featured Game State & Store Management System
 */

const AdminApp = (() => {
  // Application State
  const state = {
    token: localStorage.getItem('heehee_admin_token') || '',
    stores: [],
    orders: [],
    logs: [],
    events: [],
    npcs: [],
    currentEditStore: null,
    currentDetail: null,
    refreshInterval: null,
    ingredientsList: [
      { id: 'tra_den', name: 'Trà Đen Tân Cương', cat: 'tea' },
      { id: 'tra_thai_xanh', name: 'Trà Thái Xanh', cat: 'tea' },
      { id: 'sua_tuoi', name: 'Sữa Tươi Thanh Trùng', cat: 'tea' },
      { id: 'tra_lai', name: 'Lục Trà Lài', cat: 'tea' },
      { id: 'tra_olong', name: 'Trà Ô Long Nướng', cat: 'tea' },
      { id: 'tranchau_den', name: 'Trân Châu Đen Dẻo', cat: 'topping' },
      { id: 'thach_la_dua', name: 'Thạch Lá Dứa Tươi', cat: 'topping' },
      { id: 'tranchau_duongden', name: 'Sốt Đường Đen Hàn Quốc', cat: 'topping' },
      { id: 'dao_mieng', name: 'Đào Miếng Giòn Ngọt', cat: 'topping' },
      { id: 'cam_vang', name: 'Cam Vàng Mỹ Cắt Lát', cat: 'topping' },
      { id: 'sa_tuoi', name: 'Sả Tươi Đập Dập', cat: 'topping' },
      { id: 'suong_sao', name: 'Sương Sáo Thảo Mộc', cat: 'topping' },
      { id: 'cups', name: 'Ly Cốc Mang Đi', cat: 'item' }
    ]
  };

  // Toast notification helper
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // HTTP Request Helper
  async function apiRequest(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'x-admin-key': state.token,
      ...(options.headers || {})
    };

    try {
      const res = await fetch(endpoint, { credentials: 'omit', ...options, headers });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          showAuthOverlay(true);
        }
        throw new Error(data.error || data.message || 'Lỗi yêu cầu máy chủ!');
      }
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // Format currency
  function formatMoney(num) {
    if (num === null || num === undefined) return '0đ';
    return Number(num).toLocaleString('vi-VN') + 'đ';
  }

  // Format date time
  function formatDateTime(str) {
    if (!str) return '—';
    try {
      const d = new Date(str);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString('vi-VN');
    } catch (e) {
      return str;
    }
  }

  // Auth Overlay Visibility
  function showAuthOverlay(visible) {
    const overlay = document.getElementById('auth-overlay');
    overlay.style.display = visible ? 'flex' : 'none';
  }

  // Initialize
  function init() {
    setupEventListeners();
    if (state.token) {
      verifyAndLoad();
    } else {
      showAuthOverlay(true);
    }
  }

  // Verify Admin Token & Initial Load
  async function verifyAndLoad() {
    try {
      await apiRequest('/api/admin/verify');
      showAuthOverlay(false);
      showToast('Đã xác thực quyền Quản Trị Viên thành công!', 'success');
      loadAllData();
      startAutoRefresh();
    } catch (err) {
      showAuthOverlay(true);
    }
  }

  // Auto Refresh Every 15s
  function startAutoRefresh() {
    if (state.refreshInterval) clearInterval(state.refreshInterval);
    state.refreshInterval = setInterval(() => {
      loadAllData(true);
    }, 15000);
  }

  // Load All System Data
  async function loadAllData(silent = false) {
    try {
      await Promise.all([
        loadSystemOverview(),
        loadStores(),
        loadOrders(),
        loadLogs(),
        loadEvents(),
        loadNPCs()
      ]);
      if (!silent) {
        showToast('Dữ liệu đã được làm mới!', 'info');
      }
    } catch (err) {
      if (!silent) showToast(err.message, 'error');
    }
  }

  // 1. SYSTEM OVERVIEW & METRICS
  async function loadSystemOverview() {
    try {
      const data = await apiRequest('/api/admin/system/overview');
      document.getElementById('kpi-total-stores').textContent = data.totalStores;
      document.getElementById('kpi-total-money').textContent = formatMoney(data.totalMoney);
      document.getElementById('kpi-total-debt').textContent = formatMoney(data.totalDebt);
      document.getElementById('kpi-active-orders').textContent = data.activeOrders;
      document.getElementById('kpi-today-earned').textContent = formatMoney(data.todayEarned);
      document.getElementById('kpi-today-orders').textContent = `${data.todayOrdersServed} đơn hoàn thành`;
      document.getElementById('kpi-ram-usage').textContent = `${data.memory.heapUsedMB} MB / ${data.memory.rssMB} MB RSS`;
      
      const cbText = `Circuit Breaker: ${data.circuitBreaker.state || 'CLOSED'}`;
      document.getElementById('kpi-circuit-breaker').textContent = cbText;

      document.getElementById('badge-total-stores').textContent = data.totalStores;
      document.getElementById('badge-active-orders').textContent = data.activeOrders;
      document.getElementById('sidebar-db-type').textContent = data.database;
      document.getElementById('sidebar-uptime').textContent = `${Math.floor(data.uptimeSeconds / 60)} phút`;

      // Update System Info Table
      const osEl = document.getElementById('sys-info-os');
      if (osEl) osEl.textContent = 'Node.js Runtime (' + (process?.platform || 'Live') + ')';
      const dbEl = document.getElementById('sys-info-db');
      if (dbEl) dbEl.textContent = data.database;
      const uptimeEl = document.getElementById('sys-info-uptime');
      if (uptimeEl) uptimeEl.textContent = `${data.uptimeSeconds} giây (${(data.uptimeSeconds / 3600).toFixed(1)} giờ)`;
      const sysCbEl = document.getElementById('sys-info-cb');
      if (sysCbEl) sysCbEl.textContent = data.circuitBreaker.state || 'CLOSED';
    } catch (err) {
      console.error('Error loading overview:', err);
    }
  }

  // 2. STORES LIST & MANAGEMENT
  async function loadStores() {
    try {
      const search = document.getElementById('stores-search-input')?.value || '';
      const filter = document.getElementById('stores-filter-select')?.value || 'all';

      const data = await apiRequest(`/api/admin/stores?search=${encodeURIComponent(search)}`);
      state.stores = data.stores || [];

      // Update Store Select Dropdowns
      updateStoreDropdowns(state.stores);

      // Filter
      let list = [...state.stores];
      if (filter === 'jailed') list = list.filter(s => s.is_jailed === 1);
      if (filter === 'active_orders') list = list.filter(s => s.active_orders_count > 0);
      if (filter === 'chapter_1') list = list.filter(s => (s.chapter || 1) === 1);
      if (filter === 'chapter_2') list = list.filter(s => (s.chapter || 1) === 2);
      if (filter === 'chapter_3') list = list.filter(s => (s.chapter || 1) === 3);

      renderStoresTable(list);
      renderDashboardTopStores(state.stores);
    } catch (err) {
      console.error('Error loading stores:', err);
    }
  }

  function updateStoreDropdowns(stores) {
    const bulkSelect = document.getElementById('bulk-inv-store-select');
    const spawnSelect = document.getElementById('spawn-store-select');
    const eventStoreSelect = document.getElementById('event-target-store-select');
    const weatherStoreSelect = document.getElementById('weather-store-select');

    const optionsHtml = '<option value="">-- Chọn cửa hàng --</option>' + 
      stores.map(s => `<option value="${s.id}">[#${s.id}] ${s.store_name} (${s.store_code})</option>`).join('');

    if (bulkSelect) bulkSelect.innerHTML = optionsHtml;
    if (spawnSelect) spawnSelect.innerHTML = optionsHtml;
    if (weatherStoreSelect) weatherStoreSelect.innerHTML = optionsHtml;
    if (eventStoreSelect) {
      eventStoreSelect.innerHTML = '<option value="all">📢 Toàn Bộ Máy Chủ (Tất cả quán cùng diễn ra)</option>' +
        stores.map(s => `<option value="${s.id}">[#${s.id}] ${s.store_name} (${s.store_code})</option>`).join('');
    }
  }

  function renderStoresTable(stores) {
    const tbody = document.getElementById('stores-list-tbody');
    if (!tbody) return;

    if (!stores.length) {
      tbody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 24px; color: var(--text-muted);">Không tìm thấy cửa hàng nào phù hợp.</td></tr>';
      return;
    }

    tbody.innerHTML = stores.map(s => {
      const isJailed = s.is_jailed === 1;
      const statusBadge = isJailed 
        ? `<span class="badge badge-danger">🔒 Bị Tù</span>` 
        : (s.rest_until_ts > Date.now() 
            ? `<span class="badge badge-warning">💤 Kiệt Sức</span>` 
            : `<span class="badge badge-success">🟢 Bình Thường</span>`);

      const orderBadge = s.active_orders_count > 0 
        ? `<span class="badge badge-warning">${s.active_orders_count} đơn</span>`
        : `<span style="color: var(--text-muted);">0</span>`;

      return `
        <tr>
          <td><strong>#${s.id}</strong></td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(s.store_name)}</div>
            <small style="color: var(--text-muted);">User: ${escapeHtml(s.username || 'Chơi nhanh')}</small>
          </td>
          <td><code>${s.store_code}</code></td>
          <td>Chương ${s.chapter || 1} • Ngày ${s.day_in_game || 1}</td>
          <td style="color: #34d399; font-weight: 600;">${formatMoney(s.money)}</td>
          <td style="color: #f87171;">${formatMoney(s.debt_remaining)}</td>
          <td style="color: #fbbf24;">🪙 ${s.teacoin || 0}</td>
          <td>⭐ ${parseFloat(s.reputation || 5.0).toFixed(1)}</td>
          <td>${orderBadge}</td>
          <td>${statusBadge}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button class="btn btn-primary btn-xs" onclick="AdminApp.openStoreEditor(${s.id})">
                🛠️ Chỉnh Sửa
              </button>
              <button class="btn btn-secondary btn-xs" onclick="AdminApp.quickActionWithStore(${s.id}, 'add_money', 10000000)" title="+10tr Tiền">
                +10Tr
              </button>
              <button class="btn btn-danger btn-xs" onclick="AdminApp.deleteStoreQuick(${s.id}, '${escapeHtml(s.store_name)}')" title="Xóa tiệm">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderDashboardTopStores(stores) {
    // Top rich
    const sortedRich = [...stores].sort((a, b) => Number(b.money) - Number(a.money)).slice(0, 5);
    const richTbody = document.getElementById('top-rich-tbody');
    if (richTbody) {
      richTbody.innerHTML = sortedRich.map(s => `
        <tr>
          <td><strong>${escapeHtml(s.store_name)}</strong></td>
          <td>Chương ${s.chapter || 1}</td>
          <td style="color: #34d399; font-weight: 600;">${formatMoney(s.money)}</td>
          <td style="color: #f87171;">${formatMoney(s.debt_remaining)}</td>
          <td>
            <button class="btn btn-secondary btn-xs" onclick="AdminApp.openStoreEditor(${s.id})">Chỉnh sửa</button>
          </td>
        </tr>
      `).join('');
    }

    // Top debt
    const sortedDebt = [...stores].sort((a, b) => Number(b.debt_remaining) - Number(a.debt_remaining)).slice(0, 5);
    const debtTbody = document.getElementById('top-debt-tbody');
    if (debtTbody) {
      debtTbody.innerHTML = sortedDebt.map(s => `
        <tr>
          <td><strong>${escapeHtml(s.store_name)}</strong></td>
          <td><code>${s.store_code}</code></td>
          <td style="color: #f87171; font-weight: 600;">${formatMoney(s.debt_remaining)}</td>
          <td>⭐ ${parseFloat(s.reputation || 5.0).toFixed(1)}</td>
          <td>
            <button class="btn btn-info btn-xs" onclick="AdminApp.quickActionWithStore(${s.id}, 'clear_debt')">Xóa nợ</button>
          </td>
        </tr>
      `).join('');
    }
  }

  // 3. ORDERS MANAGEMENT
  async function loadOrders() {
    try {
      const data = await apiRequest('/api/admin/orders');
      state.orders = data.orders || [];
      renderOrdersTable(state.orders);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  }

  function renderOrdersTable(orders) {
    const tbody = document.getElementById('orders-list-tbody');
    if (!tbody) return;

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">Hiện tại không có đơn hàng nào đang đợi xử lý.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(o => {
      let toppingsArr = [];
      try { toppingsArr = JSON.parse(o.toppings || '[]'); } catch (e) {}

      const timeLeftSec = Math.max(0, Math.floor((Number(o.expires_at) - Date.now()) / 1000));
      const timeBadge = timeLeftSec > 0 
        ? `<span class="badge badge-warning">⏳ Còn ${timeLeftSec}s</span>`
        : `<span class="badge badge-danger">Đã Hết Giờ</span>`;

      return `
        <tr>
          <td><code>${o.id.substring(0, 8)}...</code></td>
          <td>
            <strong>${escapeHtml(o.store_name)}</strong><br>
            <small style="color: var(--text-muted);">${o.store_code}</small>
          </td>
          <td>
            <strong>${escapeHtml(o.customer_name)}</strong>
          </td>
          <td><span class="badge badge-info">${o.recipe_id}</span></td>
          <td>
            Đường: ${o.sugar} • Đá: ${o.ice}<br>
            <small style="color: var(--text-muted);">Toppings: ${toppingsArr.length ? toppingsArr.join(', ') : 'Không'}</small>
          </td>
          <td style="color: #34d399; font-weight: 600;">${formatMoney(o.price)}</td>
          <td>${timeBadge}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button class="btn btn-success btn-xs" onclick="AdminApp.forceCompleteOrder('${o.id}')" title="Cưỡng chế hoàn thành & cộng tiền">
                ✅ Hoàn Thành
              </button>
              <button class="btn btn-danger btn-xs" onclick="AdminApp.cancelOrder('${o.id}')" title="Hủy đơn">
                ❌ Hủy
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // 4. AUDIT LOGS
  async function loadLogs() {
    try {
      const data = await apiRequest('/api/admin/logs');
      state.logs = data.logs || [];
      renderLogsTable(state.logs);
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  }

  function renderLogsTable(logs) {
    const tbody = document.getElementById('logs-list-tbody');
    if (!tbody) return;

    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">Chưa có nhật ký ghi nhận.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let detailFormatted = l.detail;
      try {
        const obj = JSON.parse(l.detail);
        detailFormatted = JSON.stringify(obj, null, 2);
      } catch (e) {}

      return `
        <tr>
          <td>#${l.id}</td>
          <td>${l.store_name ? `<strong>${escapeHtml(l.store_name)}</strong> (#${l.store_id})` : '<span style="color: var(--text-muted);">Hệ thống</span>'}</td>
          <td><span class="badge badge-purple">${escapeHtml(l.event_type)}</span></td>
          <td>
            <pre style="font-family: monospace; font-size: 11px; max-width: 450px; overflow-x: auto; white-space: pre-wrap; margin: 0; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">${escapeHtml(detailFormatted)}</pre>
          </td>
          <td style="color: var(--text-muted); font-size: 12px;">${formatDateTime(l.logged_at)}</td>
        </tr>
      `;
    }).join('');
  }

  // 4b. EVENTS SYSTEM
  async function loadEvents() {
    try {
      const data = await apiRequest('/api/admin/events');
      state.events = data.events || [];
      renderEventsGrid(state.events);
    } catch (err) {
      console.error('Error loading events:', err);
    }
  }

  function renderEventsGrid(events) {
    const grid = document.getElementById('events-cards-grid');
    if (!grid) return;

    grid.innerHTML = events.map(ev => `
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--admin-border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
        <div>
          <div style="font-size: 16px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span>${ev.icon}</span> <span>${escapeHtml(ev.name)}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); line-height: 1.5;">${escapeHtml(ev.desc)}</div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
          <span style="font-size: 11px; color: #fbbf24; font-weight: 600;">⏱️ Thời lượng: ${ev.durationSec}s</span>
          <button class="btn btn-warning btn-xs" onclick="AdminApp.triggerEventQuick('${ev.id}')">
            ⚡ Kích Hoạt Nhanh
          </button>
        </div>
      </div>
    `).join('');
  }

  async function triggerSelectedEvent() {
    const storeId = document.getElementById('event-target-store-select')?.value || 'all';
    const eventId = document.getElementById('event-select-trigger')?.value;
    if (!eventId) return;

    try {
      const res = await apiRequest('/api/admin/events/trigger', {
        method: 'POST',
        body: JSON.stringify({ storeId, eventId })
      });
      showToast(res.message, 'success');
      loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function triggerEventQuick(eventId) {
    const storeId = document.getElementById('event-target-store-select')?.value || 'all';
    try {
      const res = await apiRequest('/api/admin/events/trigger', {
        method: 'POST',
        body: JSON.stringify({ storeId, eventId })
      });
      showToast(res.message, 'success');
      loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // 4c. NPCS DIRECTORY (55 CHARACTERS)
  async function loadNPCs() {
    try {
      const data = await apiRequest('/api/admin/npcs');
      state.npcs = data.npcs || [];
      renderNPCsTable(state.npcs);
    } catch (err) {
      console.error('Error loading npcs:', err);
    }
  }

  function renderNPCsTable(npcs) {
    const tbody = document.getElementById('npcs-list-tbody');
    if (!tbody) return;

    const search = (document.getElementById('npcs-search-input')?.value || '').toLowerCase().trim();
    let list = npcs || [];
    if (search) {
      list = list.filter(n => n.name.toLowerCase().includes(search) || (n.fav && n.fav.some(f => f.toLowerCase().includes(search))));
    }

    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">Không tìm thấy NPC nào phù hợp.</td></tr>';
      return;
    }

    tbody.innerHTML = list.map(n => {
      let catBadge = `<span class="badge badge-info">Khách Thường</span>`;
      if (n.isVIP) catBadge = `<span class="badge badge-warning">💎 Khách VIP</span>`;
      else if (n.isTiktoker) catBadge = `<span class="badge badge-purple">📱 TikToker / Idol</span>`;
      else if (n.isShipper) catBadge = `<span class="badge badge-success">🛵 Shipper Ăn Vặt</span>`;

      const dialogue = (n.dialogues && n.dialogues.length) ? n.dialogues[0] : '...';

      return `
        <tr>
          <td><strong>#${n.id}</strong></td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(n.name)}</div>
          </td>
          <td>${catBadge}</td>
          <td><code>${(n.fav || []).join(', ')}</code></td>
          <td>⏳ ${Math.round(n.patience / 1000)}s</td>
          <td style="color: #34d399; font-weight: 600;">x${n.tipMult}</td>
          <td style="font-size: 12px; color: var(--text-muted); max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(dialogue)}">
            "${escapeHtml(dialogue)}"
          </td>
          <td style="text-align: right;">
            <button class="btn btn-primary btn-xs" onclick="AdminApp.spawnSpecificNPC(${n.id}, '${escapeHtml(n.name)}')">
              ⚡ Triệu Hồi
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  async function spawnSpecificNPC(npcId, npcName) {
    if (!state.stores.length) {
      return showToast('Chưa có cửa hàng nào trên máy chủ để triệu hồi!', 'error');
    }

    // Prompt user to pick a store or use the first active store
    const storeOptions = state.stores.map((s, idx) => `${idx + 1}. [#${s.id}] ${s.store_name}`).join('\n');
    const pick = prompt(`Triệu hồi [${npcName}] đến tiệm nào?\nNhập số thứ tự tiệm (1 đến ${state.stores.length}):\n${storeOptions}`, "1");
    if (!pick) return;

    const pickIdx = parseInt(pick, 10) - 1;
    const targetStore = state.stores[pickIdx];
    if (!targetStore) {
      return showToast('Lựa chọn không hợp lệ!', 'error');
    }

    try {
      const res = await apiRequest('/api/admin/npcs/spawn', {
        method: 'POST',
        body: JSON.stringify({ storeId: targetStore.id, npcId })
      });
      showToast(res.message, 'success');
      loadOrders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // 5. STORE DETAIL EDITOR MODAL
  async function openStoreEditor(storeId) {
    try {
      const data = await apiRequest(`/api/admin/stores/${storeId}`);
      state.currentEditStore = data.store;
      state.currentDetail = data;

      document.getElementById('edit-store-id').value = storeId;
      document.getElementById('editor-store-name-display').textContent = `${data.store.store_name} (#${storeId})`;

      // Subtab 1: Stats
      const save = data.save || {};
      document.getElementById('edit-stat-money').value = save.money || 0;
      document.getElementById('edit-stat-debt').value = save.debt_remaining || 0;
      document.getElementById('edit-stat-teacoin').value = save.teacoin || 0;
      document.getElementById('edit-stat-reputation').value = save.reputation || 5.0;
      document.getElementById('edit-stat-chapter').value = save.chapter || 1;
      document.getElementById('edit-stat-day').value = save.day_in_game || 1;
      document.getElementById('edit-stat-is-jailed').value = save.is_jailed ? '1' : '0';
      document.getElementById('edit-stat-jail-reason').value = save.jail_reason || '';

      // Subtab 2: Inventory
      renderEditorInventory(save.inventory || {});

      // Subtab 3: Upgrades & Pets
      const upg = save.upgrades || {};
      document.getElementById('edit-upg-may-dap-nap').value = upg.may_dap_nap ? '1' : '0';
      document.getElementById('edit-upg-binh-u-lon').value = upg.binh_u_lon ? '1' : '0';
      document.getElementById('edit-upg-xe-wave').value = upg.xe_wave ? '1' : '0';
      
      let talismanCount = 0;
      if (typeof upg.bua_an_than === 'object' && upg.bua_an_than !== null) {
        talismanCount = upg.bua_an_than.count || 0;
      } else if (upg.bua_an_than) {
        talismanCount = Number(upg.bua_an_than) || 1;
      }
      document.getElementById('edit-upg-bua-an-than').value = talismanCount;

      // Pets
      const pets = upg.pets || {};
      document.getElementById('edit-upg-pet-corgi').value = pets.corgi ? (pets.corgi.stolen ? 'stolen' : 'active') : (upg.pet_corgi ? 'active' : 'none');
      document.getElementById('edit-upg-pet-meo').value = pets.meo_tam_the ? (pets.meo_tam_the.stolen ? 'stolen' : 'active') : (upg.pet_meo_tam_the ? 'active' : 'none');
      document.getElementById('edit-upg-pet-capybara').value = pets.capybara ? (pets.capybara.stolen ? 'stolen' : 'active') : (upg.pet_capybara ? 'active' : 'none');

      // Special Items
      document.getElementById('edit-upg-loa-keo-keo').value = upg.loa_keo_keo ? '1' : '0';
      document.getElementById('edit-upg-tui-muoi').value = upg.tui_muoi_phong_thuy ? '1' : '0';
      document.getElementById('edit-upg-may-lac').value = upg.may_lac_sieu_toc ? '1' : '0';
      document.getElementById('edit-upg-ve-vang').value = typeof upg.ve_vang_vip === 'number' ? upg.ve_vang_vip : (upg.ve_vang_vip ? 1 : 0);
      document.getElementById('edit-upg-bien-led').value = upg.bien_led_neon ? '1' : '0';

      // Subtab 4: Recipes & Custom Prices
      renderEditorRecipes(save.recipes || [], save.custom_prices || {}, data.staticDb.recipes);

      // Subtab 5: Properties
      const props = save.properties || {};
      document.getElementById('edit-prop-ngoi_nha').value = props.ngoi_nha ? '1' : '0';
      document.getElementById('edit-prop-vuon_trai').value = props.vuon_trai ? '1' : '0';
      document.getElementById('edit-prop-chung_cu').value = props.chung_cu ? '1' : '0';
      document.getElementById('edit-prop-shop_mini').value = props.shop_mini ? '1' : '0';

      // Subtab 6: Account
      document.getElementById('edit-acc-store-name').value = data.store.store_name;
      document.getElementById('edit-acc-username').value = data.store.username || '';
      document.getElementById('edit-acc-password').value = '';

      // Open Modal
      document.getElementById('modal-store-editor').classList.add('open');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function closeStoreEditor() {
    document.getElementById('modal-store-editor').classList.remove('open');
    state.currentEditStore = null;
    state.currentDetail = null;
  }

  function renderEditorInventory(inv) {
    const grid = document.getElementById('editor-inventory-grid');
    if (!grid) return;

    grid.innerHTML = state.ingredientsList.map(item => {
      const val = inv[item.id] !== undefined ? inv[item.id] : 0;
      return `
        <div class="form-group">
          <label>${item.name} (<code>${item.id}</code>)</label>
          <input type="number" class="input-control edit-inv-input" data-id="${item.id}" value="${val}" min="0">
        </div>
      `;
    }).join('');
  }

  function fillEditorInv(val) {
    document.querySelectorAll('.edit-inv-input').forEach(input => {
      input.value = val;
    });
  }

  function renderEditorRecipes(unlockedRecipes, customPrices, recipesDb) {
    const checkContainer = document.getElementById('editor-recipes-checkboxes');
    const pricesGrid = document.getElementById('editor-custom-prices-grid');

    const recipeIds = Object.keys(recipesDb || {
      tra_sua_truyen_thong: { name: 'Trà Sữa Truyền Thống', basePrice: 32000 },
      hong_tra_tac: { name: 'Hồng Trà Tắc Xí Muội', basePrice: 25000 },
      tra_thai_xanh: { name: 'Trà Sữa Thái Xanh', basePrice: 35000 },
      sua_tuoi_duong_den: { name: 'Sữa Tươi Trân Châu Đường Đen', basePrice: 42000 },
      tra_dao_cam_sa: { name: 'Trà Đào Cam Sả', basePrice: 48000 },
      tra_olong_nuong: { name: 'Trà Ô Long Nướng Sương Sáo', basePrice: 45000 }
    });

    if (checkContainer) {
      checkContainer.innerHTML = recipeIds.map(rid => {
        const item = recipesDb[rid] || { name: rid };
        const isChecked = unlockedRecipes.includes(rid);
        return `
          <label style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--admin-border); cursor: pointer;">
            <input type="checkbox" class="edit-recipe-checkbox" value="${rid}" ${isChecked ? 'checked' : ''}>
            <span>${item.name}</span>
          </label>
        `;
      }).join('');
    }

    if (pricesGrid) {
      pricesGrid.innerHTML = recipeIds.map(rid => {
        const item = recipesDb[rid] || { name: rid, basePrice: 20000 };
        const priceVal = customPrices[rid] || item.basePrice || 20000;
        return `
          <div class="form-group">
            <label>${item.name} (Gốc: ${formatMoney(item.basePrice)})</label>
            <input type="number" class="input-control edit-custom-price-input" data-id="${rid}" value="${priceVal}" min="0">
          </div>
        `;
      }).join('');
    }
  }

  // Quick Action execution
  async function quickAction(action, amount) {
    const storeId = document.getElementById('edit-store-id')?.value;
    if (!storeId) return;
    await quickActionWithStore(storeId, action, amount);
    // Reload editor
    openStoreEditor(storeId);
  }

  async function quickActionWithStore(storeId, action, amount) {
    try {
      const res = await apiRequest(`/api/admin/stores/${storeId}/quick-action`, {
        method: 'POST',
        body: JSON.stringify({ action, amount })
      });
      showToast(res.message, 'success');
      loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Force Complete Order
  async function forceCompleteOrder(orderId) {
    if (!confirm(`Bạn có chắc muốn cưỡng chế hoàn thành đơn hàng #${orderId} và cộng tiền cho quán không?`)) return;
    try {
      const res = await apiRequest('/api/admin/orders/force-complete', {
        method: 'POST',
        body: JSON.stringify({ orderId })
      });
      showToast(res.message, 'success');
      loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Cancel Order
  async function cancelOrder(orderId) {
    if (!confirm(`Bạn có chắc muốn hủy đơn hàng #${orderId} không?`)) return;
    try {
      const res = await apiRequest(`/api/admin/orders/${orderId}`, {
        method: 'DELETE'
      });
      showToast(res.message, 'success');
      loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Clear Audit Logs
  async function clearAuditLogs() {
    if (!confirm('Bạn có chắc muốn xóa sạch toàn bộ lịch sử Audit Logs không?')) return;
    try {
      const res = await apiRequest('/api/admin/logs', { method: 'DELETE' });
      showToast(res.message, 'success');
      loadLogs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Flush Memory Cache
  async function flushCache() {
    try {
      const res = await apiRequest('/api/admin/system/flush-cache', { method: 'POST' });
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Clear Rate Limit
  async function clearRateLimit() {
    try {
      const res = await apiRequest('/api/admin/system/clear-ratelimit', { method: 'POST' });
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Reset Circuit Breaker
  async function resetCircuitBreaker() {
    try {
      const res = await apiRequest('/api/admin/system/reset-circuit-breaker', { method: 'POST' });
      showToast(res.message, 'success');
      loadSystemOverview();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Reset Current Store
  async function resetCurrentStoreSave() {
    const storeId = document.getElementById('edit-store-id')?.value;
    if (!storeId) return;
    if (!confirm('CẢNH BÁO: Thao tác này sẽ đưa tiệm về Chương 1, Ngày 1, Vốn 200k và 3Tr nợ. Bạn có chắc không?')) return;
    try {
      const res = await apiRequest(`/api/admin/stores/${storeId}/reset`, { method: 'POST' });
      showToast(res.message, 'success');
      openStoreEditor(storeId);
      loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Delete Current Store
  async function deleteCurrentStore() {
    const storeId = document.getElementById('edit-store-id')?.value;
    if (!storeId) return;
    if (!confirm('CẢNH BÁO NGUY HIỂM: Thao tác này sẽ XÓA VĨNH VIỄN cửa hàng và toàn bộ dữ liệu liên quan! Bạn có chắc không?')) return;
    try {
      const res = await apiRequest(`/api/admin/stores/${storeId}`, { method: 'DELETE' });
      showToast(res.message, 'success');
      closeStoreEditor();
      loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function deleteStoreQuick(storeId, storeName) {
    if (!confirm(`Bạn có chắc muốn XÓA VĨNH VIỄN tiệm [${storeName}] (#${storeId}) không?`)) return;
    try {
      const res = await apiRequest(`/api/admin/stores/${storeId}`, { method: 'DELETE' });
      showToast(res.message, 'success');
      loadAllData(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Modals Open/Close
  function openCreateStoreModal() {
    document.getElementById('modal-create-store').classList.add('open');
  }
  function closeCreateStoreModal() {
    document.getElementById('modal-create-store').classList.remove('open');
  }

  function openSpawnOrderModal() {
    document.getElementById('modal-spawn-order').classList.add('open');
  }
  function closeSpawnOrderModal() {
    document.getElementById('modal-spawn-order').classList.remove('open');
  }

  // Bulk Inv Inputs Helper
  function fillBulkInvInputs(val) {
    state.ingredientsList.forEach(item => {
      const input = document.getElementById(`bulk-inv-${item.id}`);
      if (input) input.value = val;
    });
  }

  // Helper Escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Setup UI Event Listeners
  function setupEventListeners() {
    // Admin Login Form
    document.getElementById('admin-login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('admin-username-input')?.value.trim() || 'admin';
      const password = document.getElementById('admin-password-input').value.trim();
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Tài khoản hoặc mật khẩu quản trị viên không chính xác!');
        }
        state.token = data.token;
        localStorage.setItem('heehee_admin_token', state.token);
        showToast('Đăng nhập quản trị thành công!', 'success');
        showAuthOverlay(false);
        loadAllData();
        startAutoRefresh();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Logout
    document.getElementById('btn-admin-logout')?.addEventListener('click', () => {
      if (confirm('Bạn có muốn đăng xuất khỏi trang quản trị?')) {
        localStorage.removeItem('heehee_admin_token');
        state.token = '';
        if (state.refreshInterval) clearInterval(state.refreshInterval);
        showAuthOverlay(true);
      }
    });

    // Refresh All Button
    document.getElementById('btn-refresh-all')?.addEventListener('click', () => {
      loadAllData(false);
    });

    // Navigation Tabs
    document.querySelectorAll('.nav-menu .nav-item').forEach(item => {
      item.addEventListener('click', () => {
        document.querySelectorAll('.nav-menu .nav-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');

        const tabId = item.dataset.tab;
        document.querySelectorAll('.tab-pane').forEach(pane => {
          pane.style.display = 'none';
          pane.classList.remove('active');
        });

        const activePane = document.getElementById(tabId);
        if (activePane) {
          activePane.style.display = 'block';
          activePane.classList.add('active');
        }

        // Update Title
        const titleMap = {
          'tab-dashboard': '📊 Tổng Quan Hệ Thống',
          'tab-stores': '🏪 Quản Lý Người Chơi & Cửa Hàng',
          'tab-orders': '📋 Đơn Hàng Đang Hoạt Động',
          'tab-events': '🎪 Quản Lý Sự Kiện & Lễ Hội Trong Game',
          'tab-npcs': '🎭 Danh Mục 55 Khách Hàng NPC',
          'tab-bulk-inv': '📦 Bơm Kho Nguyên Liệu Hàng Loạt',
          'tab-logs': '🛡️ Nhật Ký & Chống Hack (Audit Logs)',
          'tab-system': '⚙️ Công Cụ Hệ Thống & Máy Chủ'
        };
        document.getElementById('page-title-display').textContent = titleMap[tabId] || 'Trang Quản Trị';
      });
    });

    // Subtabs inside Store Detail Modal
    document.querySelectorAll('.subtabs .subtab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.subtabs .subtab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const subtabId = btn.dataset.subtab;
        document.querySelectorAll('.subtab-pane').forEach(p => p.classList.remove('active'));
        const activeSubPane = document.getElementById(subtabId);
        if (activeSubPane) activeSubPane.classList.add('active');
      });
    });

    // Search and Filter Stores
    let searchDebounce;
    document.getElementById('stores-search-input')?.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(loadStores, 300);
    });
    document.getElementById('stores-filter-select')?.addEventListener('change', loadStores);

    // Search NPCs
    let npcSearchDebounce;
    document.getElementById('npcs-search-input')?.addEventListener('input', () => {
      clearTimeout(npcSearchDebounce);
      npcSearchDebounce = setTimeout(() => renderNPCsTable(state.npcs), 250);
    });

    // Form: Edit Stats
    document.getElementById('form-edit-stats')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const storeId = document.getElementById('edit-store-id').value;
      const body = {
        money: document.getElementById('edit-stat-money').value,
        debt_remaining: document.getElementById('edit-stat-debt').value,
        teacoin: document.getElementById('edit-stat-teacoin').value,
        reputation: document.getElementById('edit-stat-reputation').value,
        chapter: document.getElementById('edit-stat-chapter').value,
        day_in_game: document.getElementById('edit-stat-day').value,
        is_jailed: document.getElementById('edit-stat-is-jailed').value === '1',
        jail_reason: document.getElementById('edit-stat-jail-reason').value
      };

      try {
        const res = await apiRequest(`/api/admin/stores/${storeId}/stats`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        showToast(res.message, 'success');
        loadAllData(true);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Form: Edit Inventory
    document.getElementById('form-edit-inventory')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const storeId = document.getElementById('edit-store-id').value;
      const inventory = {};
      document.querySelectorAll('.edit-inv-input').forEach(input => {
        inventory[input.dataset.id] = parseInt(input.value, 10) || 0;
      });

      try {
        const res = await apiRequest(`/api/admin/stores/${storeId}/inventory`, {
          method: 'PUT',
          body: JSON.stringify({ inventory })
        });
        showToast(res.message, 'success');
        loadAllData(true);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Form: Edit Upgrades & Pets
    document.getElementById('form-edit-upgrades')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const storeId = document.getElementById('edit-store-id').value;
      const mayDapNap = document.getElementById('edit-upg-may-dap-nap').value === '1';
      const binhULon = document.getElementById('edit-upg-binh-u-lon').value === '1';
      const xeWave = document.getElementById('edit-upg-xe-wave').value === '1';
      const talismanCount = parseInt(document.getElementById('edit-upg-bua-an-than').value, 10) || 0;

      const corgiVal = document.getElementById('edit-upg-pet-corgi').value;
      const meoVal = document.getElementById('edit-upg-pet-meo').value;
      const capyVal = document.getElementById('edit-upg-pet-capybara').value;

      const loaKeoKeo = document.getElementById('edit-upg-loa-keo-keo').value === '1';
      const tuiMuoi = document.getElementById('edit-upg-tui-muoi').value === '1';
      const mayLac = document.getElementById('edit-upg-may-lac').value === '1';
      const veVang = parseInt(document.getElementById('edit-upg-ve-vang').value, 10) || 0;
      const bienLed = document.getElementById('edit-upg-bien-led').value === '1';

      const upgrades = {
        may_dap_nap: mayDapNap,
        binh_u_lon: binhULon,
        xe_wave: xeWave,
        bua_an_than: { count: Math.min(3, Math.max(0, talismanCount)) },
        loa_keo_keo: loaKeoKeo,
        tui_muoi_phong_thuy: tuiMuoi,
        may_lac_sieu_toc: mayLac,
        ve_vang_vip: veVang,
        bien_led_neon: bienLed,
        pet_corgi: corgiVal !== 'none',
        pet_meo_tam_the: meoVal !== 'none',
        pet_capybara: capyVal !== 'none',
        pets: {
          corgi: corgiVal !== 'none' ? { active: corgiVal === 'active', stolen: corgiVal === 'stolen' } : null,
          meo_tam_the: meoVal !== 'none' ? { active: meoVal === 'active', stolen: meoVal === 'stolen' } : null,
          capybara: capyVal !== 'none' ? { active: capyVal === 'active', stolen: capyVal === 'stolen' } : null
        }
      };

      try {
        const res = await apiRequest(`/api/admin/stores/${storeId}/upgrades`, {
          method: 'PUT',
          body: JSON.stringify({ upgrades })
        });
        showToast(res.message, 'success');
        loadAllData(true);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Form: Edit Recipes & Custom Prices
    document.getElementById('form-edit-recipes')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const storeId = document.getElementById('edit-store-id').value;
      const recipes = [];
      document.querySelectorAll('.edit-recipe-checkbox:checked').forEach(cb => {
        recipes.push(cb.value);
      });

      const customPrices = {};
      document.querySelectorAll('.edit-custom-price-input').forEach(input => {
        customPrices[input.dataset.id] = parseInt(input.value, 10) || 0;
      });

      try {
        const [res1, res2] = await Promise.all([
          apiRequest(`/api/admin/stores/${storeId}/recipes`, {
            method: 'PUT',
            body: JSON.stringify({ recipes })
          }),
          apiRequest(`/api/admin/stores/${storeId}/custom-prices`, {
            method: 'PUT',
            body: JSON.stringify({ customPrices })
          })
        ]);
        showToast('Đã lưu Menu công thức và bảng giá bán tùy chỉnh!', 'success');
        loadAllData(true);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Form: Edit Properties
    document.getElementById('form-edit-properties')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const storeId = document.getElementById('edit-store-id').value;
      const properties = {
        que: {
          ngoi_nha: document.getElementById('edit-prop-ngoi_nha').value === '1',
          vuon_trai: document.getElementById('edit-prop-vuon_trai').value === '1'
        },
        pho: {
          chung_cu: document.getElementById('edit-prop-chung_cu').value === '1',
          shop_mini: document.getElementById('edit-prop-shop_mini').value === '1'
        }
      };

      try {
        const res = await apiRequest(`/api/admin/stores/${storeId}/properties`, {
          method: 'PUT',
          body: JSON.stringify({ properties })
        });
        showToast(res.message, 'success');
        loadAllData(true);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Form: Edit Account
    document.getElementById('form-edit-account')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const storeId = document.getElementById('edit-store-id').value;
      const body = {
        store_name: document.getElementById('edit-acc-store-name').value,
        username: document.getElementById('edit-acc-username').value,
        password: document.getElementById('edit-acc-password').value
      };

      try {
        const res = await apiRequest(`/api/admin/stores/${storeId}/account`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
        showToast(res.message, 'success');
        loadAllData(true);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Form: Bulk Inventory
    document.getElementById('bulk-inventory-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const storeId = document.getElementById('bulk-inv-store-select').value;
      if (!storeId) {
        return showToast('Vui lòng chọn cửa hàng cần cấp nguyên liệu!', 'error');
      }

      const inventory = {};
      state.ingredientsList.forEach(item => {
        const input = document.getElementById(`bulk-inv-${item.id}`);
        if (input) inventory[item.id] = parseInt(input.value, 10) || 0;
      });

      try {
        const res = await apiRequest(`/api/admin/stores/${storeId}/inventory`, {
          method: 'PUT',
          body: JSON.stringify({ inventory })
        });
        showToast(`Đã bơm kho thành công cho quán #${storeId}!`, 'success');
        loadAllData(true);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Form: Create Store
    document.getElementById('form-create-store')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = {
        store_name: document.getElementById('create-store-name').value,
        username: document.getElementById('create-username').value,
        password: document.getElementById('create-password').value,
        money: document.getElementById('create-money').value,
        chapter: document.getElementById('create-chapter').value
      };

      try {
        const res = await apiRequest('/api/admin/stores/create', {
          method: 'POST',
          body: JSON.stringify(body)
        });
        showToast(res.message, 'success');
        closeCreateStoreModal();
        e.target.reset();
        loadAllData(true);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });

    // Form: Spawn Order
    document.getElementById('form-spawn-order')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const storeId = document.getElementById('spawn-store-select').value;
      const type = document.getElementById('spawn-order-type').value;

      try {
        const res = await apiRequest('/api/admin/orders/spawn', {
          method: 'POST',
          body: JSON.stringify({ storeId, type })
        });
        showToast(res.message, 'success');
        closeSpawnOrderModal();
        loadOrders();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // --- WEATHER MANAGEMENT ---
  function toggleWeatherScopeUI() {
    const scope = document.getElementById('weather-target-scope')?.value;
    const group = document.getElementById('weather-store-select-group');
    if (group) {
      group.style.display = (scope === 'single') ? 'block' : 'none';
    }
  }

  async function applySelectedWeather() {
    const scope = document.getElementById('weather-target-scope')?.value;
    const storeId = document.getElementById('weather-store-select')?.value;
    const radio = document.querySelector('input[name="admin-weather-type"]:checked');
    const weatherId = radio ? radio.value : 'sunny';

    if (scope === 'single' && !storeId) {
      return showToast('Vui lòng chọn một cửa hàng cụ thể!', 'error');
    }

    try {
      const res = await apiRequest('/api/admin/weather/change', {
        method: 'POST',
        body: JSON.stringify({
          weatherId,
          storeId: scope === 'single' ? Number(storeId) : undefined,
          broadcast: scope === 'broadcast'
        })
      });
      showToast(res.message || 'Đã áp dụng thời tiết thành công!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function forceTriggerStorm() {
    const stormyRadio = document.querySelector('input[name="admin-weather-type"][value="stormy"]');
    if (stormyRadio) stormyRadio.checked = true;

    try {
      const res = await apiRequest('/api/admin/weather/change', {
        method: 'POST',
        body: JSON.stringify({
          weatherId: 'stormy',
          broadcast: true
        })
      });
      showToast('⚡ ' + (res.message || 'Đã kích hoạt giông bão sấm sét trên toàn bộ hệ thống!'), 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  // Public Interface
  return {
    init,
    openStoreEditor,
    closeStoreEditor,
    openCreateStoreModal,
    closeCreateStoreModal,
    openSpawnOrderModal,
    closeSpawnOrderModal,
    quickAction,
    quickActionWithStore,
    forceCompleteOrder,
    cancelOrder,
    clearAuditLogs,
    flushCache,
    clearRateLimit,
    resetCircuitBreaker,
    resetCurrentStoreSave,
    deleteCurrentStore,
    deleteStoreQuick,
    fillBulkInvInputs,
    fillEditorInv,
    triggerSelectedEvent,
    triggerEventQuick,
    spawnSpecificNPC,
    toggleWeatherScopeUI,
    applySelectedWeather,
    forceTriggerStorm
  };
})();

// Bootstrap
document.addEventListener('DOMContentLoaded', AdminApp.init);

