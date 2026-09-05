import { io } from 'socket.io-client';

// the socket URL should ideally be derived from window.location in a real deployment
// but for this preview environment, the server is running on the same host/port.
export const socket = io({
  autoConnect: false,
});
