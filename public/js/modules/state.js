// Shared Game State & Configuration Constants

export const state = {
  // Store & Session Data
  storeState: null,
  orderQueue: [],
  currentOrder: null,

  // Timing & Pause Controls
  orderTimerInterval: null,
  restTimerInterval: null,
  nextOrderTimeout: null,
  isGamePaused: false,
  pauseStartTime: 0,
  totalWavePausedTime: 0,
  orderStartTime: 0,

  // Mixing & Workflow Selection State
  selectedTea: 'den',
  selectedSugar: '50%',
  selectedIce: 'Vừa đá',
  selectedToppings: [],
  isShaken: false,
  isPoured: false,
  isSealed: false,

  // Canvas & Workstation Instances
  canvas: null,
  workstation: null
};

export const TOPPING_LABELS = {
  tranchau_den: '⚫ Trân Châu Đen',
  thach_la_dua: '🍃 Thạch Lá Dứa',
  tranchau_duongden: '🍯 Đường Đen',
  dao_mieng: '🍑 Đào Miếng',
  cam_vang: '🍊 Cam Vàng',
  sa_tuoi: '🌱 Sả Tươi',
  suong_sao: '🍮 Sương Sáo'
};

export const TEA_LABELS = {
  den: '🍵 Trà Đen Đậm',
  thai_xanh: '🌿 Thái Xanh',
  sua_tuoi: '🥛 Sữa Tươi',
  lai: '🌸 Lục Trà Lài',
  olong_nuong: '🔥 Ô Long Nướng'
};

export const RECIPE_TEA_MAP = {
  tra_sua_truyen_thong: { teaId: 'den', teaName: 'Trà Đen Đậm', icon: '🍵', btnLabel: 'Trà Đen Đậm' },
  hong_tra_tac: { teaId: 'den', teaName: 'Trà Đen Đậm', icon: '🍊', btnLabel: 'Trà Đen Đậm' },
  luc_tra_lai_suong_sao: { teaId: 'lai', teaName: 'Lục Trà Lài', icon: '🌼', btnLabel: 'Lục Trà Lài' },
  tra_thai_xanh: { teaId: 'thai_xanh', teaName: 'Thái Xanh', icon: '🌿', btnLabel: 'Thái Xanh' },
  sua_tuoi_tran_chau_hoang_kim: { teaId: 'sua_tuoi', teaName: 'Sữa Tươi', icon: '🥛', btnLabel: 'Sữa Tươi' },
  sua_tuoi_duong_den: { teaId: 'sua_tuoi', teaName: 'Sữa Tươi', icon: '🍯', btnLabel: 'Sữa Tươi' },
  hong_tra_cam_que_mat_ong: { teaId: 'den', teaName: 'Trà Đen Đậm', icon: '🍹', btnLabel: 'Trà Đen Đậm' },
  tra_dao_cam_sa: { teaId: 'lai', teaName: 'Lục Trà Lài', icon: '🍑', btnLabel: 'Lục Trà Lài' },
  tra_thai_xanh_kem_pho_mai: { teaId: 'thai_xanh', teaName: 'Thái Xanh', icon: '🧀', btnLabel: 'Thái Xanh' },
  olong_sua_tran_chau_duong_den: { teaId: 'olong_nuong', teaName: 'Ô Long Nướng', icon: '🍂', btnLabel: 'Ô Long Nướng' },
  tra_olong_nuong: { teaId: 'olong_nuong', teaName: 'Ô Long Nướng', icon: '🔥', btnLabel: 'Ô Long Nướng' },
  nitro_cold_brew: { teaId: 'olong_nuong', teaName: 'Ô Long Nướng', icon: '💨', btnLabel: 'Ô Long Nướng' },
  olong_dao_cam_phuong_hoang: { teaId: 'olong_nuong', teaName: 'Ô Long Nướng', icon: '🐦‍🔥', btnLabel: 'Ô Long Nướng' },
  kem_kho_banh_bong: { teaId: 'thai_xanh', teaName: 'Thái Xanh', icon: '🍮', btnLabel: 'Thái Xanh' },
  tra_sen_tay_ho: { teaId: 'lai', teaName: 'Lục Trà Lài', icon: '🪷', btnLabel: 'Lục Trà Lài' },
  sua_tuoi_dao_tien_ung_dung: { teaId: 'sua_tuoi', teaName: 'Sữa Tươi', icon: '🌸', btnLabel: 'Sữa Tươi' },
  tra_sua_dat_vang: { teaId: 'den', teaName: 'Trà Đen Đậm', icon: '👑', btnLabel: 'Trà Đen Đậm' },
  matcha_kyoto_dat_bac: { teaId: 'thai_xanh', teaName: 'Thái Xanh / Matcha', icon: '🍵', btnLabel: 'Thái Xanh' },
  hong_tra_vuong_trieu_thap_cam: { teaId: 'den', teaName: 'Trà Đen Đậm', icon: '💎', btnLabel: 'Trà Đen Đậm' },
  tra_sam_nui_seoul: { teaId: 'sua_tuoi', teaName: 'Sữa Tươi Sâm', icon: '🇰🇷', btnLabel: 'Sữa Tươi' }
};

export const TEA_INV_MAP = {
  'den': 'tra_den',
  'thai_xanh': 'tra_thai_xanh',
  'sua_tuoi': 'sua_tuoi',
  'lai': 'tra_lai',
  'olong_nuong': 'tra_olong'
};

