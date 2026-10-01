# 📘 VOCAB STUDIO PRO - EXCEL MULTI-EXERCISE ENGINE (V2.2)

> **Trình tạo đề & Luyện từ vựng Excel tương tác thông minh (Hỗ trợ nhiều bài tập kề cạnh trên cùng 1 Sheet, tự động chấm điểm độc lập, không Macro/VBA)**  
> Tối ưu chuyên biệt cho **Tiếng Trung HSK** (Gõ Hán tự & Pinyin song song), **Tiếng Anh IELTS**, **Tiếng Nhật JLPT**, **Tiếng Hàn Topik**...

---

## 🌟 ĐẶC TÍNH KỸ THUẬT NỔI BẬT

### 1. Hỗ Trợ Nhiều Cặp Bài Tập (Multi-Target Exercise) Kề Cạnh Nhau
- Trong 1 bảng dữ liệu, bạn có thể tạo **nhiều bài tập cùng lúc** cho các cột khác nhau:
  - Ví dụ tiếng Trung: Vừa tạo ô học sinh gõ **Hán Tự**, vừa tạo ô gõ **Pinyin**!
  - Ví dụ tiếng Anh: Vừa tạo ô gõ **Từ vựng**, vừa tạo ô gõ **Phiên âm IPA** hoặc **Từ loại**!
- Cột `[Ô Làm Bài]` và cột `[Kết Quả Chấm]` được đặt **NGAY CẠNH CỘT ĐÁP ÁN TƯƠNG ỨNG**, giúp người học quan sát trực quan nhất.
- **Logic chấm điểm chia tách độc lập:** Mỗi bài tập tự tính số câu đúng và điểm số thang 10 riêng (Điểm Hán tự, Điểm Pinyin...) và tự tính Điểm Tổng Hợp trung bình. Hai bài tập hoàn toàn không ảnh hưởng kết quả của nhau!

### 2. Trải Nghiệm Gõ Test Thử Đẳng Cấp (Zero Jumping - Mượt Như Excel)
- Khắc phục triệt để lỗi nhảy chữ và mất focus: Dữ liệu chấm điểm được cập nhật DOM cục bộ trong tích tắc, không bao giờ load lại bảng.
- **Hỗ trợ phím tắt Excel mượt mà:**
  - Nhấn phím `Enter` hoặc mũi tên `↓`: Tự động trượt con trỏ chuột xuống ô làm bài của dòng tiếp theo.
  - Nhấn mũi tên `↑`: Tự động chuyển lên ô dòng trước.
  - Hỗ trợ gõ bộ gõ tiếng Trung (Pinyin IME) và tiếng Việt Telex trơn tru không mất dấu.

### 3. Cơ Chế Mã Từ (ID) Khóa Chặt Hàng Ngang
- Mỗi dòng gắn với một mã cố định (`ID-001`, `ID-002`...).
- Khi bấm **[Trộn Hàng (Fisher-Yates)]**, toàn bộ các cột của dòng đó luôn di chuyển cùng nhau theo Mã Từ. Tuyệt đối không bao giờ đảo cột dọc!

### 4. Giải Pháp Trộn Đề (Random) Trong File Excel Khi Mở Bằng Máy Tính
- **Cách 1 (Chuẩn .xlsx không macro):** Trên thanh công cụ của Web Studio có nút **[Trộn Hàng (Khóa Mã Từ)]** để bạn tạo ngay các biến thể đề khác nhau trước khi xuất file.
- **Cách 2 (Sử dụng công thức F9 trong Excel):** Trong Excel, nếu muốn học sinh tự bấm phím F9 để đảo đề ngẫu nhiên, bạn chỉ cần chèn thêm 1 cột phụ với công thức `=RAND()`, sau đó chọn Data -> Sort theo cột đó.
- **Cách 3 (Nếu muốn dùng nút bấm VBA trong file .xlsm):** Bạn chỉ cần dán đoạn mã macro siêu ngắn sau vào Module VBA của Excel:
  ```vba
  Sub TronDeNgauNhien()
      Dim ws As Worksheet: Set ws = ActiveSheet
      ws.Unprotect
      ws.Range("A6:Z100").Sort Key1:=ws.Range("A6"), Order1:=xlAscending, Header:=xlNo
      ws.Protect
  End Sub
