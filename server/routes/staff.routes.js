const express = require('express');
const staffService = require('../services/game/staff.service');
const { authStore } = require('../middleware/auth.middleware');

const router = express.Router();

const handle = (label, fn) => async (req, res) => {
  try {
    const result = await fn(req);
    res.json(result);
  } catch (err) {
    console.error(`${label} error:`, err);
    res.status(400).json({ error: err.message });
  }
};

// GET /api/staff/status: Lấy trạng thái nhân viên trực quầy & tiến trình mở khóa
router.get('/status', authStore, handle('Get staff status', req => {
  return staffService.getStaffStatus(req.store.id);
}));

// POST /api/staff/hire: Thuê nhân viên (yêu cầu chapter >= 3 & 5 TeaCoin/giờ)
router.post('/hire', authStore, handle('Hire staff', req => {
  const { npcId, hours, autoRenew } = req.body;
  if (!npcId) throw new Error('Vui lòng chọn nhân viên cần thuê!');
  return staffService.hireStaff(req.store.id, npcId, Number(hours || 1), !!autoRenew);
}));

// POST /api/staff/extend: Gia hạn ca làm việc
router.post('/extend', authStore, handle('Extend staff contract', req => {
  const { additionalHours } = req.body;
  return staffService.extendContract(req.store.id, Number(additionalHours || 1));
}));

// POST /api/staff/claim-offline: Thu hoạch doanh thu offline tích lũy
router.post('/claim-offline', authStore, handle('Claim offline revenue', req => {
  return staffService.claimOfflineRevenue(req.store.id);
}));

// POST /api/staff/terminate: Kết thúc ca sớm & hoàn TeaCoin chưa dùng
router.post('/terminate', authStore, handle('Terminate staff contract', req => {
  return staffService.terminateContract(req.store.id);
}));

module.exports = router;

