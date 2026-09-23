# Ke hoach lam ung dung Expo cho nguoi dung

Tai lieu nay mo ta phan viec can lam de them ung dung mobile React Native bang Expo cho **nguoi mua** cua Digital Marketplace hien tai.

## 1. Mo hinh he thong

```text
Expo mobile (nguoi mua)  ---- REST/JSON + JWT ---->  Express API
                                                        |
Admin web React  -------- REST/JSON + JWT ----------->  |
                                                        v
                                                   MySQL database
```

- Expo khong ket noi truc tiep vao MySQL.
- Expo va admin web dung chung backend API va cung mot database.
- Moi tai khoan, san pham, gio hang, don hang, thanh toan, license va danh gia deu duoc luu tap trung trong database.
- Backend phai la noi kiem tra quyen, gia tien va trang thai don hang; khong tin gia tri do mobile tu tinh.

## 2. Trang thai hien tai

Backend da co cac nhom API co the dung cho mobile:

- Dang ky, dang nhap, refresh token, dang xuat: `/api/auth/*`
- Ho so nguoi dung: `/api/users/me`
- Danh sach, tim kiem va chi tiet san pham: `/api/products/*`
- Danh muc cong khai: `GET /api/categories`
- Gio hang va checkout: `/api/cart/*`
- Lich su don hang: `GET /api/orders/my`
- Thanh toan dang mo phong: `/api/payments/*`
- Thu vien san pham da mua va tai/stream noi dung: `/api/content/*`
- Danh gia san pham: `/api/reviews/*`
- Thong bao: `/api/notifications`
- Upload avatar: `POST /api/users/me/avatar`

Frontend trong thu muc `frontend/` hien la admin web. Nen tao mot thu muc mobile rieng, vi du `mobile/`, khong tron routing va component cua admin vao Expo.

## 3. Khoi tao Expo

Chay tai thu muc goc workspace:

```bash
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
npm install axios @tanstack/react-query zustand
npx expo install expo-secure-store expo-image-picker expo-file-system
```

Co the them cac goi nay khi can:

```bash
npx expo install expo-router expo-notifications
```

Nen dung:

- TypeScript.
- Expo Router hoac React Navigation cho dieu huong.
- Axios cho request va interceptor JWT.
- TanStack Query cho cache/loading/error/refetch API.
- Zustand cho session ngan han; luu token trong `expo-secure-store`, khong luu token vao AsyncStorage thuong.

## 4. Cau hinh ket noi backend

Tao bien moi trong mobile, vi du `.env`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api
```

Thay `192.168.1.10` bang IPv4 cua may dang chay backend. Dien thoai va may tinh phai cung mang LAN.

Luu y:

- Android emulator: thuong dung `http://10.0.2.2:3000/api` de tro ve may host.
- iOS simulator: co the dung `http://localhost:3000/api`.
- Dien thoai that: khong dung `localhost`; dung IP LAN cua may tinh.
- Backend can lang nghe tren interface cho phep thiet bi truy cap, va Windows Firewall phai cho phep port `3000` neu can.
- Khi dua len production, dung HTTPS va domain API thay cho IP LAN.

Tao mot Axios client duy nhat:

- Them `Authorization: Bearer <accessToken>` cho request can dang nhap.
- Khi nhan `401`, goi `/api/auth/refresh`, cap nhat access token roi thu lai request mot lan.
- Neu refresh that bai, xoa session va dua nguoi dung ve man hinh dang nhap.
- Xu ly timeout, mat mang, 401, 403 va 5xx thanh thong bao de hieu.

## 5. Man hinh mobile can lam

### Giai doan 1: tai khoan

- Splash/loading kiem tra session.
- Dang ky: ho ten, email, so dien thoai, mat khau.
- Dang nhap.
- Dang xuat.
- Ho so ca nhan, cap nhat thong tin va avatar.

### Giai doan 2: kham pha san pham

- Trang chu: san pham moi/noi bat va danh muc.
- Danh sach san pham co phan trang.
- Tim kiem theo tu khoa.
- Loc theo danh muc, gia va loai.
- Sap xep theo ten, gia, ngay tao.
- Chi tiet san pham: anh, mo ta, gia, nguoi ban, danh gia.
- Them vao gio hang.

### Giai doan 3: mua hang

- Gio hang: xem, xoa san pham, kiem tra tong tien.
- Checkout: xac nhan gio hang va phuong thuc thanh toan.
- Man hinh ket qua thanh toan: thanh cong/that bai/dang cho.
- Lich su don hang va chi tiet don hang.

### Giai doan 4: san pham da mua

- Thu vien cua toi qua `GET /api/content/my-library`.
- Chi tiet license.
- Lay signed URL qua `GET /api/content/signed/:productId`.
- Mo hoac tai noi dung qua URL duoc backend cap.
- Viet danh gia sau khi mua.

### Giai doan 5: tien ich

- Danh sach thong bao va danh dau da doc.
- Trang cai dat tai khoan.
- Trang loi va trang mat mang.
- Pull to refresh, loading skeleton, empty state va retry.

## 6. Thu tu lam viec de de kiem tra

1. Tao project `mobile/`, cau hinh API URL va chay duoc tren emulator/dien thoai.
2. Lam Axios client, auth store, SecureStore va interceptor refresh token.
3. Lam dang ky/dang nhap, sau do kiem tra bang endpoint `GET /api/users/me`.
4. Lam danh sach, tim kiem, danh muc va chi tiet san pham.
5. Lam gio hang, checkout va lich su don hang.
6. Lam thanh toan theo flow backend hien tai, truoc mat dung mock payment.
7. Lam thu vien, signed URL va review.
8. Lam thong bao, avatar, xu ly loi va polish giao dien.
9. Test tren Android emulator, iOS simulator (neu co) va it nhat mot dien thoai that.

## 7. Contract API can chot truoc khi lam UI

Mo Swagger tai `http://localhost:3000/api-docs` va ghi lai cho tung API:

- Request body, query params va header.
- Cau truc `success`, `message`, `data`.
- Ma loi va noi dung loi.
- Kieu ID va dinh dang ngay tien.
- URL anh va URL noi dung tra ve co truy cap duoc tu dien thoai hay khong.

Can uu tien kiem tra/cap nhat cac diem sau trong backend:

- API thanh toan hien tai la mock; can xac dinh ro day la yeu cau demo hay se tich hop cong thanh toan that.
- Kiem tra quyen cua cac endpoint upload va payment, tranh de client khong dang nhap goi duoc thao tac nhay cam.
- Kiem tra signed URL co thoi han va chi cap cho dung user da mua.
- Bo sung phan trang nhat quan cho danh sach san pham, don hang, danh gia va thong bao neu response hien tai chua co.
- Dam bao response san pham co URL anh day du ma mobile co the truy cap qua LAN/HTTPS, khong tra ve `localhost`.
- Kiem tra checkout la transaction: khong tao don hang nua chung khi mot san pham khong hop le.
- Them validation cho input mobile va thong bao loi on dinh.

## 8. Quy tac database dung chung

- Chi backend duoc ket noi MySQL.
- Mobile va admin khong tu tao bang, sua gia hoac sua trang thai don hang trong database.
- Chay `npm run migrate`/`npm run seed` o backend khi can dong bo schema va du lieu mau.
- Dung tai khoan database rieng cho moi moi truong dev/staging/production.
- Khong commit file `.env`, JWT secret, mat khau database hoac token vao git.
- Khi test, dung tai khoan user thuong cho Expo va tai khoan admin rieng cho admin web.

## 9. Kiem thu toi thieu

- Dang ky email moi, dang nhap sai mat khau, dang xuat va refresh token.
- App bi tat/mo lai van giu session hop le.
- User A khong xem duoc thu vien cua User B.
- User chua mua khong lay duoc signed URL.
- Them/xoa gio hang va checkout khong tao don hang trung.
- Thanh toan that bai khong tao license.
- Mat mang khi dang request co retry hoac thong bao ro rang.
- Anh va file tren mobile mo duoc khi backend chay tren may tinh trong LAN.
- Admin thay du lieu don hang/san pham do mobile tao ra vi ca hai dung chung database.

## 10. Ket qua mong muon

Sau khi hoan thanh, co ba lop ro rang:

1. `mobile/`: Expo app cho nguoi mua.
2. `frontend/`: React web cho admin.
3. Backend Node.js/Express + MySQL: noi duy nhat xu ly auth, nghiep vu va du lieu.

Khong can tao database moi cho Expo. Chi can tao mobile client, ket noi dung API backend va dam bao thiet bi truy cap duoc backend qua mang.
expo cilent version 57.0.9 supported sdks 57
