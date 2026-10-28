import { io } from "socket.io-client";

let socket;

export function getSocket() {
  if (!socket) {
    const socketUrl =
      import.meta.env.VITE_SOCKET_URL ||
      (typeof window !== "undefined" ? window.location.origin : "http://localhost:8080");

    socket = io(socketUrl, {
      withCredentials: true,
      // Evaluated on every (re)connect so it always carries the current JWT.
      auth: (cb) => cb({ token: localStorage.getItem("meeting_token") })
    });
  }

  return socket;
}

export function resetSocket() {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
}
