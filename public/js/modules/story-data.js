// Narrative & Story Tutorial Script Data for Chapters
// Includes Chapter Openings, Tutorials, and Story Milestone Cutscenes

export const STORY_DATA = {
  1: {
    title: 'Chương 1: Xe Đẩy Vỉa Hè (Món Nợ 3 Triệu)',
    scenes: [
      {
        avatar: '🧋',
        speaker: 'HeeHee (Cô Chủ Nhỏ)',
        role: 'Khởi nghiệp vỉa hè',
        text: 'Chào bạn! Mình là HeeHee.\n\nSau nhiều năm ấp ủ ước mơ tự tay làm ra những ly trà sữa thơm ngon chuẩn vị nhất phố, mình đã gom góp hết số tiền tiết kiệm ít ỏi để mở tiệm trà sữa trên chiếc xe đẩy nhỏ này!\n\nNhưng đường đời không như là mơ... Để sắm được xe đẩy và bộ đồ nghề inox, mình đã phải vay một khoản tiền lớn!',
        hint: { icon: '🧋', text: 'Chào mừng bạn đến với Tiệm Trà Sữa HeeHee!' }
      },
      {
        avatar: '🕶️',
        speaker: 'Anh Bảnh (Chủ Nợ Khu Phố)',
        role: 'Đầu gấu đòi nợ',
        text: 'Này con bé! Chiếc xe đẩy inox và bộ máy dập nắp này là tao cho mày vay đúng 3.000.000đ tiền mặt!\n\nNhớ kỹ cho tao: Liệu mà cày cuốc bán buôn trả nợ dần. Sau 7 ngày mà chưa trả hết là tao cho đàn em kéo xe đi rã sắt vụn đấy! Đừng trách Anh Bảnh không nể nang!',
        hint: { icon: '⚠️', text: 'Mục tiêu tối thượng: Kiếm đủ tiền trả hết 3.000.000đ nợ cho Anh Bảnh!' }
      },
      {
        avatar: '🌽',
        speaker: 'Bé Bắp & Anh Lâm',
        role: 'Đồng đội trợ thủ',
        text: 'Chị HeeHee ơi đừng lo! Em là Bé Bắp, em sẽ đứng quầy phụ chị dập nắp ly và ghi vé đơn hàng!\n\nCòn anh là Anh Lâm Shipper, có đơn nào khách đặt mang đi anh sẽ phóng xe Wave ship hỏa tốc! Trà sữa của chị đậm đà thơm béo, nhất định tụi mình sẽ cày đủ tiền trả sạch nợ!',
        hint: { icon: '🤝', text: 'Bé Bắp và Anh Lâm sẽ sát cánh hỗ trợ bạn buôn bán mỗi ngày!' }
      },
      {
        avatar: '📋',
        speaker: 'Bé Bắp (Hướng Dẫn Viên)',
        role: 'Bước 1: Đón Đơn Hàng',
        text: 'Em chỉ chị cách phục vụ khách nha! Khi khách ghé quầy, vé gọi món sẽ xuất hiện:\n\n• 👤 Tên khách & Tiền thu: Khách trả tiền tương ứng với từng món.\n• 🍹 Tên món: Ban đầu tiệm có Trà Sữa Truyền Thống.\n• ⏱️ Thanh kiên nhẫn: Phải giao ly trước khi thanh màu xanh tụt hết kẻo khách giận bỏ đi (-⭐ đánh giá quán)!',
        hint: { icon: '👀', text: 'Bước 1: Luôn quan sát kỹ vé đơn hàng và thanh thời gian chờ của khách!' }
      },
      {
        avatar: '🍵',
        speaker: 'Bé Bắp (Hướng Dẫn Viên)',
        role: 'Bước 2: Quầy Pha Chế',
        text: 'Ngay bên dưới là Quầy Pha Chế:\n\n1. Cốt Trà: Bấm chọn đúng trà khách gọi: Trà Đen, Thái Xanh, Sữa Tươi, Lài, Ô Long.\n2. Đường & Đá: Chọn đúng % đường (0%, 30%, 50%...) và mức đá khách thích!\n3. Topping: Bấm chọn trân châu đen, thạch lá dứa, đường đen... (khách gọi món nào kèm topping đó).',
        hint: { icon: '🧋', text: 'Bước 2: Chọn đúng cốt trà + mức đường đá + topping theo yêu cầu.' }
      },
      {
        avatar: '🍸',
        speaker: 'Bé Bắp (Hướng Dẫn Viên)',
        role: 'Bước 3: Quy Trình 4 Bước Chuẩn Barista',
        text: 'Pha xong các nguyên liệu trong Bình Lắc:\n\n1. Nhấn [1. Lắc Bình 🍸] để hòa quyện cốt trà, đường đá và topping sánh mịn!\n2. Nhấn [2. Rót Cốc 🧋] để đổ trà sữa vào ly mang đi.\n3. Nhấn [3. Dập Nắp 🖲️] niêm phong màng nilon chuyên nghiệp.\n4. Nhấn [GIAO LY (SERVE) ✨] trao tận tay khách hàng!\n\nTing ting! Tiền thanh toán và tiền tip thưởng sẽ cộng ngay vào túi tiệm!',
        hint: { icon: '🍸', text: 'Quy trình 4 bước: 1. Lắc Bình ➔ 2. Rót Cốc ➔ 3. Dập Nắp ➔ 4. Giao Ly!' }
      },
      {
        avatar: '🛒',
        speaker: 'HeeHee (Cô Chủ Nhỏ)',
        role: 'Bước 4: Mở Rộng Quán',
        text: 'Khi có tiền lãi, đừng quên bấm vào [Nâng Cấp]:\n\n• 📜 Mua Công Thức Mới: Mua Hồng Trà Tắc, Thái Xanh, Đường Đen... để khách gọi được nhiều món xịn giá cao hơn!\n• 🐾 Nuôi Thú Cưng: Corgi tăng tip +20%, Mèo Chiêu Tài tăng +15% doanh thu, Capybara giúp khách kiên nhẫn +40%!\n• ⚠️ Cảnh giác kẻ trộm áo đen câu mất thú cưng khi quán đông!',
        hint: { icon: '💡', text: 'Bước 4: Nâng cấp máy móc, mở rộng Menu và nuôi thú cưng để làm giàu nhanh!' }
      },
      {
        avatar: '💰',
        speaker: 'HeeHee (Cô Chủ Nhỏ)',
        role: 'Mục Tiêu Trả Nợ & Lên Chương',
        text: 'Và điều quan trọng nhất: Hãy bấm vào nút [Trả Nợ] bất cứ khi nào có dư tiền mặt!\n\nTrả dần từng khoản 500.000đ hoặc gom đủ 3.000.000đ trả sạch nợ cho Anh Bảnh để xóa sổ nợ, chính thức làm chủ tiệm và MỞ KHÓA CHƯƠNG 2: GÓC HẺM SINH VIÊN!\n\nKhách hàng đầu tiên đang tới rồi, cùng chiến thôi nào!',
        hint: { icon: '🚀', text: 'Chúc bạn buôn may bán đắt và sớm trở thành Vua Trà Sữa!' }
      },
      // CHAPTER 1 SCENE 9: MID-CHAPTER MILESTONE CUTSCENE
      {
        id: 'c1_milestone_1_5m',
        isMilestone: true,
        milestoneTitle: 'Cột Mốc 1.5 Triệu: Anh Bảnh Bất Ngờ',
        avatar: '🕶️',
        speaker: 'Anh Bảnh (Bất Ngờ & Kính Nể)',
        role: 'Cột Mốc 1.5 Triệu: Anh Bảnh Bất Ngờ',
        text: 'Này con bé HeeHee! Hôm nay tao tạt qua góc phố định kiểm tra xem mày có tính bùng nợ bỏ trốn không...\n\nThế quái nào mà tao thấy mày đứng pha trà thoăn thoắt, khách xếp hàng dài từ đầu ngõ đến cuối phố thế kia?! Quan trọng hơn: Cuốn sổ nợ của tao báo mày đã trả được đúng 1.500.000đ — TRÒN MỘT NỬA SỐ NỢ!\n\nTao cho vay ở cái đất này mười mấy năm rồi, đứa nào vay nợ vỉa hè đa phần ngày thứ ba là dẹp tiệm trốn chui trốn lủi. Vậy mà mày và hai đứa nhóc kia lại kiên cường thế này... Tao Anh Bảnh đầu gấu nhưng cũng biết nể người có chí khí! Cố lên con bé, tao chờ ngày xé giấy nợ cho mày!\n\nÀ mà... cho tao một ly Trà Đen Đậm trân châu đen, 30% đường, nhiều đá nhé! Tiền tươi đây, không trừ vào nợ đâu!',
        hint: { icon: '🕶️', text: 'Cột mốc 1.5 Triệu: Anh Bảnh ngạc nhiên trước sự kiên cường của HeeHee và dặn dò cố lên!' }
      }
    ]
  },
  2: {
    title: 'Chương 2: Góc Hẻm Sinh Viên (Tự Do Khởi Nghiệp)',
    scenes: [
      {
        avatar: '🕶️',
        speaker: 'Anh Bảnh (Kính Nể)',
        role: 'Thanh lý sổ nợ',
        text: 'Khá lắm con bé! Tao thật không ngờ một đứa chân ướt chân ráo như mày lại trả đủ 3.000.000đ sòng phẳng đúng hẹn thế này!\n\nĐây, giấy nợ tao xé tại chỗ. Chiếc xe đẩy này từ nay chính thức thuộc về mày! Chúc mày buôn may bán đắt, tao đi đây!',
        hint: { icon: '🎉', text: 'Chúc mừng! Đã xóa sạch 3.000.000đ nợ và bước sang Chương 2!' }
      },
      {
        avatar: '🧋',
        speaker: 'HeeHee (Cô Chủ Quán)',
        role: 'Mở rộng thị trường',
        text: 'Yayyy! Chúng ta đã hoàn toàn sạch nợ rồi! Giờ đây mỗi đồng tiền kiếm được đều là lợi nhuận thực sự của chúng mình!\n\nBé Bắp ơi, phụ chị đẩy xe vào Góc Hẻm Sinh Viên cạnh trường đại học nào! Ở đây đông đảo bạn trẻ và sinh viên qua lại suốt ngày đêm!',
        hint: { icon: '🏫', text: 'Chương 2: Góc Hẻm Sinh Viên - Lượng khách đông đảo hơn!' }
      },
      {
        avatar: '🌽',
        speaker: 'Bé Bắp (Hào Hứng)',
        role: 'Menu đại học',
        text: 'Sinh viên cực mê các món hot trend như Sữa Tươi Trân Châu Đường Đen và Trà Đào Cam Sả chị ơi!\n\nChị mau vào mục [Nâng Cấp] để sắm ngay các công thức mới này nhé! Menu càng phong phú, doanh thu càng bùng nổ!',
        hint: { icon: '🍹', text: 'Mở khóa công thức Sữa Tươi Đường Đen & Trà Đào Cam Sả để đón bão sinh viên!' }
      },
      {
        avatar: '🦹‍♂️',
        speaker: 'Lão Ba (Chủ Quán Trâu Vàng)',
        role: 'Đối thủ cạnh tranh xảo quyệt',
        text: 'Hừm! Lại thêm một con bé hỉ mũi chưa sạch dám kéo xe tới địa bàn Cổng Phụ Bách Khoa à?\n\nQuán \'Trà Sữa Trâu Vàng\' của tao ở đây bao năm nay chưa ngán bất kỳ ai đâu nhé! Liệu hồn mà dọn đi sớm, kẻo mất cả chì lẫn chài!',
        hint: { icon: '⚔️', text: 'Xuất hiện đối thủ cạnh tranh! Cuộc chiến giành khách bắt đầu!' }
      },
      {
        avatar: '🌽',
        speaker: 'Bé Bắp (Tham Mưu Chiến Thuật)',
        role: 'Mở khóa Thẻ Hãm Hại',
        text: 'Chị HeeHee đừng sợ! Ở Chương 2 này, chúng mình đã có vũ khí mới trong mục [Nâng Cấp - Thẻ Hãm Hại]:\n\n• 📱 Thẻ Bóc Phốt (500k): Thuê TikToker bóc phốt dìm hàng đối thủ khiến khách e ngại tẩy chay (-50% khách & -30% doanh thu trong 10 đợt đơn)!\n• 👮 Thẻ Quản Lý Thị Trường (850k): Báo thanh tra ập vào kiểm tra đột xuất đối thủ (-60% khách & -40% doanh thu trong 10 đợt đơn)!',
        hint: { icon: '🃏', text: 'Mở khóa 2 Thẻ Hãm Hại trong mục [Nâng Cấp] để làm suy yếu đối thủ!' }
      },
      {
        avatar: '🛵',
        speaker: 'Anh Lâm (Shipper Tình Báo)',
        role: 'Tác dụng tức thì',
        text: 'Chỉ cần chọn Thẻ Hãm Hại, nhập Mã Quán đối thủ hoặc chọn nhanh từ danh sách Bạn bè, đòn tấn công sẽ CÓ TÁC DỤNG NGAY LẬP TỨC!\n\nQuán bị dính đòn sẽ vang còi báo động 🚨, khách quay xe bỏ đi rầm rộ!\n\nNhưng nhớ canh chừng, đối thủ cũng có thể trả đũa chúng ta bất cứ lúc nào đấy nhé!',
        hint: { icon: '⚡', text: 'Thẻ có tác dụng tức thì ngay khi kích hoạt lên mã quán đối thủ!' }
      },
      {
        avatar: '🧋',
        speaker: 'HeeHee (Quyết Tâm)',
        role: 'Chinh phục Phố Thương Mại',
        text: 'Tuyệt vời! Chúng ta vừa phục vụ khách tận tâm bằng những ly trà hảo hạng, vừa vận dụng chiến thuật thông minh để bảo vệ thị phần!\n\nMục tiêu lớn nhất của Chương 2: Gom đủ 50.000.000đ để thuê mặt bằng lớn tại Phố Thương Mại sầm uất!\n\nCả đội cùng cố gắng nào!',
        hint: { icon: '🏆', text: 'Tích lũy 50.000.000đ để hoàn thành Chương 2 và tiến vào Phố Thương Mại!' }
      },
      // CHAPTER 2 SCENE 8: MID-CHAPTER MILESTONE CUTSCENE
      {
        id: 'c2_milestone_25m',
        isMilestone: true,
        milestoneTitle: 'Cột Mốc 25 Triệu: Lão Ba Tung Đòn Hiểm',
        avatar: '🦹‍♂️',
        speaker: 'Lão Ba & Đội Phản Ứng Nhanh',
        role: 'Cột Mốc 25 Triệu: Lão Ba Tung Đòn Hiểm',
        text: 'Lão Ba (Chủ Trâu Vàng đập bàn nghiến răng): "25 TRIỆU ĐỒNG?! Một con bé xe đẩy vỉa hè mà dám cán mốc doanh thu 25 triệu ngay trước mũi quán Trâu Vàng của tao à? Mày ép tao phải tung đòn hiểm rồi!"\n\n🚨 CÒI BÁO ĐỘNG VANG LÊN!\nLão Ba vừa thuê tài khoản TikTok triệu view tung tin giật gân bôi nhọ chất lượng trà, đồng thời bấm số gọi đường dây nóng Quản Lý Thị Trường ập tới kiểm tra đột xuất hòng niêm phong quầy xe HeeHee!\n\n🌽 Bé Bắp bình tĩnh chìa ngay hồ sơ: "Chị HeeHee kích hoạt [🛡️ Giấy Chứng Nhận ATTP 5 Sao] để hóa giải ngay lệnh kiểm tra!"\n🛵 Anh Lâm mở camera điện thoại: "Anh cũng livestream trực tiếp quy trình pha chế sạch bằng [🎥 Video Đính Chính & Phỏng Vấn]! Toàn bộ sinh viên Bách Khoa đang rầm rộ đứng về phía tiệm mình!"\n\n🧋 HeeHee: "Đòn hiểm đã bị bẻ gãy hoàn toàn! Hãy luôn chuẩn bị sẵn Thẻ Phòng Thủ trong mục Nâng Cấp để bảo vệ tiệm và vững bước cán mốc 50 triệu nào!"',
        hint: { icon: '🛡️', text: 'Cột mốc 25 Triệu: Lão Ba tung đòn hiểm! Hãy dùng Thẻ Phòng Thủ để bảo vệ thương hiệu và bứt phá!' }
      }
    ]
  },
  3: {
    title: 'Chương 3: Trùm Trà Sữa Đô Thị (Flagship Store 2 Tầng)',
    scenes: [
      {
        avatar: '🦹‍♂️',
        speaker: 'Lão Ba (Chủ Quán Trâu Vàng)',
        role: 'Tâm phục khẩu phục',
        text: 'Ta nhận thua rồi, cô bé HeeHee à! Hương vị trà nguyên bản thanh tao và cách phục vụ sạch sẽ, tận tâm của cháu đã hoàn toàn chinh phục sinh viên Bách Khoa!\n\nTừ nay ta xin rửa tay gác kiếm, chuyển giao độc quyền xưởng trân châu nghệ nhân của ta cho tiệm HeeHee! Chúc cháu tiến quân ra Phố Đi Bộ đại thắng!',
        hint: { icon: '🤝', text: 'Lão Ba chịu thua! Toàn bộ khu sinh viên đã công nhận trà sữa HeeHee!' }
      },
      {
        avatar: '🏛️',
        speaker: 'HeeHee (Tổng Giám Đốc)',
        role: 'Khai trương Flagship Store',
        text: 'Tạm biệt chiếc xe đẩy inox vỉa hè đầy kỷ niệm! Chào mừng mọi người đến với FLAGSHIP STORE 2 TẦNG ngay trung tâm Phố Đi Bộ Hà Nội!\n\n• Tầng 1: Quầy bar ốp đá cẩm thạch sang trọng, máy pha Nitro Cold Brew hiện đại!\n• Tầng 2: Không gian thưởng trà ngắm phố, bàn ghế gỗ cao cấp đón khách ngồi lại (Dine-in) thưởng thức!',
        hint: { icon: '✨', text: 'Mặt bằng 2 tầng sang trọng với trải nghiệm khách ngồi tại bàn (Dine-in)!' }
      },
      {
        avatar: '🌽',
        speaker: 'Bé Bắp (Cửa Hàng Trưởng)',
        role: 'Thăng chức quản lý',
        text: 'Em đã được chị HeeHee thăng chức lên CỬA HÀNG TRƯỞNG rồi nè!\n\nTừ giờ, em sẽ phụ trách TỰ ĐỘNG DẬP NẮP 100% tất cả các ly trà mà chị không cần bấm tay nữa! Tốc độ pha chế x2, phục vụ khách siêu mượt mà!',
        hint: { icon: '⭐', text: 'Cửa Hàng Trưởng Bé Bắp tự động dập nắp ly trà ngay khi rót cốc xong!' }
      },
      {
        avatar: '🛵',
        speaker: 'Anh Lâm (Đội Trưởng Logistics)',
        role: 'Tổng chỉ huy đội xe',
        text: 'Còn anh Lâm giờ là ĐỘI TRƯỞNG LOGISTICS, quản lý cả một đội xe Dream chiến và xe Wave giao hàng phủ khắp các quận!\n\nMỗi đơn shipper giao đi được cộng thêm +35% doanh thu và đơn hàng liên tục đổ về không ngơi tay!',
        hint: { icon: '📦', text: 'Đội Trưởng Logistics Anh Lâm buff thêm +35% doanh thu cho mỗi đơn giao hàng!' }
      },
      {
        avatar: '👑',
        speaker: 'HeeHee (Nhà Sáng Lập)',
        role: 'Menu Thượng Lưu & Nhượng Quyền',
        text: 'Tại Flagship Store, chúng ta mở khóa thực đơn thượng lưu: Trà Sữa Dát Vàng 24K, Nitro Cold Brew, Trà Sen Tây Hồ Thượng Hạng, Kem Khò Bánh Bỏng!\n\nKhách VIP ngồi lại còn hào phóng bo thêm tiền Tip siêu khủng từ 15k - 30k mỗi ly!\n\nMục tiêu tiếp theo: Tích lũy 100.000.000đ để tiến tới Chương 4 - Nhượng quyền toàn cầu!',
        hint: { icon: '🚀', text: 'Khai phá thực đơn thượng lưu, thu tiền tip Dine-In và chuẩn bị cho Đế Chế Nhượng Quyền!' }
      },
      // CHAPTER 3 SCENE 6: MID-CHAPTER MILESTONE CUTSCENE
      {
        id: 'c3_milestone_moc_chau',
        isMilestone: true,
        milestoneTitle: 'Khủng Hoảng Nguyên Liệu & Bước Ngoặt Nông Trại Mộc Châu',
        avatar: '🍃',
        speaker: 'Bé Bắp & Anh Lâm (Hội Nghị Khẩn)',
        role: 'Khủng Hoảng Nguyên Liệu & Bước Ngoặt Mộc Châu',
        text: '🏛️ Flagship Store 2 tầng Phố Đi Bộ đang bùng nổ: Ban công tầng 2 chật kín khách VIP, đơn app nổ liên thanh! Nhưng một cơn khủng hoảng nghiêm trọng bất ngờ ập đến:\n\n🌽 Bé Bắp (Cửa Hàng Trưởng hớt hải): "Chị HeeHee ơi nguy to rồi! Các sạp buôn ở Chợ Đầu Mối thấy tiệm mình phát đạt nên bắt tay nhau ép giá cốt trà lên gấp 3 lần, lại còn tuồn trà cũ ẩm mốc không đảm bảo vệ sinh!"\n\n🛵 Anh Lâm (Đội Trưởng Logistics đập bàn): "Tuyệt đối không thể để chất lượng ly trà HeeHee phụ thuộc vào tay đám gian thương ép giá! Đội xe của anh sẵn sàng vượt đèo Tây Bắc xuyên đêm! Anh đề xuất chúng ta tự chủ nguồn cung: [🌱 KHAI PHÁ ĐỒI CHÈ MỘC CHÂU HỮU CƠ]!"\n\n🧋 HeeHee: "Một bước đi chiến lược chuẩn xác! Tự trồng búp trà sạch không chỉ giảm 40% chi phí nguyên liệu mà còn tạo nên dòng trà Signature Organic 5⭐ chuẩn vị thượng lưu! Chúng ta lập tức xuất phát lên Mộc Châu nào!"',
        hint: { icon: '🌱', text: 'Bước ngoặt Nông Trại Mộc Châu: Quán 2 tầng tự chủ nguồn cung búp trà Organic 5⭐!' }
      }
    ]
  },
  4: {
    title: 'Chương 4: Đế Chế Nhượng Quyền Toàn Cầu (Vua Trà Sữa Đô Thị)',
    scenes: [
      {
        avatar: '👑',
        speaker: 'HeeHee (Chủ Tịch Tập Đoàn)',
        role: 'Vươn tầm thế giới',
        text: 'Từ một chiếc xe đẩy vỉa hè nợ 3 triệu đồng cho đến cửa hàng Flagship 2 tầng Phố Đi Bộ, hôm nay thương hiệu HEEHEE chính thức bước lên đỉnh cao mới:\n\n🎉 TẬP ĐOÀN NHƯỢNG QUYỀN TOÀN CẦU HEEHEE GLOBAL!\n\nChúng ta đã chính thức mở Chi Nhánh Sài Gòn đầu tiên ngay trung tâm Phố Đi Bộ Nguyễn Huệ hoa lệ!',
        hint: { icon: '👑', text: 'Chào mừng bạn đến với Chương 4: Đế Chế Nhượng Quyền Toàn Cầu!' }
      },
      {
        avatar: '🌽',
        speaker: 'Bé Bắp (Tổng Giám Đốc Vận Hành - COO)',
        role: 'Chuỗi chi nhánh tự động',
        text: 'Chị HeeHee ơi, em vừa nhận chức TỔNG GIÁM ĐỐC VẬN HÀNH (COO)!\n\nTừ nay, mỗi chi nhánh nhượng quyền (Sài Gòn Nguyễn Huệ, Đà Nẵng, Tokyo, Seoul...) sẽ TỰ ĐỘNG TẠO DOANH THU THỤ ĐỘNG mỗi giờ!\n\nChị chỉ cần bấm [Thu Tiền Nhượng Quyền] là hàng triệu đồng tiền bản quyền sẽ chảy thẳng về tài khoản!',
        hint: { icon: '💰', text: 'Thu tiền nhượng quyền thụ động định kỳ từ mạng lưới chi nhánh nhượng quyền!' }
      },
      {
        avatar: '🛵',
        speaker: 'Anh Lâm (Giám Đốc Chuỗi Cung Ứng)',
        role: 'Supply Chain Director',
        text: 'Anh đã nâng cấp hạm đội xe tải lạnh 4x4 chuyên dụng và mạng lưới vận chuyển hỏa tốc!\n\nLá trà Mộc Châu hảo hạng, hoa sen Tây Hồ tươi rói và cốt sữa béo ngậy được vận chuyển xuyên suốt Bắc - Nam không gián đoạn một giây nào!',
        hint: { icon: '🚚', text: 'Hệ thống logistics vận chuyển nguyên liệu phủ sóng toàn quốc!' }
      },
      {
        avatar: '🔨',
        speaker: 'Thương Gia Quốc Tế (Chuyên Gia Đấu Giá)',
        role: 'Sàn Đấu Giá Quý Hiếm',
        text: 'Kính chào Chủ Tịch HeeHee! Sàn Đấu Giá Trà Cổ Thụ Quốc Tế đã chính thức mở cửa đón tiếp quý tiệm!\n\nTại đây, quý khách có thể đặt giá thầu tranh đoạt các mẻ trà huyền thoại: Trà Cổ Thụ Tà Xùa 300 Năm, Ô Long Hun Khói Đài Loan, Bạch Trà Shan Tuyết Đỉnh Fansipan!\n\nMỗi mẻ trà quý sẽ buff hào quang danh tiếng vĩnh viễn và gia tăng doanh thu bùng nổ!',
        hint: { icon: '🔨', text: 'Tham gia Sàn Đấu Giá trong mục [Đế Chế] để sở hữu các mẻ trà báu vật!' }
      },
      {
        avatar: '✨',
        speaker: 'HeeHee (Vua Trà Sữa)',
        role: 'Mục tiêu tối thượng',
        text: 'Mục tiêu tối thượng của Chương 4:\n\n• Nâng cấp các chi nhánh lên cấp độ 5 sao!\n• Sở hữu công thức Matcha Kyoto Dát Bạc và các bảo vật trà quý!\n• Tích lũy khối tài sản 200.000.000đ để bước lên ngôi vị VUA TRÀ SỮA ĐÔ THỊ TOÀN CẦU (Boba Tycoon Legend)!\n\nCùng viết tiếp trang sử huy hoàng cho Tiệm Trà Sữa HeeHee nào!',
        hint: { icon: '🏆', text: 'Chinh phục ngôi vị Vua Trà Sữa Đô Thị Toàn Cầu!' }
      },
      // CHAPTER 4 SCENE 6: MID-CHAPTER MILESTONE CUTSCENE
      {
        id: 'c4_milestone_auction',
        isMilestone: true,
        milestoneTitle: 'Đại Chiến Đấu Giá Quốc Tế',
        avatar: '🔨',
        speaker: 'Chủ Tịch HeeHee & Sàn Đấu Giá',
        role: 'Đại Chiến Đấu Giá Quốc Tế',
        text: '🌐 Sàn Đấu Giá Quốc Tế Tokyo & Seoul — Nơi hội tụ các tập đoàn F&B đa quốc gia hùng mạnh nhất châu Á:\n\n🔨 Đấu Giá Viên: "Và sau đây là mẻ trà báu vật của phiên đấu giá: [TRÀ CỔ THỤ TÀ XÙA 300 NĂM NGẬM SƯƠNG] từ đỉnh non cao Việt Nam! Giá khởi điểm: 50.000 USD!"\n\n🏢 Tập Đoàn Tokyo Shibuya: "75.000 USD! Mẻ trà này phải về tay chuỗi trà đạo Nhật Bản!"\n🏢 Tập Đoàn Seoul Myeongdong: "95.000 USD! Chúng tôi sẽ biến nó thành biểu tượng trà hoàng gia!"\n\n👑 Chủ Tịch HeeHee hiên ngang giơ bảng số 88: "130.000 USD! Tinh hoa trà ngàn năm của non sông Việt Nam phải do chính người Việt nâng niu và tự hào mang ra đãi bạn bè quốc tế!"\n\n[KENG! KENG! KENG!] Tiếng búa chốt giá vang dội cả hội trường! Toàn bộ đại diện quốc tế đồng loạt đứng dậy vỗ tay thán phục khí phách của HeeHee Global! Trà Cổ Thụ Việt Nam chính thức bước lên đỉnh vinh quang!',
        hint: { icon: '🏆', text: 'Đại chiến Đấu Giá Quốc Tế: Tranh đoạt mẻ trà Cổ Thụ Tà Xùa 300 năm trước Tokyo & Seoul!' }
      }
    ]
  },
  5: {
    title: 'Chương 5: Vương Triều Trà Sữa Vũ Trụ (The Cosmic Boba Legend)',
    scenes: [
      {
        avatar: '👑',
        speaker: 'HeeHee (Nữ Hoàng Trà Sữa Vũ Trụ)',
        role: 'Boba Tycoon Legend',
        text: 'Hôm nay, một ngày lịch sử thiêng liêng của Tiệm Trà Sữa HeeHee!\n\nTừ chiếc xe đẩy inox ọp ẹp bên vỉa hè nợ ngập đầu 3 triệu đồng của Anh Bảnh... hôm nay chúng ta đã chính thức vượt mốc 200.000.000đ tài sản và được Tổ chức F&B Toàn cầu trao tặng vương miện:\n\n👑 VUA TRÀ SỮA VŨ TRỤ (BOBA TYCOON LEGEND)!\n\nChiếc xe đẩy thân thương ngày nào giờ đây đã khoác lên mình ánh sáng Ngân Hà lấp lánh, sẵn sàng phục vụ thực khách từ khắp năm châu bốn biển!',
        hint: { icon: '🌌', text: 'Chào mừng bạn đến với Chương 5: Vương Triều Trà Sữa Vũ Trụ!' }
      },
      {
        avatar: '🦈',
        speaker: 'Shark Hưng (Chủ Tịch Quỹ F&B Toàn Cầu)',
        role: 'Nhà Đầu Tư Huyền Thoại',
        text: 'Chúc mừng Nữ Hoàng HeeHee! Quỹ đầu tư mạo hiểm quốc tế của chúng tôi đã theo dõi từng bước đi kiên cường của cô từ ngõ hẻm sinh viên Bách Khoa đến các đại lộ phồn hoa.\n\nHội đồng đầu tư chính thức định giá thương hiệu HEEHEE ở mức 100 TRIỆU USD, trao tặng tiệm 500 TeaCoin hoàng gia cùng bản thiết kế Độc Quyền [Cosmic Coffee Cart] lộng lẫy nhất thiên hà!',
        hint: { icon: '💎', text: 'Nhận 500 TeaCoin hoàng gia và kích hoạt Skin Xe Đẩy Vũ Trụ Ngân Hà!' }
      },
      {
        avatar: '🌽',
        speaker: 'Bé Bắp (Tổng Giám Đốc Điều Hành)',
        role: 'Công Nghệ Pha Chế Vũ Trụ',
        text: 'Chị HeeHee ơi! Em đã nâng cấp toàn bộ quầy pha chế sang công nghệ [Nano Cold-Seal Hút Chân Không]!\n\nMỗi ly trà rót ra đều được niêm phong lượng tử hoàn hảo, giữ trọn 100% hương hoa nhài tinh khiết và vị béo ngậy của sữa tươi cao nguyên! Tốc độ dập nắp và ra món đã đạt cảnh giới siêu thanh!',
        hint: { icon: '⚡', text: 'Bé Bắp kích hoạt công nghệ dập nắp siêu tốc giữ trọn độ tươi mát của trà!' }
      },
      {
        avatar: '🚀',
        speaker: 'Anh Lâm (Hạm Trưởng Logistics Vũ Trụ)',
        role: 'Vận Tải Tốc Độ Ánh Sáng',
        text: 'Chiếc xe Wave chiến năm xưa của anh giờ đã trở thành Hạm Đội Vận Tải Siêu Thanh liên lục địa!\n\nLá trà Shan tuyết cổ thụ ngàn năm và sữa non Mộc Châu chỉ mất đúng 15 phút để vận chuyển thẳng tới quầy bar. Khách đặt hàng ở bất kỳ đâu cũng nhận được ly trà mát lạnh tê tái và đậm đà nhất!',
        hint: { icon: '🚀', text: 'Mạng lưới logistics vận chuyển nguyên liệu siêu tốc không giới hạn!' }
      },
      {
        avatar: '🕶️',
        speaker: 'Anh Bảnh & Lão Ba (Hội Đồng Trưởng Lão)',
        role: 'Tâm Phục Khẩu Phục',
        text: 'Ha ha ha! Nhìn mày hôm nay, tao - Anh Bảnh đầu gấu khu phố năm xưa cũng phải ngả mũ kính phục sát đất!\n\nAi mà tin được một cô bé từng khóc ròng vì khoản nợ 3 triệu hôm nay lại trở thành Nữ Hoàng Trà Sữa quyền lực đến thế! Còn Lão Ba ta xin kính cẩn dâng tặng công thức bí truyền [Hồng Trà Vương Triều Full Topping] cho tiệm!',
        hint: { icon: '👑', text: 'Anh Bảnh & Lão Ba chính thức công nhận ngôi vị Đệ Nhất Trà Sữa Bất Khả Chiến Bại!' }
      },
      {
        avatar: '💖',
        speaker: 'HeeHee (Lời Cảm Ơn Tri Ân)',
        role: 'Từ Đáy Trái Tim',
        text: 'Nhưng thành tựu kỳ diệu nhất của ngày hôm nay... chính là nhờ có BẠN - người cộng sự tận tụy đã sát cánh cùng HeeHee qua từng ca bán vất vả, từng cơn mưa rào và từng đợt bão đơn hàng!\n\nCảm ơn bạn đã biến ước mơ vỉa hè nhỏ bé thành một Huyền Thoại Vũ Trụ rực rỡ! Hãy tiếp tục tận hưởng niềm vui làm chủ tiệm và cùng HeeHee viết tiếp những câu chuyện tuyệt vời nhé! 🧋✨',
        hint: { icon: '💖', text: 'Cảm ơn bạn đã đồng hành và hoàn thành trọn vẹn Cốt Truyện HeeHee Boba Tycoon!' }
      },
      // CHAPTER 5 SCENE 7: GRAND EPILOGUE MILESTONE CUTSCENE
      {
        id: 'c5_milestone_grand_epilogue',
        isMilestone: true,
        milestoneTitle: 'Đại Tiệc Tri Ân Thiên Hà (Grand Epilogue)',
        avatar: '🌌',
        speaker: 'Đại Gia Đình Tiệm Trà Sữa HeeHee',
        role: 'Đại Tiệc Tri Ân Thiên Hà (Grand Epilogue)',
        text: '✨ Dưới bầu trời Trạm Không Gian lung linh ngàn tinh tú, ánh sáng neon tím thạch anh của chiếc Siêu Xe Đẩy [Cosmic Coffee Cart] chiếu rọi khắp quảng trường Ngân Hà rực rỡ!\n\n🕶️ Anh Bảnh (khoác vest bảnh bao, cụng ly): "Ai mà tin được con bé rụt rè vay nóng 3 triệu năm xưa giờ đã thành Nữ Hoàng Vũ Trụ! Đời tao chỉ tự hào nhất một điều: Năm đó tao đã cho đúng người vay!"\n🦹‍♂️ Lão Ba (cười sảng khoái): "Ta cũng tự hào vì đã chuyển giao xưởng trân châu nghệ nhân cho cháu! Hương vị trà sữa HeeHee mãi mãi là số một!"\n👵 Cô Mai & Bo Sao Đỏ: "Cả khu phố và trường Bách Khoa hôm nay rộn ràng mở tiệc theo dõi lễ phát sóng trực tiếp từ vũ trụ đấy cháu ơi!"\n🎒 Bé Hạnh (bán vé số năm xưa): "Chị HeeHee ơi, nhờ có Quỹ Học Bổng HeeHee mà hôm nay em đã được bước chân vào giảng đường đại học rồi nè!"\n\n🌽 Bé Bắp & 🛵 Anh Lâm (đồng thanh): "Chúc mừng Chị Cả! Mọi giọt mồ hôi, mọi chuyến xe đêm vượt đèo đều đã đơm hoa kết trái rực rỡ!"\n\n🧋 HeeHee (rưng rưng nước mắt, hướng về màn hình): "Và người đặc biệt nhất... chính là BẠN! Cảm ơn bạn đã luôn tin tưởng, đồng hành và cùng HeeHee biến giấc mơ nhỏ bé bên vỉa hè thành một Huyền Thoại Vĩnh Cửu giữa các vì sao! Nào mọi người... 1, 2, 3... CÙNG NÂNG LY HEEHEE NÀO! 🧋🎉👑"',
        hint: { icon: '👑', text: 'Grand Epilogue: Tất cả nhân vật hội tụ, nâng ly chúc mừng đại kết cục hoàn mỹ của HeeHee!' }
      }
    ]
  }
};

// Story Milestone & Memory Album Badges Catalog
export const STORY_MILESTONES = [
  {
    id: 'c1_milestone_1_5m',
    chapter: 1,
    sceneIdx: 8,
    title: 'Cột Mốc 1.5 Triệu: Anh Bảnh Bất Ngờ',
    shortDesc: 'Anh Bảnh ghé quầy kiểm tra, ngạc nhiên vì sự kiên cường của HeeHee và dặn dò cố lên.',
    badgeId: 'badge_banh_respect',
    badgeName: '🏅 Trượng Nghĩa Phố Cũ',
    badgeIcon: '🕶️',
    badgeDesc: 'Đạt mốc trả nợ 1.500.000đ và khiến gã chủ nợ Anh Bảnh nể phục mua ủng hộ ly trà đen.',
    reward: 'Mở khóa Hồi Ức & Huy Hiệu 🏅',
    checkUnlocked: (save) => {
      if (!save) return false;
      const chapter = save.chapter || 1;
      const debt = save.debt_remaining !== undefined ? save.debt_remaining : 3000000;
      return chapter > 1 || debt <= 1500000;
    }
  },
  {
    id: 'c2_milestone_25m',
    chapter: 2,
    sceneIdx: 7,
    title: 'Cột Mốc 25 Triệu: Lão Ba Tung Đòn Hiểm',
    shortDesc: 'Lão Ba giở trò bóc phốt và gọi quản lý thị trường, khích lệ người chơi dùng thẻ phòng thủ và bứt phá.',
    badgeId: 'badge_lao_ba_counter',
    badgeName: '🛡️ Bản Lĩnh Doanh Nhân',
    badgeIcon: '🦹‍♂️',
    badgeDesc: 'Đạt doanh thu 25.000.000đ tại Cổng Phụ Bách Khoa và hóa giải đòn bẩn cạnh tranh.',
    reward: 'Mở khóa Hồi Ức & Huy Hiệu 🛡️',
    checkUnlocked: (save) => {
      if (!save) return false;
      const chapter = save.chapter || 1;
      const money = save.money !== undefined ? save.money : (save.cash || 0);
      return chapter > 2 || (chapter >= 2 && money >= 25000000);
    }
  },
  {
    id: 'c3_milestone_moc_chau',
    chapter: 3,
    sceneIdx: 5,
    title: 'Khủng Hoảng Nguyên Liệu & Bước Ngoặt Nông Trại Mộc Châu',
    shortDesc: 'Quán 2 tầng quá tải, thiếu lá trà sạch, Bé Bắp và Anh Lâm đề xuất khai phá đồi chè Mộc Châu.',
    badgeId: 'badge_moc_chau_farm',
    badgeName: '🌱 Nông Trại Đồi Chè 5⭐',
    badgeIcon: '🍃',
    badgeDesc: 'Vượt qua khủng hoảng nguyên liệu bằng chiến lược tự chủ Đồi Chè Mộc Châu Organic.',
    reward: 'Mở khóa Hồi Ức & Huy Hiệu 🌱',
    checkUnlocked: (save) => {
      if (!save) return false;
      const chapter = save.chapter || 1;
      let upgrades = {};
      try {
        upgrades = typeof save.upgrades === 'string' ? JSON.parse(save.upgrades || '{}') : (save.upgrades || {});
      } catch (e) {}
      const money = save.money !== undefined ? save.money : (save.cash || 0);
      return chapter > 3 || (chapter >= 3 && (upgrades.staff_be_bap_manager || upgrades.staff_anh_lam_captain || money >= 60000000));
    }
  },
  {
    id: 'c4_milestone_auction',
    chapter: 4,
    sceneIdx: 5,
    title: 'Đại Chiến Đấu Giá Quốc Tế',
    shortDesc: 'Tranh đoạt mẻ trà cổ thụ Tà Xùa trước các tập đoàn ngoại quốc tại Tokyo & Seoul.',
    badgeId: 'badge_auction_victory',
    badgeName: '🏆 Vang Danh Trà Cổ Thụ',
    badgeIcon: '🔨',
    badgeDesc: 'Chiến thắng phiên đấu giá quốc tế, đưa báu vật Trà Cổ Thụ Tà Xùa vươn tầm năm châu.',
    reward: 'Mở khóa Hồi Ức & Huy Hiệu 🏆',
    checkUnlocked: (save) => {
      if (!save) return false;
      const chapter = save.chapter || 1;
      let upgrades = {};
      try {
        upgrades = typeof save.upgrades === 'string' ? JSON.parse(save.upgrades || '{}') : (save.upgrades || {});
      } catch (e) {}
      const money = save.money !== undefined ? save.money : (save.cash || 0);
      return chapter > 4 || (chapter >= 4 && (save.auction_won_count > 0 || upgrades.auction_won > 0 || money >= 120000000));
    }
  },
  {
    id: 'c5_milestone_grand_epilogue',
    chapter: 5,
    sceneIdx: 6,
    title: 'Đại Tiệc Tri Ân Thiên Hà (Grand Epilogue)',
    shortDesc: 'Tất cả nhân vật: HeeHee, Bé Bắp, Anh Lâm, Anh Bảnh, Lão Ba, Cô Mai, Bé Hạnh vé số, Bo Sao Đỏ cùng nâng ly chúc mừng.',
    badgeId: 'badge_grand_epilogue',
    badgeName: '👑 Vua Trà Sữa Vũ Trụ',
    badgeIcon: '🌌',
    badgeDesc: 'Hội tụ tất cả nhân vật trong đêm tiệc Tri Ân Thiên Hà, hoàn thành toàn bộ cốt truyện!',
    reward: 'Danh Hiệu Vua Vũ Trụ 👑',
    checkUnlocked: (save) => {
      if (!save) return false;
      const chapter = save.chapter || 1;
      return chapter >= 5;
    }
  }
];
