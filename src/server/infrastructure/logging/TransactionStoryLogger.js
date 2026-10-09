const { centsToMoney } = require("../../../shared/money");

class TransactionStoryLogger {
  constructor(labLogger, nodeApp) {
    this.logger = labLogger;
    this.nodeApp = nodeApp;
    this.pending = new Map();
  }

  enabled() {
    return this.logger.config.logTxStory !== false;
  }

  onEnqueue(requestData, queuePos, queueTotal) {
    if (!this.enabled()) return;
    const id = requestData.requestId;
    this.pending.set(id, {
      requestId: id,
      fromNode:
        requestData.nodeName ||
        requestData.hostname ||
        requestData.hostName ||
        "?",
      delta: requestData.delta,
      queuePos,
      queueTotal,
    });
  }

  onSuccess(requestData, balanceAfterCents) {
    if (!this.enabled()) {
      return false;
    }
    const id = requestData.requestId;
    const state = this.pending.get(id) || {
      fromNode:
        requestData.nodeName ||
        requestData.hostname ||
        requestData.hostName ||
        "?",
      delta: requestData.delta,
    };
    this.pending.delete(id);

    const deltaStr =
      requestData.delta != null
        ? requestData.delta
        : state.delta != null
          ? state.delta
          : "?";
    const balanceStr = centsToMoney(balanceAfterCents);
    const from = state.fromNode || "?";
    const lines = [
      `Processou pedido de ${from}`,
      `Valor: ${formatMoneyBr(deltaStr)}`,
      `Novo saldo: R$ ${balanceStr.replace(".", ",")}`,
      "Gravado no banco: sim",
    ];
    this.logger.story("LEADER", lines);
    return true;
  }

  onAcceptedWithoutStorage(requestData) {
    if (!this.enabled()) {
      return false;
    }
    const id = requestData.requestId;
    const state = this.pending.get(id);
    this.pending.delete(id);
    const from =
      state?.fromNode ||
      requestData.nodeName ||
      requestData.hostname ||
      "?";
    const lines = [
      `Aceitou pedido de ${from} (banco fora — não gravou).`,
      "Gravado no banco: não",
    ];
    this.logger.story("LEADER", lines);
    return true;
  }

  onFailure(requestData, errMessage) {
    if (!this.enabled()) {
      return false;
    }
    const id = requestData.requestId;
    const state = this.pending.get(id);
    this.pending.delete(id);
    const from =
      state?.fromNode ||
      requestData.nodeName ||
      requestData.hostname ||
      "?";
    const lines = [
      `Não concluiu pedido de ${from}`,
      `Motivo: ${errMessage}`,
    ];
    this.logger.story("LEADER", lines);
    return true;
  }
}

function formatMoneyBr(deltaStr) {
  if (!deltaStr || deltaStr === "?") return deltaStr;
  const n = parseFloat(String(deltaStr).replace(",", "."));
  if (Number.isNaN(n)) return deltaStr;
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n).toFixed(2).replace(".", ",");
  return `${sign}R$ ${abs}`;
}

module.exports = { TransactionStoryLogger };
