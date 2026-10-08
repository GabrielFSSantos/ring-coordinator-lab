/** Socket.IO wire event names (English, stable contract). */
const SocketEvents = {
  ELECTION_ROUND: "election_round",
  COORDINATOR_ANNOUNCE: "coordinator_announce",
  RECONNECT: "reconnect",
  COORDINATOR_SUSPECT: "coordinator_suspect",
  LEADER_KILL_REQUEST: "leader_kill_request",
  TRANSACTION_REQUEST: "transaction_request",
  LOG_REQUEST: "log_request",
};

function transactionResponseEvent(requestId) {
  return `transaction_response-${requestId}`;
}

module.exports = { SocketEvents, transactionResponseEvent };
