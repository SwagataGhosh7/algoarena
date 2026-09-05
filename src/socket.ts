import { io } from 'socket.io-client';
import { backendUrl } from './api';

export const socket = io(backendUrl || undefined, {
  autoConnect: false,
});
