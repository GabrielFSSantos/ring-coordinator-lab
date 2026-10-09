#!/usr/bin/env node
/**
 * Aceite E2E por fases: dois ciclos de líder alternando (kill via API).
 */
import { setTimeout as sleep } from "node:timers/promises";

const NODE_PORTS = (process.env.NODE_PORTS || "3002,3003,3004,3005")
  .split(",")
  .map((p) => parseInt(p.trim(), 10))
  .filter(Boolean);
const HTTP_OFFSET = parseInt(process.env.NODE_HTTP_PORT_OFFSET || "1000", 10);
const STORAGE_URL = process.env.STORAGE_URL || "http://127.0.0.1:4000";
const MIN_TX = parseInt(process.env.MIN_TX || "3", 10);
const PHASE_TIMEOUT_MS = parseInt(process.env.PHASE_TIMEOUT_SEC || "90", 10) * 1000;
const POLL_MS = parseInt(process.env.POLL_MS || "2000", 10);
const COOLDOWN_WAIT_MS = parseInt(
  process.env.LEADER_COOLDOWN_MS || "25000",
  10
) + 5000;

const ctx = {
  leaderA: null,
  leaderB: null,
  /** Cursor no ledger (poucas entradas); timeline global tem milhões de PEERS_MERGE. */
  ledgerAfterId: 0,
  txCountAccum: 0,
  txPhasePrimed: false,
};

function ringPort(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const stableTracker = { port: null, count: 0 };

function resetStableTracker() {
  stableTracker.port = null;
  stableTracker.count = 0;
}

async function tickStableConsensus(expectedPort, needed = 2) {
  const coord = consensusCoordinator(await readAllStates());
  if (coord !== expectedPort || coord == null) {
    resetStableTracker();
    return false;
  }
  if (stableTracker.port === coord) {
    stableTracker.count += 1;
  } else {
    stableTracker.port = coord;
    stableTracker.count = 1;
  }
  return stableTracker.count >= needed;
}

async function tickAnyStableConsensus(needed = 2) {
  const coord = consensusCoordinator(await readAllStates());
  if (coord == null) {
    resetStableTracker();
    return false;
  }
  if (stableTracker.port === coord) {
    stableTracker.count += 1;
  } else {
    stableTracker.port = coord;
    stableTracker.count = 1;
  }
  return stableTracker.count >= needed;
}

function nodeHttp(ringPort) {
  return `http://127.0.0.1:${ringPort + HTTP_OFFSET}`;
}

function alternateLeader(leaderA) {
  const sorted = [...NODE_PORTS].sort((a, b) => b - a);
  const next = sorted.find((p) => p !== leaderA);
  return next ?? null;
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchHealth(ringPort) {
  const data = await fetchJson(`${nodeHttp(ringPort)}/v1/health`);
  return data?.ok === true;
}

async function fetchState(ringPort) {
  return fetchJson(`${nodeHttp(ringPort)}/v1/state`);
}

async function fetchCluster(ringPort) {
  return fetchJson(`${nodeHttp(ringPort)}/v1/cluster/state`);
}

async function readAllStates() {
  const out = {};
  for (const p of NODE_PORTS) {
    out[p] = await fetchState(p);
  }
  return out;
}

function consensusCoordinator(states) {
  const ports = NODE_PORTS.map((p) => ringPort(states[p]?.coordinatorPort)).filter(
    (c) => c != null
  );
  if (ports.length !== NODE_PORTS.length) return null;
  const first = ports[0];
  return ports.every((c) => c === first) ? first : null;
}

async function waitStableConsensus(
  expectedPort = null,
  stablePolls = 2,
  deadlineMs = PHASE_TIMEOUT_MS
) {
  const deadline = Date.now() + deadlineMs;
  let stable = 0;
  while (Date.now() < deadline) {
    const states = await readAllStates();
    const coord = consensusCoordinator(states);
    if (coord == null) {
      stable = 0;
      await sleep(POLL_MS);
      continue;
    }
    if (expectedPort != null && coord !== expectedPort) {
      stable = 0;
      await sleep(POLL_MS);
      continue;
    }
    stable += 1;
    if (stable >= stablePolls) {
      return coord;
    }
    await sleep(POLL_MS);
  }
  return null;
}

function isLedgerTxnEntry(entry) {
  return String(entry?.entry_type ?? entry?.entryType ?? "").toLowerCase() === "txn";
}

/** Avança o cursor até o fim do ledger sem contar TX (baseline antes da fase). */
async function seekLedgerToHead() {
  const limit = 20_000;
  let after = ctx.ledgerAfterId;
  const started = Date.now();
  for (let guard = 0; guard < 50; guard += 1) {
    if (Date.now() - started > 20_000) break;
    const data = await fetchJson(
      `${STORAGE_URL}/v1/ledger?limit=${limit}&afterId=${after}`
    );
    const entries = data?.entries || [];
    if (!entries.length) break;
    const last = entries[entries.length - 1];
    const next = last?.id ?? after;
    if (next <= after) break;
    after = next;
    if (entries.length < limit) break;
  }
  ctx.ledgerAfterId = after;
}

async function pullLedgerTxns() {
  const url = `${STORAGE_URL}/v1/ledger?limit=500&afterId=${ctx.ledgerAfterId}`;
  const data = await fetchJson(url);
  const entries = data?.entries || [];
  let maxId = ctx.ledgerAfterId;
  let txCount = 0;
  for (const e of entries) {
    const id = e.id ?? 0;
    if (id > maxId) maxId = id;
    if (isLedgerTxnEntry(e)) txCount += 1;
  }
  ctx.ledgerAfterId = maxId;
  return { txCount, batch: entries.length };
}

async function nudgeTransactions() {
  const leader = ringPort(consensusCoordinator(await readAllStates()));
  const target =
    NODE_PORTS.find((p) => ringPort(p) !== leader) ?? NODE_PORTS[0];
  await fetchJson(`${nodeHttp(target)}/v1/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta: "1.00" }),
  });
}

function resetTxPhaseCounter() {
  ctx.txCountAccum = 0;
  ctx.txPhasePrimed = false;
}

/**
 * Conta TX novas no ledger com o líder esperado.
 * Sem `windowMs`: uma iteração (timeout no waitPhase).
 * Com `windowMs`: loop interno (fase final antes do cooldown do ex-líder A).
 */
async function countTxWhileLeader(leaderPort, minCount, windowMs = null) {
  const expected = ringPort(leaderPort);
  const runOnce = async () => {
    const coord = ringPort(consensusCoordinator(await readAllStates()));
    if (expected == null || coord !== expected) {
      return false;
    }
    if (!ctx.txPhasePrimed) {
      await seekLedgerToHead();
      ctx.txPhasePrimed = true;
    }
    await nudgeTransactions();
    const { txCount } = await pullLedgerTxns();
    ctx.txCountAccum += txCount;
    return true;
  };

  if (windowMs != null) {
    const deadline = Date.now() + windowMs;
    while (Date.now() < deadline) {
      await runOnce();
      if (ctx.txCountAccum >= minCount) break;
      await sleep(POLL_MS);
    }
    return ctx.txCountAccum;
  }

  await runOnce();
  return ctx.txCountAccum;
}

async function killLeader(ringPort) {
  const res = await fetch(`${nodeHttp(ringPort)}/v1/control/leader-kill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  }).catch(() => null);
  return res?.status === 202 || res?.status === 200;
}

async function dumpClusterDiag() {
  console.log("\n--- diagnóstico cluster ---");
  for (const p of NODE_PORTS) {
    const st = await fetchState(p);
    if (!st) {
      console.log(`  ${p}: (sem resposta HTTP)`);
      continue;
    }
    console.log(
      `  ${p}: coord=${st.coordinatorPort} isCoord=${st.isCoordinator} inEl=${st.inElection} defer=${st.ringJoinDeferred} eligible=${st.eligibleForCoordinator}`
    );
  }
  const coord = consensusCoordinator(await readAllStates());
  console.log(`  consenso coordinatorPort=${coord ?? "DIVIDIDO"}`);
}

async function waitPhase(name, fn) {
  const start = Date.now();
  process.stdout.write(`… ${name}`);
  const deadline = start + PHASE_TIMEOUT_MS;
  let lastErr = "timeout";
  let lastDiag = 0;
  while (Date.now() < deadline) {
    try {
      const ok = await fn();
      if (ok) {
        const sec = ((Date.now() - start) / 1000).toFixed(1);
        console.log(` [OK] (${sec}s)`);
        return true;
      }
    } catch (err) {
      lastErr = err?.message || String(err);
    }
    const now = Date.now();
    if (now - lastDiag > 20_000) {
      lastDiag = now;
      await dumpClusterDiag();
    }
    await sleep(POLL_MS);
  }
  console.log(` [FALHA] ${lastErr}`);
  await dumpClusterDiag();
  return false;
}

const phases = [
  {
    name: "start_cluster_ready",
    run: async () => {
      const storageOk = await fetchJson(`${STORAGE_URL}/v1/health`);
      if (!storageOk?.ok) return false;
      for (const p of NODE_PORTS) {
        if (!(await fetchHealth(p))) return false;
      }
      const cluster = await fetchCluster(NODE_PORTS[0]);
      const peers = cluster?.peerDetails?.length ?? Object.keys(cluster?.peers || {}).length;
      return peers >= NODE_PORTS.length;
    },
  },
  {
    name: "elect_leader_a",
    run: async () => {
      if (!(await tickAnyStableConsensus())) return false;
      ctx.leaderA = ringPort(stableTracker.port);
      ctx.leaderB = alternateLeader(ctx.leaderA);
      return ctx.leaderB != null;
    },
  },
  {
    name: "transactions_under_a",
    run: async () => {
      const n = await countTxWhileLeader(ctx.leaderA, MIN_TX);
      if (process.env.LAB_ACCEPTANCE_DEBUG === "1") {
        console.error(
          `[debug] transactions_under_a leaderA=${ctx.leaderA} accum=${n} ledgerAfter=${ctx.ledgerAfterId}`
        );
      }
      return n >= MIN_TX;
    },
  },
  {
    name: "leader_a_down",
    run: async () => {
      if (!(await killLeader(ctx.leaderA))) return false;
      const deadline = Date.now() + PHASE_TIMEOUT_MS;
      while (Date.now() < deadline) {
        const st = await fetchState(ctx.leaderA);
        if (st && !st.isCoordinator) return true;
        await sleep(POLL_MS);
      }
      return false;
    },
  },
  {
    name: "ex_leader_deferred",
    run: async () => {
      const st = await fetchState(ctx.leaderA);
      return st?.ringJoinDeferred === true && st?.eligibleForCoordinator === false;
    },
  },
  {
    name: "elect_leader_b",
    run: async () => (await waitStableConsensus(ctx.leaderB)) != null,
  },
  {
    name: "ex_leader_rejoin_participant",
    run: async () => {
      const st = await fetchState(ctx.leaderA);
      return (
        st?.ringJoinDeferred === false &&
        st?.isCoordinator === false &&
        st?.coordinatorPort === ctx.leaderB
      );
    },
  },
  {
    name: "transactions_all_nodes_b",
    run: async () => {
      const n = await countTxWhileLeader(ctx.leaderB, MIN_TX);
      if (process.env.LAB_ACCEPTANCE_DEBUG === "1") {
        console.error(
          `[debug] transactions_all_nodes_b leaderB=${ctx.leaderB} accum=${n} ledgerAfter=${ctx.ledgerAfterId}`
        );
      }
      return n >= MIN_TX;
    },
  },
  {
    name: "leader_b_down",
    run: async () => {
      if (!(await killLeader(ctx.leaderB))) return false;
      const deadline = Date.now() + PHASE_TIMEOUT_MS;
      while (Date.now() < deadline) {
        const st = await fetchState(ctx.leaderB);
        if (st && !st.isCoordinator) return true;
        await sleep(POLL_MS);
      }
      return false;
    },
  },
  {
    name: "wait_leader_a_eligible",
    run: async () => {
      const deadline = Date.now() + COOLDOWN_WAIT_MS;
      while (Date.now() < deadline) {
        const st = await fetchState(ctx.leaderA);
        if (st?.eligibleForCoordinator === true) return true;
        await sleep(POLL_MS);
      }
      return false;
    },
  },
  {
    name: "elect_leader_a_again",
    run: async () => {
      const want = ringPort(ctx.leaderA);
      let coord = ringPort(consensusCoordinator(await readAllStates()));
      if (coord != null && want != null && coord !== want) {
        await killLeader(coord);
        await sleep(POLL_MS * 2);
      }
      return (await waitStableConsensus(ctx.leaderA)) != null;
    },
  },
  {
    name: "ex_leader_b_rejoin",
    run: async () => {
      const st = await fetchState(ctx.leaderB);
      return (
        st?.ringJoinDeferred === false &&
        st?.isCoordinator === false &&
        st?.coordinatorPort === ctx.leaderA
      );
    },
  },
  {
    name: "transactions_under_a_again",
    run: async () => {
      const n = await countTxWhileLeader(ctx.leaderA, MIN_TX);
      if (process.env.LAB_ACCEPTANCE_DEBUG === "1") {
        console.error(
          `[debug] transactions_under_a_again leaderA=${ctx.leaderA} accum=${n} ledgerAfter=${ctx.ledgerAfterId}`
        );
      }
      return n >= MIN_TX;
    },
  },
  {
    name: "leader_a_down_again",
    run: async () => {
      if (!(await killLeader(ctx.leaderA))) return false;
      const deadline = Date.now() + PHASE_TIMEOUT_MS;
      while (Date.now() < deadline) {
        const st = await fetchState(ctx.leaderA);
        if (st && !st.isCoordinator) return true;
        await sleep(POLL_MS);
      }
      return false;
    },
  },
  {
    name: "elect_leader_b_again",
    run: async () => {
      const want = ringPort(ctx.leaderB);
      let coord = ringPort(consensusCoordinator(await readAllStates()));
      if (coord != null && want != null && coord !== want) {
        await killLeader(coord);
        await sleep(POLL_MS * 2);
      }
      return (await waitStableConsensus(ctx.leaderB)) != null;
    },
  },
  {
    name: "ex_leader_a_rejoin",
    run: async () => {
      const st = await fetchState(ctx.leaderA);
      return (
        st?.ringJoinDeferred === false &&
        st?.isCoordinator === false &&
        st?.coordinatorPort === ctx.leaderB
      );
    },
  },
  {
    name: "transactions_final",
    run: async () => {
      const cooldownMs = parseInt(process.env.LEADER_COOLDOWN_MS || "25000", 10);
      const windowMs = Math.max(15_000, cooldownMs - 8_000);
      const n = await countTxWhileLeader(ctx.leaderB, MIN_TX, windowMs);
      if (process.env.LAB_ACCEPTANCE_DEBUG === "1") {
        console.error(
          `[debug] transactions_final leaderB=${ctx.leaderB} accum=${n} windowMs=${windowMs}`
        );
      }
      return n >= MIN_TX;
    },
  },
];

async function main() {
  console.log("==> lab-acceptance-checklist");
  console.log(`    nós=${NODE_PORTS.join(",")} MIN_TX=${MIN_TX} fase=${PHASE_TIMEOUT_MS / 1000}s`);

  const failed = [];
  let lastPhaseName = "";
  for (const phase of phases) {
    if (phase.name !== lastPhaseName) {
      resetStableTracker();
      resetTxPhaseCounter();
      lastPhaseName = phase.name;
    }
    const ok = await waitPhase(phase.name, phase.run);
    if (!ok) {
      failed.push(phase.name);
      break;
    }
  }

  console.log("");
  if (failed.length === 0) {
    console.log(`==> CHECKLIST OK (leaderA=${ctx.leaderA} leaderB=${ctx.leaderB})`);
    process.exit(0);
  }
  console.log("==> CHECKLIST FALHOU");
  console.log(`    fases: ${failed.join(", ")}`);
  process.exit(1);
}

main();
