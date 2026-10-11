/**
 * Farm Crops & Crafting Recipes Data
 * Nông Trại Chè Mộc Châu & Xưởng Chế Biến Thủ Công
 */

const FARM_CROPS = {
  crop_shan_tuyet: {
    id: 'crop_shan_tuyet',
    name: 'Đồi Chè Đen Shan Tuyết',
    subname: 'Mộc Châu Cổ Thụ',
    icon: '🍵',
    badge: 'Đặc Sản Núi Cao',
    color: '#824f33',
    seedCost: 35000,
    growthSeconds: 40,
    desc: 'Búp chè Shan Tuyết cổ thụ phủ lớp lông tơ trắng muốt, ủ men ra cốt trà đen đậm đà hảo hạng.',
    produce: {
      tra_den: 12
    },
    rawProduce: {
      bup_shan_tuyet: 4
    }
  },

  crop_thai_xanh: {
    id: 'crop_thai_xanh',
    name: 'Vườn Chè Thái Xanh & Lá Dứa',
    subname: 'Cao Nguyên Xanh Mướt',
    icon: '🍃',
    badge: 'Hương Thảo Mộc',
    color: '#2fa364',
    seedCost: 45000,
    growthSeconds: 45,
    desc: 'Lá chè xanh mơn mởn xen lẫn khóm lá dứa Mộc Châu thơm ngào ngạt, dùng cho Trà Sữa Thái Xanh.',
    produce: {
      tra_thai_xanh: 12,
      thach_la_dua: 8
    },
    rawProduce: {
      la_dua_moc_chau: 4
    }
  },

  crop_sen_tay_ho: {
    id: 'crop_sen_tay_ho',
    name: 'Đầm Sen Bách Diệp',
    subname: 'Giống Sen Trăm Cánh',
    icon: '🪷',
    badge: 'Tinh Hoa Đất Hà Thành',
    color: '#ff79c6',
    seedCost: 52000,
    growthSeconds: 60,
    desc: 'Cánh sen hồng phớt ngát hương thanh khiết, nền tảng cho Lục Trà Lài và Trà Sen Bách Diệp Tây Hồ.',
    produce: {
      tra_lai: 14
    },
    rawProduce: {
      hoa_sen_tay_ho: 5
    }
  },

  crop_vuon_trai_cay: {
    id: 'crop_vuon_trai_cay',
    name: 'Vườn Đào Mộc Châu & Cam Vàng',
    subname: 'Cây Ăn Trái Núi Rừng',
    icon: '🍑',
    badge: 'Mọng Nước Tươi Giòn',
    color: '#ff9f43',
    seedCost: 65000,
    growthSeconds: 70,
    desc: 'Đào giòn Mộc Châu má ửng hồng cùng cam vàng mọng nước và nhánh sả đồi thơm lừng.',
    produce: {
      dao_mieng: 10,
      cam_vang: 10,
      sa_tuoi: 10
    },
    rawProduce: {
      dao_tuoi_moc_chau: 4,
      cam_vang_tuoi: 4,
      sa_doi_moc_chau: 4
    }
  },

  crop_mia_duong_den: {
    id: 'crop_mia_duong_den',
    name: 'Nương Mía Mật & Thảo Dược',
    subname: 'Đường Đen Cổ Truyền',
    icon: '🍯',
    badge: 'Sánh Mịn Tự Nhiên',
    color: '#5c3a21',
    seedCost: 75000,
    growthSeconds: 80,
    desc: 'Cây mía tím ngọt đậm đà nấu mật mía đường đen và thảo dược sương sáo giải nhiệt cực mát.',
    produce: {
      tranchau_duongden: 12,
      suong_sao: 12,
      tranchau_den: 10
    },
    rawProduce: {
      mat_mia_duong_den: 5
    }
  },

  crop_olong_moc_chau: {
    id: 'crop_olong_moc_chau',
    name: 'Đồi Chè Ô Long Sương Mù',
    subname: 'Sao Than Củi Thượng Hạng',
    icon: '🔥',
    badge: 'Vị Khói Trầm Ấm',
    color: '#d35400',
    seedCost: 85000,
    growthSeconds: 90,
    desc: 'Búp trà Ô Long hái sớm sấy chậm trên than hồng, dùng cho Trà Ô Long Nướng & Nitro Cold Brew.',
    produce: {
      tra_olong: 15,
      tranchau_den: 12
    },
    rawProduce: {
      bup_shan_tuyet: 4,
      mat_mia_duong_den: 3
    }
  }
};

const CRAFT_RECIPES = {
  craft_siro_dao_cam_sa: {
    id: 'craft_siro_dao_cam_sa',
    name: 'Ủ Siro Đào Cam Sả Tươi 5⭐',
    icon: '🍑',
    badge: 'Organic 5⭐',
    requires: {
      dao_tuoi_moc_chau: 2,
      cam_vang_tuoi: 2,
      sa_doi_moc_chau: 2
    },
    produce: {
      dao_mieng: 10,
      cam_vang: 10,
      sa_tuoi: 10
    },
    organicBuffCups: 8,
    organicBonusPercent: 40,
    repGain: 0.05,
    desc: 'Ủ thủ công từng lát đào giòn ngọt và cam vàng tươi với sả đập dập. Tặng kèm 8 ly gắn mác Signature Organic (+40% doanh thu).'
  },

  craft_tranchau_duongden: {
    id: 'craft_tranchau_duongden',
    name: 'Nấu Trân Châu Đường Đen Nồi Đất',
    icon: '🧋',
    badge: 'Organic 5⭐',
    requires: {
      mat_mia_duong_den: 3,
      bup_shan_tuyet: 2
    },
    produce: {
      tranchau_duongden: 15,
      tranchau_den: 15
    },
    organicBuffCups: 8,
    organicBonusPercent: 40,
    repGain: 0.05,
    desc: 'Nấu trân châu bột năng thủ công trong nồi đất cùng mật mía Mộc Châu cô đặc dẻo quánh, dậy mùi thơm lừng.'
  },

  craft_tra_sen_bach_diep: {
    id: 'craft_tra_sen_bach_diep',
    name: 'Ướp Trà Sen Bách Diệp Sớm Mai',
    icon: '🪷',
    badge: 'Organic 5⭐',
    requires: {
      hoa_sen_tay_ho: 3,
      bup_shan_tuyet: 2
    },
    produce: {
      tra_lai: 16
    },
    organicBuffCups: 12,
    organicBonusPercent: 40,
    repGain: 0.08,
    desc: 'Ướp từng búp chè Shan Tuyết vào lòng bông sen Tây Hồ đón sương sớm. Tinh hoa trà Việt đỉnh cao (+40% doanh thu trong 12 ly).'
  },

  craft_thach_la_dua_organic: {
    id: 'craft_thach_la_dua_organic',
    name: 'Nấu Thạch Lá Dứa & Sương Sáo Tươi',
    icon: '🌿',
    badge: 'Organic 5⭐',
    requires: {
      la_dua_moc_chau: 3,
      mat_mia_duong_den: 2
    },
    produce: {
      thach_la_dua: 16,
      suong_sao: 16
    },
    organicBuffCups: 8,
    organicBonusPercent: 40,
    repGain: 0.05,
    desc: 'Ép nước cốt lá dứa Mộc Châu nấu thạch dẻo thơm dịu mát kết hợp sương sáo thảo mộc thanh nhiệt giải độc.'
  }
};

const RAW_MATERIAL_INFO = {
  bup_shan_tuyet: { name: 'Búp Chè Shan Tuyết', icon: '🍃', color: '#a8e063' },
  la_dua_moc_chau: { name: 'Lá Dứa Mộc Châu', icon: '🌿', color: '#2ed573' },
  hoa_sen_tay_ho: { name: 'Hoa Sen Bách Diệp', icon: '🪷', color: '#ff79c6' },
  dao_tuoi_moc_chau: { name: 'Đào Tươi Mộc Châu', icon: '🍑', color: '#ffa502' },
  cam_vang_tuoi: { name: 'Cam Vàng Mường Khương', icon: '🍊', color: '#ff9f43' },
  sa_doi_moc_chau: { name: 'Sả Đồi Tây Bắc', icon: '🌱', color: '#7bed9f' },
  mat_mia_duong_den: { name: 'Mật Mía Đường Đen', icon: '🍯', color: '#eccc68' }
};

function createDefaultFarmData() {
  return {
    plots: [
      { id: 1, cropId: null, plantedAt: 0, readyAt: 0, wateredCount: 0, lastWateredAt: 0 },
      { id: 2, cropId: null, plantedAt: 0, readyAt: 0, wateredCount: 0, lastWateredAt: 0 },
      { id: 3, cropId: null, plantedAt: 0, readyAt: 0, wateredCount: 0, lastWateredAt: 0 },
      { id: 4, cropId: null, plantedAt: 0, readyAt: 0, wateredCount: 0, lastWateredAt: 0 },
      { id: 5, cropId: null, plantedAt: 0, readyAt: 0, wateredCount: 0, lastWateredAt: 0 },
      { id: 6, cropId: null, plantedAt: 0, readyAt: 0, wateredCount: 0, lastWateredAt: 0 }
    ],
    harvestCount: 0,
    rawMaterials: {
      bup_shan_tuyet: 2,
      la_dua_moc_chau: 2,
      hoa_sen_tay_ho: 2,
      dao_tuoi_moc_chau: 2,
      cam_vang_tuoi: 2,
      sa_doi_moc_chau: 2,
      mat_mia_duong_den: 2
    }
  };
}

module.exports = {
  FARM_CROPS,
  CRAFT_RECIPES,
  RAW_MATERIAL_INFO,
  createDefaultFarmData
};

