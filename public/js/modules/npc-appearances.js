// ============================================================================
// MODULAR NPC APPEARANCE & CUSTOMIZATION SYSTEM
// Grouped by Gender (Nữ / Nam / Unisex) for Flexible Pixel Art Generation
// ============================================================================

export const HAIRSTYLES = {
  // --- NỮ (FEMALE HAIRSTYLES) ---
  female: [
    { id: 'twin_tails', name: 'Búi 2 Chùm Buộc Nơ', tags: ['dễ thương', 'nhí nhảnh', 'học sinh'] },
    { id: 'ponytail', name: 'Tóc Đuôi Ngựa Năng Động', tags: ['thể thao', 'năng động', 'gọn gàng'] },
    { id: 'long_straight', name: 'Tóc Dài Thẳng Mái Thưa', tags: ['dịu dàng', 'truyền thống', 'thanh lịch'] },
    { id: 'short_bob', name: 'Tóc Ngắn Bob Kẹp X', tags: ['cá tính', 'hiện đại', 'trẻ trung'] },
    { id: 'braided', name: 'Tóc Tết Bím Lệch Vai', tags: ['tiểu thư', 'dịu dàng', 'hoa khôi'] },
    { id: 'curly_wavy', name: 'Tóc Uốn Xoăn Sóng Bồng Bềnh', tags: ['sành điệu', 'hotgirl', 'quyến rũ'] },
    { id: 'high_bun', name: 'Tóc Búi Củ Tỏi Cài Trâm', tags: ['thanh tú', 'tiểu thư', 'gọn gàng'] },
    { id: 'hime_cut', name: 'Tóc Hime Mái Bằng Anime', tags: ['công chúa', 'anime', 'bí ẩn'] }
  ],

  // --- NAM (MALE HAIRSTYLES) ---
  male: [
    { id: 'undercut', name: 'Undercut Vuốt Sáp Lịch Lãm', tags: ['soái ca', 'nam tính', 'hiện đại'] },
    { id: 'korean_curtain', name: 'Tóc 2 Mái Hàn Quốc 5/5', tags: ['lãng tử', 'oppa', 'genz'] },
    { id: 'short_crew', name: 'Tóc Crew Cut Gọn Gàng', tags: ['học sinh', 'thể thao', 'nghiêm túc'] },
    { id: 'messy_spiky', name: 'Tóc Vuốt Rối Anime Spiky', tags: ['nổi loạn', 'game thủ', 'cá tính'] },
    { id: 'side_part', name: 'Tóc Rẽ Ngôi 7/3 Quý Ông', tags: ['công sở', 'trưởng thành', 'lịch thiệp'] },
    { id: 'curly_perm', name: 'Tóc Uốn Xoăn Mì Tôm Gen Z', tags: ['nghệ sĩ', 'thời trang', 'phong cách'] },
    { id: 'buzz_cut', name: 'Đầu Đinh Quân Đội', tags: ['mạnh mẽ', 'bụi bặm', 'cool ngầu'] }
  ],

  // --- UNISEX / PHỤ KIỆN ĐỘI ĐẦU ---
  unisex: [
    { id: 'cap_backward', name: 'Mũ Lưỡi Trai Đội Ngược', tags: ['streetwear', 'hiphop', 'năng động'] },
    { id: 'beanie', name: 'Mũ Len Trùm Đầu Hipster', tags: ['ấm áp', 'chill', 'vintage'] },
    { id: 'bucket_hat', name: 'Mũ Tai Bèo Dã Ngoại', tags: ['sinh viên', 'phượt', 'dễ thương'] },
    { id: 'afro', name: 'Tóc Xù Afro Tròn Cá Tính', tags: ['nghệ thuật', 'hài hước', 'ấn tượng'] },
    { id: 'middle_part', name: 'Tóc Rẽ Ngôi Tự Nhiên', tags: ['cổ điển', 'mộc mạc', 'thoải mái'] }
  ]
};

export const OUTFITS = {
  // --- NỮ (FEMALE OUTFITS) ---
  female: [
    { id: 'ao_dai', name: 'Áo Dài Truyền Thống Nữ Sinh', category: 'truyền thống', tags: ['thướt tha', 'duyên dáng'] },
    { id: 'dress_cute', name: 'Váy Xòe Tiểu Thư Thắt Nơ', category: 'dạo phố', tags: ['dễ thương', 'ngọt ngào'] },
    { id: 'crop_top_jeans', name: 'Áo Croptop & Quần Jeans Ống Suông', category: 'streetwear', tags: ['cá tính', 'tôn dáng'] },
    { id: 'hoodie_skirt', name: 'Áo Hoodie & Chân Váy Tennis', category: 'genz', tags: ['năng động', 'kute'] },
    { id: 'office_blouse', name: 'Sơ Mi Cổ Nơ & Chân Váy Chữ A', category: 'công sở', tags: ['thanh lịch', 'chuyên nghiệp'] },
    { id: 'student_girl', name: 'Đồng Phục Nữ Sinh Áo Trắng Váy Xanh', category: 'học đường', tags: ['học sinh', 'trong sáng'] },
    { id: 'sweater_skirt', name: 'Áo Len Cổ Lọ Oversize & Váy Midi', category: 'mùa đông', tags: ['ấm áp', 'vintage'] },
    { id: 'party_dress', name: 'Đầm Dạ Hội Hai Dây Lấp Lánh', category: 'tiệc tùng', tags: ['sang chảnh', 'nổi bật'] }
  ],

  // --- NAM (MALE OUTFITS) ---
  male: [
    { id: 'student_boy', name: 'Đồng Phục Sơ Mi Trắng & Quần Tây', category: 'học đường', tags: ['chỉn chu', 'học sinh'] },
    { id: 'tshirt_cargo', name: 'Áo Thun Oversize & Quần Túi Hộp', category: 'streetwear', tags: ['bụi bặm', 'hiphop'] },
    { id: 'hoodie_jogger', name: 'Hoodie Đường Phố & Quần Jogger', category: 'genz', tags: ['ấm áp', 'thoải mái'] },
    { id: 'suit_formal', name: 'Bộ Suit Công Sở Thắt Cà Vạt', category: 'công sở', tags: ['lịch lãm', 'quý ông'] },
    { id: 'polo_khaki', name: 'Áo Polo Lịch Sự & Quần Kaki', category: 'dạo phố', tags: ['thanh lịch', 'trưởng thành'] },
    { id: 'gym_tank', name: 'Áo Ba Lỗ Thể Thao Cơ Bắp', category: 'thể thao', tags: ['khoẻ khoắn', 'gymer'] },
    { id: 'denim_jacket', name: 'Áo Khoác Bò Jeans & Quần Rách', category: 'bụi bặm', tags: ['rocker', 'phong trần'] },
    { id: 'hawaii_shirt', name: 'Sơ Mi Hawaii Họa Tiết Nhiệt Đới', category: 'du lịch', tags: ['vui tươi', 'mát mẻ'] }
  ],

  // --- UNISEX (TRANG PHỤC NGHỀ NGHIỆP & CHUNG) ---
  unisex: [
    { id: 'barista_apron', name: 'Tạp Dề Quán Trà Sữa Chuyên Nghiệp', category: 'nghề nghiệp', tags: ['pha chế', 'quán boba'] },
    { id: 'shipper_jacket', name: 'Áo Khoác Giao Hàng Công Nghệ', category: 'nghề nghiệp', tags: ['shipper', 'phản quang'] },
    { id: 'doctor_coat', name: 'Áo Blouse Trắng Bác Sĩ & Ống Nghe', category: 'nghề nghiệp', tags: ['y tế', 'bác sĩ'] },
    { id: 'police_uniform', name: 'Cảnh Phục Tuần Tra Kèm Cầu Vai', category: 'nghề nghiệp', tags: ['an ninh', 'kỷ luật'] },
    { id: 'sport_tracksuit', name: 'Bộ Đồ Nỉ Thể Thao Sọc Tay', category: 'thể thao', tags: ['năng động', 'chạy bộ'] },
    { id: 'winter_puffer', name: 'Áo Phao Béo Mùa Đông Ấm Áp', category: 'mùa đông', tags: ['mùa đông', 'phồng'] }
  ]
};

// ============================================================================
// COLOR PALETTES
// ============================================================================

export const SKIN_TONES = [
  { id: 'porcelain', name: 'Trắng Sứ Hồng Hào', tone: '#FFE0BD', shadow: '#E8A882', blush: '#FF7675' },
  { id: 'fair', name: 'Trắng Sáng Tự Nhiên', tone: '#FCD7B0', shadow: '#E29E73', blush: '#FB7185' },
  { id: 'warm', name: 'Bánh Mật Khỏe Khoắn', tone: '#D79E6D', shadow: '#B87333', blush: '#F87171' },
  { id: 'tanned', name: 'Rám Nắng Nam Tính', tone: '#C28456', shadow: '#96522E', blush: '#EF4444' }
];

export const HAIR_COLORS = [
  { id: 'black', name: 'Đen Tự Nhiên', hex: '#1E293B', highlight: '#334155' },
  { id: 'dark_brown', name: 'Nâu Hạt Dẻ Đậm', hex: '#3E2723', highlight: '#5D4037' },
  { id: 'choco', name: 'Nâu Socola Ngọt Ngào', hex: '#4E2A16', highlight: '#78350F' },
  { id: 'honey', name: 'Nâu Vàng Mật Ong', hex: '#B45309', highlight: '#D97706' },
  { id: 'blonde', name: 'Vàng Rơm Nắng', hex: '#FACC15', highlight: '#FEF08A' },
  { id: 'pink_pastel', name: 'Hồng Pastel Gen Z', hex: '#F472B6', highlight: '#FBCFE8' },
  { id: 'wine_red', name: 'Đỏ Rượu Vang', hex: '#881337', highlight: '#BE123C' },
  { id: 'silver', name: 'Bạch Kim / Khói', hex: '#CBD5E1', highlight: '#F8FAFC' },
  { id: 'blue_cyan', name: 'Xanh Khói Anime', hex: '#0284C7', highlight: '#38BDF8' }
];

export const CLOTHES_PALETTES = {
  female: [
    { clothes: '#FFF1F2', sub: '#FB7185', pants: '#BE185D', name: 'Hồng Pastel Ngọt Ngào' },
    { clothes: '#FFFFFF', sub: '#0284C7', pants: '#1E3A8A', name: 'Thủy Thủ Học Đường' },
    { clothes: '#FEF08A', sub: '#F59E0B', pants: '#78350F', name: 'Vàng Nắng Mùa Hè' },
    { clothes: '#F3E8FF', sub: '#A855F7', pants: '#6B21A8', name: 'Tím Oải Hương Mộng Mơ' },
    { clothes: '#DCFCE7', sub: '#10B981', pants: '#065F46', name: 'Xanh Bạc Hà Thanh Mát' },
    { clothes: '#18181B', sub: '#F43F5E', pants: '#09090B', name: 'Goth Cá Tính Đen Hồng' }
  ],
  male: [
    { clothes: '#FFFFFF', sub: '#EF4444', pants: '#1E293B', name: 'Đồng Phục Sơ Mi Trắng' },
    { clothes: '#0F172A', sub: '#38BDF8', pants: '#334155', name: 'Streetwear Đen Xanh' },
    { clothes: '#15803D', sub: '#FACC15', pants: '#1F2937', name: 'Xanh Rêu Thể Thao' },
    { clothes: '#1D4ED8', sub: '#FFFFFF', pants: '#1E293B', name: 'Xanh Royal Hiện Đại' },
    { clothes: '#78350F', sub: '#FDE68A', pants: '#1C1917', name: 'Vintage Nâu Cà Phê' },
    { clothes: '#B91C1C', sub: '#FDE047', pants: '#18181B', name: 'Đỏ Đô Năng Động' }
  ]
};

// ============================================================================
// RANDOM NPC GENERATOR UTILITIES
// ============================================================================

const SAMPLE_NAMES = {
  female: [
    'Bé Thảo Ly', 'Huyền Trang', 'Minh Anh', 'Khánh Linh', 'Bảo Ngọc', 
    'Ánh Tuyết', 'Mỹ Uyên', 'Phương Thảo', 'Diệu Linh', 'Quỳnh Chi'
  ],
  male: [
    'Quốc Huy', 'Tuấn Kiệt', 'Đăng Khoa', 'Minh Nhật', 'Hải Nam', 
    'Gia Bách', 'Trọng Hiếu', 'Văn Dũng', 'Đức Anh', 'Việt Hoàng'
  ]
};

const SAMPLE_ROLES = {
  female: ['Sinh Viên Bách Khoa', 'Hotgirl Livestream', 'Thực Tập Sinh', 'Nhiếp Ảnh Gia', 'Nhà Thiết Kế'],
  male: ['Lập Trình Viên', 'Game Thủ Esports', 'Vận Động Viên', 'Chuyên Viên Tài Chính', 'Nhạc Công Indie']
};

const SAMPLE_QUOTES = [
  'Chị ơi cho em 1 ly trà sữa nhiều trân châu dai giòn nha!',
  'Hôm nay làm bài kiểm tra xong ghé nạp năng lượng boba!',
  'Trà sữa của tiệm thơm nức cả góc phố luôn ạ!',
  'Em thích nhất vị trà ô long nướng thơm béo ở đây!',
  'Làm chuẩn vị ngọt 50% giúp em nhé chị chủ!',
  'Đứng xếp hàng ngắm phố phường một lúc là tới lượt!',
  'Một ly mát lạnh giải nhiệt ngày nắng gắt!'
];

export function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Tạo cấu hình NPC hoàn chỉnh ngẫu nhiên hoặc theo giới tính
 * @param {'female' | 'male'} [gender] 
 * @param {Object} [overrides]
 */
export function generateRandomNPC(gender = null, overrides = {}) {
  const finalGender = gender || (Math.random() > 0.5 ? 'female' : 'male');
  
  // Lựa chọn kiểu tóc (70% kiểu riêng theo giới tính, 30% kiểu unisex)
  const hairPool = (Math.random() < 0.75) 
    ? HAIRSTYLES[finalGender] 
    : HAIRSTYLES.unisex;
  const hair = getRandomElement(hairPool);

  // Lựa chọn trang phục (80% trang phục theo giới tính, 20% unisex)
  const outfitPool = (Math.random() < 0.8) 
    ? OUTFITS[finalGender] 
    : OUTFITS.unisex;
  const outfit = getRandomElement(outfitPool);

  // Lựa chọn bảng màu
  const skin = getRandomElement(SKIN_TONES);
  const hairColor = getRandomElement(HAIR_COLORS);
  const clothesPalette = getRandomElement(CLOTHES_PALETTES[finalGender]);

  const name = getRandomElement(SAMPLE_NAMES[finalGender]);
  const role = getRandomElement(SAMPLE_ROLES[finalGender]);
  const quote = getRandomElement(SAMPLE_QUOTES);

  return {
    isModular: true,
    id: overrides.id || ('npc_' + Date.now() + '_' + Math.floor(Math.random() * 1000)),
    name: overrides.name || name,
    gender: finalGender,
    role: overrides.role || role,
    quote: overrides.quote || quote,
    hairStyle: overrides.hairStyle || hair.id,
    hairName: hair.name,
    outfitStyle: overrides.outfitStyle || outfit.id,
    outfitName: outfit.name,
    palette: {
      skin: overrides.palette?.skin || skin.tone,
      skinShadow: overrides.palette?.skinShadow || skin.shadow,
      blush: overrides.palette?.blush || skin.blush,
      hair: overrides.palette?.hair || hairColor.hex,
      hairHighlight: overrides.palette?.hairHighlight || hairColor.highlight,
      clothes: overrides.palette?.clothes || clothesPalette.clothes,
      sub: overrides.palette?.sub || clothesPalette.sub,
      pants: overrides.palette?.pants || clothesPalette.pants
    },
    prop: overrides.prop || 'boba',
    height: overrides.height || 54
  };
}

/**
 * Tạo NPC tùy biến chính xác theo các thông số người dùng chọn
 */
export function createCustomNPC(config) {
  const gender = config.gender || 'female';
  return {
    isModular: true,
    id: config.id || ('custom_' + Date.now()),
    name: config.name || (gender === 'female' ? 'Bạn Gái Mới' : 'Bạn Trai Mới'),
    gender: gender,
    role: config.role || 'Khách Quen',
    quote: config.quote || 'Trà sữa thơm ngon tuyệt đỉnh!',
    hairStyle: config.hairStyle || (gender === 'female' ? 'twin_tails' : 'undercut'),
    outfitStyle: config.outfitStyle || (gender === 'female' ? 'ao_dai' : 'student_boy'),
    palette: {
      skin: config.palette?.skin || '#FFE0BD',
      skinShadow: config.palette?.skinShadow || '#E8A882',
      blush: config.palette?.blush || '#FF7675',
      hair: config.palette?.hair || '#3E2723',
      hairHighlight: config.palette?.hairHighlight || '#5D4037',
      clothes: config.palette?.clothes || '#FFFFFF',
      sub: config.palette?.sub || '#EF4444',
      pants: config.palette?.pants || '#1E293B'
    },
    prop: config.prop || 'boba',
    height: config.height || 54
  };
}

// Global export for non-module compatibility
if (typeof window !== 'undefined') {
  window.NPC_SYSTEM = {
    HAIRSTYLES,
    OUTFITS,
    SKIN_TONES,
    HAIR_COLORS,
    CLOTHES_PALETTES,
    generateRandomNPC,
    createCustomNPC
  };
}

