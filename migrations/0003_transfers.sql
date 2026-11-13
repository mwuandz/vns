insert into posts (slug, title, excerpt, body, category, cover, kicker, author, featured, published, reads, minutes, published_at)
values (
  'cua-so-chuyen-nhuong',
  'Chuyển nhượng: đọc một tin đồn trước khi tin một bản hợp đồng',
  'Mùa chuyển nhượng nhiều tiếng hơn chữ. Lê Phan ghi lại cách tách một nguồn đáng tin khỏi một dòng tin được viết để câu tương tác.',
  $$Một tin chuyển nhượng thường đi qua ba lớp. Lớp thứ nhất là người trong cuộc: câu lạc bộ, người đại diện, hoặc một nguồn đã đúng nhiều lần. Lớp thứ hai là báo dẫn lại, có khi đúng ý, có khi chỉ đúng một nửa. Lớp thứ ba là dòng tin không nguồn, chạy nhanh vì tên cầu thủ đủ hot.

Vietnam Sports Daily không đăng một thương vụ chỉ vì nó đang được chia sẻ. Bài trong mục này sẽ nói rõ cái gì đã được xác nhận, cái gì mới là khả năng, và cái gì nên bỏ qua.

> Một bản hợp đồng chỉ thành chuyện khi có người ký. Trước đó, nó là một cuộc đàm phán — và cuộc đàm phán có quyền đổ vỡ.

Lê Phan sẽ theo cửa sổ chuyển nhượng của bóng đá Việt Nam và những thương vụ quốc tế đáng đặt cạnh nhau: phí, thời hạn, vai trò, chứ không chỉ cái tên trên ảnh bìa.$$,
  'chuyen-nhuong',
  'https://images.unsplash.com/photo-1574629810360-7ef9b9b1a7c4?auto=format&fit=crop&w=1600&q=80',
  'Chuyển nhượng',
  'Lê Phan',
  false,
  true,
  188,
  4,
  now() - interval '6 hours'
)
on conflict (slug) do nothing;
