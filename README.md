# CampusKit — Apple Store Edition (Hugo + GSAP 3)

Dự án website thương mại điện tử **CampusKit ("Đủ Đồ Dùng, Vào Học Là Chiến!")** xây dựng trên **Hugo (Go Static Site Generator)** được tái cấu trúc toàn diện theo **Hệ thống Thiết kế Cửa Hàng Trực Tuyến Apple Việt Nam (`apple.com/vn/store`)**, kết hợp chuyển động **GSAP 3 + ScrollTrigger + Flip**.

## 1. Đặc trưng ngôn ngữ thiết kế Apple Store đã áp dụng

- **Open Shelf trên nền Alabaster `#F5F5F7`:** Không đóng khung nặng nề; các kệ hàng thở tự nhiên trên nền `#F5F5F7`, làm nổi bật thẻ trắng `#FFFFFF` và thẻ Pastel/Pro Dark bo góc lớn `24px–28px` kèm bóng đổ môi trường mảnh (`2px 4px 12px rgba(0,0,0,0.06)`).
- **Thanh điều hướng kính mờ `44px` + Search Curtain:** Frosted Glass (`backdrop-filter: saturate(180%) blur(20px)`), ô tìm kiếm trượt mượt khi bấm biểu tượng kính lúp `🔍`, kèm dải thông báo Ưu đãi Giáo dục ngay bên dưới.
- **Tiêu đề đôi hai tông màu (`Split-Tone Inline Heading`):** Mệnh đề chính màu mực đậm `#1D1D1F` nối liền mạch với mệnh đề phụ màu xám `#6E6E73` trên cùng một dòng.
- **Kệ trượt ngang & Nút điều hướng tròn `36×36px` (`Trước ‹ / Tiếp ›`):** Chuẩn vật lý trượt `scroll-snap` của Apple Store, tự động mờ khi chạm biên.
- **Thẻ Sản Phẩm Flashcard 3D chuẩn Apple Tile:** Tích hợp chấm màu hoàn thiện (`• • •`), nhãn Eyebrow cam đất `#B64400`, nút pill xanh `#0071E3` và hiệu ứng **lật 3D bằng GSAP** xem ghi chú thông số ở mặt sau.

## 2. Các trang trong hệ thống (1 Trang chủ + 5 Trang con)

1. **Cửa Hàng (`/`)**: Split Store Hero + Widget Flash Sale & Chuyên gia tư vấn, thanh ChapterNav 12 danh mục icon, kệ `"Thế hệ mới nhất"` (`400px` Editorial Cards), kệ `"CampusKit tạo nên mọi khác biệt"` và lưới Flashcard sản phẩm nổi bật.
2. **Sản Phẩm (`/san-pham/`)**: Trang danh mục chuẩn Apple Accessories với bộ lọc bo tròn tinh tế, chuyển đổi 2/3 cột bằng `GSAP Flip`, cửa sổ Xem nhanh và 12 thẻ Flashcard 3D.
3. **Mã Giảm Giá (`/ma-giam-gia/`)**: Phong cách **Apple Education Store** xác thực email `.edu.vn` mở khóa mã `EDU15VIP` (-15%), kho 6 thẻ ưu đãi mùa thi áp dụng 1 chạm vào Giỏ hàng & FAQ.
4. **Công Cụ Học Tập (`/cong-cu/`)**: **Study Hub** phong cách Widget macOS/iPadOS gồm Đồng hồ Pomodoro + Checklist, Bộ tổng hợp Tiếng ồn trắng 4 kênh bằng Web Audio API và Bảng tính GPA Hệ 10 / Hệ 4.0.
5. **Góc Học Tập (`/goc-hoc-tap/`)**: Apple Styling Book phối cảnh bàn học KTX với các điểm **Hotspot kính mờ `[01–04]`** tương tác trên ảnh và nút thêm trọn bộ Setup vào giỏ.
6. **Tra Cứu & Bảo Hành (`/tra-cuu/`)**: Giao diện theo dõi tiến độ giao nhanh KTX 2 giờ (4 bước trực quan, tự lưu đơn vừa đặt) và tra cứu bảo hành **1 đổi 1 tận sảnh trong 30 ngày**.

## 3. Cách chạy dự án trên máy tính

```bash
cd campuskit-hugo
hugo server -D
```

Mở trình duyệt tại `http://localhost:1313` (hoặc cổng hiển thị trên Terminal) để trải nghiệm.
