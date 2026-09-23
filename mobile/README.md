# Digital Marketplace Mobile

Expo SDK 57 buyer app for the Digital Marketplace API.

## Run

```bash
cd mobile
copy .env.example .env
npm install
npm run start
```

Set `EXPO_PUBLIC_API_URL` in `.env` before starting:

- Android emulator: `http://10.0.2.2:3000/api`
- iOS simulator: `http://localhost:3000/api`
- Physical phone: `http://YOUR_COMPUTER_LAN_IP:3000/api`

The backend must be running and reachable from the device. On a physical Windows device, allow port `3000` through Windows Firewall when needed.

## Included buyer flows

- SecureStore-backed login, registration, token refresh and logout
- Product discovery, search and category filters
- Add/remove cart items and checkout
- Order history and purchased library
- Account view
