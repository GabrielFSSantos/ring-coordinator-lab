function defaultNodeNameForPort(port) {
  if (port >= 3002 && port <= 3099) {
    return `ubuntu-node-${port - 3000}`;
  }
  return `porta-${port}`;
}

function friendlyNodeName(meta, port) {
  if (meta?.nodeName && meta.nodeName !== "?") return meta.nodeName;
  if (port != null) return defaultNodeNameForPort(port);
  return "nó";
}

function friendlyPeerLabel(peer) {
  const name = friendlyNodeName(
    { nodeName: peer.nodeName },
    peer.port
  );
  return name;
}

function hostPrefix(labHostName) {
  const host = (labHostName || "").trim();
  if (!host || host === "-" || host === "lab-tail") return "";
  return `${host} · `;
}

function boxTitle(context, roleKey, roleLabels) {
  const role = roleLabels[roleKey] || roleKey;
  const node = context.hostname || friendlyNodeName(null, context.port);
  const prefix = hostPrefix(context.labHostName);
  if (roleKey === "LEADER") {
    return `${prefix}${node} · coordenador`;
  }
  if (roleKey === "STORAGE" || context.hostname === "storage") {
    return `${prefix}banco de dados`;
  }
  return `${prefix}${node} · ${role}`;
}

module.exports = {
  defaultNodeNameForPort,
  friendlyNodeName,
  friendlyPeerLabel,
  boxTitle,
  hostPrefix,
};
