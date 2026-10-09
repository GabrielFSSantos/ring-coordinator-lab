const { connectPeer } = require("../../infrastructure/socket/SocketPeerClient");

function orderedRingPorts(topology, startAfterPort = null) {
  let ports = topology.ringPortsAfterLocal();
  if (startAfterPort != null) {
    const idx = ports.indexOf(startAfterPort);
    if (idx >= 0) {
      ports = [...ports.slice(idx + 1), ...ports.slice(0, idx + 1)];
    }
  }
  return ports;
}

/**
 * Conecta ao primeiro peer vivo no percurso circular do anel.
 */
async function connectAlongRing(topology, options = {}) {
  const {
    connect = connectPeer,
    timeoutMs = 2000,
    retries = 1,
    skipPorts = [],
    startAfterPort = null,
  } = options;

  const skip = new Set(skipPorts.map((p) => parseInt(p, 10)));
  const ports = orderedRingPorts(topology, startAfterPort);

  for (const port of ports) {
    if (skip.has(port)) continue;
    const address = topology.peerAddressForPort(port);
    if (!address) continue;
    const socket = await connect(address, { timeoutMs, retries });
    if (socket?.connected) {
      return { ok: true, port, socket };
    }
  }
  return { ok: false };
}

/**
 * Entrega um evento Socket.io ao próximo peer vivo no anel lógico.
 */
function defaultSettleMs(options) {
  const ms = options.settleMs;
  return typeof ms === "number" && ms >= 0 ? ms : 400;
}

async function emitAlongRing(topology, event, payload, options = {}) {
  const { keepSocket = false, settleMs: settleOverride, ...connectOpts } = options;
  const hop = await connectAlongRing(topology, connectOpts);
  if (!hop.ok) return hop;
  hop.socket.emit(event, payload);
  if (!keepSocket) {
    const wait =
      typeof settleOverride === "number" ? settleOverride : defaultSettleMs(options);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    hop.socket.disconnect(true);
    return { ok: true, port: hop.port };
  }
  return hop;
}

module.exports = { connectAlongRing, emitAlongRing, orderedRingPorts };
