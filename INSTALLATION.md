# Hướng dẫn cài đặt dự án (Digital Marketplace Backend)

Yêu cầu trước khi cài:
- Node.js >= 16
- MySQL server (hoặc MariaDB)
- Git

1) Clone repository

```bash
git clone <repo-url> .
```

2) Tạo file môi trường

Sao chép `.env.example` thành `.env` và chỉnh thông tin DB, JWT secrets:

```bash
cp .env.example .env
# chỉnh .env theo môi trường của bạn
```

3) Cài dependencies

```bash
npm install
```

4) Tạo/đồng bộ database

Hai tuỳ chọn:
- Dùng migrate đơn giản (sẽ sync models -> tạo/alter bảng):

```bash
npm run migrate
```

- Hoặc dùng seed để vừa sync vừa thêm dữ liệu mẫu (admin, categories, sample product):

```bash
npm run seed
```

5) Chạy server (development)

```bash
npm run dev
```

Server mặc định lắng nghe: `http://localhost:3000`

6) Swagger UI (API docs)

Sau khi server chạy, mở:

```
http://localhost:3000/api-docs
```

Ghi chú
- Các file upload được lưu vào thư mục `uploads/` tại gốc workspace.
- Admin mặc định được seed: `admin@example.com` / `Admin1234` (thay đổi qua env `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`).
- Đảm bảo `DB_*` trong `.env` trỏ tới DB hợp lệ.
