// API Client with Session & Token Management
const API = {
  token: localStorage.getItem('hyhy_session_token') || null,

  async request(endpoint, method = 'GET', body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['x-session-token'] = this.token;
    }

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const res = await fetch('/api' + endpoint, config);
      const data = await res.json();
      if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
        this.token = null;
        localStorage.removeItem('hyhy_session_token');
      }
      return data;
    } catch (err) {
      console.error('API Error:', err);
      return { error: 'Không thể kết nối đến máy chủ Tiệm Trà Sữa HeeHee!' };
    }
  },

  async authRegister(username, password, storeName) {
    const res = await this.request('/auth/register', 'POST', { username, password, store_name: storeName });
    if (res && res.session_token) {
      this.token = res.session_token;
      localStorage.setItem('hyhy_session_token', this.token);
    }
    return res;
  },

  async authLogin(account, password) {
    const res = await this.request('/auth/login', 'POST', { account, password });
    if (res && res.session_token) {
      this.token = res.session_token;
      localStorage.setItem('hyhy_session_token', this.token);
    }
    return res;
  },

  async authLogout() {
    const res = await this.request('/auth/logout', 'POST');
    this.token = null;
    localStorage.removeItem('hyhy_session_token');
    return res;
  },

  async getMe() {
    return await this.request('/auth/me');
  },

  async login(storeName, storeCode) {
    const res = await this.request('/store/login', 'POST', { store_name: storeName, store_code: storeCode });
    if (res && res.session_token) {
      this.token = res.session_token;
      localStorage.setItem('hyhy_session_token', this.token);
    }
    return res;
  },

  async getState() {
    return await this.request('/store/state');
  },

  async getOrder() {
    return await this.request('/game/order');
  },

  async serveOrder(orderId, timeTaken, recipeId, sugar, ice, toppings = [], pausedTimeMs = 0) {
    return await this.request('/game/serve', 'POST', {
      orderId,
      timeTaken,
      recipeId,
      sugar,
      ice,
      toppings,
      pausedTimeMs
    });
  },

  async snackDecision(accept) {
    return await this.request('/game/snack-decision', 'POST', { accept });
  },

  async reportOrderFail(orderId, isTiktoker = false) {
    return await this.request('/game/order-fail', 'POST', { orderId, isTiktoker });
  },

  async collab(friendCode) {
    return await this.request('/game/collab', 'POST', { friendCode });
  },

  async getCollabs() {
    return await this.request('/game/collabs');
  },

  async acceptCollab(collabId) {
    return await this.request('/game/collab/accept', 'POST', { collabId });
  },

  async declineCollab(collabId) {
    return await this.request('/game/collab/decline', 'POST', { collabId });
  },

  async cancelCollab(collabId) {
    return await this.request('/game/collab/cancel', 'POST', { collabId });
  },

  async payDebt(amount) {
    return await this.request('/game/pay-debt', 'POST', { amount });
  },

  async buyUpgrade(upgradeId) {
    return await this.request('/game/upgrade', 'POST', { upgradeId });
  },

  async advanceDay() {
    return await this.request('/game/advance-day', 'POST');
  },

  async testTamper() {
    return await this.request('/anticheat/test-tamper', 'POST');
  },

  async acceptPenalty() {
    return await this.request('/anticheat/accept-penalty', 'POST');
  },

  async stealPet() {
    return await this.request('/game/steal-pet', 'POST');
  },

  async redeemPet() {
    return await this.request('/game/redeem-pet', 'POST');
  },

  async shooThief() {
    return await this.request('/game/shoo-thief', 'POST');
  },

  async inviteTiktoker() {
    return await this.request('/game/invite-tiktoker', 'POST');
  },

  async buyIngredients(items) {
    return await this.request('/game/buy-ingredients', 'POST', { items });
  },

  async endShift() {
    return await this.request('/game/end-shift', 'POST');
  },

  async unlockChapter2() {
    return await this.request('/game/unlock-chapter-2', 'POST');
  },

  async policeFine() {
    return await this.request('/game/police-fine', 'POST');
  }
};

window.API = API;
