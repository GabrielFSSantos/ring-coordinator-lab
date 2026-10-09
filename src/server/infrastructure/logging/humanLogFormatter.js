const { LogEventCodes } = require("./logEventCodes");
const { wrapInBox } = require("./logBoxRenderer");
const {
  friendlyNodeName,
  friendlyPeerLabel,
  boxTitle,
} = require("./friendlyNames");

const ROLE_LABELS = {
  LEADER: "coordenador",
  FOLLOWER: "participante",
  ELECTION: "eleição",
  STORAGE: "banco",
  SIM: "simulação",
  BOOT: "início",
};

function parseDetail(detail) {
  const out = {};
  if (!detail || typeof detail !== "string") return out;
  const parts = detail.trim().split(/\s+/);
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq > 0) {
      out[part.slice(0, eq)] = part.slice(eq + 1);
    }
  }
  return out;
}

function formatMoneyBr(deltaStr) {
  if (!deltaStr || deltaStr === "?") return deltaStr;
  const n = parseFloat(deltaStr);
  if (Number.isNaN(n)) return deltaStr;
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n).toFixed(2).replace(".", ",");
  return `${sign}R$ ${abs}`;
}

function messageForEvent(eventCode, detail, extra = {}, context = {}) {
  const kv = parseDetail(detail);
  const logDetail = extra.logDetail === true;

  switch (eventCode) {
    case LogEventCodes.ELECTION_ROUND: {
      const ports = kv.ports ? kv.ports.replace(/^\[|\]$/g, "") : "";
      return [
        ports
          ? `Estamos escolhendo quem vai coordenar o grupo (portas ${ports}…).`
          : "Estamos escolhendo quem vai coordenar o grupo.",
      ];
    }
    case LogEventCodes.ELECTION_HEARD: {
      const ports = kv.ports ? kv.ports.replace(/^\[|\]$/g, "") : "";
      return [
        ports
          ? `Recebeu a rodada de eleição do anel (portas ${ports}…).`
          : "Recebeu a rodada de eleição do anel.",
      ];
    }
    case LogEventCodes.ELECTION_PASS: {
      const ports = kv.ports ? kv.ports.replace(/^\[|\]$/g, "") : "";
      const next = kv.successorPort || "?";
      return [
        ports
          ? `Repassei a rodada ao próximo nó (porta ${next}; lista ${ports}…).`
          : `Repassei a rodada ao próximo nó (porta ${next}).`,
      ];
    }
    case LogEventCodes.COORDINATOR_ANNOUNCE: {
      const leader = kv.node || friendlyNodeName(null, parseInt(kv.port, 10));
      const lines = [`Ficou definido: ${leader} coordena o grupo.`];
      if (logDetail && kv.epoch) lines.push(`Referência interna: ${kv.epoch}`);
      return lines;
    }
    case LogEventCodes.COORDINATOR_APPLY: {
      const leader =
        kv.node || friendlyNodeName(null, parseInt(kv.port, 10));
      return [`Este computador aceitou que ${leader} coordena.`];
    }
    case LogEventCodes.COORD_CONNECT:
      return [`Conectado ao coordenador em ${detail}.`];
    case LogEventCodes.PEERS_MERGE:
      return [`Lista de máquinas do grupo atualizada (${kv.count || "?"} no total).`];
    case LogEventCodes.PEER_JOIN:
      return [`Nova máquina entrou no grupo: ${detail}.`];
    case LogEventCodes.LEADER_UP:
      return [`Este computador passou a coordenar o grupo (porta ${kv.port || "?"}).`];
    case LogEventCodes.TX_SEND: {
      const who = context.hostname || "Este nó";
      const val = formatMoneyBr(kv.delta);
      const lines = [`${who} pediu uma movimentação de ${val}.`];
      if (logDetail && kv.req) lines.push(`Id: ${kv.req}`);
      return lines;
    }
    case LogEventCodes.TX_ACK: {
      const ok = kv.status === "Success";
      const accepted = kv.status === "Accepted";
      let headline = `Resposta: ${kv.status || "?"}.`;
      if (ok) headline = "Resposta do coordenador: tudo certo.";
      if (accepted) {
        headline =
          "Coordenador aceitou o pedido; o banco está fora (ainda não gravou).";
      }
      if (kv.status === "Rejected") {
        headline = "Resposta: Rejected — vale procurar outro líder no anel.";
      }
      const lines = [headline];
      if (logDetail && kv.req) lines.push(`Id: ${kv.req}`);
      return lines;
    }
    case LogEventCodes.TX_TIMEOUT:
      return ["O coordenador demorou demais para responder; vamos tentar de novo."];
    case LogEventCodes.TX_ENQUEUE: {
      const lines = ["Coordenador colocou o pedido na fila."];
      if (logDetail && extra.queue) lines.push(`Fila: ${extra.queue}`);
      if (logDetail && kv.req) lines.push(`Id: ${kv.req}`);
      return lines;
    }
    case LogEventCodes.TX_DEQUEUE:
      return logDetail && kv.req
        ? [`Coordenador começou a processar o pedido.`, `Id: ${kv.req}`]
        : ["Coordenador começou a processar o pedido."];
    case LogEventCodes.TX_APPLY: {
      const balRaw = kv.balance || (detail && detail.includes("balance=")
        ? detail.split("balance=")[1]?.split(/\s/)[0]
        : null);
      const balText = balRaw ? formatMoneyBr(balRaw) : null;
      return [balText ? `Saldo atualizado para ${balText}.` : "Saldo atualizado."];
    }
    case LogEventCodes.TX_STORAGE:
      return ["Movimentação gravada no banco."];
    case LogEventCodes.TX_FAIL:
      return [`Não foi possível concluir a movimentação (${kv.err || "erro"}).`];
    case LogEventCodes.TX_STORY:
      return extra.storyLines || [detail];
    case LogEventCodes.BALANCE:
      return [`Saldo atual: ${detail}.`];
    case LogEventCodes.BALANCE_FAIL:
      return ["Não conseguimos ler o saldo (banco indisponível)."];
    case LogEventCodes.STORAGE_UP:
      if (detail && detail.startsWith("url=")) {
        return ["O banco voltou a responder."];
      }
      return ["O banco está acessível."];
    case LogEventCodes.STORAGE_DOWN:
      return ["O banco não está respondendo."];
    case LogEventCodes.STORAGE_WARN:
      return ["Coordenador ativo, mas o banco ainda não responde."];
    case LogEventCodes.STORAGE_DISCARD:
      return ["Movimentação descartada porque o banco está fora."];
    case LogEventCodes.STORAGE_DEFER:
      return ["Pedido aceito pelo coordenador; aguardando o banco para gravar."];
    case LogEventCodes.KILL_REJECT:
      return ["Teste de falha do líder não pôde rodar agora."];
    case LogEventCodes.KILL_REQUEST:
      return [`Teste: pedido para derrubar o coordenador (${detail}).`];
    case LogEventCodes.LEADER_DOWN:
      return ["Teste: coordenador simulado como fora do ar."];
    case LogEventCodes.BOOTSTRAP_FAIL:
      return [`Não foi possível iniciar: ${detail}`];
    case LogEventCodes.NODE_HTTP_READY:
      return [`Painel HTTP deste nó na porta ${kv.port || detail}.`];
    case LogEventCodes.STORAGE_HTTP_READY:
      return [`Servidor do banco escutando na porta ${kv.port || detail}.`];
    case LogEventCodes.BOOT: {
      const lines = [
        `Nó ligado e pronto (porta ${kv.port || context.port || "?"}).`,
      ];
      if (kv.storageUrl && kv.storageUrl !== "-") {
        lines.push(logDetail ? `Banco: ${kv.storageUrl}` : "Usando o banco compartilhado do lab.");
      }
      return lines;
    }
    case LogEventCodes.STORAGE_PRIMARY:
      if (detail.startsWith("url=")) {
        const rest = detail.replace(/^url=/, "").split(" db=");
        const lines = [
          "Banco de dados primário em execução.",
          `Endereço: ${rest[0] || "?"}`,
        ];
        if (rest[1]) lines.push(`Arquivo: ${rest[1]}`);
        lines.push("Configure o mesmo endereço em todos os nós (STORAGE_URL).");
        return lines;
      }
      return [detail];
    case LogEventCodes.STORAGE_STANDBY:
      return [detail];
    case LogEventCodes.STORAGE_NONE:
      return [detail];
    case LogEventCodes.ENV_SUMMARY:
      return extra.lines || [detail];
    default:
      return [detail || eventCode];
  }
}

function formatRingViewBody(ringView, logDetail) {
  const lines = ["Resumo do grupo"];
  if (ringView.leaderPort) {
    const leader = friendlyNodeName(
      { nodeName: ringView.leaderNodeName },
      ringView.leaderPort
    );
    lines.push(`Quem coordena: ${leader}`);
  } else {
    lines.push("Quem coordena: ainda em definição");
  }
  lines.push(
    ringView.storageUp
      ? "Banco: consegue gravar"
      : "Banco: fora do ar"
  );
  if (logDetail && ringView.storageUrl) {
    lines.push(`URL: ${ringView.storageUrl}`);
  }
  const names = (ringView.peers || []).map((p) => friendlyPeerLabel(p));
  lines.push(`Máquinas no grupo (${ringView.peerCount}): ${names.join(", ")}`);
  const selfName = friendlyNodeName(
    { nodeName: ringView.selfNodeName },
    ringView.selfPort
  );
  lines.push(`Você está vendo o log de: ${selfName}`);
  return lines;
}

function applyStyle(lines, context, roleKey, formatOpts) {
  const style = formatOpts.logStyle || "box";
  if (style === "plain") {
    const host =
      context.labHostName && context.labHostName !== "-"
        ? `${context.labHostName} · `
        : "";
    const header = `── ${host}${context.hostname || "?"} · ${ROLE_LABELS[roleKey] || roleKey} ──`;
    return [header, ...lines];
  }
  const title = boxTitle(context, roleKey, ROLE_LABELS);
  return wrapInBox(title, lines, { port: context.port });
}

function formatHumanBlock(context, roleKey, eventCode, detail, extra = {}) {
  const formatOpts = extra.formatOpts || {};
  const logDetail = formatOpts.logDetail === true;
  const suppressLeaderTx =
    formatOpts.logTxStory === true &&
    roleKey === "LEADER" &&
    [
      LogEventCodes.TX_ENQUEUE,
      LogEventCodes.TX_DEQUEUE,
      LogEventCodes.TX_APPLY,
      LogEventCodes.TX_STORAGE,
    ].includes(eventCode);

  if (suppressLeaderTx) {
    return [];
  }

  if (eventCode === LogEventCodes.RING_VIEW && extra.ringView) {
    const body = formatRingViewBody(extra.ringView, logDetail);
    if (logDetail) body.push(`[${LogEventCodes.RING_VIEW}]`);
    return applyStyle(body, context, "ELECTION", formatOpts);
  }

  const messages = messageForEvent(eventCode, detail, {
    ...extra,
    logDetail,
  }, context);

  if (messages === null) {
    return [];
  }

  const body = [...messages];
  if (logDetail && eventCode !== LogEventCodes.RING_VIEW) {
    body.push(`[${eventCode}]`);
    if (detail && !body.some((l) => l.includes(detail))) {
      body.push(detail);
    }
  }

  return applyStyle(body, context, roleKey, formatOpts);
}

function formatStructuredLine(context, roleKey, eventCode, detail, extra = {}) {
  const parts = [
    new Date().toISOString(),
    context.labHostName || "-",
    context.hostname || "-",
    roleKey,
    extra.queue || "-",
    eventCode,
    detail,
  ];
  return [parts.join(" | ")];
}

function narrativeForEvent(eventCode, detail, extra = {}, context = {}) {
  const messages = messageForEvent(
    eventCode,
    detail,
    { ...extra, logDetail: true },
    context
  );
  if (messages === null) return [];
  return messages.filter(Boolean);
}

function buildTimelineMessage(context, roleKey, eventCode, detail, extra = {}) {
  if (eventCode === LogEventCodes.RING_VIEW && extra.ringView) {
    return formatRingViewBody(extra.ringView, false).join("\n");
  }
  if (eventCode === LogEventCodes.TX_STORY && extra.storyLines) {
    return extra.storyLines.join("\n");
  }
  const messages = narrativeForEvent(eventCode, detail, extra, context);
  if (!messages.length) return "";
  return messages.join("\n");
}

module.exports = {
  formatHumanBlock,
  formatStructuredLine,
  buildTimelineMessage,
  narrativeForEvent,
  parseDetail,
  ROLE_LABELS,
  formatRingViewBody,
};
