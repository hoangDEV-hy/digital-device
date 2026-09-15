# Digital Marketplace Backend (scaffold)

Minimal Node.js + Express + Sequelize scaffold implementing core requirements from the assignment.

Quick start:

1. Copy `.env.example` to `.env` and fill DB credentials.
2. Install deps:

```bash
npm install
```

3. Start server:

```bash
npm run dev
```

APIs:
- `POST /api/auth/register` — register
- `POST /api/auth/login` — login
- `POST /api/auth/refresh` — refresh token
- `POST /api/auth/logout` — logout
- `GET /api/users/me` — get current user (requires `Authorization: Bearer <accessToken>`)
 - `POST /api/auth/register` — register
 - `POST /api/auth/login` — login
 - `POST /api/auth/refresh` — refresh token
 - `POST /api/auth/logout` — logout
 - `GET /api/users/me` — get current user (requires `Authorization: Bearer <accessToken>`)
 - `POST /api/payments/create` — initiate mock payment (body: `orderId`, `method`)
 - `GET /api/payments/mock-ipn` — mock IPN callback (query: `orderId`, `status=success|failed`, `providerTxId`)
 - `POST /api/uploads/image` — upload image (`image` form field)
 - `POST /api/uploads/file` — upload content file (`file` form field)
 - `POST /api/admin/users/:userId/lock` — lock user (admin)
 - `POST /api/admin/users/:userId/unlock` — unlock user (admin)
 - `POST /api/admin/users/:userId/reset-device-ip` — reset device IP (admin)

Default admin seeded on startup: `admin@example.com` / `Admin1234` (change via env `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`).

Files of interest:
- `src/models` — Sequelize models (User, Category, Product, RefreshToken)
- `src/controllers` — controllers (authController)
- `src/routes` — routes (auth, users)
