import { io } from 'socket.io-client';
import { backendUrl } from './api';

export const socket = io(backendUrl || undefined, {
  autoConnect: true,
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 20,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});

