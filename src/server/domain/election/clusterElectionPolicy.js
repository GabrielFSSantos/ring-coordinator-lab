/**
 * Quem pode disparar eleição global neste host (evita 3003–3005 iniciarem com visão parcial do mDNS).
 */
function shouldScheduleClusterElection({
  port,
  clusterInitiatorPort,
  advertisePortBase,
  coordinatorPort,
  inElection,
  peerCount,
  nodeCount,
}) {
  const expected = Math.min(Math.max(nodeCount || 1, 1), 4);
  const initiator =
    clusterInitiatorPort != null ? clusterInitiatorPort : advertisePortBase;
  if (port !== initiator) return false;
  if (coordinatorPort || inElection) return false;
  return peerCount >= expected;
}

module.exports = { shouldScheduleClusterElection };
