import { io } from "socket.io-client";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      withCredentials: false,
      autoConnect: false,
      // No userId here — connectSocket() sets it before connecting
    });
  }
  return socket;
};

export const connectSocket = (token) => {
  const s = getSocket();
  const jwtToken = token || localStorage.getItem("graphyte_token");
  if (jwtToken) {
    s.auth = { token: jwtToken };
    if (s.io.opts.query) {
      delete s.io.opts.query.userId;
    }
  }
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect();
  socket = null;
};
