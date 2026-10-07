// Time of Day & Patrol System for GameCanvas

export const timeMethods = {
  getNightPatrolStatus() {
    const { hour, minute, totalInGameMinutes } = this.getInGameTime();
    // Operating hours: 7:00 (420 min) to 22:30 (1350 min)
    const isBusinessHours = (totalInGameMinutes >= 420 && totalInGameMinutes <= 1350);

    if (isBusinessHours) {
      return {
        isBusinessHours: true,
        isOvertime: false,
        probability: 0,
        isAmuletInvalid: false,
        timeStr: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        statusText: '🟢 Giờ kinh doanh (7h00 - 22h30)'
      };
    }

    // Overtime (After 22:30):
    let minutesPastClose = 0;
    if (totalInGameMinutes > 1350) {
      minutesPastClose = totalInGameMinutes - 1350;
    } else {
      // Past midnight (0:00 to 7:00)
      minutesPastClose = (1440 - 1350) + totalInGameMinutes;
    }

    const hoursPast = Math.floor(minutesPastClose / 60);
    // Probability starts at 25% at 22:30 (giảm mạnh từ 75%), tăng chậm +5%/h tối đa 50%
    const probability = Math.min(50, 25 + hoursPast * 5);

    // Invisibility Amulet is INVALID after 1:00 AM (1:00 = 60 min to 7:00 = 420 min)
    const isAmuletInvalid = (totalInGameMinutes >= 60 && totalInGameMinutes < 420);

    return {
      isBusinessHours: false,
      isOvertime: true,
      probability,
      isAmuletInvalid,
      hoursPast,
      minutesPastClose,
      timeStr: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      statusText: isAmuletInvalid
        ? `💀 Sau 1h: BÙA VÔ HIỆU! (Công an ${probability}%)`
        : `🔴 Quá giờ! Tuần tra đêm (${probability}%)`
    };
  },

  setInGameTimeTo7AM() {
    const DAY_CYCLE_MS = 2 * 60 * 60 * 1000; // 7,200,000 ms (2 hours)
    const currentNow = Date.now() + (this.inGameTimeOffsetMs || 0);
    const currentElapsed = currentNow % DAY_CYCLE_MS;
    // 7:00 AM = 7 hours = 420 in-game minutes = (7 / 24) of day cycle = 2,100,000 ms
    const targetElapsed = (7 / 24) * DAY_CYCLE_MS;
    const delta = (targetElapsed - currentElapsed + DAY_CYCLE_MS) % DAY_CYCLE_MS;
    this.inGameTimeOffsetMs = (this.inGameTimeOffsetMs || 0) + delta;
    try {
      localStorage.setItem('hyhy_time_offset', this.inGameTimeOffsetMs.toString());
    } catch (e) {}
    this.customTimeOfDay = null; // Resume automatic time of day (morning)
    return this.getInGameTime();
  },

  getInGameTime() {
    // 2 real-world hours = 1 in-game day (24 in-game hours)
    // 120 real minutes = 24 in-game hours => 1 in-game hour = 5 real minutes (300,000 ms)
    // 1 in-game minute = 5 real seconds (5,000 ms)
    const DAY_CYCLE_MS = 2 * 60 * 60 * 1000; // 7,200,000 ms (2 hours)
    const now = Date.now() + (this.inGameTimeOffsetMs || 0);
    const elapsed = now % DAY_CYCLE_MS;
    const fraction = elapsed / DAY_CYCLE_MS;
    const totalInGameMinutes = Math.floor(fraction * 24 * 60);
    const hour = Math.floor(totalInGameMinutes / 60);
    const minute = totalInGameMinutes % 60;
    return { hour, minute, totalInGameMinutes, fraction };
  },

  getTimeOfDay() {
    if (this.customTimeOfDay) return this.customTimeOfDay;
    const { hour } = this.getInGameTime();
    if (hour >= 5 && hour < 11) return 'morning';   // 05:00 - 10:59: Buổi Sáng (30 phút thực)
    if (hour >= 11 && hour < 15) return 'noon';      // 11:00 - 14:59: Buổi Trưa (20 phút thực)
    if (hour >= 15 && hour < 19) return 'afternoon'; // 15:00 - 18:59: Buổi Chiều (Hoàng hôn, 20 phút thực)
    return 'night';                                  // 19:00 - 04:59: Buổi Tối / Đêm (50 phút thực)
  },

  getTimeOfDayLabel() {
    const tod = this.getTimeOfDay();
    const { hour, minute } = this.getInGameTime();
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const labels = {
      morning: `🌅 Sáng ${timeStr}`,
      noon: `☀️ Trưa ${timeStr}`,
      afternoon: `🌇 Chiều ${timeStr}`,
      night: `🌙 Tối ${timeStr}`
    };
    return labels[tod] || `🌅 Sáng ${timeStr}`;
  },

  cycleTimeOfDay() {
    const list = ['morning', 'noon', 'afternoon', 'night', null]; // null = Trở về chế độ tự động theo chu kỳ 2 tiếng
    const cur = this.customTimeOfDay;
    const curIdx = list.indexOf(cur);
    const nextIdx = (curIdx + 1) % list.length;
    this.customTimeOfDay = list[nextIdx];
    return {
      tod: this.getTimeOfDay(),
      isAuto: this.customTimeOfDay === null,
      label: this.customTimeOfDay === null ? `⏱️ Chu kỳ 2h: ${this.getTimeOfDayLabel()}` : this.getTimeOfDayLabel()
    };
  }
};

