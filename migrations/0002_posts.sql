create table if not exists posts (
  id           serial primary key,
  slug         text not null unique,
  title        text not null,
  excerpt      text not null default '',
  body         text not null default '',
  category     text not null,
  cover        text not null default '',
  kicker       text not null default '',
  author       text not null default 'Lê Phan',
  featured     boolean not null default false,
  published    boolean not null default false,
  reads        integer not null default 0,
  minutes      integer not null default 4,
  published_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists posts_published_idx on posts (published, published_at desc);
create index if not exists posts_category_idx on posts (category);

insert into posts (slug, title, excerpt, body, category, cover, kicker, author, featured, published, reads, minutes, published_at)
values
(
  'v-league-nhung-diem-nong',
  'V-League: những điểm nóng đáng chờ ở chặng đường tiếp theo',
  'Cục diện nhóm đầu siết lại. Phong độ, lịch thi đấu và những quyết định nhân sự sẽ tách đội còn tham vọng khỏi đội chỉ đang giữ nhịp.',
  $$V-League không thưởng cho sự an toàn quá lâu. Khi lịch dày lên, khoảng cách trên bảng xếp hạng chỉ còn là một vài điểm, và mỗi vòng đấu biến thành một cuộc thương lượng giữa thể lực, chiến thuật và cái đầu.

Điều đáng xem không nằm ở một cái tên. Nó nằm ở cách các đội xử lý quãng đường: ai dám xoay tua, ai vẫn tin vào bộ khung cũ, ai chịu thay đổi nhịp pressing khi đối thủ đã đọc được bài vở. Những chi tiết ấy quyết định một mùa giải nhiều hơn một bàn thắng đẹp.

Khán đài cũng đã khác. Người xem không chỉ hỏi đội nào đang dẫn đầu. Họ hỏi đội nào còn chơi được bóng khi bị dẫn, đội nào giữ được cấu trúc khi mất người, và huấn luyện viên nào dám nhận trách nhiệm trước micro thay vì đổ cho lịch thi đấu.

> Một giải đấu hay không phải lúc nào cũng ồn ào. Đôi khi nó hay vì bạn nhìn ra được ai đang chịu đựng đúng cách.

Từ ghế báo, Lê Phan sẽ đi cùng chặng đường đó: bám phòng họp báo, bám đường biên, và viết về những quyết định nhỏ mà bảng tỷ số không kể hết.$$,
  'v-league',
  'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1600&q=80',
  'Spotlight · Bóng đá Việt Nam',
  'Lê Phan',
  true,
  true,
  1284,
  5,
  now() - interval '3 hours'
),
(
  'long-bat-giac-ban-linh',
  'Trong lồng bát giác: nơi bản lĩnh lên tiếng',
  'MMA không bắt đầu khi chuông reo. Nó bắt đầu từ những tuần cắt cân, những buổi tập mà không ai quay, và một quyết định rất lạnh giữa hiệp đấu.',
  $$Lồng bát giác là môn thể thao của khoảng cách. Một bước quá gần thì ăn gối. Một bước quá xa thì mất quyền kiểm soát. Người xem thấy đòn. Vận động viên đang đếm nhịp thở của đối thủ.

Bản lĩnh ở đây không phải cái cau mày trước ống kính. Bản lĩnh là biết nhận đòn nào đáng nhận, biết lúc nào phải bỏ một thế vật đẹp để giữ thể lực cho hiệp sau. Những võ sĩ đáng nhớ thường không phải người ném nhiều đòn nhất.

Vietnam Sports Daily nhìn MMA như một môn của chiến thuật, không phải một màn trình diễn đau. Có những trận người thắng là người im hơn. Có những trận người thua lại để lại bài học rõ hơn trên bảng điểm.

Lê Phan sẽ viết từ góc đó: cân nặng, giáo án, góc quay, và những câu nói sau trận khi adrenaline đã hạ.$$,
  'mma',
  'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80',
  'Fight night · MMA',
  'Lê Phan',
  true,
  true,
  966,
  4,
  now() - interval '8 hours'
),
(
  'doi-tuyen-lua-chon-nhan-su',
  'Đội tuyển Việt Nam và những lựa chọn nhân sự đáng chú ý',
  'Danh sách triệu tập không chỉ là tên. Đó là một tuyên bố về cách đội muốn chơi, về ai đang được tin ở thời điểm này, và ai cần thêm một nhịp.',
  $$Mỗi đợt triệu tập là một bản thảo. Có cầu thủ đi vì phong độ câu lạc bộ. Có cầu thủ đi vì vai trò không ai thay được. Có cầu thủ đứng ngoài không phải vì yếu, mà vì hệ thống hiện tại chưa có ô cho họ.

Người hâm mộ hay tranh luận đúng-sai của một cái tên. Công việc của phóng viên là hỏi câu kế tiếp: cái tên ấy vào để giải quyết vấn đề gì? Giữ bóng? Chạy chỗ? Một quả đá phạt? Một tiếng nói trong phòng thay đồ?

Đội tuyển quốc gia luôn sống trong hai đồng hồ. Một chiếc đếm đến trận sắp tới. Chiếc kia đếm đến thế hệ kế tiếp. Bỏ qua chiếc nào cũng làm bóng đá Việt Nam nghèo đi.

Bài viết này mở một chuỗi ghi chép của Lê Phan quanh lực lượng: ai đang lên tiếng bằng phong độ, ai cần được bảo vệ khỏi kỳ vọng quá sớm.$$,
  'doi-tuyen',
  'https://images.unsplash.com/photo-1574629810360-7ef9b9b1a7c4?auto=format&fit=crop&w=1600&q=80',
  'Đội tuyển quốc gia',
  'Lê Phan',
  true,
  true,
  1102,
  4,
  now() - interval '1 day'
),
(
  'san-co-the-gioi-cau-chuyen',
  'Sân cỏ thế giới: những câu chuyện không nằm trên bảng tỷ số',
  'Từ các giải hàng đầu đến những gương mặt đang đổi nhịp sự nghiệp, tuần này có nhiều điều đáng đọc hơn một kết quả 90 phút.',
  $$Bóng đá quốc tế dễ bị nuốt bởi tỷ số. Một trận hòa có thể là một kế hoạch đúng. Một chiến thắng đậm có thể là buổi tối đối thủ đã vỡ từ phút thứ mười. Đọc trận đấu là đọc ý đồ, không chỉ đọc bảng điện tử.

Tuần này đáng chú ý ở những chuyển động bên lề: một tiền đạo đang học lại cách di chuyển không bóng, một hàng thủ trẻ bị giao nhiệm vụ sớm hơn dự kiến, một huấn luyện viên chấp nhận xấu xí để giữ cấu trúc.

Người xem Việt Nam theo dõi thế giới không chỉ để giải trí. Họ đang đối chiếu. Nhịp pressing nào có thể mang về. Mô hình đào tạo nào không hợp sân nhà. Đó là lý do một tờ thể thao không thể chỉ dịch tin.

Lê Phan chọn những câu chuyện có thể đứng vững sau khi highlight hết hạn: sự nghiệp, lựa chọn, và cái giá của một phong cách chơi.$$,
  'quoc-te',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1600&q=80',
  'Bóng đá quốc tế',
  'Lê Phan',
  false,
  true,
  734,
  5,
  now() - interval '2 days'
),
(
  'mma-chien-thuat-tung-hiep',
  'MMA không chỉ là sức mạnh: chiến thuật trong từng hiệp',
  'Đòn đẹp làm người ta reo. Kế hoạch mới làm một võ sĩ đi hết trận. Đây là cách nhìn một đêm đấu khi bạn đã xem quá phần giao lưu.',
  $$Hiệp một thường thuộc về người dám chiếm trung tâm. Hiệp hai thuộc về người còn chân. Hiệp ba, nếu có, thuộc về người đã nói thật với bản thân từ lúc cắt cân.

Chiến thuật MMA nghe trừu tượng cho đến khi bạn thấy một võ sĩ liên tục chạm chân trước để câu phản đòn, hoặc giả vờ vào vật chỉ để kéo đối thủ ra khỏi nhịp đấm. Những việc nhỏ đó không lên thumbnail, nhưng chúng thắng trận.

Người mới theo dõi nên bỏ thói quen chỉ chờ knockout. Hãy nhìn tay trước, khoảng cách hai chân, và lúc nào vận động viên ngừng tấn công để thở. Bản lĩnh nằm ở chỗ biết dừng.

Fight Desk của Vietnam Sports Daily sẽ đi chậm hơn highlight, đủ chậm để thấy vì sao một đòn tưởng vô hại lại là đòn mở màn.$$,
  'mma',
  'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1600&q=80',
  'Fight desk',
  'Lê Phan',
  false,
  true,
  512,
  4,
  now() - interval '3 days'
),
(
  'mon-the-thao-keo-nguoi-xem',
  'Những môn thể thao đang kéo người hâm mộ ra khỏi một khung giờ',
  'Bóng đá vẫn là nhịp lớn. Nhưng đường chạy, võ đài, sân cứng và sân rổ đang giữ chân một lớp khán giả không muốn chỉ chờ cuối tuần.',
  $$Thể thao Việt Nam lâu nay bị kể như một môn chính và phần còn lại. Cách kể ấy làm thiệt người xem. Một giải chạy phố, một giải bóng rổ sinh viên, một đêm kickboxing địa phương đều có nhịp riêng, có nhân vật riêng, có lý do để ở lại hết trận.

Điều đang đổi là sự chú ý. Người trẻ không trung thành với một lịch phát sóng. Họ trung thành với cảm giác được chứng kiến ai đó tiến bộ thật. Môn nào kể được câu chuyện đó sẽ có khán giả, dù sân không đầy.

Tòa soạn này mở chuyên mục thể thao khác không phải để cho đủ menu. Lê Phan muốn những môn từng đứng bên lề có cùng một chuẩn viết: rõ sự kiện, rõ con người, không màu mè.

Nếu bạn đang theo một môn mà báo lớn ít đụng tới, bàn biên tập muốn nghe. Một tờ thể thao sống được là nhờ tai nó để đúng chỗ.$$,
  'the-thao-khac',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?auto=format&fit=crop&w=1600&q=80',
  'Thể thao khác',
  'Lê Phan',
  false,
  true,
  408,
  4,
  now() - interval '4 days'
),
(
  'phia-sau-mot-su-kien',
  'Phía sau một sự kiện thể thao là những câu chuyện nào?',
  'Đèn sân bật lên là phần người xem thấy. Trước đó là lịch, là người mở cửa, là vận động viên ngồi im, và một phóng viên đang quyết định câu nào đáng giữ.',
  $$Một sự kiện thể thao nhìn từ khán đài là kết quả. Nhìn từ hành lang là một chuỗi việc phải đúng giờ: cân đo, kiểm tra, khởi động, bản nhạc walkout, và khoảnh khắc ai đó nhận ra mình không còn đường lùi.

Lê Phan thích phần hành lang. Không phải vì nó bí mật. Vì ở đó giọng người thật hơn. Vận động viên nói ngắn. Huấn luyện viên nói vòng. Người làm truyền thông muốn một câu sạch. Phóng viên phải chọn mình đứng về phía câu nào còn đúng sau 24 giờ.

> Hậu trường không phải chỗ moi chuyện. Đó là chỗ kiểm tra xem câu chuyện trên sân có thật như người ta đang kể không.

Góc nhìn trên Vietnam Sports Daily sẽ dành cho những lát cắt ấy. Không đua tin phút. Đủ chậm để một chi tiết có chỗ thở. Đó là cách một tờ báo giữ được chữ ký của người viết.$$,
  'goc-nhin',
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1600&q=80',
  'Góc nhìn · Lê Phan',
  'Lê Phan',
  false,
  true,
  640,
  6,
  now() - interval '5 days'
),
(
  'bong-ro-phong-trao',
  'Bóng rổ phong trào và thế hệ không chờ được gọi tên',
  'Trên những sân thuê theo giờ, một lớp cầu thủ trẻ đang tự xây lịch, tự quay trận, tự học — không đợi một giải lớn gọi tên mình.',
  $$Bóng rổ Việt Nam có hai mặt. Một mặt là các đội tuyển, các giải được phát sóng, những cái tên đã có tiểu sử. Mặt kia là sân thuê, đèn vàng, và những trận pick-up kết thúc chỉ vì bảo vệ tắt điện.

Thế hệ này không chờ. Họ cắt highlight, họ xem film phòng thủ của người khác, họ tranh một suất ngoại binh theo cách rất thực dụng: ai phòng ngự được thì được chơi. Chuyên môn hình thành từ sự lặp lại, không từ một bài tuyên ngôn.

Vấn đề của báo là đừng chỉ xuất hiện khi có cúp. Lê Phan sẽ ghé những sân đó như ghé một buổi tập của V-League: hỏi vai trò, hỏi thể lực, hỏi vì sao một cầu thủ chọn ném giữa thay vì lao rổ.

Nếu bóng rổ muốn khán giả ở lại, nó cần được viết như một môn có chiến thuật — không như một hoạt động cuối tuần.$$,
  'bong-ro',
  'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1600&q=80',
  'Bóng rổ',
  'Lê Phan',
  false,
  true,
  356,
  4,
  now() - interval '6 days'
),
(
  'tennis-nhip-chan-nhip-tho',
  'Tennis: nhịp chân, nhịp thở và những trận không nằm ở set điểm',
  'Set điểm là phần dễ kể. Phần đáng viết là cách một tay vợt sửa chân trái sau một game bị bẻ, và vì sao nhịp giao bóng đổi cả trận.',
  $$Tennis trông cô đơn, nên người ta hay viết nó như chuyện tính cách. Tính cách có thật. Nhưng trận đấu được quyết bởi những việc cụ thể hơn: đường bóng thứ nhất có đủ sâu không, chân có còn kịp trở về giữa sân không, và giao bóng hai có bị đọc sau set một không.

Một tay vợt giỏi không phải lúc nào cũng chơi đẹp hơn. Họ chơi ít lỗi hơn vào đúng lúc đối thủ bắt đầu nóng. Đó là lý do xem tennis bằng highlight rất dễ hiểu sai người thắng.

Lê Phan tiếp cận môn này như tiếp cận một trận bóng đá có ít người hơn và ít chỗ trốn hơn. Mỗi điểm là một pha bóng. Mỗi game break là một tình huống cố định được thực hiện đúng hoặc sai.

Chuyên mục tennis trên tờ này sẽ ít lời tán và nhiều nhịp. Nếu bạn chơi, bạn sẽ nhận ra. Nếu bạn chỉ xem, bạn sẽ bắt đầu thấy vì sao một quả giao bóng chậm lại đáng sợ.$$,
  'tennis',
  'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1600&q=80',
  'Tennis',
  'Lê Phan',
  false,
  true,
  289,
  4,
  now() - interval '7 days'
),
(
  'ghi-chep-san-tap',
  'Ghi chép từ sân tập — bản nháp chưa lên sóng',
  'Buổi sáng, sân còn ướt. Một vài cầu thủ trẻ chạy trước giáo án. Đây là ghi chép thô, chưa đủ để đăng.',
  $$Mình đến sớm hơn lịch hẹn hai mươi phút. Sân còn mùi cỏ cắt. Hai cầu thủ trẻ tự chuyền, không nói nhiều. Huấn luyện viên chưa ra.

Phần này sẽ được viết lại khi mình có đủ một câu từ phòng tập và một chi tiết không thể bịa. Nháp để ở bàn biên tập, chưa cho lên trang nhất.

Nếu tối nay kịp một phát biểu rõ, bài sẽ chuyển sang công khai. Nếu chưa, nó ở lại đây.$$,
  'goc-nhin',
  'https://images.unsplash.com/photo-1574629810360-7ef9b9b1a7c4?auto=format&fit=crop&w=1600&q=80',
  'Nháp · Góc nhìn',
  'Lê Phan',
  false,
  false,
  0,
  2,
  now() - interval '12 hours'
)
on conflict (slug) do nothing;
