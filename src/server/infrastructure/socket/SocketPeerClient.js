const socketClient = require("socket.io-client");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Connects to a peer; resolves when connected, on failure, or on timeout.
 */
async function connectPeer(address, options = {}) {
  const timeoutMs = options.timeoutMs ?? 3000;
  const retries = options.retries ?? 3;
  const backoffMs = options.backoffMs ?? 200;

  if (!address) return null;

  const url = address.includes("://")
    ? address
    : `http://${address.includes(":") ? address : `${address}:3000`}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const socket = await tryOnce(url, timeoutMs);
    if (socket && socket.connected) {
      return socket;
    }
    if (socket) {
      socket.close();
    }
    if (attempt < retries) {
      await sleep(backoffMs * attempt);
    }
  }
  return null;
}

function tryOnce(url, timeoutMs) {
  return new Promise((resolve) => {
    const socket = socketClient(url, {
      transports: ["websocket"],
      reconnection: false,
      timeout: timeoutMs,
    });

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => finish(socket), timeoutMs);

    socket.once("connect", () => finish(socket));
    socket.once("connect_error", () => finish(null));
  });
}

module.exports = { connectPeer };
