function peersCsvToMap(csv) {
  const map = {};
  if (!csv || typeof csv !== "string") {
    return map;
  }
  csv.split(",").forEach((entry) => {
    const trimmed = entry.trim();
    if (!trimmed) return;
    const colon = trimmed.lastIndexOf(":");
    if (colon === -1) return;
    const host = trimmed.slice(0, colon);
    const port = parseInt(trimmed.slice(colon + 1), 10);
    if (host && port) {
      map[port] = host;
    }
  });
  return Object.fromEntries(
    Object.entries(map).sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
  );
}

function legacyIpsToMap(ipListCsv) {
  const map = {};
  if (!ipListCsv) return map;
  ipListCsv.split(",").forEach((ip) => {
    const trimmed = ip.trim();
    if (!trimmed) return;
    const parts = trimmed.split(".");
    const id = parseInt(parts[parts.length - 1], 10);
    map[3000 + id] = trimmed;
  });
  return Object.fromEntries(
    Object.entries(map).sort((a, b) => parseInt(a[0], 10) - parseInt(b[0], 10))
  );
}

function buildPeerMap(clusterPeers, ipListCsv) {
  if (clusterPeers && clusterPeers.trim()) {
    return peersCsvToMap(clusterPeers);
  }
  return legacyIpsToMap(ipListCsv);
}

module.exports = { peersCsvToMap, legacyIpsToMap, buildPeerMap };
