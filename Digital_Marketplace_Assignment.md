## Chủ đề: Hệ thống Marketplace Sản phẩm Số (Digital Product Marketplace API)

## 1. Mục tiêu

Xây dựng **RESTful API** cho hệ thống marketplace mua bán sản phẩm số
(sách điện tử, video khóa học, tài liệu số...) bằng **Node.js +
MySQL**, phục vụ đồng thời **Web Admin** (React) và **App Mobile**
cho người dùng (React Native).

- Chỉ xây dựng Backend API.
- Web Admin dùng để quản trị hệ thống (duyệt sản phẩm, khóa tài
  khoản, quản lý danh mục...).
- App Mobile (React Native) dùng cho customer.

---

# 2. Công nghệ bắt buộc

- Node.js (Express)
- MySQL
- JWT Authentication
- Swagger / OpenAPI
- Logging middleware (Winston hoặc Morgan)
- Git
- React Native (App Mobile — customer)
- ReactJS (Web Admin)
  sua lai nhap hang-tao san pham/ bao hanh

---

# 3. Kiến trúc

Áp dụng kiến trúc phân lớp (Layered Architecture).

```text
digital-marketplace/

src/
 ├── routes/
 ├── controllers/
 ├── services/
 ├── repositories/
 ├── models/
 ├── middlewares/
 └── config/

mobile-app/          (React Native — customer)
web-admin/           (ReactJS — admin)
```

---

# tạo mã code mysql

---

# 4. Chức năng bắt buộc

## 4.1 Đăng ký tài khoản

Thông tin:

- Họ tên
- Email
- Số điện thoại
- Mật khẩu
- Xác nhận mật khẩu

Yêu cầu

- Email không được trùng
- Password lưu plain text
- Validate dữ liệu
- một tài khoản chỉ gắn với 1 ip thiết bị
- mật khẩu phải lưu hash

---

## 4.2 Đăng nhập

- JWT (access token)
- Refresh Token
- Đăng xuất
- Đổi mật khẩu
- Quên mật khẩu

---

## 4.3 Phân quyền

Có 2 Role, dùng chung 1 bảng `Users`, phân biệt bằng cột `role`

- **customer**: đăng ký, đăng nhập, xem sản phẩm, mua sản phẩm,
  đánh giá sản phẩm đã mua, đăng bán sản phẩm số, quản lý đơn hàng của sản phẩm, rút tiền

- **admin**: duyệt sản phẩm trước khi công khai, khóa tài khoản vi
  phạm (seller bán hàng giả, khách gian lận thanh toán...), quản lý
  toàn hệ thống, cho phép thay đổi ip máy với tài khoản

Business rule về tài khoản

- Admin có thể đổi `status` của user sang `locked` để khóa tài
  khoản vi phạm
- Tài khoản bị `locked` không thể đăng nhập / thực hiện giao dịch
- Không được tự khóa tài khoản của chính mình

---

## 4.4 Quản lý người dùng (Users)

Thông tin

- Mã người dùng
- Họ tên
- Email
- Số điện thoại
- Mật khẩu
- Vai trò (customer/ admin)
- Trạng thái (active / locked)
- Avatar
- Ngày tạo

API

-   Đăng ký / Đăng nhập/ refest token/logoutout-ok
-   Xem chi tiết-ok
-   Cập nhật profile-ok
-   Đổi mật khẩu-ok
-thay đổi mật khẩu tk admin-thêm trường trong env-test?
-   Danh sách người dùng (Admin)-ok
-   Khóa / Mở khóa tài khoản (Admin)-/api/admin/users/{userId}/lock( unlock)-chuyển khoá bằng tên( bảng lựa chọn và tìm kiếm)
-   Cấp quyền đổi ip máy( Admin)-/api/admin/users/{userId}/reset-device-ip-chuyển khoá bằng tên( bảng lựa chọn và tìm kiếm)
-   chuyển từ id thành tên-ok
-   gửi report-ok

---

## 4.5 Danh mục sản phẩm (Categories)

CRUD (chỉ Admin được tạo/sửa/xóa danh mục)-ok

Mỗi sản phẩm thuộc một danh mục.

Ví dụ danh mục: Sách điện tử, Khóa học video, Tài liệu, Template...

---

## 4.6 Sản phẩm số (Products)

Thông tin

- Mã sản phẩm
- Tên sản phẩm
- Mô tả
- Giá
- Danh mục
- Người bán (seller)
- Loại sản phẩm (ebook / video / tài liệu...)
- File nội dung sản phẩm (đường dẫn lưu trữ, chỉ truy cập được sau
  khi mua)
- Ảnh bìa / thumbnail
- Trạng thái duyệt (pending / approved / rejected)
- Trạng thái hiển thị (active / inactive)

API

-   Admin: Duyệt / Từ chối sản phẩm trước khi công khai-ok
-   Customer: Xem chi tiết / Danh sách sản phẩm đã duyệt, Thêm / Cập nhật / Xóa  sản phẩm của mình, Tổng doanh thu (theo ngày/tháng/tổng)-ok

---

## 4.7 Đơn hàng (Orders) & Chi tiết đơn hàng (OrderItems)-ok

Orders

- Mã đơn hàng
- Người mua
- Tổng tiền
- Trạng thái đơn hàng (pending / paid / failed / cancelled)
- Ngày tạo

OrderItems

- Mã đơn hàng
- Mã sản phẩm
- Giá tại thời điểm mua
- Số lượng (mặc định 1 với sản phẩm số)

API

- Customer: Tạo đơn hàng từ giỏ hàng, xem lịch sử đơn hàng, Xem danh sách đơn hàng chứa sản phẩm của mình
- Admin: Xem toàn bộ đơn hàng hệ thống

---

## 4.8 Thanh toán (Payments)-ok

Thông tin

- Mã thanh toán
- Mã đơn hàng
- Phương thức thanh toán (VNPay / Momo / ...)
- Trạng thái thanh toán (pending / success / failed)
- Mã giao dịch từ cổng thanh toán
- Thời gian thanh toán

Yêu cầu

-   Thiết kế API tích hợp cổng thanh toán (VNPay/Momo), có thể giả
    lập (mock) callback/IPN cho môi trường fresher
-   Khi thanh toán thành công → tự động sinh License cho từng sản
    phẩm trong đơn hàng
-thiếu api xác thực thanh toán thành công thất bại

---

## 4.9 Cấp quyền sở hữu (Licenses)-ok

Đặc trưng của sản phẩm số: sau khi thanh toán thành công, hệ thống
cấp một "License" xác nhận người dùng có quyền truy cập/sử dụng sản
phẩm đó vĩnh viễn (hoặc theo thời hạn nếu có).

Thông tin

- Mã license
- Người sở hữu (customer)
- Sản phẩm
- Đơn hàng liên quan
- Ngày cấp
- Trạng thái (active / revoked)

API

- Hệ thống tự sinh license khi Payment thành công
- Customer xem danh sách sản phẩm mình đã sở hữu (My Library)
- Admin có thể thu hồi license (revoke) khi có tranh chấp/gian lận

---

## 4.10 Đánh giá (Reviews) -ok
-   Customer chỉ được đánh giá sản phẩm đã mua (đã có License), có thể xem sản phẩm của mình bán
-   Thông tin: điểm số (rating), nội dung, người đánh giá, sản phẩm
-   Admin có thể gỡ review vi phạm

---

## 4.11 Giỏ hàng (Cart) & Sản phẩm trong giỏ (CartItems)-ok

Cart

- Mỗi customer có một giỏ hàng
- Trạng thái giỏ hàng

CartItems

- Sản phẩm trong giỏ
- Giá tại thời điểm thêm vào giỏ

API

- Thêm / Xóa sản phẩm khỏi giỏ
- Xem giỏ hàng hiện tại
- Checkout: chuyển giỏ hàng thành Order

---

## 4.12 Truy cập nội dung sản phẩm số--ok
/api/content/signed/{productId}-lấy token cho stream
    { url: `/api/content/stream/${token}` }
/api/content/stream/{token}--phát nội dung
Chức năng đặc trưng: xem sách (ebook), xem video khóa học...

Yêu cầu

- Mọi request truy cập nội dung (file ebook, video stream...) đều
  phải kiểm tra quyền thông qua bảng `Licenses`
- Nếu customer chưa mua (không có license `active` cho sản phẩm
  đó) → từ chối truy cập (403)
- Không trả trực tiếp đường dẫn file gốc cho client; nên dùng URL
  tạm thời/ký (signed URL) hoặc stream qua backend để tránh chia sẻ
  link trái phép

---

# 5. Tìm kiếm-ok

Danh sách sản phẩm hỗ trợ

- Search tên sản phẩm
- Search theo mô tả

Filter

- Danh mục
- Khoảng giá
- Loại sản phẩm (ebook / video / tài liệu)
- Trạng thái duyệt (Admin)
- Seller

Sort

- Tên sản phẩm
- Giá
- Ngày tạo
- Đánh giá trung bình

Pagination

- page
- pageSize

---

# 6. Upload-ok

Cho phép upload

- Ảnh bìa / avatar: jpg, png
- File nội dung sản phẩm số: pdf, epub, mp4 (tùy loại sản phẩm)

Giới hạn

- Ảnh: tối đa 2MB
- File nội dung sản phẩm: giới hạn theo cấu hình (ví dụ tối đa
  100MB, có thể điều chỉnh)

---

# 7. Logging

Sử dụng middleware logging (Winston/Morgan)

Log

- Request
- Response
- Exception
- Login
- Payment callback (do liên quan tiền, cần log đầy đủ)

---

# 8. Exception

Xử lý bằng Middleware (error-handling middleware của Express/NestJS).

Không try/catch xử lý logic nghiệp vụ trong Controller.

---

# 9. Validation

Bắt buộc

Email

- đúng định dạng
- không trùng

Password

- tối thiểu 8 ký tự
- có chữ hoa
- có chữ thường
- có số

Phone

- đúng định dạng Việt Nam

Product

- Giá phải > 0
- File nội dung bắt buộc khi tạo sản phẩm

---

# 10. Database

Thiết kế các bảng

- Users
- Categories
- Products
- Orders
- OrderItems
- Payments
- Licenses
- Reviews
- Cart
- CartItems
- AuditLogs (khuyến khích, phục vụ truy vết hành động Admin)

Yêu cầu

- PK
- FK
- Index- Unique
- Soft Delete

---

# 11. Business Rule

- Một tài khoản chỉ áp dụng cho một user, admin do hệ thống cấp riêng.
- Email là duy nhất.
- Password lưu plain text.
- Admin có thể khóa (`locked`) tài khoản vi phạm; tài khoản bị khóa
  không đăng nhập được.
- Không được tự khóa tài khoản của chính mình.
- Customer chỉ quản lý được sản phẩm và đơn hàng liên quan đến sản
  phẩm của chính mình.
- Sản phẩm phải được Admin duyệt (`approved`) mới hiển thị công
  khai cho customer.
- Customer chỉ được đánh giá (Review) sản phẩm mà mình đã sở hữu
  License hợp lệ.
- Chỉ cấp License khi Payment ở trạng thái `success`.
- Truy cập nội dung sản phẩm số (đọc sách/xem video) bắt buộc kiểm
  tra License còn hiệu lực (`active`).
- Không xóa Category nếu còn Product thuộc danh mục đó.

---

# 12. API Response

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```
------------------------------------------------------------------------
# thông báo -ok
Không có thông báo (email/push) cho các sự kiện: sản phẩm được duyệt, thanh toán thành công, review mới...
-----------------------------------------------------------
# dashboard-ok
 -admin (crud)
    Số user mới, số user bị khóa
    Số sản phẩm đang chờ duyệt (để admin biết việc tồn đọng)
    danh sách users bị report



update
thêm cho tôi các api về 
+Cập nhật profile; PUT /api/users/me-ok  upload_avatar: /api/users/me/avatar-ok
+Danh sách người dùng (Admin): /api/admin/users-ok
+gửi report( báo cáo người dùng khác)-POST /api/reports-ok, xem danh sách reports(admin)-GET /api/reports-ok
+CRUD (chỉ Admin được tạo/sửa/xóa danh mục)-ok hiển thị danh mục sản phẩm-/api/categories-ok
+Admin: Duyệt / Từ chối sản phẩm trước khi công khai-POST /api/admin/products/{productId}/approve-ok
+Customer: Xem chi tiết GET /api/products/{productId}-OK / Danh sách sản phẩm đã duyệt/ SẢN PHẨM ĐÃ ĐĂNG- GET  /api/products/mine-OK, Thêm / Cập nhật /-OK, Xóa  sản phẩm của mình-ok, Tổng doanh thu (theo ngày/tháng/tổng)-chưa test do chưa có đơn hàng
+thêm api lấy thông báo (email/push) cho các sự kiện: sản phẩm được duyệt, thanh toán thành công, review mới...-OK
+thêm api phục vụ cho 
 dashboard 
 admin (crud)-tổng quan 3 thông số-/api/admin/dashboard/summary-ok
    Số user mới, số user bị khóa-/api/admin/dashboard/reported-users
    Số sản phẩm đang chờ duyệt (để admin biết việc tồn đọng)
    danh sách users bị report-/api/admin/reports
    -------------------------------------------------------------------------------------------------

    #update
     luồng hoạt động:   escrow/deposit
        muốn bán hàng thì phải ứng tiền làm hợp đồng
        khi vi phạm thì trừ từ đó( deposit)
        giữ tiền 7 ngày từ lúc người mua thanh toán thành công, cứ hoàn hàng là hoàn tiền

    tạo api: models: wallets( escrow/deposit)
        +làm thêm api-quản lý nguồn tiền-GET /api/wallets/me-ok
        +api  lịch sử giao dịch ví-GET /api/wallets/transactions-thiếu api crud?-tự thêm và không thể xoá-ok
        +Admin xem danh sách ví của toàn hệ thống-GET /api/wallets/admin/list-ok
        +api  quản lý nguồn tiền-crud sl tiền-?thiếu api nạp tiền để test
        +api rút tiền-trừ tiền trong escrow-GET /api/wallets/me-?-thiếu api nạp tiền
        +api đăng kí hợp đồng- trừ tiên deposit-?-thiếu api nạp tiền
        +api huỷ đăng kí - cộng tiền-test sau khi api đăng kí hợp đồng
        +"Hoàn hàng" tính từ mốc nào?-lúc người mua yêu cầu
            ++hoàn hàng admin không cần xử lý
            ++sau 7 ngày không bị hoàn hàng-cộng tiền escrow-POST /api/wallets/escrow/hold-trừ tiền người mua, cộng escrow người bán, POST /api/wallets/escrow/release-giải phóng escrow-hold trừ âm balence, chưa cộng escrow-cập nhập thanh toán cộng escrow seller, đủ thì trừ balance buyer, balance không đủ thì yêu cầu thanh toán api payment, xử lý trường hợp order có nhiều sellerid
                                BUYER
                      │
                      ▼
              Create / Pay Order
                      │
                      ▼
              Check Wallet
                 /        \
              đủ            thiếu
              │               │
              ▼               ▼
        Hold Escrow        Top-up
              │               │
              │          Payment Gateway
              │               │
              │               ▼
              │        Payment success
              │               │
              │          Wallet + money
              │               │
              │               ▼
              │          Hold Escrow
              │               │
              └───────┬───────┘
                      ▼
               Order = paid
                      │
                      ▼
               Create License
                      │
                      ▼
              Money in Escrow
                      │
              Product delivered
                      │
                      ▼
                Release Escrow
                      │
                      ▼
              Seller balance += money

              seed data-> chạy hết các api trong nhóm swagger Wallets có trong hệ thống. trả về kết quả của từng api-khó mô tả nhưng ai không tự động thêm để chạy thành công trả về có dữ liệu liên quan đến nhau

            cho tôi danh sách url tương ứng với các tính năng trên
            thêm validate phải ký hợp đồng mới đăng sản phẩm được

            ++bị hoàn hàng trước 7 ngày thanh toán-trừ tiền trong escrow
            ++bị hoàn hàng sau 7 ngày thanh toán-trừ tiền trong deposit
            ++Trừ âm-Khóa tài khoản?
            ++Deposit bị trừ xuống dưới mức tối thiểu của hợp đồng-Tự động tạm ngưng quyền bán cho đến khi nạp bù?
        +cập nhập mọi thông báo phù hợp với từng api vào api thông báo

        ##chưa đăng kí vẫn bán được, test luông hoạt động ví( )
        --->test luồng hoat động của ví, thiếu api, thiếu api để test, api lỗi


        WALLET TEST
│
├─ 0. ĐĂNG NHẬP
│   ├─ admin/seller/buyer login → 200, có accessToken (lưu adminToken, sellerToken, buyerToken)
│   ├─ Sai mật khẩu → 401
│   └─ Gọi API ví không token → 401
│
├─ 1. SỐ DƯ GỐC
│   ├─ GET /wallets/me (seller) → 200 {balance:0, escrowBalance:0, depositBalance:0, status:"active"}
│   └─ GET /wallets/me (buyer)  → 200 {balance:0, escrowBalance:0, depositBalance:0}
│
├─ 2. SELLER: NẠP VÍ + KÝ HỢP ĐỒNG
│   ├─ 2.1 Case lỗi (chạy trước)
│   │   ├─ register-seller-contract {amount:1000000}, ví 0đ → 400 "Insufficient balance" (ví không đổi)
│   │   └─ register-seller-contract {amount:100000} → 400 "Amount is below minimum deposit"
│   ├─ 2.2 Nạp ví seller
│   │   ├─ Lỗi: amount = 0 / -1 / "abc" / thiếu amount → 400 validation
│   │   ├─ Lỗi: dưới mức nạp tối thiểu (nếu có) → 400
│   │   ├─ Lỗi: không token → 401
│   │   └─ OK: POST /wallets/deposit {amount:1500000} → 200 {balance:1500000}
│   │       └─ Kiểm tra: /transactions có 1 dòng loại nạp ví +1.500.000 "completed"
│   ├─ 2.3 Chưa ký hợp đồng mà tạo sản phẩm (đủ tiền, chưa ký)
│   │   └─ POST /products → 403 (chưa có hợp đồng)
│   ├─ 2.4 Ký hợp đồng thành công
│   │   └─ {amount:1000000} → 200 {contractSigned:true, depositBalance:1000000, balance:500000}
│   ├─ 2.5 Ký lần 2 → 400/409 "Contract already registered" (số dư không đổi)
│   ├─ 2.6 Buyer gọi register-seller-contract → 403
│   └─ 2.7 Đối chiếu
│       ├─ GET /wallets/me → balance 500000, depositBalance 1000000
│       └─ GET /transactions → thứ tự: nạp ví +1.500.000, cọc 1.000.000
│
├─ 3. SẢN PHẨM
│   ├─ Seller tạo product A (300000) → 201 {status:"pending"}
│   ├─ Seller tạo product B (300000) → 201 {status:"pending"}
│   ├─ Buyer duyệt product → 403
│   └─ Admin approve A, B → 200 {status:"approved"}
│
├─ 4. BUYER: THANH TOÁN ĐƠN A (đơn 300.000)
├─ Nạp ví buyer 200.000 → balance 200.000
├─ Checkout → orderA "pending"
├─ payments/create {orderId:orderA}, thiếu tiền
│   └─ 200 {status:"pending", requiredAmount:300000, redirectUrl:"/api/payments/mock-ipn?..."}
│       Kiểm tra: buyer 200.000, order "pending", chưa license, seller escrow 0
├─ Nạp thêm 700.000 → balance 900.000
├─ payments/create lần 2, đủ tiền
│   └─ 200 "Order paid successfully using buyer wallet balance", status "success"
│       Kiểm tra: buyer 600.000; seller escrow 300.000 (tx escrow_hold);
│       order "paid"; my-library có 1 license; 2 notification (buyer email, seller in-app)
├─ payments/create lần 3 → 200 "Order already paid" (không trừ tiền thêm)
├─ IPN success TXN_A_001 sau khi đã paid → 200 "OK", KHÔNG đổi số dư/license/escrow
├─ IPN failed sau khi đã paid → hiện tại BUG (payment.status thành "failed"); kỳ vọng đúng: bỏ qua
├─ Nhánh IPN-only (dùng đơn khác, buyer chưa đủ tiền)
│   ├─ IPN failed → 200 "OK", payment "failed", order "pending", số dư không đổi
│   └─ IPN success → 200 "OK", buyer được tự nạp phần thiếu (tx deposit) rồi trả: ghi nhận là rủi ro #1
├─ IPN orderId không tồn tại → 404 text "Order not found"
├─ createPayment orderId không tồn tại → 404 JSON
├─ Bảo mật: user khác gọi payments/create cho đơn của buyer → kỳ vọng 403 (code hiện không chặn)
├─ Bảo mật: gọi IPN không token → kỳ vọng 401/403 (code hiện cho qua)
└─ Đồng thời: 2 request create (hoặc create + IPN) cùng đơn → kỳ vọng chỉ trừ 1 lần
│
├─ 5. ESCROW HOLD (chọn 1 nhánh theo code)
│   ├─ Nhánh auto: chỉ cần kiểm tra escrowBalance ở bước 4, bỏ các case gọi tay
│   └─ Nhánh gọi tay: POST /wallets/escrow/hold {orderId, amount:300000}
│       ├─ Đúng quyền → 200 {status:"HELD", releaseAt: now+7d}
│       ├─ Gọi lần 2 cùng đơn → 400/409
│       ├─ Amount khác giá đơn → 400
│       ├─ User không liên quan đơn → 403
│       └─ Đơn chưa thanh toán → 400
│
├─ 6. ĐƠN A: REFUND TRƯỚC 7 NGÀY
│   ├─ Buyer khác (không phải chủ đơn) refund → 403
│   ├─ Refund đơn không tồn tại {orderId:"000"} → 404
│   ├─ Buyer refund {orderId:orderA, reason:"Không đúng mô tả"} → 200 {refundedAmount:300000, escrowStatus:"REFUNDED"}
│   ├─ Kiểm tra
│   │   ├─ Buyer balance 900000 (+300000)
│   │   ├─ Seller escrowBalance 0, balance vẫn 500000
│   │   ├─ /transactions buyer có REFUND +300000
│   │   └─ /content/my-library → không còn product A
│   ├─ Refund lần 2 cùng đơn A → 400 "Already refunded"
│   └─ Release đơn A sau khi refund → 400
│
├─ 7. ĐƠN B: THANH TOÁN + HOLD
│   ├─ Cart add B → checkout → {orderB, total:300000}
│   ├─ payments/create → IPN success (TXN_B_001) → buyer balance 600000
│   ├─ Seller: escrowBalance 300000, balance 500000, depositBalance 1000000
│   ├─ Release khi chưa đủ 7 ngày (Admin) → 400 "Escrow not yet releasable"
│   ├─ Buyer/Seller gọi release → 403 (nếu chỉ admin/job được phép)
│   └─ Rút vượt phần khả dụng (seller có escrow + cọc đang tồn tại)
│       ├─ withdraw {amount:800000} (balance+escrow) → 400
│       └─ withdraw {amount:1500000} (balance+cọc) → 400 (escrow và cọc không rút được)
│
├─ 8. GIẢ LẬP QUÁ 7 NGÀY (DB: releaseAt = now-8d, hoặc config/mock clock)
│   ├─ Refund đơn B khi escrow còn HELD nhưng quá hạn → 400 "Refund period has expired"
│   ├─ Admin release {orderId:orderB} → 200 {amount:300000, platformFee:30000, sellerReceived:270000, status:"RELEASED"}
│   │   └─ Kiểm tra: seller balance 770000, escrowBalance 0, có ESCROW_RELEASE 270000, có phí 30000
│   ├─ Release lần 2 → 400 "Already released"
│   └─ Refund đơn B sau khi đã release → 400 (buyer balance vẫn 600000, order không đổi trạng thái)
│
├─ 9. RÚT TIỀN (seller, balance 770000)
│   ├─ Dưới mức tối thiểu {amount:10000} → 400 "below minimum withdrawal"
│   ├─ Amount 0 / âm / thiếu → 400 validation
│   ├─ Vượt số dư {amount:900000} → 400 "Insufficient balance"
│   ├─ Thiếu thông tin ngân hàng → 400
│   ├─ Buyer rút (không phải seller) → theo nghiệp vụ: 200 nếu có tiền, hoặc 403 nếu chỉ seller
│   ├─ OK: {amount:200000, bankName, bankAccount, accountHolder} → 200 {status:"PENDING"}
│   │   └─ Kiểm tra: balance 570000, có transaction WITHDRAW 200000
│   └─ Race: 2 lệnh withdraw 500000 gửi đồng thời (balance 570000)
│       └─ Đúng 1 lệnh 200, lệnh còn lại 400; balance không âm
│
├─ 10. ADMIN QUẢN LÝ VÍ
│   ├─ GET /wallets/admin/list (admin) → 200, danh sách đủ các ví
│   ├─ Buyer/Seller gọi admin/list → 403
│   ├─ Suspend {reason:"Bị report nhiều lần"} (admin) → 200 {status:"suspended"}
│   ├─ Buyer/Seller gọi suspend → 403; suspend userId không tồn tại → 404
│   ├─ Hiệu ứng suspend (seller)
│   │   ├─ withdraw → 403 "Wallet is suspended"
│   │   ├─ POST /products → 403 "Wallet is suspended"
│   │   └─ Nạp ví / nhận release → theo quy định (ghi rõ 200 hay 403)
│   └─ Resume (admin) → 200 {status:"active"} → withdraw {amount:100000} → 200
│
├─ 11. ĐỐI SOÁ CUỐI
│   ├─ Tổng nạp ví = 1.500.000 (seller) + 900.000 (buyer) = 2.400.000
│   ├─ Σ balance + Σ escrow + Σ cọc + Σ phí + Σ đã rút
│   │   = (600.000 buyer + 570.000 seller) + 0 + 1.000.000 + 30.000 + 200.000 = 2.400.000 ✔
│   │   (nếu đã rút thêm 100.000 ở bước resume thì seller còn 470.000, tổng rút 300.000, vẫn khớp)
│   ├─ Σ transaction từng ví = số dư hiện tại của ví đó
│   ├─ Không có: license trùng, refund trùng, release trùng
│   └─ Order A "refunded", order B "released/completed"
│
└─ 12. BẢNG SỐ DƯ KỲ VỌNG SAU TỪNG BƯỚC (để QA đối chiếu nhanh)
    Bước                      | Buyer bal | Seller bal | Seller escrow | Seller cọc
    Sau nạp seller            |     0     | 1.500.000  |       0       |     0
    Sau ký hợp đồng           |     0     |   500.000  |       0       | 1.000.000
    Buyer nạp 200k, 700k      |   900.000 |   500.000  |       0       | 1.000.000
    IPN A success             |   600.000 |   500.000  |   300.000     | 1.000.000
    Refund A                  |   900.000 |   500.000  |       0       | 1.000.000
    IPN B success             |   600.000 |   500.000  |   300.000     | 1.000.000
    Release B                 |   600.000 |   770.000  |       0       | 1.000.000
    Withdraw 200k             |   600.000 |   570.000  |       0       | 1.000.000
