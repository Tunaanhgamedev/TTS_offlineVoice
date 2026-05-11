# 🎙️ VietVoiceAI: High-Performance Offline Vietnamese TTS

[![Status](https://img.shields.io/badge/Status-Beta-orange.svg)]()
[![Tech](https://img.shields.io/badge/Stack-Next.js%20|%20FastAPI%20|%20Piper-blue.svg)]()
[![License](https://img.shields.io/badge/License-MIT-green.svg)]()

**VietVoiceAI** là giải pháp chuyển đổi văn bản thành giọng nói (Text-to-Speech) chuyên dụng cho tiếng Việt, tối ưu hóa cho việc chạy **Offline 100%** với tốc độ xử lý thời gian thực. Dự án tích hợp động cơ Piper TTS và mô hình ngôn ngữ Vais1000 để mang lại chất lượng âm thanh tự nhiên nhất.

---

## ✨ Tính năng nổi bật

- 🚀 **Offline Capability**: Chạy hoàn toàn trên máy cục bộ, không cần kết nối Internet, đảm bảo bảo mật dữ liệu tuyệt đối.
- 🔊 **Vais1000 Engine**: Tích hợp mô hình giọng nói tiếng Việt chất lượng cao (vais1000-medium).
- ⚡ **Real-time Generation**: Tốc độ xử lý cực nhanh, tạo ra file âm thanh chỉ trong vài giây.
- 📄 **Auto Subtitle (SRT)**: Tự động tạo file phụ đề đi kèm với âm thanh.
- 🎙️ **Voice Cloning Interface**: Sẵn sàng giao diện và API cho việc nhân bản giọng nói.
- 🎨 **Modern UX/UI**: Giao diện người dùng hiện đại, hỗ trợ Drag & Drop file SRT.

---

## 🏗️ Kiến trúc hệ thống

Dự án được xây dựng trên mô hình Microservices tinh gọn:

- **Frontend**: Next.js 14, Tailwind CSS, Lucide Icons (Giao diện hiện đại, phản hồi nhanh).
- **Backend**: FastAPI (Python 3.10+), xử lý các tác vụ nặng qua Background Tasks.
- **TTS Engine**: Piper TTS (C++ / ONNX Runtime).
- **Database**: SQLite (Lưu trữ lịch sử và cấu hình giọng đọc).

---

## 🚀 Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
- Python 3.10 trở lên.
- Node.js 18.x trở lên.
- Windows (Bản phân phối hiện tại tối ưu cho Win32).

### 2. Cài đặt Backend
```bash
cd backend
python -m venv venv
source venv/bin/scripts/activate  # Trên Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Cài đặt Frontend
```bash
cd frontend
npm install
```

### 4. Cấu hình Model AI
1. Tải Piper Binary cho Windows và đặt vào `backend/piper/`.
2. Tải mô hình `vi_VN-vais1000-medium.onnx` và đặt vào `backend/models/`.

---

## 🛠️ Khởi chạy

**Chạy Backend Server:**
```bash
cd backend
python main.py
```

**Chạy Frontend Client:**
```bash
cd frontend
npm run dev
```

Truy cập giao diện tại: `http://localhost:3000`

---

## 🗺️ Lộ trình phát triển (Roadmap)

- [x] Tích hợp Piper TTS Offline.
- [x] Hỗ trợ mô hình Vais1000.
- [x] Giao diện Drag & Drop SRT.
- [ ] Tích hợp Zero-shot Voice Cloning (GPT-SoVITS).
- [ ] Hỗ trợ lồng tiếng tự động cho Video dài.
- [ ] Ứng dụng Desktop (Electron/Tauri).

---

## 🤝 Đóng góp

Chúng tôi luôn chào đón các đóng góp từ cộng đồng. Hãy mở một **Issue** hoặc gửi **Pull Request** nếu bạn có ý tưởng cải tiến.

---

## 📄 Giấy phép

Dự án được phát hành dưới giấy phép [MIT License](LICENSE).

---

**VietVoiceAI** - *Mang giọng nói trí tuệ nhân tạo đến gần hơn với người Việt.*
