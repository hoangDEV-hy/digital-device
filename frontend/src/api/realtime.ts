import { io } from 'socket.io-client';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const createAdminSocket = (accessToken: string) =>
  io(new URL(API_BASE_URL, window.location.origin).origin, {
    auth: { token: accessToken },
    autoConnect: false,
  });
