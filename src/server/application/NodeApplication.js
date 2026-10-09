const http = require("http");
const socketIo = require("socket.io");
const { RingTopology } = require("../domain/ring/RingTopology");
const ringRelay = require("../domain/ring/ringRelay");
const { ElectionService } = require("../domain/election/ElectionService");
const {
  shouldScheduleClusterElection: shouldScheduleClusterElectionPolicy,
} = require("../domain/election/clusterElectionPolicy");
const { RequestQueue } = require("../domain/coordinator/RequestQueue");
const { PendingTransactionBuffer } = require("../domain/coordinator/PendingTransactionBuffer");
const { connectPeer } = require("../infrastructure/socket/SocketPeerClient");
const { SqliteLogRepository } = require("../infrastructure/persistence/SqliteLogRepository");
const { StorageHttpClient } = require("../infrastructure/storage/StorageHttpClient");
const { LabLogger } = require("../infrastructure/logging/LabLogger");
const { SimulationRunner } = require("./SimulationRunner");
const { SimulationPolicy } = require("./SimulationPolicy");
const { CoordinatorTenure } = require("./CoordinatorTenure");
const { NodeStorageBinding } = require("./NodeStorageBinding");
const { DiscoveryCoordinator } = require("./DiscoveryCoordinator");
const { StorageReachabilityMonitor } = require("./StorageReachabilityMonitor");
const { NodeHttpServer } = require("../http/NodeHttpServer");
const {
  SocketEvents,
  transactionResponseEvent,
} = require("../domain/protocol/socketEvents");
const { LogEventCodes } = require("../infrastructure/logging/logEventCodes");
const { TransactionStoryLogger } = require("../infrastructure/logging/TransactionStoryLogger");
const { TimelineEventRecorder } = require("../infrastructure/logging/TimelineEventRecorder");
const { TimelineStdoutPoller } = require("../infrastructure/logging/TimelineStdoutPoller");
const { writeOpsLine } = require("../infrastructure/logging/dockerOpsLog");
const { parseSkipCodes } = require("../infrastructure/logging/timelinePersistPolicy");
const {
  parseMoneyToCents,
  centsToMoney,
  isValidTransactionDelta,
  randomDeltaCents,
} = require("../../shared/money");

class NodeApplication {
  constructor(config) {
    this.config = config;
    this.topology = RingTopology.fromCluster(
      config.clusterPeers,
      config.ipListCsv,
      config.port,
      config.advertiseHost || config.localIp
    );
    this.topology.addPeer(config.port, config.advertiseHost || config.localIp, {
      labHostName: config.labHostName,
      nodeName: config.hostname,
    });
    this.logger = new LabLogger(config);
    this.txStoryLogger = new TransactionStoryLogger(this.logger, this);
    this.lastRingViewFingerprint = null;
    this.io = null;
    this.server = null;
    this.successorSocket = null;
    this.successorIp = null;
    this.coordinatorPort = null;
    this.isCoordinator = false;
    this.inElection = false;
    this.electionList = [];
    this.lastCoordinatorEpoch = 0;
    this.simulatedDown = false;
    this.storageUp = false;
    this.requestQueue = new RequestQueue(config.queueLimit);
    this.logRepository = null;
    this.storageClient = null;
    this.pendingBuffer = new PendingTransactionBuffer(config.clientBufferLimit);
    this.electionDebounceTimer = null;
    this.coordinatorSocket = null;
    this.simulationRunner = null;
    this.coordinatorTenure = new CoordinatorTenure(this);
    this.storageBinding = new NodeStorageBinding(this);
    this.simulationPolicy = SimulationPolicy.fromConfig(config);
    this.discoveryCoordinator = null;
    this.storageMonitor = null;
    this.readTimer = null;
    this.ringViewTimer = null;
    this.lastStorageCheckMs = null;
    this.simSeq = 0;
    this.nodeHttp = null;
    this.timelineStdoutPoller = null;
    this.lastProcessedKillEpoch = null;
    this.lastSuspectWave = null;
    this.coordinatorCooldownUntil = 0;
    /** Ex-líder: fora do anel/eleição até COORDINATOR_APPLY de outro nó. */
    this.ringJoinDeferred = false;
    this.leadershipHealTimer = null;
    this.inElectionSince = 0;
  }

  isEligibleForCoordinatorRole() {
    if (this.simulatedDown) return false;
    if (this.ringJoinDeferred) return false;
    if (this.coordinatorCooldownUntil && Date.now() < this.coordinatorCooldownUntil) {
      return false;
    }
    return true;
  }

  electionListForCoordinatorPick(electionList) {
    return electionList.filter(
      (port) => port !== this.config.port || this.isEligibleForCoordinatorRole()
    );
  }

  beginExLeaderRecovery() {
    this.ringJoinDeferred = true;
    if (this.successorSocket?.connected) {
      this.successorSocket.disconnect(true);
    }
    this.successorSocket = null;
    this.successorIp = null;
  }

  async resumeRingParticipationAfterLeaderKnown() {
    if (!this.ringJoinDeferred) return;
    this.ringJoinDeferred = false;
    await this.connectToRing();
  }

  ringConnectOptions(overrides = {}) {
    return {
      timeoutMs: this.config.peerConnectTimeoutMs,
      retries: this.config.peerConnectRetries,
      ...overrides,
    };
  }

  async relayAlongRing(event, payload, options = {}) {
    const { keepSocket = false, settleMs } = options;
    const result = await ringRelay.emitAlongRing(
      this.topology,
      event,
      payload,
      this.ringConnectOptions({ keepSocket, settleMs })
    );
    if (!result.ok) {
      this.logger.election(
        LogEventCodes.RING_RELAY_FAIL,
        `event=${event}`
      );
      if (this.isClusterElectionInitiator()) {
        this.scheduleElectionDebounced();
      }
      return false;
    }
    if (keepSocket && result.socket) {
      this.successorSocket = result.socket;
      this.successorIp = this.topology.ipForPort(result.port);
    }
    return true;
  }

  getSimTxBurst() {
    return this.simulationPolicy.txBurst;
  }

  writeDockerOpsReady() {
    writeOpsLine(this.config.logDockerOps, {
      labHostName: this.config.labHostName,
      service: this.config.hostname,
      message: `ativo (anel=${this.config.port} http=${this.config.nodeHttpPort})`,
    });
  }

  onSimulationPolicyChanged() {
    this.simulationRunner?.stop();
    if (!this.isCoordinator) {
      this.simulationRunner?.start();
    }
  }

  async start() {
    this.server = http.createServer();
    this.io = socketIo(this.server, {
      cors: { origin: "*", methods: ["GET", "POST"] },
    });
    this.io.on("connection", (socket) => this.onPeerConnection(socket));

    if (this.config.useStorageHttp && this.config.storageUrl) {
      this.storageClient = new StorageHttpClient(
        this.config.storageUrl,
        this.config.storageWriteToken
      );
      await this.refreshStorageHealth();
    }
    if (this.config.logTimelinePersist && this.storageClient) {
      const skipSet = parseSkipCodes(this.config.logTimelineSkipCodes);
      const recorder = new TimelineEventRecorder({
        storageClient: this.storageClient,
        skipSet,
        labHostName: this.config.labHostName,
        hostname: this.config.hostname,
        port: this.config.port,
      });
      this.logger.setTimelineRecorder(recorder);
    }
    if (
      this.config.logStdoutMode === "timeline_self" &&
      this.storageClient
    ) {
      this.timelineStdoutPoller = new TimelineStdoutPoller({
        storageClient: this.storageClient,
        mode: "timeline_self",
        labHostName: this.config.labHostName,
        hostname: this.config.hostname,
        port: this.config.port,
        logFormat: this.config.logFormat,
        logStyle: this.config.logStyle,
        pollMs: this.config.logTimelinePollMs,
        logTimelinePersist: this.config.logTimelinePersist,
      });
      this.timelineStdoutPoller.start();
    }

    await new Promise((resolve) => {
      this.server.listen(this.config.port, () => {
        this.logger.boot(
          LogEventCodes.BOOT,
          `port=${this.config.port} discovery=${this.config.discoveryMode} storageUrl=${this.config.storageUrl || "-"}`
        );
        resolve();
      });
    });

    this.nodeHttp = new NodeHttpServer(this, this.config.nodeHttpPort);
    this.nodeHttp.start();

    this.discoveryCoordinator = new DiscoveryCoordinator(this);
    this.discoveryCoordinator.start();
    this.storageMonitor = new StorageReachabilityMonitor(this);
    this.storageMonitor.start();

    await this.tryBootstrapJoin();
    await this.syncClusterStateFromPeers();
    if (this.config.discoveryMode !== "mdns") {
      await this.bootElectionIfLeader();
    }
    this.simulationRunner = new SimulationRunner(this);
    if (!this.isCoordinator) {
      this.simulationRunner.start();
    }
    if (this.config.logReads) {
      this.readTimer = setInterval(() => this.performRead(), 60000);
    }
    const ringInterval = this.config.logRingViewIntervalMs || 0;
    if (ringInterval > 0) {
      this.ringViewTimer = setInterval(() => this.logRingView(), ringInterval);
    }
    this.logRingView(true);
    this.leadershipHealTimer = setInterval(
      () => this.healClusterLeadership(),
      5000
    );
  }

  async healClusterLeadership() {
    if (this.isCoordinator || this.ringJoinDeferred) return;
    if (!this.inElection && this.coordinatorPort) {
      if (!this.isCoordinator && !this.coordinatorSocket?.connected) {
        await this.setupRegularNode();
        await this.flushClientBuffer();
        this.simulationRunner?.start();
      }
      return;
    }
    await this.syncClusterStateFromPeers();
    if (this.coordinatorPort) {
      this.inElection = false;
      this.inElectionSince = 0;
      this.electionList = [];
      if (!this.isCoordinator) {
        await this.setupRegularNode();
        this.simulationRunner?.start();
      }
      return;
    }
    if (this.inElection && this.inElectionSince) {
      const stuckMs = Date.now() - this.inElectionSince;
      if (stuckMs > 30_000) {
        this.logger.election("ELECTION_STUCK", `ms=${stuckMs}`);
        this.inElection = false;
        this.inElectionSince = 0;
        this.electionList = [];
        if (this.isClusterElectionInitiator()) {
          this.scheduleElectionDebounced();
        }
      }
    }
  }

  async onDiscoveryUpdate(peers, storageRecord) {
    if (storageRecord?.host) {
      this.storageBinding.considerMdnsRecord(storageRecord);
    }
    const changed = this.topology.mergeDiscoveredPeers(peers);
    if (changed) {
      this.logger.election("PEERS_MERGE", `count=${this.topology.portsInOrder.length}`);
      if (this.successorSocket?.connected) {
        this.successorSocket.disconnect(true);
      }
      this.successorSocket = null;
      await this.syncClusterStateFromPeers();
      if (this.shouldScheduleClusterElection()) {
        this.scheduleElectionDebounced();
      }
    }
  }

  expectedLocalPeerCount() {
    return Math.min(Math.max(this.config.nodeCount || 1, 1), 4);
  }

  isClusterElectionInitiator() {
    const ports = this.topology.portsInOrder;
    const initiator = ports.length ? this.topology.minPort : this.config.advertisePortBase;
    return this.config.port === initiator;
  }

  isLocalPeerSetReady() {
    return this.topology.portsInOrder.length >= this.expectedLocalPeerCount();
  }

  shouldScheduleClusterElection() {
    const ports = this.topology.portsInOrder;
    const clusterInitiatorPort = ports.length
      ? this.topology.minPort
      : this.config.advertisePortBase;
    return shouldScheduleClusterElectionPolicy({
      port: this.config.port,
      clusterInitiatorPort,
      advertisePortBase: this.config.advertisePortBase,
      coordinatorPort: this.coordinatorPort,
      inElection: this.inElection,
      peerCount: this.topology.portsInOrder.length,
      nodeCount: this.config.nodeCount,
    });
  }

  async fetchClusterState(host, httpPort) {
    const url = `http://${host}:${httpPort}/v1/cluster/state`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async syncClusterStateFromPeers() {
    for (const detail of this.topology.peerDetails()) {
      if (detail.port === this.config.port) continue;
      const httpPort =
        detail.port + parseInt(process.env.NODE_HTTP_PORT_OFFSET || "1000", 10);
      const host =
        this.topology.connectHostForPort(detail.port) || detail.host;
      const state = await this.fetchClusterState(host, httpPort);
      if (state?.storageUrl) {
        this.storageBinding.considerPeerClusterState(state);
      }
      if (!state?.coordinatorPort) continue;
      const epoch = state.epoch || 0;
      const shouldApply =
        !this.coordinatorPort && state.coordinatorPort
          ? epoch >= this.lastCoordinatorEpoch
          : epoch > this.lastCoordinatorEpoch;
      if (shouldApply) {
        await this.onCoordinatorMessage(
          {
            coordinatorPort: state.coordinatorPort,
            epoch,
            processList: state.processList || [],
          },
          { skipForward: true }
        );
        return;
      }
    }
  }

  ringViewFingerprint(snapshot) {
    return JSON.stringify({
      leaderPort: snapshot.leaderPort,
      storageUp: snapshot.storageUp,
      peerCount: snapshot.peerCount,
      ports: (snapshot.peers || []).map((p) => p.port).sort((a, b) => a - b),
    });
  }

  logRingView(force = false) {
    const leaderPort = this.coordinatorPort;
    const leaderMeta = leaderPort ? this.topology.metaForPort(leaderPort) : null;
    const selfMeta = this.topology.metaForPort(this.config.port);
    const snapshot = {
      peerCount: this.topology.portsInOrder.length,
      leaderPort: leaderPort || null,
      leaderLabHost: leaderMeta?.labHostName || null,
      leaderNodeName: leaderMeta?.nodeName || null,
      storageUrl: this.config.storageUrl || "-",
      storageUp: this.storageUp,
      selfPort: this.config.port,
      selfLabHost: selfMeta?.labHostName || this.config.labHostName,
      selfNodeName: selfMeta?.nodeName || this.config.hostname,
      peers: this.topology.peerDetails(),
    };
    const fp = this.ringViewFingerprint(snapshot);
    if (!force && fp === this.lastRingViewFingerprint) {
      return;
    }
    this.lastRingViewFingerprint = fp;
    this.logger.ringView(snapshot);
  }

  async tryBootstrapJoin() {
    if (!this.config.bootstrapPeer) return;
    const peer = this.config.bootstrapPeer;
    const client = await connectPeer(peer, {
      timeoutMs: this.config.peerConnectTimeoutMs,
      retries: 2,
    });
    if (!client?.connected) return;
    const host = peer.split(":")[0];
    const port = parseInt(peer.split(":")[1], 10);
    client.emit(SocketEvents.RECONNECT, {
      port: this.config.port,
      host: this.config.advertiseHost,
    });
    client.disconnect(true);
    await this.syncClusterStateFromPeers();
  }

  async refreshStorageHealth() {
    if (!this.storageClient) {
      this.storageUp = false;
      return false;
    }
    const h = await this.storageClient.health();
    this.lastStorageCheckMs = Date.now();
    this.storageUp = !!h.ok;
    if (!this.storageUp) {
      this.logger.storage("DOWN", this.config.storageUrl);
    }
    return this.storageUp;
  }

  getPublicState() {
    return {
      host: this.config.labHostName,
      node: this.config.hostname,
      port: this.config.port,
      isCoordinator: this.isCoordinator,
      inElection: this.inElection,
      coordinatorPort: this.coordinatorPort,
      ringJoinDeferred: this.ringJoinDeferred,
      eligibleForCoordinator: this.isEligibleForCoordinatorRole(),
      storageUp: this.storageUp,
      storageUrl: this.config.storageUrl,
      simMode: this.simulationPolicy.mode,
      simulation: this.simulationPolicy.snapshot(),
      paused: this.simulationPolicy.paused,
      pendingClient: this.pendingBuffer.size,
      queueSize: this.requestQueue.size,
    };
  }

  getClusterState() {
    const leaderPort = this.coordinatorPort;
    const leaderMeta = leaderPort ? this.topology.metaForPort(leaderPort) : null;
    return {
      peers: this.topology.ipListByPort,
      peerDetails: this.topology.peerDetails(),
      coordinatorPort: this.coordinatorPort,
      leader: leaderPort
        ? {
            port: leaderPort,
            labHostName: leaderMeta?.labHostName || null,
            nodeName: leaderMeta?.nodeName || null,
          }
        : null,
      storageUrl: this.config.storageUrl,
      storageUp: this.storageUp,
      epoch: this.lastCoordinatorEpoch,
      processList: this.topology.portsInOrder,
    };
  }

  onPeerConnection(socket) {
    socket.on(SocketEvents.ELECTION_ROUND, async (data) => {
      const list = Array.isArray(data) ? data : [];
      this.logger.election(
        "ELECTION_HEARD",
        `ports=[${list.join(",")}]`
      );
      if (this.ringJoinDeferred) {
        await this.relayAlongRing(SocketEvents.ELECTION_ROUND, list);
        return;
      }
      await this.startElection(list);
    });
    socket.on(SocketEvents.COORDINATOR_ANNOUNCE, async (data) => {
      if (this.ringJoinDeferred) {
        await this.onCoordinatorMessage(data, { skipForward: true });
        await this.relayAlongRing(SocketEvents.COORDINATOR_ANNOUNCE, data);
        return;
      }
      await this.onCoordinatorMessage(data);
    });
    socket.on(SocketEvents.RECONNECT, async (data) => {
      await this.reconnect(data?.port, data?.host);
    });
    socket.on(SocketEvents.COORDINATOR_SUSPECT, async (data) => {
      if (this.ringJoinDeferred) {
        const wave = data?.wave ?? Date.now();
        if (wave === this.lastSuspectWave) return;
        this.lastSuspectWave = wave;
        await this.relayAlongRing(SocketEvents.COORDINATOR_SUSPECT, data);
        return;
      }
      await this.onCoordinatorSuspectRing(data);
    });
    socket.on(SocketEvents.LEADER_KILL_REQUEST, async (data) => {
      await this.onLeaderKillRequest(data);
    });
    if (this.isCoordinator && !this.inElection && !this.simulatedDown) {
      this.registerCoordinatorHandlers(socket);
    }
  }

  registerCoordinatorHandlers(socket) {
    if (socket.data?.txnHandlerRegistered) return;
    socket.data = { ...socket.data, txnHandlerRegistered: true };
    const handler = (requestData) => this.enqueueTransaction(requestData, socket);
    socket.on(SocketEvents.TRANSACTION_REQUEST, handler);
    socket.on(SocketEvents.LOG_REQUEST, handler);
  }

  registerCoordinatorHandlersOnAllSockets() {
    if (!this.io) return;
    for (const [, socket] of this.io.sockets.sockets) {
      this.registerCoordinatorHandlers(socket);
    }
  }

  async electSuccessor() {
    if (this.ringJoinDeferred) return null;
    if (this.successorSocket?.connected) return this.successorSocket;
    this.successorSocket = null;
    this.successorIp = null;
    const hop = await ringRelay.connectAlongRing(
      this.topology,
      this.ringConnectOptions()
    );
    if (hop.ok) {
      this.successorSocket = hop.socket;
      this.successorIp = this.topology.ipForPort(hop.port);
      return hop.socket;
    }
    this.logger.election(LogEventCodes.RING_RELAY_FAIL, "successor=none");
    if (this.isClusterElectionInitiator()) {
      this.scheduleElectionDebounced();
    }
    return null;
  }

  async getSuccessor() {
    if (this.successorSocket?.connected) return this.successorSocket;
    return this.electSuccessor();
  }

  async removeCoordinator() {
    this.coordinatorTenure.stop();
    if (this.isCoordinator) {
      this.isCoordinator = false;
      this.requestQueue.clear();
      this.logRepository = null;
    }
    this.coordinatorPort = null;
    this.coordinatorSocket = null;
    this.simulationRunner?.stop();
    if (!this.isCoordinator && !this.inElection) {
      this.simulationRunner?.start();
    }
  }

  async reconnect(announcedPort, announcedHost) {
    if (announcedPort == null || this.ringJoinDeferred) return;
    const host =
      announcedHost ||
      this.topology.ipListByPort[announcedPort] ||
      `172.25.0.${announcedPort % 3000}`;
    if (!this.topology.ipListByPort[announcedPort]) {
      this.topology.addPeer(announcedPort, host);
      this.logger.election("PEER_JOIN", `${host}:${announcedPort}`);
      await this.connectToRing();
    }
  }

  async connectToRing() {
    if (this.ringJoinDeferred) return;
    for (const address of this.topology.allPeerAddressesExceptSelf()) {
      const clientSocket = await connectPeer(address, {
        timeoutMs: this.config.peerConnectTimeoutMs,
        retries: 2,
      });
      if (clientSocket?.connected) {
        clientSocket.emit(SocketEvents.RECONNECT, {
          port: this.config.port,
          host: this.config.advertiseHost,
        });
        clientSocket.disconnect(true);
      }
    }
  }

  scheduleElectionDebounced() {
    if (this.ringJoinDeferred) return;
    if (this.electionDebounceTimer) clearTimeout(this.electionDebounceTimer);
    this.electionDebounceTimer = setTimeout(async () => {
      this.electionDebounceTimer = null;
      if (!this.inElection && !this.ringJoinDeferred) {
        await this.startElection([]);
      }
    }, this.config.electionDebounceMs);
  }

  async onCoordinatorSuspectRing(data) {
    if (this.ringJoinDeferred) return;
    const wave = data?.wave ?? Date.now();
    if (wave === this.lastSuspectWave) {
      return;
    }
    this.lastSuspectWave = wave;
    await this.onCoordinatorSuspect();
    await this.relayAlongRing(SocketEvents.COORDINATOR_SUSPECT, { wave });
  }

  async onCoordinatorSuspect() {
    await this.removeCoordinator();
    if (this.ringJoinDeferred) return;
    await this.connectToRing();
    if (this.isClusterElectionInitiator()) {
      this.scheduleElectionDebounced();
    }
  }

  async bootElectionIfLeader() {
    if (this.ringJoinDeferred) return;
    if (!this.isClusterElectionInitiator()) return;
    if (!this.isLocalPeerSetReady()) {
      setTimeout(() => this.bootElectionIfLeader(), 1000);
      return;
    }
    if (this.coordinatorPort || this.inElection) return;
    const successor = await this.getSuccessor();
    if (successor) {
      await this.startElection([]);
    } else {
      setTimeout(() => this.bootElectionIfLeader(), 2000);
    }
  }

  async forwardElectionRound(electionList) {
    if (this.ringJoinDeferred) return;
    this.logger.election(
      "ELECTION_PASS",
      `ports=[${electionList.join(",")}] defer=ineligible`
    );
    await this.relayAlongRing(SocketEvents.ELECTION_ROUND, electionList, {
      keepSocket: true,
    });
  }

  async startElection(electionList) {
    if (this.ringJoinDeferred) return;
    if (this.isCoordinator && !this.inElection) {
      return;
    }
    const list = [...electionList];
    if (
      list.length === 0 &&
      this.coordinatorPort &&
      !this.inElection &&
      this.isLocalPeerSetReady()
    ) {
      return;
    }
    for (const clientPort of list) {
      await this.reconnect(clientPort);
    }
    if (ElectionService.shouldParticipateFirstWave(this.config.port, list)) {
      await this.participateInElection(list);
      return;
    }
    const initiator = this.topology.minPort;
    if (ElectionService.shouldJoinMidRing(this.config.port, list, this.inElection)) {
      if (this.isEligibleForCoordinatorRole()) {
        const merged = [...list];
        if (!merged.includes(this.config.port)) {
          merged.push(this.config.port);
        }
        await this.participateInElection(merged);
      } else {
        await this.forwardElectionRound(list);
      }
      return;
    }
    if (
      list.includes(this.config.port) &&
      !ElectionService.isInitiatorComplete(initiator, list)
    ) {
      await this.forwardElectionRound(list);
      return;
    }
    if (
      ElectionService.isInitiatorComplete(initiator, list) &&
      this.config.port === initiator
    ) {
      await this.completeElection(list);
    }
  }

  async participateInElection(electionList) {
    if (this.ringJoinDeferred) return;
    this.inElection = true;
    this.inElectionSince = Date.now();
    await this.removeCoordinator();
    if (
      !electionList.includes(this.config.port) &&
      this.isEligibleForCoordinatorRole()
    ) {
      electionList.push(this.config.port);
    }
    this.electionList = electionList;
    const candidates = this.electionListForCoordinatorPick(electionList);
    this.logger.election("ELECTION_ROUND", `ports=[${electionList.join(",")}]`);
    if (this.topology.portsInOrder.length === 1) {
      if (candidates.length === 0) {
        this.inElection = false;
        return;
      }
      await this.completeElection(candidates);
      return;
    }
    if (this.topology.ringPortsAfterLocal().length === 0) {
      if (candidates.length === 0) {
        this.inElection = false;
        return;
      }
      await this.completeElection(candidates);
      return;
    }
    const successorPort = this.topology.successorPort();
    this.logger.election(
      "ELECTION_PASS",
      `successorPort=${successorPort} ports=[${electionList.join(",")}]`
    );
    const passed = await this.relayAlongRing(SocketEvents.ELECTION_ROUND, electionList, {
      keepSocket: false,
      settleMs: 300,
    });
    if (!passed) {
      this.inElection = false;
      if (this.isClusterElectionInitiator()) {
        this.scheduleElectionDebounced();
      }
    }
  }

  async completeElection(electionList) {
    const peerCount = this.topology.portsInOrder.length;
    const initiator = this.topology.minPort;
    if (peerCount > 1 && this.config.port !== initiator) {
      this.inElection = false;
      return;
    }
    const candidates = this.electionListForCoordinatorPick(electionList);
    if (candidates.length === 0) {
      this.inElection = false;
      this.electionList = [];
      return;
    }
    const coordinatorPort = ElectionService.pickCoordinatorPort(candidates);
    const epoch = Date.now();
    this.coordinatorPort = coordinatorPort;
    this.inElection = false;
    this.electionList = [];
    this.lastCoordinatorEpoch = epoch;
    if (this.coordinatorPort === this.config.port) {
      if (!this.isEligibleForCoordinatorRole()) {
        this.coordinatorPort = null;
        return;
      }
      this.isCoordinator = true;
      this.simulatedDown = false;
      this.ringJoinDeferred = false;
      await this.setupCoordinator();
      this.simulationRunner?.stop();
    }
    const leaderMeta = this.topology.metaForPort(coordinatorPort);
    this.logger.election(
      "COORDINATOR_ANNOUNCE",
      `port=${coordinatorPort} epoch=${epoch} labHost=${leaderMeta?.labHostName || "?"} node=${leaderMeta?.nodeName || "?"}`
    );
    this.logRingView(true);
    const payload = {
      coordinatorPort,
      epoch,
      processList: electionList,
    };
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const ok = await this.relayAlongRing(SocketEvents.COORDINATOR_ANNOUNCE, payload);
      if (ok) break;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  async onCoordinatorMessage(data, options = {}) {
    const epoch = data?.epoch ?? 0;
    if (epoch < this.lastCoordinatorEpoch) return;
    if (
      epoch === this.lastCoordinatorEpoch &&
      this.coordinatorPort != null &&
      this.coordinatorPort === data.coordinatorPort
    ) {
      return;
    }
    this.lastCoordinatorEpoch = epoch;
    this.coordinatorPort = data.coordinatorPort;
    this.inElection = false;
    this.electionList = [];
    const becameCoordinator = this.coordinatorPort === this.config.port;
    if (becameCoordinator) {
      this.isCoordinator = true;
      this.simulatedDown = false;
      await this.setupCoordinator();
      this.simulationRunner?.stop();
    } else {
      this.isCoordinator = false;
      this.simulatedDown = false;
      await this.setupRegularNode();
      this.simulationRunner?.stop();
      this.simulationRunner?.start();
      await this.resumeRingParticipationAfterLeaderKnown();
    }
    const leaderMeta = this.topology.metaForPort(this.coordinatorPort);
    this.logger.election(
      "COORDINATOR_APPLY",
      `port=${this.coordinatorPort} node=${leaderMeta?.nodeName || "?"}`
    );
    if (!options.skipForward) {
      await this.relayAlongRing(SocketEvents.COORDINATOR_ANNOUNCE, data);
    }
    await this.flushClientBuffer();
  }

  async setupCoordinator() {
    await this.refreshStorageHealth();
    const useHttp =
      this.config.useStorageHttp || !!this.config.storageUrl;
    if (useHttp) {
      if (!this.storageUp) {
        this.logger.storage("WARN", "leader_without_storage");
      }
    } else {
      this.logRepository = new SqliteLogRepository(
        this.config.databasePath,
        this.config.schemaPath
      );
      this.logRepository.open();
    }
    this.registerCoordinatorHandlersOnAllSockets();
    this.logger.write("LEADER_UP", `port=${this.config.port}`);
    this.coordinatorTenure.startIfEnabled();
  }

  async setupRegularNode() {
    if (this.isCoordinator || this.inElection || !this.coordinatorPort) return;
    const host = this.topology.connectHostForPort(this.coordinatorPort);
    if (!host) return;
    const coordinatorSocket = await connectPeer(`${host}:${this.coordinatorPort}`, {
      timeoutMs: this.config.peerConnectTimeoutMs,
      retries: this.config.peerConnectRetries,
    });
    if (coordinatorSocket?.connected) {
      this.coordinatorSocket = coordinatorSocket;
      this.logger.line(
        "FOLLOWER",
        LogEventCodes.COORD_CONNECT,
        `${host}:${this.coordinatorPort}`
      );
    }
  }

  async performRead() {
    if (!this.storageClient || !this.config.logReads) return;
    try {
      const cents = await this.storageClient.getBalance();
      this.logger.read("BALANCE", centsToMoney(cents));
    } catch {
      this.logger.read("BALANCE_FAIL", "storage_down");
    }
  }

  buildTransaction(deltaCents) {
    return {
      requestId: `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      hostName: this.config.labHostName,
      nodeName: this.config.hostname,
      nodePort: this.config.port,
      delta: centsToMoney(deltaCents),
      deltaCents,
      timestamp: Date.now(),
    };
  }

  sendSimulatedTransaction(burstIndex = 0) {
    if (this.isCoordinator || this.inElection || !this.coordinatorPort) return;
    if (this.simulationPolicy.paused || !this.simulationPolicy.txEnabled) return;
    let deltaCents;
    if (
      this.simulationPolicy.deltaMode === "fixed" &&
      this.simulationPolicy.deltaFixed != null
    ) {
      deltaCents = parseMoneyToCents(this.simulationPolicy.deltaFixed);
    } else {
      deltaCents = randomDeltaCents(
        this.simulationPolicy.deltaMin,
        this.simulationPolicy.deltaMax
      );
    }
    const tx = this.buildTransaction(deltaCents);
    tx.requestId = `sim-${this.config.port}-${++this.simSeq}-${burstIndex}`;
    this.submitTransaction(tx);
  }

  submitTransaction(tx) {
    if (this.simulationPolicy.paused && !String(tx.requestId).startsWith("ui-")) {
      return;
    }
    if (this.inElection && this.config.clientBufferOnLeaderLoss) {
      const r = this.pendingBuffer.push(tx);
      if (r.accepted) {
        this.logger.line("FOLLOWER", "TX_BUFFER", `req=${tx.requestId}`);
      }
      return;
    }
    if (!this.coordinatorSocket?.connected) {
      if (this.config.clientBufferOnLeaderLoss) {
        this.pendingBuffer.push(tx);
      }
      return;
    }
    this.emitTransaction(tx);
  }

  async emitTransaction(tx) {
    if (!this.coordinatorSocket?.connected) {
      if (this.config.clientBufferOnLeaderLoss) {
        this.pendingBuffer.push(tx);
      }
      return;
    }
    this.logger.line(
      "FOLLOWER",
      "TX_SEND",
      `delta=${tx.delta} req=${tx.requestId}`
    );
    await this.logger.drainTimeline();
    const responseEvent = transactionResponseEvent(tx.requestId);
    const socket = this.coordinatorSocket;
    if (!socket?.connected) {
      if (this.config.clientBufferOnLeaderLoss) {
        this.pendingBuffer.push(tx);
      }
      return;
    }
    const timeout = setTimeout(() => {
      socket?.off(responseEvent);
      this.logger.line("FOLLOWER", "TX_TIMEOUT", `req=${tx.requestId}`);
      if (this.config.clientBufferOnLeaderLoss) {
        this.pendingBuffer.push(tx);
      }
      const wave = Date.now();
      socket?.emit(SocketEvents.COORDINATOR_SUSPECT, { wave });
      this.scheduleElectionDebounced();
    }, this.config.requestTimeoutMs);
    socket.once(responseEvent, async (response) => {
      clearTimeout(timeout);
      const status = response?.status || "?";
      this.logger.line("FOLLOWER", "TX_ACK", `req=${tx.requestId} status=${status}`);
      await this.logger.drainTimeline();
    });
    socket.emit(SocketEvents.TRANSACTION_REQUEST, tx);
  }

  async flushClientBuffer() {
    if (!this.coordinatorSocket?.connected) {
      await this.setupRegularNode();
    }
    if (!this.coordinatorSocket?.connected) {
      return;
    }
    const items = this.pendingBuffer.drain();
    for (const tx of items) {
      await this.emitTransaction(tx);
    }
  }

  enqueueTransaction(requestData, socket) {
    if (this.simulationPolicy.paused) {
      socket.emit(transactionResponseEvent(requestData.requestId), {
        status: "Rejected",
        reason: "node_paused",
      });
      return;
    }
    if (this.simulatedDown) {
      socket.emit(transactionResponseEvent(requestData.requestId), {
        status: "Rejected",
        reason: "leader_simulated_down",
      });
      return;
    }
    const pos = this.requestQueue.size + 1;
    const result = this.requestQueue.tryEnqueue({ requestData, socket });
    if (!result.accepted) {
      socket.emit(transactionResponseEvent(requestData.requestId), {
        status: "Rejected",
        reason: result.reason,
      });
      return;
    }
    this.txStoryLogger.onEnqueue(
      requestData,
      pos,
      this.requestQueue.size
    );
    this.logger.queue(
      "TX_ENQUEUE",
      `req=${requestData.requestId}`,
      pos,
      this.requestQueue.size
    );
    if (!this.requestQueue.isProcessing) this.processNextInQueue();
  }

  processNextInQueue() {
    const item = this.requestQueue.dequeue();
    if (!item) {
      this.requestQueue.setProcessing(false);
      return;
    }
    this.requestQueue.setProcessing(true);
    const total = this.requestQueue.size + 1;
    this.logger.queue("TX_DEQUEUE", `req=${item.requestData.requestId}`, 1, total);
    this.processRequest(item.requestData, item.socket, total);
  }

  async processRequest(request, socket, queueTotal) {
    try {
      let deltaCents = request.deltaCents;
      if (deltaCents == null && request.delta != null) {
        deltaCents = parseMoneyToCents(request.delta);
      }
      if (!isValidTransactionDelta(centsToMoney(deltaCents))) {
        throw new Error("delta_invalid");
      }
      if (this.config.useStorageHttp) {
        await this.refreshStorageHealth();
        if (!this.storageUp) {
          this.logger.storage(
            "DEFER",
            `req=${request.requestId} reason=storage_down`
          );
          this.txStoryLogger.onAcceptedWithoutStorage(request);
          await this.logger.drainTimeline();
          socket.emit(transactionResponseEvent(request.requestId), {
            status: "Accepted",
            reason: "storage_down",
            persisted: false,
          });
          return;
        }
        const result = await this.storageClient.applyTransaction({
          requestId: request.requestId,
          hostName: request.hostName || request.hostname,
          nodeName: request.nodeName || request.hostname,
          nodePort: request.nodePort || this.config.port,
          deltaCents,
        });
        const entry = result.entry;
        this.txStoryLogger.onSuccess(request, entry.balance_after_cents);
        this.logger.write(
          "TX_APPLY",
          `balance=${centsToMoney(entry.balance_after_cents)} req=${request.requestId}`,
          { queue: `1/${queueTotal}` }
        );
        this.logger.write(
          "TX_STORAGE",
          `req=${request.requestId} status=200 balance_after=${centsToMoney(entry.balance_after_cents)}`
        );
        await this.logger.drainTimeline();
        socket.emit(transactionResponseEvent(request.requestId), {
          status: "Success",
          data: entry,
        });
      } else if (this.logRepository) {
        const row = this.logRepository.append({
          hostname: request.nodeName || request.hostname,
          timestampMs: request.timestamp || Date.now(),
          requestId: request.requestId,
        });
        socket.emit(transactionResponseEvent(request.requestId), {
          status: "Success",
          data: row,
        });
      } else {
        throw new Error("no_repository");
      }
    } catch (err) {
      socket.emit(transactionResponseEvent(request.requestId), {
        status: "Failure",
        error: err.message,
      });
      this.txStoryLogger.onFailure(request, err.message);
      this.logger.write("TX_FAIL", `req=${request.requestId} err=${err.message}`);
    } finally {
      this.requestQueue.setProcessing(false);
      this.processNextInQueue();
    }
  }

  async onLeaderKillRequest(data) {
    const epoch = data?.killEpoch;
    if (epoch != null && epoch === this.lastProcessedKillEpoch) {
      return;
    }
    if (this.inElection) {
      this.logger.sim("KILL_REJECT", "election_in_progress");
      return;
    }
    await this.refreshStorageHealth();
    const selfTenure = data?.reason === "leader-tenure";
    if (!this.storageUp && !selfTenure) {
      this.logger.sim("KILL_REJECT", "storage_down");
      return;
    }
    const initiator = `${data?.initiatorHost || "?"}:${data?.initiatorNode || "?"}`;
    if (this.isCoordinator && this.coordinatorPort === this.config.port) {
      if (epoch != null) this.lastProcessedKillEpoch = epoch;
      this.logger.sim("KILL_REQUEST", initiator);
      this.simulatedDown = true;
      this.isCoordinator = false;
      this.requestQueue.clear();
      if (this.storageClient) {
        try {
          await this.storageClient.appendAdmin({
            requestId: `kill-${Date.now()}`,
            hostName: data?.initiatorHost,
            nodeName: data?.initiatorNode,
            message: `leader_kill ${initiator}`,
          });
        } catch {
          /* ignore */
        }
      }
      this.logger.sim("LEADER_DOWN", "simulated");
      this.coordinatorCooldownUntil =
        Date.now() + (this.config.leaderCooldownMs || 25_000);
      const wave = epoch ?? Date.now();
      this.lastSuspectWave = wave;
      await this.removeCoordinator();
      const successorBeforeDefer = await this.getSuccessor();
      if (successorBeforeDefer) {
        successorBeforeDefer.emit(SocketEvents.COORDINATOR_SUSPECT, { wave });
      }
      this.beginExLeaderRecovery();
      return;
    }
    if (epoch != null) this.lastProcessedKillEpoch = epoch;
    const successor = await this.getSuccessor();
    if (successor) {
      successor.emit(SocketEvents.LEADER_KILL_REQUEST, data);
    }
  }

  async requestLeaderSelfResignation(reason) {
    if (!this.isCoordinator || this.inElection) return;
    await this.onLeaderKillRequest({
      initiatorHost: this.config.labHostName,
      initiatorNode: this.config.hostname,
      reason,
      killEpoch: Date.now(),
    });
  }

  requestLeaderKill(reason) {
    if (this.inElection) return;
    const payload = {
      initiatorHost: this.config.labHostName,
      initiatorNode: this.config.hostname,
      reason,
      killEpoch: Date.now(),
    };
    this.getSuccessor().then((s) => {
      if (s) {
        s.emit(SocketEvents.LEADER_KILL_REQUEST, payload);
        return;
      }
      this.onLeaderKillRequest(payload);
    });
  }
}

module.exports = { NodeApplication };
