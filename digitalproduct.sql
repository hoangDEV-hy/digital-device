-- =========================================================
-- DATABASE: Quản lý bán sản phẩm kỹ thuật số
-- Dùng cho: Web + Mobile (Expo) - dùng chung 1 backend API
-- DBMS: MySQL
-- =========================================================

CREATE DATABASE IF NOT EXISTS digital_product_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE digital_product_store;

-- =========================================================
-- 1. USERS
-- =========================================================
CREATE TABLE Users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    avatar          VARCHAR(255),
    role            ENUM('admin', 'seller', 'customer') NOT NULL DEFAULT 'customer',
    status          ENUM('active', 'locked') NOT NULL DEFAULT 'active',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =========================================================
-- 2. CATEGORIES
-- =========================================================
CREATE TABLE Categories (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    parent_id       INT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES Categories(id)
        ON DELETE SET NULL
);

-- =========================================================
-- 3. PRODUCTS
-- =========================================================
CREATE TABLE Products (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    seller_id       INT NOT NULL,
    category_id     INT NOT NULL,
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    price           DECIMAL(12,2) NOT NULL,
    sale_price      DECIMAL(12,2) NULL,
    product_type    ENUM('ebook', 'course', 'software', 'template', 'license') NOT NULL,
    file_url        VARCHAR(255) NOT NULL,   -- link file gốc lưu trên cloud storage
    thumbnail       VARCHAR(255),
    status          ENUM('active', 'hidden') NOT NULL DEFAULT 'active',
    sold_count      INT NOT NULL DEFAULT 0,
    avg_rating      DECIMAL(2,1) NOT NULL DEFAULT 0,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(id) ON DELETE RESTRICT
);

-- =========================================================
-- 4. ORDERS
-- =========================================================
CREATE TABLE Orders (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    total_amount    DECIMAL(12,2) NOT NULL,
    status          ENUM('pending', 'paid', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- =========================================================
-- 5. ORDER ITEMS
-- =========================================================
CREATE TABLE OrderItems (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    order_id        INT NOT NULL,
    product_id      INT NOT NULL,
    price           DECIMAL(12,2) NOT NULL,   -- giá tại thời điểm mua
    quantity        INT NOT NULL DEFAULT 1,
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE RESTRICT
);

-- =========================================================
-- 6. PAYMENTS
-- =========================================================
CREATE TABLE Payments (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    order_id            INT NOT NULL,
    method              ENUM('vnpay', 'momo', 'credit_card', 'bank_transfer') NOT NULL,
    transaction_code    VARCHAR(100) UNIQUE,
    status              ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
    paid_at             DATETIME NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES Orders(id) ON DELETE CASCADE
);

-- =========================================================
-- 7. LICENSES / DOWNLOADS
--    Bảng đặc trưng của sản phẩm số: cấp quyền sở hữu/tải
-- =========================================================
CREATE TABLE Licenses (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    product_id      INT NOT NULL,
    order_item_id   INT NOT NULL,
    license_key     VARCHAR(100) UNIQUE,
    download_link   VARCHAR(255) NOT NULL,     -- link tải riêng, có thể có token
    download_limit  INT NOT NULL DEFAULT 5,
    download_count  INT NOT NULL DEFAULT 0,
    expires_at      DATETIME NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES OrderItems(id) ON DELETE CASCADE
);

-- =========================================================
-- 8. REVIEWS
-- =========================================================
CREATE TABLE Reviews (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    product_id      INT NOT NULL,
    rating          TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE
);

-- =========================================================
-- 9. CART
-- =========================================================
CREATE TABLE Cart (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL UNIQUE,      -- mỗi user có đúng 1 giỏ hàng
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- =========================================================
-- 10. CART ITEMS
-- =========================================================
CREATE TABLE CartItems (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    cart_id         INT NOT NULL,
    product_id      INT NOT NULL,
    added_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES Cart(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_product (cart_id, product_id)  -- tránh trùng sản phẩm trong giỏ
);

-- =========================================================
-- INDEXES gợi ý để tăng tốc truy vấn
-- =========================================================
CREATE INDEX idx_products_category ON Products(category_id);
CREATE INDEX idx_products_seller ON Products(seller_id);
CREATE INDEX idx_orders_user ON Orders(user_id);
CREATE INDEX idx_reviews_product ON Reviews(product_id);
CREATE INDEX idx_licenses_user ON Licenses(user_id);