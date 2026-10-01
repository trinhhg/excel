# 📘 VOCAB STUDIO PRO - EXCEL INTERACTIVE LEARNING ENGINE (LIGHT THEME V2.1)

> **Trình tạo đề & Luyện từ vựng Excel tương tác thông minh (Giao diện chuẩn Excel Light Theme, không Macro/VBA, tự động chấm điểm)**  
> Tối ưu chuyên biệt cho mọi ngôn ngữ: **Tiếng Trung HSK/TOCFL** (Hán tự, Pinyin, Nghĩa, Câu tiếng Trung, Pinyin câu, Dịch câu), **Tiếng Anh IELTS/TOEIC**, **Tiếng Nhật JLPT**, **Tiếng Hàn Topik**...

---

## 🌟 CÁC ĐIỂM CẢI TIẾN ĐỘT PHÁ Ở PHIÊN BẢN V2.1

### 1. Phân hệ Tiếng Trung & Đa Ngôn Ngữ Linh Hoạt
- **Cấu trúc thực tế đầy đủ nhiều cột:** Hỗ trợ cùng lúc nhiều cột thông tin: `Hán tự`, `Pinyin`, `Nghĩa tiếng Việt`, `Câu tiếng Trung`, `Pinyin của câu`, `Dịch nghĩa câu`.
- **Cơ chế gõ linh hoạt:**
  - Nhìn nghĩa tiếng Việt hoặc Pinyin để gõ Pinyin trên bàn phím (IME) ra chữ Hán.
  - Hoặc nhìn Hán tự để gõ Pinyin.
  - Hoặc đối với tiếng Anh/Nhật/Hàn: Nhìn nghĩa tiếng Việt để gõ từ vựng của tiếng đó.

### 2. Quét Dữ Liệu Tự Do (Universal Parser) - Không Tự Gán Sai Vai Trò
- Khi dán dữ liệu vào, hệ thống tự động chia cột theo dấu Tab (`\t`), Phẩy (`,`), Chấm phẩy (`;`), Pipe (`|`), Gạch ngang (` - `)...
- **Tên cột để trống hoặc giữ nguyên số thứ tự Cột 1, Cột 2...** Người dùng có thể tùy ý sửa tên cột hoặc để trống mà không bị ép buộc gán vai trò sai lệch.
- Cột dữ liệu nào không chọn làm đáp án thì khi xuất file Excel sẽ hiển thị bình thường như một cột tham khảo, không sinh công thức thừa.

### 3. Nút "Chọn Cột Đáp Án Chuẩn" - Tự Động Chèn Ô Nhập & Kết Quả
- Có nút chuyên dụng trên thanh công cụ: **[Chọn Cột Đáp Án Chuẩn]**.
- Người dùng chỉ cần bấm nút và chọn cột mục tiêu (Ví dụ: Cột Hán tự hoặc Cột Từ vựng).
- Hệ thống sẽ tự động liên kết và sinh cặp cột:
  - `[Ô Làm Bài (Học Sinh Nhập)]`: Nền vàng kem `#FEFCE8` có viền nổi bật, mở khóa cho học sinh gõ.
  - `[Kết Quả Chấm]`: Tự động so sánh với cột đáp án chuẩn:
    `=IF(TRIM(InCell)="","",IF(ISNUMBER(SEARCH("|"&LOWER(TRIM(InCell))&"|","|"&LOWER(TRIM(TargetCell))&"|")),"✓ ĐÚNG","✗ SAI"))`
  - Hỗ trợ nhiều đáp án đồng nghĩa ngăn cách bằng dấu `|` (Ví dụ: `bận|bận rộn` hoặc `rich|wealthy`).
  - Định dạng màu tự động: `✓ ĐÚNG` nền xanh lá `#DCFCE7`, chữ xanh `#15803D` // `✗ SAI` nền đỏ `#FEE2E2`, chữ đỏ `#B91C1C`.

### 4. Cơ Chế Mã Từ (ID) - Khóa Chặt Hàng Ngang Khi Trộn Đề
- Mỗi dòng dữ liệu được định danh bằng một **Mã Từ (ID)** duy nhất (`ID-001`, `ID-002`, `ID-003`...).
- Khi bấm **[Trộn Hàng (Fisher-Yates)]**: Chỉ xáo trộn thứ tự các hàng ngang, toàn bộ các cột của dòng đó luôn di chuyển cùng nhau theo Mã Từ. **Tuyệt đối không đảo cột dọc, không bao giờ lệch đáp án!**
- Nút **[Thứ Tự Gốc]**: Dễ dàng khôi phục lại trật tự ban đầu theo Mã Từ bất kỳ lúc nào.

### 5. Sheet 2: Làm Test Thử Trực Tiếp Trước Khi Xuất File
- Tab **[Sheet 2: Làm Test Thử Trực Tiếp]** cung cấp môi trường làm bài y hệt như trên file Excel thật:
  - Học sinh/người bán có thể gõ trực tiếp đáp án vào ô màu vàng để test trước độ nhạy và tính chuẩn xác của đề bài.
  - Tích hợp phát âm giọng đọc bản xứ (Web Speech TTS) từng từ, từng câu.
  - **Bảng điểm KPI Dashboard thiết kế siêu đẹp, tối giản chuẩn Light Theme:**
    - Tổng số câu
    - Đã làm
    - Số câu Đúng
    - Số câu Sai
    - Điểm số hệ 10
    - Tiến độ hoàn thành (%)
  - Bắn pháo hoa Confetti và âm thanh chúc mừng khi hoàn thành 100%!

### 6. File Excel Xuất Ra (.xlsx) Hoạt Động 100% Không Lỗi
- **Loại bỏ hoàn toàn các logic dropdown phức tạp dễ lỗi:** Mở file lên là học sinh có thể gõ ngay vào các ô màu vàng, kết quả và bảng điểm tự động nhảy thời gian thực.
- **Khóa bảo vệ Sheet (Sheet Protection):** Chỉ mở khóa duy nhất các ô học sinh nhập, bảo vệ toàn bộ đề bài và công thức tính điểm không bị xóa nhầm.
- Hoạt động mượt mà trên **Microsoft Excel, WPS Office, Google Sheets**.

---

## 📂 CẤU TRÚC DỰ ÁN

```text
vocab-studio-pro/
├── index.html        # Giao diện chính chuẩn Excel Light Theme, thanh công cụ Ribbon, 2 Sheet Tab
├── style.css         # Lưới bảng tính Excel Grid, thẻ KPI, thanh cuộn tùy biến
├── app.js            # Controller quản lý dữ liệu, Mã Từ, xóa hàng/cột, Test mode, TTS
├── excel-engine.js   # Bộ xuất file Excel .xlsx chuyên nghiệp bằng ExcelJS
└── README.md         # Tài liệu hướng dẫn
