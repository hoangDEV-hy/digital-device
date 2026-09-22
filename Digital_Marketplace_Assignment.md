## Chủ đề: Hệ thống Marketplace Sản phẩm Số (Digital Product Marketplace API)

## 1. Mục tiêu

Xây dựng **RESTful API** cho hệ thống marketplace mua bán sản phẩm số
(sách điện tử, video khóa học, tài liệu số...) bằng **Node.js +
MySQL**, phục vụ đồng thời **Web Admin** (React) và **App Mobile**
cho người dùng (React Native).

-   Chỉ xây dựng Backend API.
-   Web Admin dùng để quản trị hệ thống (duyệt sản phẩm, khóa tài
    khoản, quản lý danh mục...).
-   App Mobile (React Native) dùng cho customer.

------------------------------------------------------------------------

# 2. Công nghệ bắt buộc

-   Node.js (Express)
-   MySQL
-   JWT Authentication
-   Swagger / OpenAPI
-   Logging middleware (Winston hoặc Morgan)
-   Git
-   React Native (App Mobile — customer)
-   ReactJS (Web Admin)

------------------------------------------------------------------------

# 3. Kiến trúc

Áp dụng kiến trúc phân lớp (Layered Architecture).

``` text
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


------------------------------------------------------------------------

# tạo mã code mysql

------------------------------------------------------------------------


# 4. Chức năng bắt buộc

## 4.1 Đăng ký tài khoản

Thông tin:

-   Họ tên
-   Email
-   Số điện thoại
-   Mật khẩu
-   Xác nhận mật khẩu

Yêu cầu

-   Email không được trùng
-   Password lưu plain text
-   Validate dữ liệu
-   một tài khoản chỉ gắn với 1 ip thiết bị
-   mật khẩu phải lưu hash

------------------------------------------------------------------------

## 4.2 Đăng nhập

-   JWT (access token)
-   Refresh Token
-   Đăng xuất
-   Đổi mật khẩu
-   Quên mật khẩu

------------------------------------------------------------------------

## 4.3 Phân quyền

Có 2 Role, dùng chung 1 bảng `Users`, phân biệt bằng cột `role`

-   **customer**: đăng ký, đăng nhập, xem sản phẩm, mua sản phẩm,
    đánh giá sản phẩm đã mua, đăng bán sản phẩm số, quản lý đơn hàng của sản phẩm, rút tiền

-   **admin**: duyệt sản phẩm trước khi công khai, khóa tài khoản vi
    phạm (seller bán hàng giả, khách gian lận thanh toán...), quản lý
    toàn hệ thống, cho phép thay đổi ip máy với tài khoản

Business rule về tài khoản

-   Admin có thể đổi `status` của user sang `locked` để khóa tài
    khoản vi phạm
-   Tài khoản bị `locked` không thể đăng nhập / thực hiện giao dịch
-   Không được tự khóa tài khoản của chính mình

------------------------------------------------------------------------

## 4.4 Quản lý người dùng (Users)

Thông tin

-   Mã người dùng
-   Họ tên
-   Email
-   Số điện thoại
-   Mật khẩu
-   Vai trò (customer/ admin)
-   Trạng thái (active / locked)
-   Avatar
-   Ngày tạo

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

------------------------------------------------------------------------

## 4.5 Danh mục sản phẩm (Categories)

CRUD (chỉ Admin được tạo/sửa/xóa danh mục)-ok

Mỗi sản phẩm thuộc một danh mục.

Ví dụ danh mục: Sách điện tử, Khóa học video, Tài liệu, Template...

------------------------------------------------------------------------

## 4.6 Sản phẩm số (Products)

Thông tin

-   Mã sản phẩm
-   Tên sản phẩm
-   Mô tả
-   Giá
-   Danh mục
-   Người bán (seller)
-   Loại sản phẩm (ebook / video / tài liệu...)
-   File nội dung sản phẩm (đường dẫn lưu trữ, chỉ truy cập được sau
    khi mua)
-   Ảnh bìa / thumbnail
-   Trạng thái duyệt (pending / approved / rejected)
-   Trạng thái hiển thị (active / inactive)

API

-   Admin: Duyệt / Từ chối sản phẩm trước khi công khai-ok
-   Customer: Xem chi tiết / Danh sách sản phẩm đã duyệt, Thêm / Cập nhật / Xóa  sản phẩm của mình, Tổng doanh thu (theo ngày/tháng/tổng)-ok

------------------------------------------------------------------------

## 4.7 Đơn hàng (Orders) & Chi tiết đơn hàng (OrderItems)-ok

Orders

-   Mã đơn hàng
-   Người mua
-   Tổng tiền
-   Trạng thái đơn hàng (pending / paid / failed / cancelled)
-   Ngày tạo

OrderItems

-   Mã đơn hàng
-   Mã sản phẩm
-   Giá tại thời điểm mua
-   Số lượng (mặc định 1 với sản phẩm số)

API

-   Customer: Tạo đơn hàng từ giỏ hàng, xem lịch sử đơn hàng, Xem danh sách đơn hàng chứa sản phẩm của mình
-   Admin: Xem toàn bộ đơn hàng hệ thống

------------------------------------------------------------------------

## 4.8 Thanh toán (Payments)-ok

Thông tin

-   Mã thanh toán
-   Mã đơn hàng
-   Phương thức thanh toán (VNPay / Momo / ...)
-   Trạng thái thanh toán (pending / success / failed)
-   Mã giao dịch từ cổng thanh toán
-   Thời gian thanh toán

Yêu cầu

-   Thiết kế API tích hợp cổng thanh toán (VNPay/Momo), có thể giả
    lập (mock) callback/IPN cho môi trường fresher
-   Khi thanh toán thành công → tự động sinh License cho từng sản
    phẩm trong đơn hàng
-thiếu api xác thực thanh toán thành công thất bại

------------------------------------------------------------------------

## 4.9 Cấp quyền sở hữu (Licenses)-ok

Đặc trưng của sản phẩm số: sau khi thanh toán thành công, hệ thống
cấp một "License" xác nhận người dùng có quyền truy cập/sử dụng sản
phẩm đó vĩnh viễn (hoặc theo thời hạn nếu có).

Thông tin

-   Mã license
-   Người sở hữu (customer)
-   Sản phẩm
-   Đơn hàng liên quan
-   Ngày cấp
-   Trạng thái (active / revoked)

API

-   Hệ thống tự sinh license khi Payment thành công
-   Customer xem danh sách sản phẩm mình đã sở hữu (My Library)
-   Admin có thể thu hồi license (revoke) khi có tranh chấp/gian lận

------------------------------------------------------------------------

## 4.10 Đánh giá (Reviews) -ok
-   Customer chỉ được đánh giá sản phẩm đã mua (đã có License), có thể xem sản phẩm của mình bán
-   Thông tin: điểm số (rating), nội dung, người đánh giá, sản phẩm
-   Admin có thể gỡ review vi phạm

------------------------------------------------------------------------

## 4.11 Giỏ hàng (Cart) & Sản phẩm trong giỏ (CartItems)-ok

Cart

-   Mỗi customer có một giỏ hàng
-   Trạng thái giỏ hàng

CartItems

-   Sản phẩm trong giỏ
-   Giá tại thời điểm thêm vào giỏ

API

-   Thêm / Xóa sản phẩm khỏi giỏ
-   Xem giỏ hàng hiện tại
-   Checkout: chuyển giỏ hàng thành Order

------------------------------------------------------------------------

## 4.12 Truy cập nội dung sản phẩm số--ok
/api/content/signed/{productId}-lấy token cho stream
    { url: `/api/content/stream/${token}` }
/api/content/stream/{token}--phát nội dung
Chức năng đặc trưng: xem sách (ebook), xem video khóa học...

Yêu cầu

-   Mọi request truy cập nội dung (file ebook, video stream...) đều
    phải kiểm tra quyền thông qua bảng `Licenses`
-   Nếu customer chưa mua (không có license `active` cho sản phẩm
    đó) → từ chối truy cập (403)
-   Không trả trực tiếp đường dẫn file gốc cho client; nên dùng URL
    tạm thời/ký (signed URL) hoặc stream qua backend để tránh chia sẻ
    link trái phép

------------------------------------------------------------------------

# 5. Tìm kiếm-ok

Danh sách sản phẩm hỗ trợ

-   Search tên sản phẩm
-   Search theo mô tả

Filter

-   Danh mục
-   Khoảng giá
-   Loại sản phẩm (ebook / video / tài liệu)
-   Trạng thái duyệt (Admin)
-   Seller

Sort

-   Tên sản phẩm
-   Giá
-   Ngày tạo
-   Đánh giá trung bình

Pagination

-   page
-   pageSize

------------------------------------------------------------------------

# 6. Upload-ok

Cho phép upload

-   Ảnh bìa / avatar: jpg, png
-   File nội dung sản phẩm số: pdf, epub, mp4 (tùy loại sản phẩm)

Giới hạn

-   Ảnh: tối đa 2MB
-   File nội dung sản phẩm: giới hạn theo cấu hình (ví dụ tối đa
    100MB, có thể điều chỉnh)

------------------------------------------------------------------------

# 7. Logging

Sử dụng middleware logging (Winston/Morgan)

Log

-   Request
-   Response
-   Exception
-   Login
-   Payment callback (do liên quan tiền, cần log đầy đủ)

------------------------------------------------------------------------

# 8. Exception

Xử lý bằng Middleware (error-handling middleware của Express/NestJS).

Không try/catch xử lý logic nghiệp vụ trong Controller.

------------------------------------------------------------------------

# 9. Validation

Bắt buộc

Email

-   đúng định dạng
-   không trùng

Password

-   tối thiểu 8 ký tự
-   có chữ hoa
-   có chữ thường
-   có số

Phone

-   đúng định dạng Việt Nam

Product

-   Giá phải > 0
-   File nội dung bắt buộc khi tạo sản phẩm

------------------------------------------------------------------------

# 10. Database

Thiết kế các bảng

-   Users
-   Categories
-   Products
-   Orders
-   OrderItems
-   Payments
-   Licenses
-   Reviews
-   Cart
-   CartItems
-   AuditLogs (khuyến khích, phục vụ truy vết hành động Admin)

Yêu cầu

-   PK
-   FK
-   Index-   Unique
-   Soft Delete

------------------------------------------------------------------------

# 11. Business Rule

-   Một tài khoản chỉ áp dụng cho một user, admin do hệ thống cấp riêng.
-   Email là duy nhất.
-   Password lưu plain text.
-   Admin có thể khóa (`locked`) tài khoản vi phạm; tài khoản bị khóa
    không đăng nhập được.
-   Không được tự khóa tài khoản của chính mình.
-   Customer chỉ quản lý được sản phẩm và đơn hàng liên quan đến sản
    phẩm của chính mình.
-   Sản phẩm phải được Admin duyệt (`approved`) mới hiển thị công
    khai cho customer.
-   Customer chỉ được đánh giá (Review) sản phẩm mà mình đã sở hữu
    License hợp lệ.
-   Chỉ cấp License khi Payment ở trạng thái `success`.
-   Truy cập nội dung sản phẩm số (đọc sách/xem video) bắt buộc kiểm
    tra License còn hiệu lực (`active`).
-   Không xóa Category nếu còn Product thuộc danh mục đó.

------------------------------------------------------------------------

# 12. API Response

``` json
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