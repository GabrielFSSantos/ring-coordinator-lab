/**
 * Renúncia automática do líder após mandato (somente o coordenador atual).
 */
class CoordinatorTenure {
  constructor(nodeApp) {
    this.node = nodeApp;
    this.timer = null;
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  startIfEnabled() {
    this.stop();
    const policy = this.node.simulationPolicy;
    if (!policy.leaderSelfTermEnabled || !this.node.isCoordinator) return;
    const ms = policy.leaderTenureMs;
    if (!ms || ms < 5000) return;
    this.timer = setTimeout(() => {
      if (!this.node.isCoordinator || this.node.inElection) return;
      this.node.requestLeaderSelfResignation("leader-tenure");
    }, ms);
  }
}

module.exports = { CoordinatorTenure };
