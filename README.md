# 📘 VOCAB STUDIO PRO - EXCEL INTERACTIVE LEARNING ENGINE

> **Trình tạo đề & Luyện từ vựng Excel tương tác thông minh (2 tầng Web & Native .xlsx không cần Macro/VBA)**  
> Được thiết kế chuyên biệt để đóng gói và thương mại hóa các file Excel bài tập từ vựng tự động chấm điểm cho học sinh, sinh viên và người tự học ngoại ngữ (Tiếng Anh IELTS/TOEIC, Tiếng Trung HSK, Tiếng Nhật JLPT, Tiếng Hàn Topik...).

---

## 🌟 TỔNG QUAN TÍNH NĂNG ĐỘT PHÁ

### 1. Xuất file Native Excel (.xlsx) thương mại - KHÔNG DÙNG MACRO / VBA
- **Tương thích 100%:** Mở mượt mà trên **Microsoft Excel (2016, 2019, 2021, Office 365, Excel Online)**, **WPS Office**, và **Google Sheets**. Không bị chặn cảnh báo bảo mật Macro từ Microsoft!
- **Dashboard KPI đỉnh cao trên đầu trang tính:**
  - Tự động thống kê: *Tổng số câu*, *Số câu đã làm*, *Số câu Đúng*, *Số câu Sai*.
  - Tự động tính điểm hệ 10 (`ROUND`).
  - Thanh tiến độ đồ họa khối trực quan (`■■■■■□□□□□ 50%`) tự co giãn theo tiến độ.
- **Cơ chế Nộp bài mới chấm (Exam Submit Flow):**
  - Dropdown trạng thái tại ô `J3`: `Chưa nộp` / `Đã nộp`.
  - Khi `Chưa nộp`: Ô kết quả hiển thị `⏳ Đã ghi nhận` để học sinh tự tin đã nhập, nhưng không lộ đáp án đúng/sai.
  - Khi chuyển sang `Đã nộp`: Cột kết quả đồng loạt chấm điểm `✓ ĐÚNG` / `✗ SAI` và kích hoạt bảng điểm tổng.
- **Cơ chế Ô che mở khóa (Scratch & Reveal):**
  - Nội dung gợi ý (Pinyin, Nghĩa tiếng Việt, ví dụ câu) được khóa mặc định: `🔒 [Nhập đúng để mở]`.
  - Khi học sinh gõ đúng đáp án (hoặc nộp bài): Ô che tự động giải mã và bung nội dung thật ra ngay lập tức.
- **Hỗ trợ nhiều đáp án đồng nghĩa:**
  - Cho phép người bán cài đặt nhiều đáp án đúng cho 1 câu, phân cách bằng dấu pipe `|` (Ví dụ: `rich|wealthy|plentiful` hoặc `bận rộn|bận`).
  - Không phân biệt hoa thường, tự động cắt tỉa khoảng trắng thừa (`TRIM` & `LOWER`).
- **Khóa bảo vệ Sheet (Sheet Protection):**
  - Khóa toàn bộ ô đề bài, tiêu đề và công thức tính toán.
  - Chỉ mở khóa duy nhất các ô màu vàng để học sinh nhập đáp án.
  - Cột đáp án gốc và dữ liệu nhạy cảm được ẩn hoàn toàn (`hidden = true`).
- **Nạp ngược file Excel (Reverse Import):**
  - Kéo thả file `.xlsx` đã xuất trước đó vào tool để phục hồi 100% dữ liệu gốc (kể cả metadata ẩn), cho phép sửa từ, thêm bớt câu và xuất lại đề mới.

### 2. Universal Multi-Engine Parser
- Tự động phân tích tần suất ký tự để nhận diện phân cách: Tab (`\t`), CSV (`,`), Chấm phẩy (`;`), Gạch ngang (` - `), Hai chấm (`:`), Pipe (`|`), Đa khoảng trắng.
- Tự động nhận diện chữ Hán (`[\u4e00-\u9fff]`), thanh điệu Pinyin (`[āáǎà...]`), từ loại tiếng Anh `(n), (v), (adj)`, phiên âm IPA `[/.../]`.
- Studio xem trước & Gán vai trò từng cột trực quan trước khi nạp.

### 3. Hệ thống Luyện tập & Gamification trực tiếp trên Web
- **Bảng tính Live:** Gõ đáp án trực tiếp trên web với hiệu ứng đổi màu xanh/đỏ thời gian thực.
- **Thẻ Flashcard 3D:** Hiệu ứng lật thẻ 180° mặt trước/sau cực mượt, phím tắt `Space` để lật, phím mũi tên `←` / `→` đổi thẻ.
- **Trắc nghiệm phản xạ 4 lựa chọn (Quiz):** Tự động bốc 3 đáp án sai từ các dòng khác làm đáp án nhiễu, đếm chuỗi Combo Đúng liên tiếp (`🔥 Combo x3, x5...`).
- **Web Speech Text-to-Speech (TTS):** Phát âm chuẩn giọng bản xứ không cần backend, tối ưu riêng cho `zh-CN`, `en-US`, `ja-JP`, `ko-KR`.
- **Âm thanh tổng hợp (Web Audio API):** Tự sinh hiệu ứng âm thanh ting ting khi đúng, âm trầm khi sai, và âm mừng chiến thắng kèm pháo hoa (Canvas Confetti).

---

## 📂 CẤU TRÚC DỰ ÁN

```text
vocab-studio-pro/
├── index.html        # Giao diện chính (Tailwind CSS, Icons, Modals, Tab Layout)
├── style.css         # Hiệu ứng Glassmorphism, 3D Flashcard flip, custom scrollbars
├── app.js            # Controller: Parser, Table Grid, Flashcards, Quiz, TTS, Audio SFX
├── excel-engine.js   # Bộ tạo file Excel chuyên nghiệp với ExcelJS, Formulas, Sheet Protection
└── README.md         # Hướng dẫn chi tiết & Cẩm nang kinh doanh file Excel
