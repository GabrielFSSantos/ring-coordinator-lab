const { buildPeerMap } = require("../../../shared/peers");

function portFromIp(ip) {
  const parts = ip.split(".");
  const id = parseInt(parts[parts.length - 1], 10);
  return 3000 + id;
}

function ipsToObjectSorted(ips) {
  let objeto;
  if (typeof ips === "string") {
    objeto = {};
    ips.split(",").forEach((ip) => {
      const trimmed = ip.trim();
      if (!trimmed) return;
      objeto[portFromIp(trimmed)] = trimmed;
    });
  } else if (typeof ips === "object" && ips !== null) {
    objeto = { ...ips };
  } else {
    objeto = {};
  }
  return Object.fromEntries(
    Object.entries(objeto).sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
  );
}

class RingTopology {
  constructor(ipListByPort, localPort, localIp) {
    this.ipListByPort = ipListByPort;
    this.peerMetaByPort = {};
    this.localPort = localPort;
    this.localIp = localIp;
  }

  static fromEnv(ipListCsv, localPort, localIp) {
    return new RingTopology(
      ipsToObjectSorted(ipListCsv),
      localPort,
      localIp
    );
  }

  static fromPeerMap(peerMap, localPort, localHost) {
    return new RingTopology(peerMap, localPort, localHost);
  }

  static fromCluster(clusterPeers, ipListCsv, localPort, localHost) {
    const map = buildPeerMap(clusterPeers, ipListCsv);
    return new RingTopology(map, localPort, localHost);
  }

  get portsInOrder() {
    return Object.keys(this.ipListByPort).map((p) => parseInt(p, 10));
  }

  get minPort() {
    const ports = this.portsInOrder;
    return ports.length ? Math.min(...ports) : this.localPort;
  }

  ipForPort(port) {
    return this.ipListByPort[port];
  }

  portForIp(ip) {
    for (const [port, host] of Object.entries(this.ipListByPort)) {
      if (host === ip) return parseInt(port, 10);
    }
    return portFromIp(ip);
  }

  hostForCoordinator(coordinatorPort) {
    return this.ipListByPort[coordinatorPort];
  }

  successorPort() {
    const ports = this.portsInOrder;
    for (const p of ports) {
      if (p > this.localPort) {
        return p;
      }
    }
    return ports.length ? ports[0] : null;
  }

  successorIp() {
    const port = this.successorPort();
    return port ? this.ipListByPort[port] : null;
  }

  removeIp(ip) {
    const port = this.portForIp(ip);
    if (this.ipListByPort[port] === ip) {
      delete this.ipListByPort[port];
    }
  }

  addPeer(port, ip, meta = {}) {
    const portNum = parseInt(port, 10);
    const prev = this.ipListByPort[portNum];
    const changed = prev !== ip;
    if (!prev || prev !== ip) {
      this.ipListByPort = ipsToObjectSorted({
        ...this.ipListByPort,
        [portNum]: ip,
      });
    }
    if (meta.labHostName || meta.nodeName) {
      this.peerMetaByPort[portNum] = {
        labHostName:
          meta.labHostName || this.peerMetaByPort[portNum]?.labHostName,
        nodeName: meta.nodeName || this.peerMetaByPort[portNum]?.nodeName,
      };
    }
    return changed;
  }

  /**
   * @param {Array<{port:number,host:string,labHostName?:string,nodeName?:string}>} discovered
   * @returns {boolean} true se o mapa de peers mudou
   */
  mergeDiscoveredPeers(discovered) {
    if (!Array.isArray(discovered) || !discovered.length) return false;
    const sorted = [...discovered].sort(
      (a, b) => parseInt(a.port, 10) - parseInt(b.port, 10)
    );
    let changed = false;
    for (const peer of sorted) {
      const port = parseInt(peer.port, 10);
      if (!port || !peer.host) continue;
      if (port === this.localPort && peer.host === this.localIp) continue;
      const wasNew = this.addPeer(port, peer.host, {
        labHostName: peer.labHostName,
        nodeName: peer.nodeName,
      });
      if (wasNew) changed = true;
    }
    return changed;
  }

  metaForPort(port) {
    const p = parseInt(port, 10);
    return this.peerMetaByPort[p] || null;
  }

  peerDetails() {
    return this.portsInOrder.map((port) => ({
      port,
      host: this.ipListByPort[port],
      labHostName: this.peerMetaByPort[port]?.labHostName || null,
      nodeName: this.peerMetaByPort[port]?.nodeName || null,
    }));
  }

  peerAddressForPort(port) {
    const ip = this.ipListByPort[port];
    return ip ? `${ip}:${port}` : null;
  }

  allPeerAddressesExceptSelf() {
    return Object.entries(this.ipListByPort)
      .filter(([port]) => parseInt(port, 10) !== this.localPort)
      .map(([port, ip]) => `${ip}:${port}`);
  }
}

module.exports = { RingTopology, ipsToObjectSorted, portFromIp };
