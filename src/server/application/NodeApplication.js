const http = require("http");
const socketIo = require("socket.io");
const { RingTopology } = require("../domain/ring/RingTopology");
const { ElectionService } = require("../domain/election/ElectionService");
const { RequestQueue } = require("../domain/coordinator/RequestQueue");
const { PendingTransactionBuffer } = require("../domain/coordinator/PendingTransactionBuffer");
const { connectPeer } = require("../infrastructure/socket/SocketPeerClient");
const { SqliteLogRepository } = require("../infrastructure/persistence/SqliteLogRepository");
const { StorageHttpClient } = require("../infrastructure/storage/StorageHttpClient");
const { LabLogger } = require("../infrastructure/logging/LabLogger");
const { SimulationRunner } = require("./SimulationRunner");
const { SimulationPolicy } = require("./SimulationPolicy");
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
    this.simulationPolicy = SimulationPolicy.fromConfig(config);
    this.discoveryCoordinator = null;
    this.storageMonitor = null;
    this.readTimer = null;
    this.ringViewTimer = null;
    this.lastStorageCheckMs = null;
    this.simSeq = 0;
    this.nodeHttp = null;
    this.timelineStdoutPoller = null;
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
    await this.bootElectionIfLeader();
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
  }

  async onDiscoveryUpdate(peers, storageRecord) {
    if (storageRecord?.host && !this.config.storageUrl) {
      const url = `http://${storageRecord.host}:${storageRecord.port || 4000}`;
      this.config.storageUrl = url.replace(/\/$/, "");
      if (!this.storageClient) {
        this.storageClient = new StorageHttpClient(
          this.config.storageUrl,
          this.config.storageWriteToken
        );
      }
      await this.refreshStorageHealth();
    }
    const changed = this.topology.mergeDiscoveredPeers(peers);
    if (changed) {
      this.logger.election("PEERS_MERGE", `count=${this.topology.portsInOrder.length}`);
      if (this.successorSocket?.connected) {
        this.successorSocket.disconnect(true);
      }
      this.successorSocket = null;
      await this.syncClusterStateFromPeers();
      if (this.config.port === this.topology.minPort) {
        this.scheduleElectionDebounced();
      }
    }
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
      const state = await this.fetchClusterState(detail.host, httpPort);
      if (!state?.coordinatorPort) continue;
      const epoch = state.epoch || 0;
      if (epoch > this.lastCoordinatorEpoch) {
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
      await this.startElection(list);
    });
    socket.on(SocketEvents.COORDINATOR_ANNOUNCE, async (data) => {
      await this.onCoordinatorMessage(data);
    });
    socket.on(SocketEvents.RECONNECT, async (data) => {
      await this.reconnect(data?.port, data?.host);
    });
    socket.on(SocketEvents.COORDINATOR_SUSPECT, async () => {
      if (this.isCoordinator) await this.onCoordinatorSuspect();
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
    if (this.successorSocket?.connected) {
      this.successorSocket.disconnect(true);
    }
    this.successorSocket = null;
    this.successorIp = null;
    const successorPort = this.topology.successorPort();
    if (!successorPort) return null;
    const address = this.topology.peerAddressForPort(successorPort);
    const socket = await connectPeer(address, {
      timeoutMs: this.config.peerConnectTimeoutMs,
      retries: this.config.peerConnectRetries,
    });
    if (socket?.connected) {
      this.successorIp = this.topology.ipForPort(successorPort);
      this.successorSocket = socket;
      return socket;
    }
    return null;
  }

  async getSuccessor() {
    if (this.successorSocket?.connected) return this.successorSocket;
    return this.electSuccessor();
  }

  async removeCoordinator() {
    if (this.isCoordinator) {
      this.isCoordinator = false;
      this.requestQueue.clear();
      this.logRepository = null;
    }
    this.coordinatorPort = null;
    this.coordinatorSocket = null;
    this.simulationRunner?.stop();
    if (!this.isCoordinator) {
      this.simulationRunner?.start();
    }
  }

  async reconnect(announcedPort, announcedHost) {
    if (announcedPort == null) return;
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
    if (this.electionDebounceTimer) clearTimeout(this.electionDebounceTimer);
    this.electionDebounceTimer = setTimeout(async () => {
      this.electionDebounceTimer = null;
      if (!this.inElection) await this.startElection([]);
    }, this.config.electionDebounceMs);
  }

  async onCoordinatorSuspect() {
    await this.removeCoordinator();
    await this.connectToRing();
    this.scheduleElectionDebounced();
  }

  async bootElectionIfLeader() {
    if (this.config.port !== this.topology.minPort) return;
    const successor = await this.getSuccessor();
    if (successor) {
      await this.startElection([]);
    } else {
      setTimeout(() => this.bootElectionIfLeader(), 2000);
    }
  }

  async startElection(electionList) {
    for (const clientPort of electionList) {
      await this.reconnect(clientPort);
    }
    const list = [...electionList];
    if (ElectionService.shouldParticipateFirstWave(this.config.port, list)) {
      await this.participateInElection(list);
      return;
    }
    if (
      ElectionService.shouldRestartElection(
        this.config.port,
        list,
        this.inElection
      )
    ) {
      await this.participateInElection([this.config.port]);
      return;
    }
    if (ElectionService.isInitiatorComplete(this.config.port, list)) {
      await this.completeElection(list);
    }
  }

  async participateInElection(electionList) {
    this.inElection = true;
    await this.removeCoordinator();
    const successorSocket = await this.getSuccessor();
    if (!electionList.includes(this.config.port)) {
      electionList.push(this.config.port);
    }
    this.electionList = electionList;
    this.logger.election("ELECTION_ROUND", `ports=[${electionList.join(",")}]`);
    if (successorSocket) {
      const successorPort = this.topology.successorPort();
      this.logger.election(
        "ELECTION_PASS",
        `successorPort=${successorPort} ports=[${electionList.join(",")}]`
      );
      successorSocket.emit(SocketEvents.ELECTION_ROUND, electionList);
    } else {
      this.scheduleElectionDebounced();
    }
  }

  async completeElection(electionList) {
    const coordinatorPort = ElectionService.pickCoordinatorPort(electionList);
    const epoch = Date.now();
    this.coordinatorPort = coordinatorPort;
    this.inElection = false;
    this.electionList = [];
    this.lastCoordinatorEpoch = epoch;
    if (this.coordinatorPort === this.config.port) {
      this.isCoordinator = true;
      this.simulatedDown = false;
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
    const successorSocket = await this.getSuccessor();
    if (successorSocket) {
      successorSocket.emit(SocketEvents.COORDINATOR_ANNOUNCE, payload);
    }
  }

  async onCoordinatorMessage(data, options = {}) {
    const epoch = data?.epoch ?? 0;
    if (epoch <= this.lastCoordinatorEpoch) return;
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
      await this.setupRegularNode();
      this.simulationRunner?.start();
    }
    const leaderMeta = this.topology.metaForPort(this.coordinatorPort);
    this.logger.election(
      "COORDINATOR_APPLY",
      `port=${this.coordinatorPort} node=${leaderMeta?.nodeName || "?"}`
    );
    if (!options.skipForward) {
      const successorSocket = await this.getSuccessor();
      if (successorSocket) {
        successorSocket.emit(SocketEvents.COORDINATOR_ANNOUNCE, data);
      }
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
  }

  async setupRegularNode() {
    if (this.isCoordinator || this.inElection || !this.coordinatorPort) return;
    const host = this.topology.hostForCoordinator(this.coordinatorPort);
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
    if (this.isCoordinator || this.inElection) return;
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
    this.logger.line(
      "FOLLOWER",
      "TX_SEND",
      `delta=${tx.delta} req=${tx.requestId}`
    );
    await this.logger.drainTimeline();
    const responseEvent = transactionResponseEvent(tx.requestId);
    const timeout = setTimeout(() => {
      this.coordinatorSocket.off(responseEvent);
      this.logger.line("FOLLOWER", "TX_TIMEOUT", `req=${tx.requestId}`);
      if (this.config.clientBufferOnLeaderLoss) {
        this.pendingBuffer.push(tx);
      }
      this.coordinatorSocket.emit(SocketEvents.COORDINATOR_SUSPECT);
      this.scheduleElectionDebounced();
    }, this.config.requestTimeoutMs);
    this.coordinatorSocket.once(responseEvent, async (response) => {
      clearTimeout(timeout);
      const status = response?.status || "?";
      this.logger.line("FOLLOWER", "TX_ACK", `req=${tx.requestId} status=${status}`);
      await this.logger.drainTimeline();
    });
    this.coordinatorSocket.emit(SocketEvents.TRANSACTION_REQUEST, tx);
  }

  async flushClientBuffer() {
    if (!this.coordinatorSocket?.connected) {
      await this.setupRegularNode();
    }
    const items = this.pendingBuffer.drain();
    for (const tx of items) {
      this.emitTransaction(tx);
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
    if (this.config.useStorageHttp && !this.storageUp) {
      if (this.config.discardOnStorageDown) {
        socket.emit(transactionResponseEvent(requestData.requestId), {
          status: "Rejected",
          reason: "storage_down",
        });
        this.logger.storage("DISCARD", `req=${requestData.requestId} reason=storage_down`);
        return;
      }
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
        if (!this.storageUp) throw new Error("storage_down");
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
    if (this.inElection) {
      this.logger.sim("KILL_REJECT", "election_in_progress");
      return;
    }
    await this.refreshStorageHealth();
    if (!this.storageUp) {
      this.logger.sim("KILL_REJECT", "storage_down");
      return;
    }
    const initiator = `${data?.initiatorHost || "?"}:${data?.initiatorNode || "?"}`;
    this.logger.sim("KILL_REQUEST", initiator);
    if (this.isCoordinator && this.coordinatorPort === this.config.port) {
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
      await this.onCoordinatorSuspect();
      return;
    }
    const successor = await this.getSuccessor();
    if (successor) {
      successor.emit(SocketEvents.LEADER_KILL_REQUEST, data);
    }
  }

  requestLeaderKill(reason) {
    if (this.inElection) return;
    const payload = {
      initiatorHost: this.config.labHostName,
      initiatorNode: this.config.hostname,
      reason,
      killEpoch: Date.now(),
    };
    this.onLeaderKillRequest(payload);
    this.getSuccessor().then((s) => {
      if (s) s.emit(SocketEvents.LEADER_KILL_REQUEST, payload);
    });
  }
}

module.exports = { NodeApplication };
