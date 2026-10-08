/**
 * UNIVERSAL RETRO PIXEL ART CHARACTER SYSTEM
 * Faithfully matches ModelNPC.html with full proportional height & signature details for all 50 characters
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    var exports = factory();
    root.CHARACTERS = exports.CHARACTERS;
    root.CUSTOMERS_LIST = exports.CUSTOMERS_LIST;
    root.getCharacter = exports.getCharacter;
    root.getCharacterHeight = exports.getCharacterHeight;
    root.pRect = exports.pRect;
    root.pDot = exports.pDot;
    root.drawBobaCup = exports.drawBobaCup;
    root.drawNPCCharacter = exports.drawNPCCharacter;
    root.drawOwnerBarista = exports.drawOwnerBarista;
    root.drawOwnerForearms = exports.drawOwnerForearms;
  }
})(typeof self !== 'undefined' ? self : this, function () {

  // ==========================================
  // 1. ALL 50 CHARACTERS DEFINITIONS
  // ==========================================
  const CHARACTERS = [
    // --- CHỦ QUÁN (CHỊ THẢO BOBA - CÔ CHỦ TRẺ XINH ĐẸP) ---
    {
      id: 1, name: 'Chị Thảo Boba', role: 'CHỦ TIỆM TRÀ SỮA', cat: 'pro',
      age: '24 tuổi', personality: 'Dễ thương, khéo léo, đam mê sáng tạo món trà sữa mới',
      favoriteDrink: 'Trà Sữa Oolong Nướng Sốt Phô Mai Kem Trứng',
      desc: 'Hơn 5 năm ấp ủ tình yêu với từng búp trà tươi và trân châu thủ công. Nụ cười rạng rỡ, chiếc tạp dề hoa xinh xắn và đôi tay lắc bình shaker điêu luyện.',
      tags: ['#CôChủXinhĐẹp', '#BậcThầyPhaChế', '#TạpDềHồng', '#TươiTắn'],
      dialogues: [
        "Trà sữa tự tay em nấu, hôm nay giảm 50% đường thêm nhiều trân châu dai giòn nha anh chị ơi!",
        "Em vừa ủ mẻ trà Oolong nướng thơm nức mũi luôn, để em lắc cho anh chị một ly nhé!",
        "Lớp kem trứng phô mai này em vừa khò cháy xém thơm bùi béo ngậy cực đỉnh đó ạ!"
      ],
      palette: { hair: '#4E2A16', skin: '#FFE0BD', clothes: '#FFF0F5', sub: '#FB7185', pants: '#831843' },
      style: 'owner', prop: 'shaker'
    },

    // --- NHÓM 1: THIẾU NHI & HỌC SINH (2 -> 11) ---
    {
      id: 2, name: 'Bé Bi Mẫu Giáo', role: 'BÉ MẪU GIÁO 4 TUỔI', cat: 'student',
      age: '4 tuổi', personality: 'Tò mò, hay cười lí lắc',
      favoriteDrink: 'Sữa Tươi Thạch Pudding Trứng',
      desc: 'Đội mũ tai bèo vàng, đeo yếm xanh ngọc, thích chỉ trỏ các hạt boba trôi nổi tròn xoe.',
      tags: ['#MũTaiBèo', '#YếmGấu', '#MêPudding'],
      dialogues: ["Chị Thảo ơi mấy viên đen đen tròn tròn biết bơi hả chị?", "Con uống hết sữa là mẹ khen ngoan!", "Pudding mềm như thạch rau câu í!"],
      palette: { hair: '#1A1A1A', skin: '#FFE0BD', clothes: '#06B6D4', sub: '#FDE047', pants: '#0284C7' },
      style: 'kid', prop: 'boba'
    },
    {
      id: 3, name: 'Bé Lan Khăn Quàng', role: 'HỌC SINH CẤP 2', cat: 'student',
      age: '13 tuổi', personality: 'Chăm học, hồn nhiên',
      favoriteDrink: 'Trà Sữa Trân Châu Đen 100% Ngọt',
      desc: 'Tóc búi hai chùm thắt nơ đỏ, khăn quàng đỏ tung bay sau giờ tan trường.',
      tags: ['#KhănQuàngĐỏ', '#BaloHồng', '#HọcSinhGiỏi'],
      dialogues: ["Vừa kiểm tra 15 phút xong phải ghé chị Thảo nạp năng lượng!", "Chị cho em thêm nhiều thạch phô mai nha!", "Ly trà sữa này làm bài toán khó cũng thấy dễ."],
      palette: { hair: '#2D1500', skin: '#FFE0BD', clothes: '#FFFFFF', sub: '#DC2626', pants: '#1565C0' },
      style: 'student_girl', prop: 'boba'
    },
    {
      id: 4, name: 'Bo Đội Trưởng Sao Đỏ', role: 'SAO ĐỎ TRƯỜNG LỚP', cat: 'student',
      age: '14 tuổi', personality: 'Nghiêm túc, công minh',
      favoriteDrink: 'Trà Đào Cam Sả Ít Đường',
      desc: 'Băng đỏ trên tay, sổ tay ghi điểm thi đua, thích uống trà mát giải nhiệt mùa thi.',
      tags: ['#BăngĐỏ', '#SổTayKỷLuật', '#UốngThanhMát'],
      dialogues: ["Bạn nào đi học trễ là ghi sổ, nhưng uống boba thì hoan nghênh!", "Trà đào chua ngọt vừa đủ tỉnh táo truy bài.", "Chị Thảo làm chuẩn quy định an toàn vệ sinh 10 điểm!"],
      palette: { hair: '#1E293B', skin: '#FCD7B0', clothes: '#FFFFFF', sub: '#EF4444', pants: '#334155' },
      style: 'student_boy', prop: 'notebook'
    },
    {
      id: 5, name: 'Bé Nhím Họa Sĩ Nhí', role: 'HỌC SINH LỚP VẼ', cat: 'student',
      age: '9 tuổi', personality: 'Sáng tạo, mơ mộng',
      favoriteDrink: 'Sữa Dâu Thạch Cầu Vồng',
      desc: 'Mũ nồi họa sĩ nghiêng một bên, áo lem vài vệt màu nước rực rỡ.',
      tags: ['#MũNồiBeret', '#VếtMàuNước', '#ThạchCầuVồng'],
      dialogues: ["Con vẽ chân dung chị Thảo đang lắc ly boba nè chị!", "Ly sữa dâu màu hồng xinh ơi là xinh!", "Trân châu màu đen tương phản hoàn hảo với sữa trắng!"],
      palette: { hair: '#451A03', skin: '#FFE0BD', clothes: '#EC4899', sub: '#A855F7', pants: '#F59E0B' },
      style: 'artist_kid', prop: 'palette'
    },
    {
      id: 6, name: 'Minh Cờ Vua', role: 'TUYỂN THỦ CỜ VUA TRƯỜNG', cat: 'student',
      age: '12 tuổi', personality: 'Tập trung, điềm đạm',
      favoriteDrink: 'Hồng Trà Sữa Thạch Cà Phê',
      desc: 'Đeo kính cận gọng tròn, tay cầm quân mã cờ vua, thích vị đậm đà kích thích tư duy.',
      tags: ['#KínhCậnTròn', '#QuânCờVua', '#NãoBộ'],
      dialogues: ["Mỗi nước cờ như một giọt hồng trà đậm đà.", "Trà sữa vừa miệng, nước đi tiếp theo là Mã bắt Hậu!", "Nước này em thắng chắc rồi chị Thảo ơi!"],
      palette: { hair: '#0F172A', skin: '#FCD7B0', clothes: '#38BDF8', sub: '#0F172A', pants: '#475569' },
      style: 'student_boy', prop: 'chess'
    },
    {
      id: 7, name: 'Bé Bông Múa Ba Lê', role: 'VŨ CÔNG NHÍ', cat: 'student',
      age: '8 tuổi', personality: 'Duyên dáng, nhẹ nhàng',
      favoriteDrink: 'Trà Sữa Hoa Lài Sương Sáo Trắng',
      desc: 'Váy xòe tutu màu hồng phấn, búi tóc củ tỏi thắt hoa xinh xắn.',
      tags: ['#VáyTutu', '#BúiTócBúpBê', '#HươngLài'],
      dialogues: ["Sau bài múa xoay vòng là con ghé chị Thảo ngay!", "Hương lài thơm như khu vườn cổ tích vậy á.", "Con có thể kiễng chân nhận ly trà sữa không chị?"],
      palette: { hair: '#3E2723', skin: '#FFE0BD', clothes: '#F472B6', sub: '#FDF2F8', pants: '#F472B6' },
      style: 'ballet_girl', prop: 'boba'
    },
    {
      id: 8, name: 'Cu Tí Đội Trưởng Bóng Đá', role: 'TIỀN ĐẠO NHÍ TIỂU HỌC', cat: 'student',
      age: '11 tuổi', personality: 'Nhiệt huyết, năng động',
      favoriteDrink: 'Nước Mía Trân Châu Khổng Lồ',
      desc: 'Áo số 10 đỏ rực, đầu gối dán băng cá nhân, ôm trái bóng da sọc đen trắng.',
      tags: ['#ÁoSố10', '#TráiBóngĐá', '#NăngLượng'],
      dialogues: ["Chị Thảo ơi sút vào gôn xong khát cháy cổ!", "Bơm cho em một ly ngọt lịm hồi sức đá hiệp 2!", "Trận này đội em dẫn trước 3-1 rồi đó!"],
      palette: { hair: '#18181B', skin: '#E5A672', clothes: '#EF4444', sub: '#FFFFFF', pants: '#FFFFFF' },
      style: 'soccer_boy', prop: 'ball'
    },
    {
      id: 9, name: 'Bé Hạnh & Cún Vàng', role: 'BÉ BÁN VÉ SỐ NGHỊ LỰC', cat: 'student',
      age: '10 tuổi', personality: 'Lễ phép, lạc quan',
      favoriteDrink: 'Trà Sữa Sương Sáo Chị Thảo Tặng',
      desc: 'Nón lá nghiêng che nắng, xấp vé số trên tay, chú cún nhỏ vẫy đuôi kề bên.',
      tags: ['#NónLáNhỏ', '#CúnTrungThành', '#ẤmÁp'],
      dialogues: ["Dạ em chúc chị Thảo ngày mới bán đắt đỏ nha!", "Cún con ngoan lắm, chị cho uống ngụm nước là mừng rơn.", "Trà sữa của chị ngọt ngào nhất trần đời!"],
      palette: { hair: '#27272A', skin: '#E5A672', clothes: '#F59E0B', sub: '#D97706', pants: '#334155' },
      style: 'lottery_girl', prop: 'lottery'
    },
    {
      id: 10, name: 'Tuấn Cận Ôn Thi Chuyên', role: 'SĨ TỬ THI VÀO 10', cat: 'student',
      age: '15 tuổi', personality: 'Chăm chỉ, điềm đạm',
      favoriteDrink: 'Matcha Latte Đậu Đỏ Gấp Đôi Đá',
      desc: 'Đeo cặp táp nặng trịch, tay ôm đề thi thử, hút matcha xua tan cơn buồn ngủ.',
      tags: ['#BaloNặng', '#ĐềThiThử', '#MatchaXanh'],
      dialogues: ["Matcha đậm vị giúp em giải nốt 3 đề Toán nâng cao!", "Chị Thảo bỏ thêm cho em chút đậu bùi bùi nha.", "Cố gắng đậu trường chuyên rồi khao cả nhà boba!"],
      palette: { hair: '#0284C7', skin: '#FCD7B0', clothes: '#0284C7', sub: '#FFFFFF', pants: '#1E293B' },
      style: 'student_boy', prop: 'book'
    },
    {
      id: 11, name: 'Mai Mê Anime', role: 'COSPLAYER NHÍ', cat: 'student',
      age: '14 tuổi', personality: 'Dễ thương, mơ mộng',
      favoriteDrink: 'Trà Sữa Khoai Môn Tím Pastel',
      desc: 'Bờm tai mèo dễ thương, tất đùi sọc trắng tím, đam mê manga Nhật Bản.',
      tags: ['#TaiMèoKawaii', '#TấtSọcTím', '#MàuPastel'],
      dialogues: ["Trà sữa khoai môn hợp màu tóc cosplay hôm nay ghê!", "Nya~ Chị Thảo pha ly này ngon chuẩn vị anime luôn!", "Em chụp ảnh khoe lên hội cosplay liền đây!"],
      palette: { hair: '#C084FC', skin: '#FFE0BD', clothes: '#E879F9', sub: '#4C1D95', pants: '#A855F7' },
      style: 'anime_girl', prop: 'boba'
    },

    // --- NHÓM 2: GEN Z & TRẺ TUỔI (12 -> 21) ---
    {
      id: 12, name: 'Tú TikToker Triệu View', role: 'CONTENT CREATOR Y2K', cat: 'genz',
      age: '21 tuổi', personality: 'Tự tin, bắt trend siêu nhanh',
      favoriteDrink: 'Matcha Latte Phân Tầng 3 Lớp',
      desc: 'Kính mát gác đỉnh đầu, tay cầm gậy gimbal gắn điện thoại đang livestream triệu view.',
      tags: ['#Livestream', '#Y2KStyle', '#ReviewFood'],
      dialogues: ["Hello cả nhà iu! Hôm nay Tú dẫn mọi người thẩm tiệm boba của cô chủ Thảo Nhi xinh đẹp!", "Góc quay này ánh sáng hắt vào ly boba đẹp xuất sắc!", "Chị Thảo chào 100k người đang xem live nha chị!"],
      palette: { hair: '#7C3AED', skin: '#FFE5CC', clothes: '#10B981', sub: '#EC4899', pants: '#E2E8F0' },
      style: 'tiktoker', prop: 'gimbal'
    },
    {
      id: 13, name: 'Quân Rapper Đường Phố', role: 'UNDERGROUND MC', cat: 'genz',
      age: '22 tuổi', personality: 'Chất lừ, phóng khoáng',
      favoriteDrink: 'Trà Sữa Cacao Đậm Đặc 0 Đường',
      desc: 'Mũ snapback ngược, dây chuyền xích to bản, áo hoodie oversize cực cool ngầu.',
      tags: ['#Snapback', '#DâyChuyềnXích', '#Freestyle'],
      dialogues: ["Yo chị Thảo, nhả một câu rap đổi lấy ly trà sữa đậm đà!", "Flow mượt mà như dòng sữa tươi đổ tràn ly đá.", "Uống cacao này vào là bắn rap nhanh như gió!"],
      palette: { hair: '#18181B', skin: '#FCD7B0', clothes: '#18181B', sub: '#EAB308', pants: '#3F3F46' },
      style: 'rapper', prop: 'mic'
    },
    {
      id: 14, name: 'Linh Sinh Viên Kiến Trúc', role: 'DÂN VẼ ĐỒ ÁN', cat: 'genz',
      age: '20 tuổi', personality: 'Nghệ sĩ, thích thức đêm',
      favoriteDrink: 'Cold Brew Macchiato Muối Biển',
      desc: 'Ống đựng bản vẽ vắt vai, mắt thâm quầng nhưng thần thái sắc sảo.',
      tags: ['#ỐngBảnVẽ', '#DeadlineĐồÁn', '#MuốiBiển'],
      dialogues: ["Còn 6 tiếng nộp đồ án chung cư cao tầng, cứu em với chị Thảo ơi!", "Lớp kem muối biển này xốc lại 200% tinh thần!", "Vẽ phối cảnh xong em sẽ ngủ bù một ngày một đêm."],
      palette: { hair: '#78350F', skin: '#FFE0BD', clothes: '#E0E7FF', sub: '#4338CA', pants: '#1E1B4B' },
      style: 'student_pro', prop: 'tube'
    },
    {
      id: 15, name: 'Huy Skater Phố Đi Bộ', role: 'VẬN ĐỘNG VIÊN TRƯỢT VÁN', cat: 'genz',
      age: '19 tuổi', personality: 'Liều lĩnh, hoạt bát',
      favoriteDrink: 'Trà Chanh Dây Kim Quất Băng Lạnh',
      desc: 'Cắp ván trượt grip đen, áo thun thụng, giày skate xước gót điêu luyện.',
      tags: ['#VánTrượtSkate', '#OllieTrick', '#BăngLạnh'],
      dialogues: ["Vừa kickflip qua 4 bậc thềm mệt đứt hơi!", "Chanh dây mát lịm sảng khoái từng tế bào!", "Lát em biểu diễn xoay ván trước cửa quán cho chị xem!"],
      palette: { hair: '#EA580C', skin: '#FCD5B5', clothes: '#F97316', sub: '#1E293B', pants: '#1E293B' },
      style: 'skater', prop: 'skateboard'
    },
    {
      id: 16, name: 'Châu Trưởng Fanclub K-pop', role: 'GEN Z ĐU IDOL', cat: 'genz',
      age: '21 tuổi', personality: 'Nhiệt tình, cuồng nhiệt',
      favoriteDrink: 'Trà Dâu Kem Cheese Pinky Holic',
      desc: 'Cầm lightstick phát sáng, balo cài đầy huy hiệu oppa lấp lánh.',
      tags: ['#Lightstick', '#ĐuIdol', '#KemCheeseHồng'],
      dialogues: ["Chị Thảo bật nhạc bài mới của idol nhóm em được hông chị?", "Màu ly trà dâu này chuẩn tông concert luôn á!", "Hôm nay đu vé concert thành công mỹ mãn rồi!"],
      palette: { hair: '#F43F5E', skin: '#FFE0BD', clothes: '#FDA4AF', sub: '#9F1239', pants: '#FDF2F8' },
      style: 'kpop_fan', prop: 'lightstick'
    },
    {
      id: 17, name: 'Khoa Gamer Đấu Giải', role: 'TUYỂN THỦ ESPORTS', cat: 'genz',
      age: '20 tuổi', personality: 'Tập trung cao độ, phản xạ nhanh',
      favoriteDrink: 'Trà Xanh Năng Lượng Đậu Biếc',
      desc: 'Tai nghe gaming chụp tai có đèn LED RGB, áo thun in logo clan huyền thoại.',
      tags: ['#TaiNgheRGB', '#Esports', '#ĐậuBiếc'],
      dialogues: ["Team em vừa leo lên bậc Thách Đấu xong, khát khô họng!", "Uống ngụm trà xanh phản xạ chuột tăng thêm 15%!", "Chị Thảo cổ vũ trận chung kết tối nay của em nha!"],
      palette: { hair: '#0284C7', skin: '#FCD7B0', clothes: '#0F172A', sub: '#22D3EE', pants: '#1E293B' },
      style: 'gamer', prop: 'headset'
    },
    {
      id: 18, name: 'Hồng Hotgirl Bán Hàng Online', role: 'CHỦ SHOP LIVESTREAM', cat: 'genz',
      age: '23 tuổi', personality: 'Khéo miệng, duyên dáng',
      favoriteDrink: 'Trà Hoa Cúc Mật Ong Nha Đam',
      desc: 'Đeo mic cài áo tí hon, giọng lanh lảnh chốt ngàn đơn một buổi tối.',
      tags: ['#ChốtĐơn99k', '#ThanhGiọng', '#NhaĐam'],
      dialogues: ["Em nói liên tục 4 tiếng livestream, trà hoa cúc này đúng là cứu tinh giọng!", "Mấy chị em ơi, ai mua đầm tặng ly boba chị Thảo nè!", "Đơn hôm nay nổ tưng bừng luôn rồi chị ơi!"],
      palette: { hair: '#831843', skin: '#FFE0BD', clothes: '#FB7185', sub: '#FFF1F2', pants: '#BE185D' },
      style: 'seller_girl', prop: 'phone'
    },
    {
      id: 19, name: 'Nam Barista Cà Phê Đặc Sản', role: 'CHUYÊN GIA PHA CHẾ TRẺ', cat: 'genz',
      age: '24 tuổi', personality: 'Tinh tế, sành sỏi về vị',
      favoriteDrink: 'Trà Sữa Rang Thiết Quan Âm',
      desc: 'Tạp dề da bò, xách ấm rót cổ ngỗng v60, đến học hỏi cách ủ trà của tiền bối.',
      tags: ['#TạpDềDa', '#ẤmCổNgỗng', '#TràRang'],
      dialogues: ["Nhiệt độ ủ trà Thiết Quan Âm của chị Thảo canh chuẩn đến từng độ C!", "Mùi thơm khói rang này kết hợp sữa tươi ngậy quá tuyệt.", "Hai đứa mình trao đổi công thức pha chế chút nha Thảo!"],
      palette: { hair: '#451A03', skin: '#FCD7B0', clothes: '#78350F', sub: '#FDE68A', pants: '#1C1917' },
      style: 'barista', prop: 'kettle'
    },
    {
      id: 20, name: 'Hà Nhiếp Ảnh Film Vintage', role: 'DÂN CHỤP ẢNH TỰ DO', cat: 'genz',
      age: '22 tuổi', personality: 'Trầm tư, yêu cái đẹp hoài niệm',
      favoriteDrink: 'Trà Sữa Ô Long Nướng Hạt Dẻ',
      desc: 'Máy ảnh cơ film kim loại đeo trước ngực, phong cách vintage áo khoác măng-tô ngắn.',
      tags: ['#MáyẢnhFilm', '#HoàiNiệm', '#HạtDẻNướng'],
      dialogues: ["Chị Thảo giữ nguyên dáng cười lắc bình nhé, em chụp một tấm film 35mm!", "Màu ánh sáng ở tiệm chị lên film hạt grain đẹp mê ly.", "Vừa ngắm ảnh vừa nhâm nhi vị hạt dẻ bùi bùi."],
      palette: { hair: '#292524', skin: '#FCD7B0', clothes: '#A16207', sub: '#FEF08A', pants: '#44403C' },
      style: 'photographer', prop: 'camera'
    },
    {
      id: 21, name: 'Đạt Phượt Thủ Xuyên Việt', role: 'BACKPACKER VIỆT', cat: 'genz',
      age: '24 tuổi', personality: 'Bụi bặm, ưa khám phá',
      favoriteDrink: 'Trà Sâm Dứa Sữa Đá Khổng Lồ',
      desc: 'Áo khoác gió cản bụi, khăn rằn quấn cổ, vừa hoàn thành cung đường Tây Bắc.',
      tags: ['#KhănRằn', '#PhượtXuyênViệt', '#SâmDứa'],
      dialogues: ["Đi khắp bốn phương trời vẫn nhớ vị boba sâm dứa chị Thảo pha!", "Chạy xe máy 300km đường đèo vào tiệm làm ngụm là tỉnh rụi.", "Việt Nam mình đẹp lắm, trà của Thảo cũng ngon vô địch!"],
      palette: { hair: '#1C1917', skin: '#D79E6D', clothes: '#15803D', sub: '#FEF2F2', pants: '#1F2937' },
      style: 'traveler', prop: 'backpack'
    },

    // --- NHÓM 3: DÂN CÔNG SỞ & NGHỀ NGHIỆP (22 -> 33) ---
    {
      id: 22, name: 'Hoàng Senior IT Developer', role: 'KỸ SƯ PHẦN MỀM FIX BUG', cat: 'pro',
      age: '29 tuổi', personality: 'Logic, ít nói nhưng mê ngọt',
      favoriteDrink: 'Hồng Trà Macchiato Gấp 3 Shot Trà',
      desc: 'Kính cận dày, laptop dán kín sticker lập trình, quầng mắt biến mất khi chạm vị boba.',
      tags: ['#FixBugXuyênĐêm', '#LaptopDev', '#Macchiato'],
      dialogues: ["Đang có bug ngàn sao trên server production, cần ly trà sữa xua tan stress!", "Code chạy mượt như trân châu lọt qua ống hút to!", "Deploy thành công rồi, khao cả team 10 ly em Thảo ơi!"],
      palette: { hair: '#1A2327', skin: '#FCD5B5', clothes: '#BFDBFE', sub: '#1E3A8A', pants: '#334155' },
      style: 'office', prop: 'laptop'
    },
    {
      id: 23, name: 'Mai HR Tuyển Dụng', role: 'CHUYÊN VIÊN NHÂN SỰ', cat: 'pro',
      age: '27 tuổi', personality: 'Khéo léo, tươi cười, chu đáo',
      favoriteDrink: 'Trà Sữa Hoa Hồng Trắng Thạch Nha Đam',
      desc: 'Váy công sở thanh lịch, kẹp file ứng viên, luôn là người gom order boba cho cả phòng.',
      tags: ['#VáyCôngSở', '#GomOrderTeam', '#HoaHồng'],
      dialogues: ["Thảo ơi xuất hóa đơn công ty cho chị nha, phòng chị gom 25 ly!", "Trà sữa là chìa khóa gắn kết tinh thần đồng nghiệp số 1.", "Uống ly này xong phỏng vấn ứng viên tràn đầy năng lượng!"],
      palette: { hair: '#4A044E', skin: '#FFE0BD', clothes: '#F472B6', sub: '#FFFFFF', pants: '#4A044E' },
      style: 'office_woman', prop: 'folder'
    },
    {
      id: 24, name: 'Huy Shipper Bất Bại', role: 'CHIẾN THẦN GIAO HÀNG HỎA TỐC', cat: 'pro',
      age: '26 tuổi', personality: 'Nhanh nhẹn, trung thực, chịu khó',
      favoriteDrink: 'Trà Tắc Khổng Lồ 1 Lít Nạp Năng Lượng',
      desc: 'Áo khoác xanh phản quang, mũ bảo hiểm chuẩn chỉnh, thùng giữ nhiệt sau lưng.',
      tags: ['#GiaoHỏaTốc', '#ÁoPhảnQuang', '#TràTắc1Lít'],
      dialogues: ["Chị Thảo ơi đơn #9928 của em 6 ly xong chưa, khách đang ngóng!", "Trưa nắng chang chang tạt vào làm hớp trà tắc là hồi máu!", "Đánh giá 5 sao cho tiệm chị trên app nha!"],
      palette: { hair: '#1E293B', skin: '#D79E6D', clothes: '#16A34A', sub: '#F1F5F9', pants: '#1E293B' },
      style: 'shipper', prop: 'shipper_box'
    },
    {
      id: 25, name: 'Bác Sĩ Trực Cấp Cứu', role: 'BÁC SĨ BỆNH VIỆN ĐA KHOA', cat: 'pro',
      age: '34 tuổi', personality: 'Tận tụy, bình tĩnh, ấm áp',
      favoriteDrink: 'Trà Thảo Mộc Kỷ Tử Ít Đường 30%',
      desc: 'Áo blouse trắng tinh, ống nghe quàng cổ, vừa xong ca mổ trực đêm dài 8 tiếng.',
      tags: ['#ÁoBlouseTrắng', '#ỐngNgheYKhoa', '#HồiSức'],
      dialogues: ["Vừa hoàn thành ca cấp cứu thành công, ghé tiệm Thảo uống ly trà thơm.", "Ít đường nhiều thảo mộc vừa tốt sức khỏe vừa ấm bụng.", "Chúc cô chủ luôn xinh tươi và đông khách nhé!"],
      palette: { hair: '#334155', skin: '#FCD7B0', clothes: '#FFFFFF', sub: '#0284C7', pants: '#0F172A' },
      style: 'doctor', prop: 'stethoscope'
    },
    {
      id: 26, name: 'Cô Giáo Mai Dạy Văn', role: 'GIÁO VIÊN TRUNG HỌC', cat: 'pro',
      age: '30 tuổi', personality: 'Dịu dàng, truyền cảm hứng',
      favoriteDrink: 'Trà Sen Vàng Hạt Sen Bùi Béo',
      desc: 'Áo dài lụa hồng phấn nhã nhặn, cặp tài liệu chấm bài thi học kỳ.',
      tags: ['#ÁoDàiLụa', '#ChấmBàiThi', '#HạtSenVàng'],
      dialogues: ["Giảng 4 tiết văn liền, có ly trà sen của em Thảo cổ họng êm hẳn.", "Vị thanh tao của sen như áng văn mùa thu vậy em.", "Mấy em học sinh lớp cô khen cô chủ tiệm này xinh lắm đó!"],
      palette: { hair: '#18181B', skin: '#FFE0BD', clothes: '#F472B6', sub: '#FDF2F8', pants: '#FFFFFF' },
      style: 'teacher', prop: 'chalk'
    },
    {
      id: 27, name: 'Thợ Điện Thành Phố', role: 'KỸ THUẬT VIÊN LƯỚI ĐIỆN', cat: 'pro',
      age: '33 tuổi', personality: 'Dũng cảm, tháo vát',
      favoriteDrink: 'Trà Chanh Muối Sủi Bọt Bù Khoáng',
      desc: 'Mũ bảo hộ cam, đai an toàn móc kìm búa, vừa bảo trì đường dây cột cao.',
      tags: ['#MũBảoHộCam', '#ĐaiDụngCụ', '#BùKhoáng'],
      dialogues: ["Leo cột điện cả buổi sáng mồ hôi ướt đẫm lưng áo.", "Trà chanh muối của em Thảo bù điện giải cực kỳ chuẩn xác!", "Đóng điện lại sáng rực cả khu phố rồi cô chủ nha!"],
      palette: { hair: '#292524', skin: '#D79E6D', clothes: '#EA580C', sub: '#FACC15', pants: '#1E293B' },
      style: 'electrician', prop: 'wrench'
    },
    {
      id: 28, name: 'Anh Cảnh Sát Giao Thông', role: 'CHIẾN SĨ CSGT NGÃ TƯ', cat: 'pro',
      age: '31 tuổi', personality: 'Nghiêm minh, thân thiện',
      favoriteDrink: 'Trà Sữa Oolong Lạnh Không Ngọt',
      desc: 'Sắc phục vàng đồng nghiêm trang, gậy điều khiển giao thông dắt thắt lưng.',
      tags: ['#SắcPhụcVàng', '#ĐiềuTiếtGiaoThông', '#TỉnhTáo'],
      dialogues: ["Ngã tư giờ tan tầm đông đúc, uống ngụm oolong mát lịm giữ bình tĩnh.", "Bà con đi lại chấp hành tín hiệu giao thông rất tốt!", "Em Thảo nhớ nhắc shipper đỗ xe gọn gàng hè phố nhé."],
      palette: { hair: '#0F172A', skin: '#D79E6D', clothes: '#EAB308', sub: '#854D0E', pants: '#854D0E' },
      style: 'police', prop: 'baton'
    },
    {
      id: 29, name: 'Bếp Trưởng Khách Sạn 5 Sao', role: 'CHEF TRƯỞNG NHÀ HÀNG', cat: 'pro',
      age: '38 tuổi', personality: 'Khắt khe về hương vị, đam mê ẩm thực',
      favoriteDrink: 'Trà Earl Grey Kem Cheese Nướng Vỏ Cam',
      desc: 'Mũ toque trắng cao vút, áo đầu bếp hai hàng khuy ngực sang trọng.',
      tags: ['#MũToqueTrắng', '#ẨmThực5Sao', '#VịTràTinhTế'],
      dialogues: ["Kỹ thuật đánh bọt kem cheese của cô chủ đạt độ mịn emulsion tuyệt đối!", "Hương cam bergamot hòa quyện nền sữa tròn trịa.", "Hôm nào Thảo sang bếp của anh giao lưu món tráng miệng nhé!"],
      palette: { hair: '#27272A', skin: '#FCD7B0', clothes: '#FFFFFF', sub: '#000000', pants: '#18181B' },
      style: 'chef', prop: 'knife'
    },
    {
      id: 30, name: 'Nữ Luật Sư Tố Tụng', role: 'LUẬT SƯ TRANH TỤNG', cat: 'pro',
      age: '32 tuổi', personality: 'Sắc bén, bản lĩnh',
      favoriteDrink: 'Americano Pha Hồng Trà Boba Đen',
      desc: 'Bộ vest đen quyền lực, cặp táp da cá sấu, vừa bước ra từ phiên tòa thắng kiện.',
      tags: ['#VestĐen', '#ThắngKiện', '#SắcSảo'],
      dialogues: ["Vừa bảo vệ thành công quyền lợi cho thân chủ tại tòa!", "Vị đắng cà phê pha ngọt boba là sự cân bằng hoàn hảo.", "Chứng cứ rõ ràng: tiệm trà sữa của Thảo ngon nhất quận!"],
      palette: { hair: '#18181B', skin: '#FFE0BD', clothes: '#09090B', sub: '#FFFFFF', pants: '#09090B' },
      style: 'lawyer', prop: 'briefcase'
    },
    {
      id: 31, name: 'Phi Công Tuyến Quốc Tế', role: 'CƠ TRƯỞNG AIRLINE', cat: 'pro',
      age: '36 tuổi', personality: 'Phong độ, đĩnh đạc',
      favoriteDrink: 'Trà Sữa Thiết Quan Âm 5 Tầng Mây',
      desc: 'Đồng phục phi công cầu vai 4 vạch vàng, kính râm aviator lịch lãm.',
      tags: ['#CầuVai4Vạch', '#BayXuyênLụcĐịa', '#PhiCông'],
      dialogues: ["Vừa hạ cánh chuyến bay 12 tiếng từ Frankfurt xuống Tân Sơn Nhất!", "Uống boba ở độ cao 10.000 mét không đâu bằng tiệm cô chủ Thảo dưới mặt đất.", "Chuẩn bị cho chuyến bay kế tiếp thôi!"],
      palette: { hair: '#334155', skin: '#FCD7B0', clothes: '#1E3A8A', sub: '#FACC15', pants: '#0F172A' },
      style: 'pilot', prop: 'aviator'
    },
    {
      id: 32, name: 'Anh Thợ Rèn Mỹ Nghệ', role: 'NGHỆ NHÂN KIM KHÍ', cat: 'pro',
      age: '35 tuổi', personality: 'Mộc mạc, bền bỉ',
      favoriteDrink: 'Trà Đen Đá Đường Phèn Lửa Đỏ',
      desc: 'Bắp tay gân guốc, tạp dề da chống nhiệt, vừa gõ xong tác phẩm sắt nghệ thuật.',
      tags: ['#TạpDềDaLửa', '#BắpTayKhỏe', '#ĐườngPhèn'],
      dialogues: ["Bên lò than rực 1000 độ mà có ly trà đá đường phèn thì quý như vàng!", "Thép phải tôi qua lửa đỏ, trà phải hãm đúng thời gian mới quý.", "Để anh rèn tặng Thảo cái móc treo bình shaker nhé!"],
      palette: { hair: '#1F2937', skin: '#C28456', clothes: '#78350F', sub: '#DC2626', pants: '#18181B' },
      style: 'blacksmith', prop: 'hammer'
    },
    {
      id: 33, name: 'Cô Dược Sĩ Khu Phố', role: 'DƯỢC SĨ HIỆU THUỐC', cat: 'pro',
      age: '28 tuổi', personality: 'Tỉ mỉ, chu đáo',
      favoriteDrink: 'Trà Atiso Đỏ Hạt Chia Thanh Nhiệt',
      desc: 'Áo blouse xanh lơ y tế, am hiểu từng thành phần dinh dưỡng và calo trong đồ uống.',
      tags: ['#ÁoBlouseXanh', '#AtisoĐỏ', '#HạtChia'],
      dialogues: ["Hôm nay Thảo dùng đường mía hữu cơ đúng không, chỉ số glycemic rất an toàn!", "Màu đỏ atiso giàu chất chống oxy hóa tuyệt vời.", "Khu phố mình ai cũng khoẻ mạnh là chị vui nhất."],
      palette: { hair: '#3E2723', skin: '#FFE0BD', clothes: '#E0F2FE', sub: '#0284C7', pants: '#0369A1' },
      style: 'pharmacist', prop: 'pill'
    },

    // --- NHÓM 4: TRUNG NIÊN & CAO NIÊN (34 -> 42) ---
    {
      id: 34, name: 'Cô Ba Hàng Xóm', role: 'HỘI TRƯỞNG TỔ DÂN PHỐ', cat: 'elder',
      age: '53 tuổi', personality: 'Sôi nổi, hào hiệp, biết tuốt',
      favoriteDrink: 'Trà Sen Vàng Kem Béo Ít Ngọt',
      desc: 'Đồ bộ hoa nhí rực rỡ, búi tóc kẹp càng cua, phe phẩy quạt nan dừa rôm rả chuyện ngõ.',
      tags: ['#ĐồBộBông', '#QuạtNanDừa', '#KẹpCàngCua'],
      dialogues: ["Con Thảo khéo tay ghê, tiệm lúc nào cũng nườm nượp khách!", "Pha cô ly ít đường thôi con gái nha, cái lưỡi thèm mà sợ lên cân!", "Trà sen của con thơm nức cả đầu ngõ cuối hẻm!"],
      palette: { hair: '#262626', skin: '#FCD7B0', clothes: '#E11D48', sub: '#FDE047', pants: '#BE123C' },
      style: 'neighbor', prop: 'fan'
    },
    {
      id: 35, name: 'Cụ Đồ Phố Cổ', role: 'BẬC THẦY THƯ PHÁP VIỆT', cat: 'elder',
      age: '78 tuổi', personality: 'Uyên bác, ung dung, nho nhã',
      favoriteDrink: 'Trà Mạn Thượng Hạng Ướp Hoa Nhài',
      desc: 'Áo the khăn xếp xanh thẫm, chòm râu bạc dài bay nhẹ, tay cầm bút lông viết chữ Phúc.',
      tags: ['#KhănXếpÁoDài', '#RâuBạcTiênÔng', '#ThưPháp'],
      dialogues: ["Thanh tao một chén trà đượm tình, trần thế âu lo hoá hư vô.", "Lão tặng cháu Thảo bức đại tự: 'Hương Trà Tụ Phúc - Tâm Tịnh Sinh Tài'.", "Cháu gái còn trẻ mà nấu trà khéo léo, giữ được vị trà hồn cốt dân tộc."],
      palette: { hair: '#F8FAFC', skin: '#F5CBA7', clothes: '#1E3A8A', sub: '#FBBF24', pants: '#F8FAFC' },
      style: 'calligrapher', prop: 'brush'
    },
    {
      id: 36, name: 'Ông Bảy Thợ Mộc Lão Thành', role: 'NGHỆ NHÂN ĐỒ GỖ HƯU TRÍ', cat: 'elder',
      age: '66 tuổi', personality: 'Trầm ấm, tỉ mỉ',
      favoriteDrink: 'Trà Đen Nóng Mật Ong Rừng',
      desc: 'Áo ghi-lê túi hộp, thước gỗ vắt tai, bàn tay dày dặn từng đóng quầy bar cho tiệm trà.',
      tags: ['#ThướcGỗ', '#MùiGỗTrầm', '#MậtOngRừng'],
      dialogues: ["Mấy cái kệ gỗ thông này ông đóng cho cháu Thảo nhìn vẫn bóng đẹp ghê!", "Trà đen nóng ấm cổ họng tuổi già.", "Gỗ tốt bền năm tháng, trà cháu nấu ngon nhớ mãi."],
      palette: { hair: '#94A3B8', skin: '#D79E6D', clothes: '#451A03', sub: '#A16207', pants: '#292524' },
      style: 'elder_man', prop: 'ruler'
    },
    {
      id: 37, name: 'Bà Tư Bán Bánh Mì Pate', role: 'CHỦ XE BÁNH MÌ ĐẦU NGÕ', cat: 'elder',
      age: '60 tuổi', personality: 'Xởi lởi, chăm chỉ',
      favoriteDrink: 'Trà Sữa Truyền Thống Đậm Trà Sữa Đặc',
      desc: 'Tạp dề hoa sẫm, xách đòn bánh mì giòn rụm qua đổi ly trà sữa với chị Thảo.',
      tags: ['#BánhMìGiòn', '#TìnhLàngNghĩaXóm', '#SữaĐặc'],
      dialogues: ["Thảo ơi bánh mì pate nóng hổi mới ra lò đổi ly trà sữa nè con!", "Pha sữa đặc ngọt lịm như bà thích nha con gái cưng.", "Hàng xóm tối lửa tắt đèn có nhau ấm lòng ghê."],
      palette: { hair: '#52525B', skin: '#FCD7B0', clothes: '#B45309', sub: '#FEF3C7', pants: '#451A03' },
      style: 'bread_lady', prop: 'bread'
    },
    {
      id: 38, name: 'Võ Sư Vovinam Bạch Đai', role: 'VÕ SƯ CỔ TRUYỀN', cat: 'elder',
      age: '58 tuổi', personality: 'Khí phách, cương trực, dẻo dai',
      favoriteDrink: 'Trà Gừng Nướng Trân Châu Hoàng Kim',
      desc: 'Võ phục xanh lam truyền thống, đai quấn chắc nịch, đứng tấn vững như bàn thạch.',
      tags: ['#VõPhụcXanhLam', '#ĐứngTấn', '#TràGừngẤm'],
      dialogues: ["Luyện quyền xong khí huyết lưu thông, thêm ngụm trà gừng trọn vẹn!", "Võ thuật rèn tâm tính, pha trà rèn sự nhẫn nại kiên trì.", "Cháu Thảo vung bình lắc có dáng cổ tay rất dẻo và lực đấy nhé!"],
      palette: { hair: '#E2E8F0', skin: '#D79E6D', clothes: '#2563EB', sub: '#DC2626', pants: '#1D4ED8' },
      style: 'martial_master', prop: 'fist'
    },
    {
      id: 39, name: 'Bác Tài Xe Ôm Công Nghệ', role: 'TÀI XẾ XE ÔM LÂU NĂM', cat: 'elder',
      age: '56 tuổi', personality: 'Hiền lành, chịu thương chịu khó',
      favoriteDrink: 'Trà Đá Đường Trân Châu Trắng',
      desc: 'Áo khoác sờn vai quen thuộc, điếu thuốc gài tai (chưa châm), chở khách mưu sinh nuôi con đại học.',
      tags: ['#BácTàiXeÔm', '#NuôiConĂnHọc', '#TrânChâuTrắng'],
      dialogues: ["Chở cuốc khách từ bến xe qua đây, ghé cháu Thảo làm ly giải khát.", "Con gái lớn của bác sắp tốt nghiệp đại học rồi đó con!", "Trà ngọt mát lòng người cha vất vả."],
      palette: { hair: '#64748B', skin: '#C28456', clothes: '#047857', sub: '#FCD34D', pants: '#1F2937' },
      style: 'driver', prop: 'helmet'
    },
    {
      id: 40, name: 'Bà Ngoại Đan Áo Len', role: 'NGƯỜI BÀ HIỀN TỪ', cat: 'elder',
      age: '72 tuổi', personality: 'Từ ái, bao dung',
      favoriteDrink: 'Sữa Đậu Nành Trân Châu Nóng',
      desc: 'Đeo kính lão trễ mũi, cuộn len hồng và que đan thoăn thoắt đan khăn cho cháu.',
      tags: ['#CuộnLenHồng', '#ĐanKhănCháu', '#SữaNóng'],
      dialogues: ["Thảo cho bà ly sữa đậu nóng hổi nha con, trời se se lạnh rồi.", "Bà đan cái khăn len hồng này tặng cô chủ nhỏ xinh xắn đó.", "Nhìn cháu Thảo nhanh nhẹn dễ thương bà quý như cháu ruột."],
      palette: { hair: '#E2E8F0', skin: '#FFE0BD', clothes: '#BE185D', sub: '#FCE7F3', pants: '#831843' },
      style: 'grandma', prop: 'yarn'
    },
    {
      id: 41, name: 'Thầy Giáo Về Hưu', role: 'NGUYÊN HIỆU TRƯỞNG TRƯỜNG HUYỆN', cat: 'elder',
      age: '68 tuổi', personality: 'Mẫu mực, trầm ngâm',
      favoriteDrink: 'Trà Ô Long Thuần Khiết Không Đá',
      desc: 'Áo sơ mi cài khuy cổ nghiêm túc, tay cầm tờ báo sáng chăm chú đọc tin tức.',
      tags: ['#TờBáoSáng', '#NgườiThầyKínhYêu', '#TràThanhVị'],
      dialogues: ["Nhìn tụi nhỏ tan trường ùa vào quán làm tôi nhớ bục giảng xưa quá.", "Vị trà oolong của cô Thảo sâu lắng, hậu vị ngọt thanh rất lâu.", "Mỗi học trò trưởng thành là niềm hạnh phúc lớn nhất của đời dạy học."],
      palette: { hair: '#CBD5E1', skin: '#FCD7B0', clothes: '#F8FAFC', sub: '#334155', pants: '#1E293B' },
      style: 'teacher_elder', prop: 'newspaper'
    },
    {
      id: 42, name: 'Bác Làm Vườn Sinh Thái', role: 'NGHỆ NHÂN CÂY CẢNH BONSAI', cat: 'elder',
      age: '62 tuổi', personality: 'Yêu thiên nhiên, thảnh thơi',
      favoriteDrink: 'Trà Hoa Đậu Biếc Chanh Vàng Mật Hoa',
      desc: 'Nón lá rộng vành, tạp dề vải thô dính chút đất mùn, tay cầm kéo tỉa lá bonsai.',
      tags: ['#KéoTỉaBonsai', '#HươngHoaCỏ', '#YêuCâyXanh'],
      dialogues: ["Mấy chậu cúc họa mi trước cửa tiệm bác tỉa lại nở hoa xinh đón khách rồi Thảo nhé!", "Trà đổi màu tím biếc khi vắt chanh vào như phép màu của tự nhiên.", "Uống xong về uốn nốt dáng cây mai vàng đón Tết."],
      palette: { hair: '#64748B', skin: '#D79E6D', clothes: '#365314', sub: '#84CC16', pants: '#1C1917' },
      style: 'gardener', prop: 'scissors'
    },

    // --- NHÓM 5: KHÁCH ĐẶC BIỆT & ĐA DẠNG (43 -> 50) ---
    {
      id: 43, name: 'Gymer Vạm Vỡ Thích Ngọt', role: 'VẬN ĐỘNG VIÊN THỂ HÌNH', cat: 'special',
      age: '27 tuổi', personality: 'Mạnh mẽ nhưng tâm hồn kẹo ngọt',
      favoriteDrink: 'Sữa Tươi Trân Châu Thêm 2 Muỗng Whey Protein',
      desc: 'Áo ba lỗ khoét nách lộ cơ xô cuồn cuộn, xách bình lắc whey 2 lít đi tập cheat day.',
      tags: ['#CơBắpCuồnCuộn', '#CheatDayBoba', '#WheyProtein'],
      dialogues: ["Chị Thảo ơi hôm nay là Cheat Day, cho em ly sữa tươi full topping gấp đôi đạm!", "Gánh tạ 200kg không sướng bằng hút ngụm trân châu dẻo quánh này!", "Tập nặng cả tuần chỉ chờ giây phút ghé tiệm chị thôi!"],
      palette: { hair: '#18181B', skin: '#E0A97E', clothes: '#DC2626', sub: '#FACC15', pants: '#18181B' },
      style: 'gymer', prop: 'dumbbell'
    },
    {
      id: 44, name: 'Cặp Đôi Gà Bông Hẹn Hò', role: 'TÌNH YÊU KẸO NGỌT TUỔI TRẺ', cat: 'special',
      age: '19 tuổi', personality: 'Ngọt ngào, đáng yêu, quấn quýt',
      favoriteDrink: '1 Ly Khổng Lồ Cắm 2 Ống Hút Hồng & Xanh',
      desc: 'Mặc áo đôi in nửa trái tim ghép lại, kề má cười tít mắt uống chung một ly boba.',
      tags: ['#ÁoĐôiTráiTim', '#2ỐngHút', '#HẹnHòĐầuTiên'],
      dialogues: ["Anh hút trân châu đi, em uống lớp kem phô mai béo béo cho!", "Uống chung một ly ngọt ngào gấp đôi luôn chị Thảo ơi.", "Quán chị Thảo là nơi chúng em gặp nhau lần đầu tiên đó!"],
      palette: { hair: '#3E2723', skin: '#FFE0BD', clothes: '#EC4899', sub: '#0284C7', pants: '#1E293B' },
      style: 'couple', prop: 'shared_cup'
    },
    {
      id: 45, name: 'David Tây Ba-Lô Mê Phở', role: 'KHÁCH DU LỊCH QUỐC TẾ', cat: 'special',
      age: '28 tuổi', personality: 'Hào hứng, yêu văn hóa Việt Nam',
      favoriteDrink: 'Trà Sữa Thái Xanh Full Topping Bánh Flan',
      desc: 'Tóc vàng rực rỡ, áo hoa Hawaii, balo leo núi to đùng, nói tiếng Việt lơ lớ cực kỳ vui tính.',
      tags: ['#ÁoHawaii', '#BaloDuLịch', '#TôiYêuViệtNam'],
      dialogues: ["Xin chao chi Thao! Mot ly tra sua tran chau sieu to please!", "Boba by sister Thao is number one in the whole world!", "Toi yeu con nguoi va am thuc Viet Nam rat nhieu!"],
      palette: { hair: '#FACC15', skin: '#FFDFC4', clothes: '#0284C7', sub: '#EF4444', pants: '#B45309' },
      style: 'foreigner', prop: 'boba'
    },
    {
      id: 46, name: 'Ảo Thuật Gia Đường Phố', role: 'MAGICIAN BIỂU DIỄN', cat: 'special',
      age: '26 tuổi', personality: 'Bí ẩn, hài hước, biến hóa',
      favoriteDrink: 'Trà Sủi Bọt Đổi Màu Phép Thuật',
      desc: 'Mũ ảo thuật đen cao, áo choàng lót đỏ, vừa làm biến mất lá bài bay vào ly trà sữa.',
      tags: ['#MũẢoThuật', '#BộBàiPhépThuật', '#BiếnHóa'],
      dialogues: ["Úm ba la xì bùa! Trân châu đen biến thành trân châu hoàng kim!", "Chị Thảo nhìn kĩ nhé, lá bài Át Bích đang nằm dưới đáy ly boba!", "Nụ cười rạng rỡ của cô chủ chính là phép thuật kỳ diệu nhất."],
      palette: { hair: '#09090B', skin: '#FCD7B0', clothes: '#09090B', sub: '#DC2626', pants: '#1E293B' },
      style: 'magician', prop: 'wand'
    },
    {
      id: 47, name: 'Lính Cứu Hỏa Quả Cảm', role: 'CHIẾN SĨ PCCC CỨU NẠN', cat: 'special',
      age: '30 tuổi', personality: 'Kiên cường, quả cảm, trượng nghĩa',
      favoriteDrink: 'Hồng Trà Băng Tuyết Mát Lạnh Cực Độ',
      desc: 'Bộ đồ chống cháy màu vàng cát, vệt khói xám trên má, vừa cứu hộ an toàn cho người dân.',
      tags: ['#LínhCứuHỏa', '#QuảCảm', '#BăngTuyếtCứuHỏa'],
      dialogues: ["Dập tắt đám cháy bảo vệ bình yên cho bà con xong nhẹ cả người!", "Ly trà băng tuyết này làm mát dịu cơn nóng sau ca chiến đấu.", "Em Thảo nhớ luôn kiểm tra bình chữa cháy định kỳ nhé em!"],
      palette: { hair: '#1E293B', skin: '#D79E6D', clothes: '#CA8A04', sub: '#EF4444', pants: '#854D0E' },
      style: 'firefighter', prop: 'extinguisher'
    },
    {
      id: 48, name: 'Nhà Du Hành Vũ Trụ Pixel', role: 'ASTRONAUT TƯƠNG LAI', cat: 'special',
      age: '29 tuổi', personality: 'Mơ mộng viễn tưởng, hiếu kỳ',
      favoriteDrink: 'Trà Sữa Thiên Hà Hạt Trân Châu Ngân Hà',
      desc: 'Bộ đồ phi hành gia trắng với mũ bảo hiểm kính phản quang vũ trụ lấp lánh sao đêm.',
      tags: ['#PhiHànhGia', '#VũTrụPixel', '#TràNgânHà'],
      dialogues: ["Một ngụm boba nhỏ cho con người, một bước tiến lớn cho vũ trụ trà sữa!", "Từ trạm không gian nhìn xuống, tiệm của cô chủ Thảo phát sáng rực rỡ.", "Đem trân châu lên trồng trên Sao Hỏa chắc chắn sẽ thành công!"],
      palette: { hair: '#0F172A', skin: '#FFE0BD', clothes: '#F8FAFC', sub: '#38BDF8', pants: '#E2E8F0' },
      style: 'astronaut', prop: 'helmet_space'
    },
    {
      id: 49, name: 'Chú Hề Bong Bóng Diệu Kỳ', role: 'DIỄN VIÊN BONG BÓNG NGHỆ THUẬT', cat: 'special',
      age: '25 tuổi', personality: 'Hài hước, đem lại niềm vui',
      favoriteDrink: 'Trà Sữa Kẹo Bông Gòn Bảy Màu',
      desc: 'Mũi tròn đỏ chú hề, tóc xoăn sặc sỡ, tay thoăn thoắt vặn bong bóng hình ly trà sữa.',
      tags: ['#MũiĐỏChúHề', '#BongBóngBoba', '#TiếngCười'],
      dialogues: ["Tèn ten! Chú hề tặng chị Thảo chú gấu bong bóng ôm ly trà sữa nè!", "Uống ngụm trà sữa ngọt lịm là có thêm 100 trò vui chọc các bé cười!", "Nụ cười của mọi người là món quà tuyệt vời nhất!"],
      palette: { hair: '#0284C7', skin: '#FFE0BD', clothes: '#FBBF24', sub: '#EF4444', pants: '#8B5CF6' },
      style: 'clown', prop: 'balloon'
    },
    {
      id: 50, name: 'Bé Mèo Thần Tài Boba', role: 'LINH VẬT MAY MẮN CỦA QUÁN', cat: 'special',
      age: '3 tuổi mèo', personality: 'Ngoan ngoãn, vẫy khách siêu tài',
      favoriteDrink: 'Sữa Tươi Tiệt Trùng Bát Trân Châu Nhỏ',
      desc: 'Mèo tam thể mũm mĩm đeo lục lạc vàng leng keng, ngồi trên quầy vẫy tay mời khách.',
      tags: ['#MèoThầnTài', '#VẫyKháchMayMắn', '#LinhVậtQuán'],
      dialogues: ["Meo meo~ Chị Thảo ơi khách đông kín tiệm rồi kìa meo!", "Vẫy tay trái mang lại tài lộc, vẫy tay phải đem lại niềm vui!", "Meo~ Cho bé xin một thìa pudding thơm béo nha chị Thảo!"],
      palette: { hair: '#EA580C', skin: '#FFFFFF', clothes: '#EF4444', sub: '#FACC15', pants: '#FFFFFF' },
      style: 'lucky_cat', prop: 'bell'
    },

    // --- CÁC NHÂN VẬT ĐẶC BIỆT MỚI (51 -> 55) ---
    {
      id: 51, name: 'Bà Bảy Bán Chè Bưởi', role: 'NGHỆ NHÂN CHÈ TRUYỀN THỐNG', cat: 'traditional',
      age: '65 tuổi', personality: 'Hiền hậu, hào sảng, sành ăn đồ ngọt',
      favoriteDrink: 'Trà Sữa Truyền Thống',
      desc: 'Chiếc nón lá mộc mạc, nụ cười đôn hậu của bà cụ bán chè bưởi thơm nức tiếng đầu ngõ.',
      tags: ['#BàBảyChèBưởi', '#ĐượmHươngTruyềnThống', '#SànhĂnNgọt'],
      dialogues: [
        "Bà nếm thử thấy trà sữa của con đậm đà, trân châu dẻo bùi chuẩn chỉ lắm!",
        "Hôm nào rảnh qua gánh chè bà cho chén chè bưởi giòn sần sật béo ngậy nước cốt dừa nha!",
        "Bán buôn có tâm thế này khách ủng hộ dài dài con ơi!"
      ],
      palette: { hair: '#94A3B8', skin: '#FCD7B0', clothes: '#0D9488', sub: '#CCFBF1', pants: '#1F2937' },
      style: 'grandma', prop: 'basket'
    },
    {
      id: 52, name: 'Shark Hưng Đầu Tư', role: 'NHÀ ĐẦU TƯ SHARK TANK VIP', cat: 'vip',
      age: '45 tuổi', personality: 'Quyết đoán, sắc bén, chịu chi',
      favoriteDrink: 'Trà Ô Long Nướng Sương Sáo',
      desc: 'Bộ vest xanh navy lịch lãm, phong thái đĩnh đạc, sẵn sàng rót vốn đầu tư chuỗi quán lớn.',
      tags: ['#SharkHưng', '#ĐầuTưTriệuĐô', '#KháchHàngVIP', '#ChốtĐơnLớn'],
      dialogues: [
        "Tôi đầu tư 500 triệu cho 20% cổ phần chuỗi trà sữa này, chốt đơn!",
        "Hương vị ô long hun khói này có tiềm năng vươn tầm quốc tế đấy!",
        "Tôi mua 20 ly cho toàn bộ ban giám đốc công ty tôi!"
      ],
      palette: { hair: '#1E293B', skin: '#FFE0BD', clothes: '#1E3A8A', sub: '#F59E0B', pants: '#172554' },
      style: 'investor', prop: 'briefcase'
    },
    {
      id: 53, name: 'Trâm Streamer Cosplay', role: 'IDOL LIVESTREAM ANIME', cat: 'streamer',
      age: '20 tuổi', personality: 'Nhí nhảnh, dễ thương, mê sống ảo',
      favoriteDrink: 'Trà Sữa Thái Xanh',
      desc: 'Tóc hồng hai bím tai mèo siêu xinh, cầm gậy selfie livestream kéo theo hàng ngàn fan hâm mộ.',
      tags: ['#TrâmCosplay', '#IdolTikTok', '#StreamerTriệuFollow'],
      dialogues: [
        "Konnichiwa! Em đang live trên TikTok nè, chào 50.000 bạn đang xem đi chị!",
        "Màu xanh thái mát mắt lên hình lung linh quá trời luôn á!",
        "Các bạn fan ơi ghé ủng hộ quán chị Thảo boba nha, ngon xỉu up xỉu down!"
      ],
      palette: { hair: '#EC4899', skin: '#FFE0BD', clothes: '#8B5CF6', sub: '#F472B6', pants: '#DDD6FE' },
      style: 'cosplay', prop: 'phone_live'
    },
    {
      id: 54, name: 'Anh Hiếu IT Chạy Deadline', role: 'SENIOR DEVELOPER THỨC ĐÊM', cat: 'pro',
      age: '28 tuổi', personality: 'Tập trung cao độ, cần caffeine gấp',
      favoriteDrink: 'Trà Ô Long Nướng',
      desc: 'Mắt thâm quầng nhẹ vì fix bug đêm, đeo ba lô laptop, tay gõ phím thoăn thoắt.',
      tags: ['#HiếuCoder', '#ChạyDeadline', '#CầnNhiềuCaffeine', '#FixBugXuyênĐêm'],
      dialogues: [
        "Cứu em một ly ô long nướng đậm đặc x2 trà để em fix bug deploy đêm nay!",
        "Uống ngụm trà sữa này code chạy mượt mà 0 bug luôn chị ơi!",
        "Có ly trà này em gõ bàn phím xuyên màn đêm không biết mệt!"
      ],
      palette: { hair: '#0F172A', skin: '#FCD7B0', clothes: '#0284C7', sub: '#38BDF8', pants: '#334155' },
      style: 'engineer', prop: 'laptop'
    },
    {
      id: 55, name: 'Cô Giáo Mai Dạy Văn', role: 'GIÁO VIÊN TRƯỜNG CHUYÊN', cat: 'teacher',
      age: '32 tuổi', personality: 'Thanh lịch, dịu dàng, chu đáo',
      favoriteDrink: 'Trà Đào Cam Sả',
      desc: 'Tà áo dài hồng cánh sen nhã nhặn, giọng nói truyền cảm nhẹ nhàng như thơ ca.',
      tags: ['#CôGiáoMai', '#ÁoDàiThướtTha', '#ThanhLịchNhẹNhàng'],
      dialogues: [
        "Hương đào và cam sả thanh tao như một khúc ca mùa thu vậy em.",
        "Sau những tiết giảng say sưa, vị trà mát lành làm dịu cổ họng cô rất nhiều.",
        "Chúc quán em ngày càng phát đạt và luôn giữ được cái tâm trong từng ly trà nhé!"
      ],
      palette: { hair: '#3E2723', skin: '#FFE0BD', clothes: '#F43F5E', sub: '#FFE4E6', pants: '#4C0519' },
      style: 'teacher', prop: 'book'
    }
  ];

  // =========================================================================

  // 49 Customer NPCs (excluding Owner at index 0)
  var CUSTOMERS_LIST = CHARACTERS.slice(1);

  // Character height in logical pixels (Sidewalk Y is 148)
  function getCharacterHeight(charOrQuery) {
    var char = getCharacter(charOrQuery);
    if (!char) return 54;
    var s = char.style;
    if (s === 'lucky_cat') return 30;
    if (s === 'kid' || s === 'artist_kid') return 42; // Cute preschool / primary kids
    if (s === 'student_girl' || s === 'ballet_girl') return 50; // Middle school students
    if (s === 'gymer' || s === 'foreigner' || s === 'police' || s === 'pilot' || s === 'firefighter') return 58; // Tall athletic adults
    if (s === 'chef' || s === 'magician') return 58; // Tall hats
    return 54; // Standard adult height
  }

  // Quick lookup helper by name, type, or id
  function getCharacter(query) {
    if (!query && query !== 0) return CUSTOMERS_LIST[0];
    if (typeof query === 'object' && query.name) return query;

    // Number query (type index or id)
    if (typeof query === 'number') {
      if (query >= 1 && query <= CHARACTERS.length) {
        var byId = CHARACTERS.find(function (c) { return c.id === query; });
        if (byId) return byId;
      }
      if (query >= 0 && query < CUSTOMERS_LIST.length) {
        return CUSTOMERS_LIST[query];
      }
      return CUSTOMERS_LIST[query % CUSTOMERS_LIST.length];
    }

    var str = String(query).toLowerCase().trim();
    if (!str) return CUSTOMERS_LIST[0];

    // Exact name match
    var exact = CHARACTERS.find(function (c) { return c.name.toLowerCase() === str; });
    if (exact) return exact;

    // Partial name match
    var partial = CHARACTERS.find(function (c) {
      var n = c.name.toLowerCase();
      return n.includes(str) || str.includes(n);
    });
    if (partial) return partial;

    // Legacy and New keyword aliases
    if (str.includes('bà bảy') || str.includes('chè bưởi')) return CHARACTERS[50];
    if (str.includes('shark') || str.includes('đầu tư')) return CHARACTERS[51];
    if (str.includes('trâm') || str.includes('streamer') || str.includes('cosplay')) return CHARACTERS[52];
    if (str.includes('hiếu') || str.includes('deadline')) return CHARACTERS[53];
    if (str.includes('cô mai') || str.includes('cô giáo') || str.includes('dạy văn')) return CHARACTERS[54];

    // Legacy keyword aliases
    if (str.includes('lan')) return CHARACTERS[2]; // Bé Lan Khăn Quàng
    if (str.includes('nam') || str.includes('văn phòng') || str.includes('office') || str.includes('hoàng')) return CHARACTERS[21]; // Hoàng IT
    if (str.includes('ba') || str.includes('hàng xóm')) return CHARACTERS[33]; // Cô Ba Hàng Xóm
    if (str.includes('tú') || str.includes('tiktok') || str.includes('review')) return CHARACTERS[11]; // Tú TikToker
    if (str.includes('ship') || str.includes('huy')) return CHARACTERS[23]; // Huy Shipper
    if (str.includes('đồ') || str.includes('trưởng phố') || str.includes('thư pháp') || str.includes('bác ba')) return CHARACTERS[34]; // Cụ Đồ
    if (str.includes('gym')) return CHARACTERS[42]; // Gymer
    if (str.includes('gà bông') || str.includes('đôi') || str.includes('duy')) return CHARACTERS[43]; // Cặp Đôi
    if (str.includes('david') || str.includes('tây')) return CHARACTERS[44]; // David Tây Ba-lô
    if (str.includes('vé số') || str.includes('hạnh')) return CHARACTERS[8]; // Bé Hạnh Vé Số
    if (str.includes('mèo') || str.includes('thần tài')) return CHARACTERS[49]; // Bé Mèo Thần Tài
    if (str.includes('thảo') || str.includes('chủ')) return CHARACTERS[0]; // Chị Thảo Boba

    return CUSTOMERS_LIST[0];
  }

  // ==========================================
  // 2. RETRO PIXEL RENDERING PRIMITIVES
  // ==========================================
  function pRect(ctx, x, y, w, h, color) {
    if (!color) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
  }

  function pDot(ctx, x, y, color) {
    if (!color) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }

  function drawBobaCup(ctx, cx, cy, cupColor, teaColor, strawColor, cream) {
    if (cream === undefined) cream = true;
    pRect(ctx, cx, cy + 2, 6, 8, '#FFFFFF33');
    pRect(ctx, cx, cy + 3, 6, 7, cupColor || '#FFFFFF');
    pRect(ctx, cx + 1, cy + 4, 4, 5, teaColor || '#78350F');
    // Ice cubes
    pDot(ctx, cx + 1, cy + 4, '#FFFFFF88');
    pDot(ctx, cx + 3, cy + 5, '#FFFFFF88');
    // Cream foam layer
    if (cream) {
      pRect(ctx, cx + 1, cy + 3, 4, 2, '#FFFDF0');
    }
    // Boba pearls at bottom with shine
    pDot(ctx, cx + 1, cy + 7, '#1E1B18');
    pDot(ctx, cx + 2, cy + 8, '#0A0A0A');
    pDot(ctx, cx + 3, cy + 7, '#1E1B18');
    pDot(ctx, cx + 4, cy + 8, '#0A0A0A');
    pDot(ctx, cx + 2, cy + 7, '#FCD34D'); // shine
    // Lid & Angled Straw
    pRect(ctx, cx - 1, cy + 2, 8, 1, '#ECEFF1');
    pRect(ctx, cx + 2, cy - 2, 2, 4, strawColor || '#EC4899');
    pDot(ctx, cx + 3, cy - 3, '#BE185D');
  }

  // ==========================================
  // 3. MASTER NPC CHARACTER DRAWING ROUTINE
  // ==========================================
  function drawNPCCharacter(ctx, charOrQuery, baseX, baseY, sway, isFront, isDrinking, isBlinking) {
    var char = getCharacter(charOrQuery);
    if (!char) return;

    if (sway === undefined) sway = 0;
    if (isFront === undefined) isFront = false;
    if (isDrinking === undefined) isDrinking = false;
    if (isBlinking === undefined) isBlinking = false;

    var hair = char.palette.hair;
    var skin = char.palette.skin;
    var clothes = char.palette.clothes;
    var sub = char.palette.sub;
    var pants = char.palette.pants;
    var style = char.style;

    // --- SPECIAL 1: BÉ MÈO THẦN TÀI (Lucky Cat on mat) ---
    if (style === 'lucky_cat') {
      var catX = baseX + 2;
      var catY = baseY + 2;
      // Red velvet mat
      pRect(ctx, catX, catY + 23, 20, 3, '#DC2626');
      pRect(ctx, catX + 1, catY + 25, 18, 1, '#FACC15'); // Gold trim

      // Body & Tummy
      pRect(ctx, catX + 3, catY + 10, 14, 14, '#FFFFFF');
      pRect(ctx, catX + 5, catY + 12, 10, 10, '#FFFBEB');
      // Calico orange & black patches
      pRect(ctx, catX + 12, catY + 11, 5, 5, '#EA580C');
      pRect(ctx, catX + 3, catY + 17, 4, 5, '#18181B');
      // Head & Ears with pink inner
      pRect(ctx, catX + 4, catY + 2, 12, 9, '#FFFFFF');
      pRect(ctx, catX + 10, catY + 2, 6, 5, '#EA580C');
      pRect(ctx, catX + 3, catY - 1, 3, 4, '#FFFFFF');
      pDot(ctx, catX + 4, catY + 0, '#F472B6');
      pRect(ctx, catX + 14, catY - 1, 3, 4, '#EA580C');
      pDot(ctx, catX + 15, catY + 0, '#F472B6');
      // Eyes, Whiskers & Nose
      pDot(ctx, catX + 6, catY + 5, '#1E293B');
      pDot(ctx, catX + 7, catY + 5, '#10B981'); // Emerald eye
      pDot(ctx, catX + 13, catY + 5, '#1E293B');
      pDot(ctx, catX + 14, catY + 5, '#10B981');
      pDot(ctx, catX + 10, catY + 6, '#F43F5E'); // Pink nose
      pRect(ctx, catX + 1, catY + 6, 2, 1, '#94A3B8');
      pRect(ctx, catX + 17, catY + 6, 2, 1, '#94A3B8');
      // Red Collar & Golden Bell
      pRect(ctx, catX + 5, catY + 10, 10, 2, '#DC2626');
      pRect(ctx, catX + 9, catY + 12, 3, 3, '#FACC15');
      pDot(ctx, catX + 10, catY + 13, '#B45309');
      // Waving Paw
      var pawY = catY + 6 - (sway * 3);
      pRect(ctx, catX + 16, pawY, 4, 5, '#FFFFFF');
      pDot(ctx, catX + 17, pawY + 1, '#F472B6');
      // Left Hand holding Golden Coin
      pRect(ctx, catX + 1, catY + 14, 4, 4, '#FFFFFF');
      pRect(ctx, catX + 1, catY + 17, 5, 5, '#FEF08A');
      pDot(ctx, catX + 3, catY + 19, '#D97706');
      // Tail swaying
      var tailX = sway ? catX + 0 : catX - 1;
      pRect(ctx, tailX, catY + 14, 3, 7, '#EA580C');
      return;
    }

    // --- SPECIAL 2: CẶP ĐÔI GÀ BÔNG (Two Characters Snuggling) ---
    if (style === 'couple') {
      // Girl (Left)
      pRect(ctx, baseX + 1, baseY + 6, 9, 6, '#3E2723');
      pDot(ctx, baseX + 3, baseY + 5, '#5D4037');
      pRect(ctx, baseX + 2, baseY + 10, 8, 7, '#FFE0BD');
      pRect(ctx, baseX + 4, baseY + 12, 3, 1, '#3E2723');
      pDot(ctx, baseX + 3, baseY + 13, '#FB7185'); // blush
      pRect(ctx, baseX + 1, baseY + 17, 8, 14, '#EC4899'); // pink hoodie
      pRect(ctx, baseX + 2, baseY + 31, 3, 18, '#2563EB'); // girl jeans
      pRect(ctx, baseX + 6, baseY + 31, 3, 18, '#2563EB');
      pRect(ctx, baseX + 1, baseY + 49, 4, 3, '#FFFFFF'); // white sneakers
      pRect(ctx, baseX + 6, baseY + 49, 4, 3, '#FFFFFF');

      // Boy (Right)
      pRect(ctx, baseX + 13, baseY + 5, 9, 6, '#7C2D12');
      pDot(ctx, baseX + 15, baseY + 4, '#9A3412');
      pRect(ctx, baseX + 13, baseY + 9, 8, 7, '#FCD7B0');
      pRect(ctx, baseX + 15, baseY + 11, 2, 2, '#1E293B');
      pDot(ctx, baseX + 18, baseY + 12, '#F87171');
      pRect(ctx, baseX + 13, baseY + 16, 9, 15, '#EC4899'); // matching hoodie
      pRect(ctx, baseX + 14, baseY + 31, 3, 18, '#1E293B'); // boy jeans
      pRect(ctx, baseX + 18, baseY + 31, 3, 18, '#1E293B');
      pRect(ctx, baseX + 14, baseY + 49, 4, 3, '#FFFFFF');
      pRect(ctx, baseX + 18, baseY + 49, 4, 3, '#FFFFFF');

      // Shared Heart Graphic across chests
      pRect(ctx, baseX + 9, baseY + 18, 4, 3, '#FFFFFF');
      pDot(ctx, baseX + 10, baseY + 17, '#FFFFFF');
      pDot(ctx, baseX + 11, baseY + 17, '#FFFFFF');
      pRect(ctx, baseX + 10, baseY + 19, 2, 1, '#F43F5E');

      // Shared Giant Boba with 2 Straws
      drawBobaCup(ctx, baseX + 9, baseY + 22, '#FFEDD5', '#FB923C', '#F43F5E');
      // Second blue straw pointing to boy
      pRect(ctx, baseX + 13, baseY + 19, 2, 4, '#0EA5E9');
      pDot(ctx, baseX + 14, baseY + 18, '#0EA5E9');
      return;
    }

    // --- PROPORTIONAL RETRO CHARACTER PIPELINE (Adults, Kids, Professionals) ---
    var isKid = (style === 'kid' || style === 'artist_kid');
    var isTall = (style === 'gymer' || style === 'foreigner' || style === 'police' || style === 'pilot' || style === 'firefighter');
    var isTeen = (style === 'student_girl' || style === 'ballet_girl');

    // Mathematically perfect vertical layout ensuring shoe bottom lands at baseY + (height - 1):
    var headTop = baseY + 2;
    var faceTop = headTop + 4;
    var torsoTop = faceTop + (isKid ? 9 : 10);
    var torsoH = isKid ? 11 : (isTeen ? 14 : (isTall ? 18 : 16));
    var pantsTop = torsoTop + torsoH;
    var legLength = isKid ? 12 : (isTeen ? 16 : (isTall ? 20 : 18));
    var shoeTop = pantsTop + legLength;

    // 1. HEADWEAR & HAIRSTYLE
    if (style === 'clown') {
      // Rainbow curly clown afro
      pRect(ctx, baseX + 3, headTop - 2, 16, 6, '#EF4444');
      pRect(ctx, baseX + 2, headTop + 1, 4, 7, '#F59E0B');
      pRect(ctx, baseX + 16, headTop + 1, 4, 7, '#06B6D4');
      pDot(ctx, baseX + 5, headTop - 3, '#10B981');
      pDot(ctx, baseX + 14, headTop - 3, '#8B5CF6');
    } else if (style === 'kid') {
      // Bé Bi yellow bucket hat (#MũTaiBèo)
      pRect(ctx, baseX + 3, headTop - 1, 16, 5, '#FDE047');
      pRect(ctx, baseX + 1, headTop + 3, 20, 2, '#FACC15'); // brim
      pRect(ctx, baseX + 5, headTop + 0, 12, 1, '#EAB308'); // hat band
    } else if (style === 'ballet_girl') {
      // Ballerina high bun with golden tiara
      pRect(ctx, baseX + 8, headTop - 3, 6, 5, hair);
      pRect(ctx, baseX + 9, headTop - 4, 4, 2, '#FACC15'); // Tiara
      pDot(ctx, baseX + 10, headTop - 5, '#FFFFFF'); // Gem
      pRect(ctx, baseX + 5, headTop + 2, 12, 4, hair);
    } else if (style === 'police') {
      // CSGT yellow peaked kepi cap with red band
      pRect(ctx, baseX + 5, headTop - 2, 12, 5, '#EAB308');
      pRect(ctx, baseX + 5, headTop + 2, 12, 2, '#DC2626'); // Red band
      pDot(ctx, baseX + 10, headTop + 2, '#FDE047'); // Gold crest
      pRect(ctx, baseX + 4, headTop + 3, 14, 1, '#1E293B'); // Visor
    } else if (style === 'pilot') {
      // Airline Captain Cap
      pRect(ctx, baseX + 5, headTop - 2, 12, 5, '#0F172A');
      pRect(ctx, baseX + 5, headTop + 2, 12, 2, '#FACC15'); // Gold braid
      pDot(ctx, baseX + 10, headTop + 1, '#FDE047'); // Eagle emblem
      pRect(ctx, baseX + 4, headTop + 3, 14, 1, '#020617'); // Visor
    } else if (style === 'doctor') {
      // Doctor forehead reflector mirror
      pRect(ctx, baseX + 5, headTop + 1, 12, 4, hair);
      pRect(ctx, baseX + 9, headTop - 1, 4, 4, '#CBD5E1'); // Silver reflector
      pDot(ctx, baseX + 10, headTop + 0, '#FFFFFF'); // Gleam
    } else if (style === 'chef') {
      // Tall Toque Blanche Chef Hat
      pRect(ctx, baseX + 6, headTop - 7, 10, 8, '#FFFFFF');
      pRect(ctx, baseX + 5, headTop - 5, 12, 6, '#F8FAFC');
      pRect(ctx, baseX + 6, headTop + 1, 10, 2, '#E2E8F0');
    } else if (style === 'magician') {
      // Top Hat with red satin ribbon
      pRect(ctx, baseX + 6, headTop - 6, 10, 8, '#09090B');
      pRect(ctx, baseX + 6, headTop + 0, 10, 2, '#DC2626'); // Ribbon
      pRect(ctx, baseX + 3, headTop + 2, 16, 2, '#09090B'); // Brim
    } else if (style === 'calligrapher') {
      // Khăn xếp truyền thống
      pRect(ctx, baseX + 5, headTop + 0, 12, 4, '#1E1B4B');
      pRect(ctx, baseX + 6, headTop - 1, 10, 2, '#312E81');
      pDot(ctx, baseX + 8, headTop + 1, '#4338CA');
      pDot(ctx, baseX + 12, headTop + 1, '#4338CA');
    } else if (style === 'lottery_girl' || style === 'gardener') {
      // Nón lá Việt Nam
      pRect(ctx, baseX + 10, headTop - 3, 2, 2, '#D7CCC8');
      pRect(ctx, baseX + 7, headTop - 1, 8, 2, '#D7CCC8');
      pRect(ctx, baseX + 4, headTop + 1, 14, 2, '#D7CCC8');
      pRect(ctx, baseX + 1, headTop + 3, 20, 2, '#BCAAA4');
      pDot(ctx, baseX + 9, headTop + 0, '#FFFFFF');
      pRect(ctx, baseX + 5, headTop + 5, 1, 7, '#F43F5E'); // quai nón
      pRect(ctx, baseX + 16, headTop + 5, 1, 7, '#F43F5E');
    } else if (style === 'shipper' || style === 'electrician' || style === 'firefighter' || style === 'driver') {
      var helmCol = style === 'shipper' ? '#15803D' : (style === 'electrician' ? '#EA580C' : (style === 'driver' ? '#047857' : '#CA8A04'));
      pRect(ctx, baseX + 4, headTop - 1, 14, 6, helmCol);
      pRect(ctx, baseX + 5, headTop - 2, 12, 2, '#FDE047');
      pRect(ctx, baseX + 6, headTop + 2, 10, 3, '#0F172A'); // visor
      pDot(ctx, baseX + 7, headTop + 2, '#38BDF8');
    } else if (style === 'astronaut') {
      pRect(ctx, baseX + 3, headTop - 1, 16, 12, '#F8FAFC');
      pRect(ctx, baseX + 6, headTop + 2, 10, 7, '#0F172A');
      pRect(ctx, baseX + 7, headTop + 3, 8, 5, '#0284C7');
      pDot(ctx, baseX + 8, headTop + 4, '#38BDF8');
    } else if (style === 'student_girl' || style === 'anime_girl') {
      pRect(ctx, baseX + 1, headTop + 0, 5, 6, hair);
      pRect(ctx, baseX + 16, headTop + 0, 5, 6, hair);
      pRect(ctx, baseX + 5, headTop + 1, 12, 5, hair);
      pRect(ctx, baseX + 7, headTop + 1, 8, 1, '#F472B6'); // ribbon
    } else if (style === 'rapper') {
      // Backwards snapback cap
      pRect(ctx, baseX + 4, headTop - 1, 14, 5, '#1E293B');
      pRect(ctx, baseX + 14, headTop + 2, 5, 2, '#0F172A'); // Snapback brim back
      pDot(ctx, baseX + 10, headTop + 0, '#FACC15'); // Gold badge
    } else if (style === 'skater') {
      // Street knitted beanie
      pRect(ctx, baseX + 4, headTop - 2, 14, 6, '#475569');
      pRect(ctx, baseX + 4, headTop + 2, 14, 2, '#334155'); // Cuff
    } else if (style === 'kpop_fan') {
      // Idol bunny headband
      pRect(ctx, baseX + 5, headTop - 1, 12, 4, hair);
      pRect(ctx, baseX + 6, headTop - 4, 2, 4, '#F472B6'); // Left ear
      pRect(ctx, baseX + 14, headTop - 4, 2, 4, '#F472B6'); // Right ear
    } else if (style === 'neighbor' || style === 'grandma') {
      // Hair bun with crab claw clip
      pRect(ctx, baseX + 4, headTop + 1, 14, 4, hair);
      pRect(ctx, baseX + 8, headTop - 3, 6, 4, hair);
      pRect(ctx, baseX + 9, headTop - 2, 4, 2, style === 'grandma' ? '#CBD5E1' : '#E11D48'); // Clip
    } else if (style === 'bread_lady') {
      // Traditional headscarf
      pRect(ctx, baseX + 4, headTop - 1, 14, 5, '#F59E0B');
      pDot(ctx, baseX + 10, headTop + 3, '#D97706');
    } else if (style === 'foreigner') {
      // Golden surfer waves
      pRect(ctx, baseX + 4, headTop + 0, 14, 5, '#FACC15');
      pRect(ctx, baseX + 3, headTop + 3, 3, 6, '#EAB308');
      pRect(ctx, baseX + 16, headTop + 3, 3, 6, '#EAB308');
    } else {
      // Standard groomed hair with glossy highlight
      pRect(ctx, baseX + 4, headTop + 1, 14, 4, hair);
      pRect(ctx, baseX + 6, headTop + 0, 8, 2, hair);
      pDot(ctx, baseX + 8, headTop + 0, '#FFFFFF55');
      pRect(ctx, baseX + 3, headTop + 3, 2, 4, hair);
      pRect(ctx, baseX + 17, headTop + 3, 2, 4, hair);
    }

    // 2. FACE & EXPRESSIONS
    if (style !== 'astronaut') {
      pRect(ctx, baseX + 5, faceTop, 12, 8, skin);
      pRect(ctx, baseX + 6, faceTop + 7, 10, 2, '#E5B88A'); // chin shadow
      pRect(ctx, baseX + 3, faceTop + 2, 2, 3, skin); // ears
      pRect(ctx, baseX + 17, faceTop + 2, 2, 3, skin);

      // Clown red nose
      if (style === 'clown') {
        pRect(ctx, baseX + 9, faceTop + 3, 4, 3, '#EF4444');
        pDot(ctx, baseX + 10, faceTop + 3, '#FCA5A5');
      }

      // Glasses check
      if (style === 'office' || style === 'teacher_elder' || style === 'grandma' || char.name.includes('Cận')) {
        pRect(ctx, baseX + 6, faceTop + 2, 4, 3, '#0F172A');
        pRect(ctx, baseX + 12, faceTop + 2, 4, 3, '#0F172A');
        pDot(ctx, baseX + 7, faceTop + 2, '#E0F2FE');
        pDot(ctx, baseX + 13, faceTop + 2, '#E0F2FE');
        pRect(ctx, baseX + 10, faceTop + 3, 2, 1, '#0F172A');
      } else if (style === 'foreigner' || style === 'pilot') {
        // Aviator Sunglasses
        pRect(ctx, baseX + 6, faceTop + 2, 4, 3, '#0F172A');
        pRect(ctx, baseX + 12, faceTop + 2, 4, 3, '#0F172A');
        pRect(ctx, baseX + 10, faceTop + 2, 2, 1, '#FACC15'); // Gold bridge
        pDot(ctx, baseX + 7, faceTop + 2, '#38BDF8');
        pDot(ctx, baseX + 13, faceTop + 2, '#38BDF8');
      } else {
        // Expressive Eyes
        if (isBlinking) {
          pRect(ctx, baseX + 7, faceTop + 3, 3, 1, '#1E293B');
          pRect(ctx, baseX + 12, faceTop + 3, 3, 1, '#1E293B');
        } else {
          pRect(ctx, baseX + 7, faceTop + 2, 2, 2, '#1E293B');
          pDot(ctx, baseX + 7, faceTop + 2, '#FFFFFF'); // Specular
          pRect(ctx, baseX + 13, faceTop + 2, 2, 2, '#1E293B');
          pDot(ctx, baseX + 13, faceTop + 2, '#FFFFFF');
        }
      }

      // Rosy anime cheeks
      if (isKid || style.includes('girl') || char.name.includes('Bé')) {
        pDot(ctx, baseX + 5, faceTop + 4, '#FB7185');
        pDot(ctx, baseX + 16, faceTop + 4, '#FB7185');
      }

      // Facial Hair
      if (style === 'calligrapher') {
        pRect(ctx, baseX + 6, faceTop + 6, 10, 6, '#F8FAFC'); // Grand white beard
        pRect(ctx, baseX + 7, faceTop + 11, 8, 4, '#E2E8F0');
        pRect(ctx, baseX + 8, faceTop + 14, 6, 3, '#CBD5E1');
      } else if (style === 'foreigner') {
        pRect(ctx, baseX + 8, faceTop + 6, 6, 2, '#EAB308'); // Blonde stubble
      } else {
        // Cheerful smile
        pRect(ctx, baseX + 9, faceTop + 6, 4, 1, '#DC2626');
        pDot(ctx, baseX + 10, faceTop + 6, '#FFFFFF');
      }
    }

    // 3. TORSO & APPAREL
    pRect(ctx, baseX + 4, torsoTop, 14, torsoH, clothes);
    pRect(ctx, baseX + 4, torsoTop, 2, torsoH, sub); // fold shadow

    // Specific apparel accents:
    if (style === 'kid') {
      // Bear overall bib (#YếmGấu)
      pRect(ctx, baseX + 5, torsoTop + 2, 12, 10, '#0284C7');
      pRect(ctx, baseX + 9, torsoTop + 4, 4, 4, '#FEF08A'); // Bear pocket
      pDot(ctx, baseX + 10, torsoTop + 5, '#78350F');
    } else if (style === 'ballet_girl') {
      // Ballerina bodice & flared pink tutu skirt
      pRect(ctx, baseX + 5, torsoTop, 12, 8, '#FCE7F3');
      pRect(ctx, baseX + 1, torsoTop + 8, 20, 6, '#F472B6'); // Tutu flair
      pRect(ctx, baseX + 2, torsoTop + 12, 18, 2, '#EC4899');
    } else if (style === 'student_girl' || style === 'student_boy') {
      // Khăn quàng đỏ học sinh
      pRect(ctx, baseX + 7, torsoTop, 8, 2, '#DC2626');
      pRect(ctx, baseX + 9, torsoTop + 2, 3, 5, '#B91C1C');
    } else if (style === 'police') {
      // CSGT badge & chest pockets
      pDot(ctx, baseX + 6, torsoTop + 4, '#FACC15'); // Badge
      pRect(ctx, baseX + 5, torsoTop + 13, 12, 2, '#1E293B'); // Black belt
      pDot(ctx, baseX + 10, torsoTop + 13, '#FACC15'); // Belt buckle
    } else if (style === 'pilot') {
      // 4 gold bars on black shoulder epaulets
      pRect(ctx, baseX + 3, torsoTop, 4, 3, '#0F172A');
      pRect(ctx, baseX + 15, torsoTop, 4, 3, '#0F172A');
      pDot(ctx, baseX + 4, torsoTop + 1, '#FACC15');
      pDot(ctx, baseX + 16, torsoTop + 1, '#FACC15');
      pRect(ctx, baseX + 10, torsoTop + 2, 2, 7, '#0F172A'); // Tie
    } else if (style === 'doctor') {
      // White blouse coat with stethoscope
      pRect(ctx, baseX + 4, torsoTop, 14, torsoH, '#F8FAFC');
      pRect(ctx, baseX + 6, torsoTop, 2, 6, '#94A3B8'); // Stethoscope tube
      pRect(ctx, baseX + 14, torsoTop, 2, 6, '#94A3B8');
      pDot(ctx, baseX + 10, torsoTop + 7, '#CBD5E1'); // Chest piece
    } else if (style === 'martial_master') {
      // Vovinam blue võ phục with white belt
      pRect(ctx, baseX + 4, torsoTop, 14, torsoH, '#1D4ED8');
      pRect(ctx, baseX + 4, torsoTop + 11, 14, 3, '#FFFFFF'); // Belt
      pRect(ctx, baseX + 12, torsoTop + 13, 2, 5, '#FFFFFF'); // Knot drape
    } else if (style === 'neighbor') {
      // Floral pajamas (đồ bộ hoa nhí)
      pDot(ctx, baseX + 6, torsoTop + 3, '#F43F5E');
      pDot(ctx, baseX + 11, torsoTop + 5, '#FACC15');
      pDot(ctx, baseX + 7, torsoTop + 8, '#10B981');
      pDot(ctx, baseX + 13, torsoTop + 9, '#F43F5E');
    } else if (style === 'gymer') {
      // Muscular biceps & cutaway stringer
      pRect(ctx, baseX + 2, torsoTop - 1, 4, 9, skin);
      pRect(ctx, baseX + 16, torsoTop - 1, 4, 9, skin);
      pDot(ctx, baseX + 10, torsoTop + 5, '#FACC15');
    } else if (style === 'traveler') {
      // Khăn rằn Tây Bắc quấn cổ
      pRect(ctx, baseX + 6, torsoTop, 10, 3, '#F8FAFC');
      pDot(ctx, baseX + 7, torsoTop + 1, '#1E293B');
      pDot(ctx, baseX + 9, torsoTop + 1, '#1E293B');
      pDot(ctx, baseX + 11, torsoTop + 1, '#1E293B');
    } else if (style === 'rapper') {
      // Gold chain necklace
      pRect(ctx, baseX + 8, torsoTop + 2, 6, 3, '#FACC15');
      pDot(ctx, baseX + 10, torsoTop + 5, '#FDE047');
    }

    // 4. ARMS & PROPS
    var armY = torsoTop + 1;
    var propX = baseX + 18;
    var propY = torsoTop + 2 - sway;

    if (isFront && isDrinking) {
      // Both hands holding boba cup to mouth joyfully
      pRect(ctx, baseX + 2, armY, 3, 7, clothes);
      pRect(ctx, baseX + 17, armY, 3, 7, clothes);
      pRect(ctx, baseX + 4, armY + 5, 4, 3, skin);
      pRect(ctx, baseX + 14, armY + 5, 4, 3, skin);
      drawBobaCup(ctx, baseX + 8, armY + 1, '#FFFFFF', '#92400E', '#EC4899', true);
      pRect(ctx, baseX + 10, faceTop + 5, 2, 4, '#F43F5E'); // Straw
      ctx.fillStyle = '#FF4757';
      ctx.font = '10px monospace';
      ctx.fillText('😍', baseX + 6, headTop - 2);
    } else {
      // Left arm with walking/breathing sway
      pRect(ctx, baseX + 1, armY + sway, 3, 7, clothes);
      pRect(ctx, baseX + 1, armY + 6 + sway, 3, 3, skin);

      // Right arm with prop
      pRect(ctx, baseX + 18, armY - sway, 3, 7, clothes);
      pRect(ctx, baseX + 18, armY + 5 - sway, 3, 3, skin);

      // Dynamic Props based on character description
      switch (char.prop) {
        case 'gimbal':
          pRect(ctx, propX + 1, propY - 3, 2, 10, '#334155');
          pRect(ctx, propX - 1, propY - 7, 6, 6, '#0284C7');
          pDot(ctx, propX + 3, propY - 6, '#EF4444'); // REC
          break;
        case 'laptop':
          pRect(ctx, baseX + 0, armY + 4, 6, 7, '#94A3B8');
          pDot(ctx, baseX + 1, armY + 5, '#22C55E');
          pDot(ctx, baseX + 3, armY + 6, '#38BDF8');
          drawBobaCup(ctx, propX, propY + 1, '#FFFFFF', '#78350F', '#0284C7');
          break;
        case 'fan':
          pRect(ctx, propX - 1, propY - 2, 7, 7, '#FDE68A');
          pRect(ctx, propX + 1, propY - 1, 5, 5, '#D97706');
          pRect(ctx, propX + 2, propY + 4, 1, 4, '#78350F');
          break;
        case 'brush':
          pRect(ctx, propX + 1, propY - 3, 2, 10, '#B45309');
          pRect(ctx, propX + 1, propY - 5, 2, 3, '#000000');
          // Red banner scroll in left hand
          pRect(ctx, baseX - 1, armY + 2, 4, 12, '#DC2626');
          pDot(ctx, baseX + 0, armY + 4, '#FDE047');
          pDot(ctx, baseX + 1, armY + 7, '#FDE047');
          pDot(ctx, baseX + 0, armY + 10, '#FDE047');
          break;
        case 'dumbbell':
          pRect(ctx, propX, propY - 1, 2, 7, '#475569');
          pRect(ctx, propX + 4, propY - 1, 2, 7, '#475569');
          pRect(ctx, propX + 1, propY + 1, 4, 3, '#94A3B8');
          break;
        case 'lottery':
          pRect(ctx, baseX - 1, armY + 2, 5, 8, '#EC4899');
          pRect(ctx, baseX - 1, armY + 2, 5, 2, '#DC2626');
          drawBobaCup(ctx, propX, propY + 1, '#FFFFFF', '#451A03', '#10B981');
          break;
        case 'camera':
          pRect(ctx, propX - 1, propY, 6, 5, '#1E293B');
          pRect(ctx, propX + 1, propY + 1, 2, 3, '#0284C7');
          pDot(ctx, propX + 3, propY, '#F43F5E');
          break;
        case 'notebook':
          pRect(ctx, baseX + 0, armY + 2, 5, 8, '#DC2626');
          pDot(ctx, baseX + 2, armY + 4, '#FACC15'); // Star
          drawBobaCup(ctx, propX, propY + 1, '#FFFFFF', '#78350F', '#0284C7');
          break;
        case 'palette':
          pRect(ctx, baseX - 1, armY + 2, 6, 7, '#D97706');
          pDot(ctx, baseX + 0, armY + 3, '#EF4444');
          pDot(ctx, baseX + 2, armY + 3, '#3B82F6');
          pDot(ctx, baseX + 1, armY + 5, '#10B981');
          pDot(ctx, baseX + 3, armY + 5, '#FBBF24');
          pRect(ctx, propX + 1, propY - 2, 1, 9, '#78350F');
          pDot(ctx, propX + 1, propY - 3, '#EC4899');
          break;
        case 'chess':
          pRect(ctx, baseX - 1, armY + 2, 5, 9, '#78350F');
          pRect(ctx, baseX + 0, armY + 3, 3, 7, '#FEF3C7');
          pDot(ctx, baseX + 1, armY + 5, '#78350F');
          pRect(ctx, propX + 1, propY, 3, 5, '#F8FAFC');
          pDot(ctx, propX + 2, propY - 1, '#F8FAFC');
          break;
        case 'ball':
          pRect(ctx, baseX - 4, shoeTop - 4, 8, 8, '#FFFFFF');
          pDot(ctx, baseX - 2, shoeTop - 2, '#1E293B');
          pDot(ctx, baseX - 3, shoeTop - 3, '#1E293B');
          pDot(ctx, baseX + 0, shoeTop - 1, '#1E293B');
          drawBobaCup(ctx, propX, propY + 1, '#FFFFFF', '#15803D', '#E11D48');
          break;
        case 'book':
          pRect(ctx, propX - 1, propY - 1, 6, 9, '#1E3A8A');
          pRect(ctx, propX, propY, 4, 7, '#F8FAFC');
          pDot(ctx, propX + 2, propY + 8, '#DC2626');
          break;
        case 'mic':
          pRect(ctx, propX + 1, propY - 3, 3, 4, '#94A3B8');
          pDot(ctx, propX + 2, propY - 4, '#CBD5E1');
          pRect(ctx, propX + 2, propY + 1, 1, 7, '#1E293B');
          drawBobaCup(ctx, baseX + 0, armY + 3, '#FFFFFF', '#3E2723', '#F59E0B');
          break;
        case 'tube':
          pRect(ctx, baseX - 4, torsoTop - 2, 3, 18, '#0F172A');
          pRect(ctx, baseX - 5, torsoTop - 4, 5, 3, '#DC2626');
          drawBobaCup(ctx, propX, propY + 1, '#FFFFFF', '#0284C7', '#38BDF8');
          break;
        case 'skateboard':
          pRect(ctx, baseX - 4, torsoTop + 2, 4, 18, '#F97316');
          pDot(ctx, baseX - 5, torsoTop + 3, '#06B6D4');
          pDot(ctx, baseX - 5, torsoTop + 17, '#06B6D4');
          pDot(ctx, baseX - 3, torsoTop + 9, '#FACC15');
          drawBobaCup(ctx, propX, propY + 1, '#FFFFFF', '#F59E0B', '#10B981');
          break;
        case 'lightstick':
          pRect(ctx, propX + 1, propY + 1, 2, 6, '#FFFFFF');
          pRect(ctx, propX, propY - 4, 4, 5, '#F43F5E');
          pDot(ctx, propX + 1, propY - 3, '#FFF1F2');
          break;
        case 'headset':
          pRect(ctx, propX, propY - 2, 6, 8, '#0F172A');
          pDot(ctx, propX + 2, propY + 1, '#06B6D4'); // cyan LED
          pRect(ctx, propX + 1, propY + 3, 4, 3, '#1E293B');
          drawBobaCup(ctx, baseX - 1, armY + 2, '#FFFFFF', '#06B6D4', '#F43F5E');
          break;
        case 'phone':
          pRect(ctx, propX, propY - 2, 4, 8, '#0F172A');
          pRect(ctx, propX + 1, propY - 1, 2, 6, '#38BDF8');
          break;
        case 'kettle':
          pRect(ctx, propX - 1, propY - 1, 7, 7, '#CBD5E1');
          pRect(ctx, propX + 5, propY - 3, 2, 5, '#94A3B8');
          pDot(ctx, propX + 6, propY - 4, '#CBD5E1');
          pRect(ctx, propX - 3, propY, 2, 5, '#334155');
          break;
        case 'backpack':
          pRect(ctx, baseX - 5, torsoTop + 1, 6, 17, '#B45309');
          pRect(ctx, baseX - 5, torsoTop - 3, 6, 4, '#059669');
          drawBobaCup(ctx, propX, propY + 1, '#FFFFFF', '#16A34A', '#FACC15');
          break;
        case 'folder':
          pRect(ctx, propX - 1, propY - 1, 7, 9, '#DC2626'); // Red ledger folder
          pRect(ctx, propX, propY, 5, 7, '#FFFFFF'); // Papers
          pDot(ctx, propX + 2, propY + 2, '#0F172A');
          pRect(ctx, baseX - 2, armY + 2, 5, 8, '#334155'); // Mini calculator
          pRect(ctx, baseX - 1, armY + 3, 3, 2, '#86EFAC'); // LCD screen
          break;
        case 'shipper_box':
          pRect(ctx, baseX + 18, torsoTop + 1, 7, 12, '#15803D');
          pRect(ctx, baseX + 19, torsoTop + 3, 5, 8, '#16A34A');
          pRect(ctx, baseX + 20, torsoTop + 6, 3, 2, '#FFFFFF');
          drawBobaCup(ctx, propX, propY + 2, '#FFFFFF', '#15803D', '#FDE047');
          break;
        case 'stethoscope':
          pRect(ctx, propX - 1, propY - 1, 7, 10, '#78350F'); // Brown wooden chart
          pRect(ctx, propX, propY, 5, 8, '#F8FAFC'); // White chart
          pRect(ctx, propX + 2, propY - 2, 3, 2, '#94A3B8'); // Silver clip
          pRect(ctx, propX + 1, propY + 3, 3, 1, '#EF4444'); // Red cross
          pRect(ctx, propX + 2, propY + 2, 1, 3, '#EF4444');
          drawBobaCup(ctx, baseX - 1, armY + 3, '#FFFFFF', '#0284C7', '#38BDF8');
          break;
        case 'chalk':
          pRect(ctx, propX + 1, propY - 5, 2, 14, '#FBBF24'); // Yellow wooden ruler
          pDot(ctx, propX + 1, propY - 2, '#78350F');
          pDot(ctx, propX + 1, propY + 2, '#78350F');
          pDot(ctx, propX + 1, propY + 6, '#78350F');
          pRect(ctx, baseX - 2, armY + 2, 5, 6, '#10B981'); // Chalk box
          pDot(ctx, baseX - 1, armY + 1, '#FFFFFF'); // Chalk stick
          break;
        case 'wrench':
          pRect(ctx, propX + 1, propY - 2, 2, 9, '#94A3B8');
          pRect(ctx, propX, propY - 5, 4, 4, '#CBD5E1');
          pDot(ctx, propX + 1, propY - 4, '#475569');
          break;
        case 'baton':
          pRect(ctx, propX + 1, propY - 5, 2, 11, '#EF4444');
          pRect(ctx, propX + 1, propY - 2, 2, 3, '#FFFFFF');
          pRect(ctx, propX + 1, propY + 4, 2, 3, '#1E293B');
          break;
        case 'knife':
          pRect(ctx, propX + 1, propY - 4, 2, 8, '#E2E8F0');
          pDot(ctx, propX + 1, propY - 4, '#FFFFFF');
          pRect(ctx, propX + 1, propY + 4, 2, 3, '#78350F');
          break;
        case 'briefcase':
          pRect(ctx, propX - 1, propY, 8, 8, '#3E2723');
          pRect(ctx, propX, propY + 1, 6, 6, '#5D4037');
          pDot(ctx, propX + 2, propY + 2, '#FACC15');
          break;
        case 'aviator':
          pRect(ctx, propX - 1, propY - 1, 7, 9, '#0F172A'); // Pilot logbook
          pRect(ctx, propX + 1, propY + 2, 3, 2, '#FACC15'); // Gold wings
          pDot(ctx, propX + 2, propY + 1, '#FDE047');
          drawBobaCup(ctx, baseX - 1, armY + 2, '#FFFFFF', '#0284C7', '#FDE047');
          break;
        case 'hammer':
          pRect(ctx, propX + 1, propY - 1, 2, 9, '#78350F');
          pRect(ctx, propX - 1, propY - 4, 6, 4, '#475569');
          pRect(ctx, propX, propY - 3, 4, 2, '#94A3B8');
          break;
        case 'pill':
          pRect(ctx, propX, propY, 6, 8, '#D97706'); // Amber bottle
          pRect(ctx, propX + 1, propY - 2, 4, 2, '#FFFFFF'); // White cap
          pRect(ctx, propX + 1, propY + 2, 4, 4, '#FFFFFF'); // Label
          pRect(ctx, propX + 2, propY + 3, 2, 2, '#EF4444'); // Red cross
          drawBobaCup(ctx, baseX - 1, armY + 2, '#FFFFFF', '#DC2626', '#10B981');
          break;
        case 'ruler':
          pRect(ctx, propX, propY - 3, 2, 12, '#EAB308');
          pRect(ctx, propX + 2, propY + 1, 2, 8, '#FACC15');
          pDot(ctx, propX + 1, propY - 4, '#EF4444');
          pRect(ctx, baseX - 2, armY + 3, 5, 6, '#78350F');
          break;
        case 'bread':
          pRect(ctx, propX - 1, propY, 8, 5, '#D97706');
          pRect(ctx, propX, propY + 1, 6, 3, '#FDE68A');
          break;
        case 'fist':
          pRect(ctx, propX, propY, 5, 5, '#FFFFFF');
          pRect(ctx, propX + 1, propY + 1, 3, 3, skin);
          pDot(ctx, propX + 2, propY + 2, '#DC2626');
          drawBobaCup(ctx, baseX - 2, armY + 1, '#FFFFFF', '#B45309', '#F59E0B');
          break;
        case 'helmet':
          pRect(ctx, propX - 2, propY, 9, 8, '#047857'); // Motorbike helmet
          pRect(ctx, propX - 1, propY + 2, 7, 2, '#FACC15'); // Yellow stripe
          pRect(ctx, propX, propY + 5, 5, 2, '#1E293B'); // Strap
          drawBobaCup(ctx, baseX - 1, armY + 2, '#FFFFFF', '#059669', '#34D399');
          break;
        case 'yarn':
          pRect(ctx, propX, propY + 1, 6, 6, '#DC2626');
          pDot(ctx, propX + 2, propY + 2, '#F87171');
          pRect(ctx, propX - 1, propY - 2, 1, 7, '#CBD5E1');
          pRect(ctx, propX + 5, propY - 3, 1, 7, '#CBD5E1');
          break;
        case 'newspaper':
          pRect(ctx, baseX - 1, armY + 3, 4, 8, '#E2E8F0');
          pDot(ctx, baseX, armY + 5, '#1E293B');
          pDot(ctx, baseX + 1, armY + 7, '#1E293B');
          drawBobaCup(ctx, propX, propY + 1, '#FFFFFF', '#451A03', '#FBBF24');
          break;
        case 'scissors':
          pRect(ctx, propX + 1, propY - 1, 2, 7, '#475569');
          pRect(ctx, propX, propY - 4, 4, 4, '#CBD5E1');
          break;
        case 'wand':
          pRect(ctx, propX + 1, propY - 2, 2, 9, '#F59E0B');
          pDot(ctx, propX + 1, propY - 4, '#FDE047');
          pDot(ctx, propX + 0, propY - 4, '#FDE047');
          pDot(ctx, propX + 2, propY - 4, '#FDE047');
          break;
        case 'extinguisher':
          pRect(ctx, baseX - 4, torsoTop + 2, 5, 12, '#DC2626');
          pRect(ctx, baseX - 3, torsoTop + 0, 3, 3, '#1E293B');
          pDot(ctx, baseX - 2, torsoTop - 1, '#FACC15');
          drawBobaCup(ctx, propX, propY + 1, '#FFFFFF', '#DC2626', '#38BDF8');
          break;
        case 'helmet_space':
          pRect(ctx, propX - 1, propY, 7, 9, '#CBD5E1'); // Space boba pouch
          pRect(ctx, propX, propY + 1, 5, 7, '#E2E8F0');
          pDot(ctx, propX + 2, propY + 3, '#0284C7');
          pDot(ctx, propX + 3, propY + 5, '#0284C7');
          pRect(ctx, propX + 1, propY - 3, 2, 4, '#38BDF8'); // Zero-g straw
          break;
        case 'balloon':
          pRect(ctx, propX + 1, propY - 3, 1, 10, '#CBD5E1');
          pRect(ctx, propX - 3, propY - 11, 9, 9, '#EF4444');
          pDot(ctx, propX - 1, propY - 10, '#FCA5A5');
          break;
        case 'shaker':
          pRect(ctx, propX, propY - 2, 6, 11, '#CBD5E1');
          pRect(ctx, propX + 1, propY - 2, 2, 11, '#FFFFFF');
          pRect(ctx, propX + 4, propY - 2, 2, 11, '#94A3B8');
          pRect(ctx, propX + 1, propY - 4, 4, 3, '#94A3B8');
          break;
        case 'shared_cup':
          drawBobaCup(ctx, propX, propY + 1, '#FFEDD5', '#FB923C', '#F43F5E');
          break;
        case 'bell':
          pRect(ctx, propX, propY, 5, 5, '#FACC15');
          pDot(ctx, propX + 2, propY + 2, '#B45309');
          break;
        default:
          drawBobaCup(ctx, propX, propY + 1, '#FFFFFF', '#92400E', '#EC4899');
          break;
      }
    }

    // 5. LOWER GARMENT / PANTS / SKIRTS
    pRect(ctx, baseX + 5, pantsTop, 5, legLength, pants);
    pRect(ctx, baseX + 12, pantsTop, 5, legLength, pants);
    pDot(ctx, baseX + 6, pantsTop + 3, '#FFFFFF22');
    pDot(ctx, baseX + 13, pantsTop + 3, '#FFFFFF22');

    // 6. SHOES WITH WHITE RUBBER SOLES (Resting on sidewalk Y = 148)
    pRect(ctx, baseX + 4, shoeTop, 6, 3, '#1E293B');
    pRect(ctx, baseX + 12, shoeTop, 6, 3, '#1E293B');
    pRect(ctx, baseX + 3, shoeTop + 2, 7, 1, '#FFFFFF'); // Rubber sole
    pRect(ctx, baseX + 12, shoeTop + 2, 7, 1, '#FFFFFF');

    // 7. BE HANH COMPANION PUPPY
    if (style === 'lottery_girl') {
      var pupX = baseX - 9;
      var pupY = shoeTop - 7;
      var pupTail = (sway ? -1 : 1);
      pRect(ctx, pupX, pupY + 2, 8, 6, '#F59E0B'); // Body
      pRect(ctx, pupX - 2, pupY, 6, 6, '#F59E0B'); // Head
      pRect(ctx, pupX - 3, pupY + 1, 2, 4, '#D97706'); // Floppy ear
      pDot(ctx, pupX, pupY + 1, '#111111'); // Eye
      pDot(ctx, pupX - 2, pupY + 3, '#111111'); // Nose
      pRect(ctx, pupX - 1, pupY + 5, 4, 1, '#EF4444'); // Collar
      pDot(ctx, pupX + 0, pupY + 6, '#FBBF24'); // Bell
      pRect(ctx, pupX + 7, pupY + 1 + pupTail, 2, 3, '#F59E0B'); // Tail
      pRect(ctx, pupX, pupY + 7, 2, 3, '#D97706'); // Legs
      pRect(ctx, pupX + 5, pupY + 7, 2, 3, '#D97706');
    }
  }

  // ==========================================
  // 4. BARISTA OWNER SPRITE (CHỊ THẢO BOBA)
  // Stands tall inside the stall behind counter
  // ==========================================
  function drawOwnerBarista(ctx, hx, hy, bob, isBlinking) {
    if (bob === undefined) bob = 0;
    if (isBlinking === undefined) isBlinking = false;

    var skin = '#FFE0BD';
    var headTop = 76 + bob;
    var faceTop = headTop + 4;
    var headX = hx + 8;

    // 1. SNEAKER SHOES ON STALL FLOOR (Y = 144)
    pRect(ctx, hx + 3, 142, 6, 2, '#FB7185');
    pRect(ctx, hx + 11, 142, 6, 2, '#FB7185');
    pRect(ctx, hx + 2, 143, 8, 1, '#FFFFFF'); // white soles
    pRect(ctx, hx + 10, 143, 8, 1, '#FFFFFF');

    // 2. SLENDER LEGS IN WHITE ANKLE SOCKS
    pRect(ctx, hx + 4, 138, 5, 4, '#FFFFFF');
    pRect(ctx, hx + 12, 138, 5, 4, '#FFFFFF');
    pDot(ctx, hx + 6, 139, '#F43F5E'); // pink ribbon
    pDot(ctx, hx + 14, 139, '#F43F5E');

    pRect(ctx, hx + 4, 114 + bob, 4, 25, skin);
    pRect(ctx, hx + 12, 114 + bob, 4, 25, skin);
    pRect(ctx, hx + 7, 114 + bob, 1, 25, '#F6C8A6');
    pRect(ctx, hx + 12, 114 + bob, 1, 25, '#F6C8A6');

    // 3. PLEATED BERRY SKIRT (Below counter)
    var skirtTop = 104 + bob;
    pRect(ctx, hx - 2, skirtTop, 22, 14, '#831843');
    for (var px = hx - 1; px <= hx + 18; px += 3) {
      pRect(ctx, px, skirtTop, 1, 13, '#500724');
      pRect(ctx, px + 1, skirtTop + 1, 1, 12, '#9D174D');
    }
    pRect(ctx, hx - 2, skirtTop + 13, 22, 1, '#F43F5E');

    // 4. WHITE PASTEL BLOUSE (Above counter at 114)
    var torsoTop = 92 + bob;
    pRect(ctx, hx - 1, torsoTop, 20, 16, '#FFF5F5');
    pRect(ctx, hx + 6, torsoTop, 6, 3, skin); // neckline

    // 5. SWEET PINK BOBA APRON
    pRect(ctx, hx + 2, torsoTop + 2, 14, 14, '#FB7185');
    pRect(ctx, hx + 1, torsoTop + 10, 16, 6, '#F43F5E');
    pRect(ctx, hx + 3, torsoTop + 1, 2, 8, '#E11D48'); // straps
    pRect(ctx, hx + 13, torsoTop + 1, 2, 8, '#E11D48');

    // Embroidered mini boba cup on chest
    pRect(ctx, hx + 8, torsoTop + 4, 3, 4, '#FFFFFF');
    pDot(ctx, hx + 9, torsoTop + 5, '#78350F'); // tea
    pDot(ctx, hx + 9, torsoTop + 3, '#FDE047'); // straw

    // Apron front utility pocket
    pRect(ctx, hx + 4, torsoTop + 9, 10, 6, '#F43F5E');
    pRect(ctx, hx + 5, torsoTop + 10, 8, 4, '#FB7185');

    // 6. CHESTNUT HAIR (Back Dome)
    pRect(ctx, headX - 8, headTop - 3, 18, 16, '#4E2A16');
    pRect(ctx, headX - 9, headTop + 3, 3, 12, '#3D2010');
    pRect(ctx, headX + 8, headTop + 3, 3, 12, '#3D2010');

    // 7. TWIN HAIR BUNS WITH PINK RIBBONS
    pRect(ctx, headX - 10, headTop - 7, 5, 5, '#4E2A16');
    pRect(ctx, headX - 9, headTop - 6, 3, 3, '#F43F5E');
    pDot(ctx, headX - 8, headTop - 6, '#FFF1F2');

    pRect(ctx, headX + 7, headTop - 7, 5, 5, '#4E2A16');
    pRect(ctx, headX + 8, headTop - 6, 3, 3, '#F43F5E');
    pDot(ctx, headX + 8, headTop - 6, '#FFF1F2');

    // 8. ANIME HEAD & EXPRESSIVE FACE
    pRect(ctx, headX - 6, faceTop, 14, 10, skin);
    pRect(ctx, headX - 5, faceTop + 8, 12, 2, '#F6C8A6'); // chin
    pRect(ctx, headX - 7, faceTop + 2, 2, 4, skin); // ears
    pRect(ctx, headX + 7, faceTop + 2, 2, 4, skin);

    // Eyes
    if (isBlinking) {
      pRect(ctx, headX - 4, faceTop + 3, 3, 1, '#1E293B');
      pRect(ctx, headX + 3, faceTop + 3, 3, 1, '#1E293B');
    } else {
      pRect(ctx, headX - 4, faceTop + 2, 3, 3, '#1E293B');
      pDot(ctx, headX - 4, faceTop + 2, '#FFFFFF'); // Specular
      pDot(ctx, headX - 3, faceTop + 4, '#38BDF8'); // Cyan iris

      pRect(ctx, headX + 3, faceTop + 2, 3, 3, '#1E293B');
      pDot(ctx, headX + 3, faceTop + 2, '#FFFFFF');
      pDot(ctx, headX + 4, faceTop + 4, '#38BDF8');
    }

    // Má hồng kẹo ngọt
    pRect(ctx, headX - 6, faceTop + 5, 3, 2, '#FB7185');
    pDot(ctx, headX - 5, faceTop + 5, '#FDA4AF');
    pRect(ctx, headX + 5, faceTop + 5, 3, 2, '#FB7185');
    pDot(ctx, headX + 5, faceTop + 5, '#FDA4AF');

    // Nụ cười chúm chím
    pRect(ctx, headX - 1, faceTop + 6, 4, 1, '#F43F5E');
    pDot(ctx, headX, faceTop + 6, '#FFFFFF');

    // 9. FRONT HAIR BANGS & SIDE LOCKS
    pRect(ctx, headX - 7, headTop - 4, 16, 5, '#4E2A16');
    pRect(ctx, headX - 5, headTop - 5, 12, 2, '#67391F');
    pDot(ctx, headX - 2, headTop - 5, '#8C4D2A'); // specular halo
    pRect(ctx, headX - 7, headTop + 1, 2, 7, '#4E2A16');
    pRect(ctx, headX + 7, headTop + 1, 2, 7, '#4E2A16');

    // Gold boba hairpin
    pRect(ctx, headX + 4, headTop - 3, 2, 2, '#FDE047');
    pDot(ctx, headX + 5, headTop - 4, '#FFFFFF');

    // 10. UPPER ARMS (Behind counter)
    pRect(ctx, hx - 2, torsoTop + 2, 3, 8, skin);
    pRect(ctx, hx + 16, torsoTop + 2, 3, 8, skin);
  }

  // ==========================================
  // 5. BARISTA FOREARMS & SHAKER ON COUNTER
  // ==========================================
  function drawOwnerForearms(ctx, hx, hy, bob, isShaking, tick) {
    if (bob === undefined) bob = 0;
    if (tick === undefined) tick = 0;
    var skin = '#FFE0BD';

    if (isShaking) {
      var shakeArm = Math.round(Math.sin(tick * 0.8) * 4);

      // Forearms holding stainless shaker
      pRect(ctx, hx + 14, 104 + bob, 4, 7, skin);
      pRect(ctx, hx + 12, 98 + bob + shakeArm, 4, 8, skin);
      pRect(ctx, hx - 1, 104 + bob, 4, 7, skin);
      pRect(ctx, hx + 9, 99 + bob + shakeArm, 4, 7, skin);

      // Stainless steel shaker in pixel art with heart sticker
      var shakerX = hx + 12;
      var shakerY = 90 + bob + shakeArm;

      pRect(ctx, shakerX, shakerY, 8, 15, '#CBD5E1');
      pRect(ctx, shakerX + 1, shakerY, 2, 15, '#FFFFFF'); // chrome shine
      pRect(ctx, shakerX + 6, shakerY, 2, 15, '#94A3B8'); // shadow
      pRect(ctx, shakerX + 2, shakerY - 3, 4, 3, '#94A3B8'); // cap
      pRect(ctx, shakerX + 3, shakerY - 4, 2, 2, '#CBD5E1');

      // Pink heart sticker on shaker
      pDot(ctx, shakerX + 3, shakerY + 6, '#F472B6');
      pDot(ctx, shakerX + 4, shakerY + 6, '#F472B6');
      pDot(ctx, shakerX + 3, shakerY + 7, '#F43F5E');

      // Motion sparkles
      pDot(ctx, shakerX - 2, shakerY + 4, '#FFFFFF');
      pDot(ctx, shakerX - 3, shakerY + 8, '#FFFFFF');
      pDot(ctx, shakerX + 9, shakerY + 4, '#FFFFFF');
      pDot(ctx, shakerX + 10, shakerY + 8, '#FFFFFF');
    } else {
      // Left forearm holding silver jigger with rose gold bracelet
      pRect(ctx, hx - 1, 104 + bob, 3, 7, skin);
      pRect(ctx, hx + 1, 109 + bob, 3, 2, '#E17055'); // bracelet
      pRect(ctx, hx + 2, 111 + bob, 3, 3, skin); // hand

      // Silver dual-ended jigger
      pRect(ctx, hx + 4, 108 + bob, 4, 2, '#CBD5E1');
      pRect(ctx, hx + 5, 110 + bob, 2, 2, '#94A3B8');
      pRect(ctx, hx + 4, 112 + bob, 4, 3, '#CBD5E1');
      pRect(ctx, hx + 5, 108 + bob, 1, 7, '#FFFFFF'); // shine

      // Resting right arm on counter
      pRect(ctx, hx + 14, 104 + bob, 3, 8, skin);
      pRect(ctx, hx + 16, 111 + bob, 3, 3, skin);
    }
  }

  return {
    CHARACTERS: CHARACTERS,
    CUSTOMERS_LIST: CUSTOMERS_LIST,
    getCharacter: getCharacter,
    getCharacterHeight: getCharacterHeight,
    pRect: pRect,
    pDot: pDot,
    drawBobaCup: drawBobaCup,
    drawNPCCharacter: drawNPCCharacter,
    drawOwnerBarista: drawOwnerBarista,
    drawOwnerForearms: drawOwnerForearms
  };
});
