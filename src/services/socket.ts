import { io, Socket } from 'socket.io-client';

// Detecta dinamicamente a URL do servidor backend
const SERVER_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? `http://${window.location.hostname}:3001`
  : `http://${window.location.hostname}:3001`;

export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});

export const getSocketServerUrl = () => SERVER_URL;
