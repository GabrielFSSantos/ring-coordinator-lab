/**
 * Pure election rules for this lab variant (participant list on the ring + max(port) as leader).
 */
class ElectionService {
  static shouldParticipateFirstWave(localPort, electionList) {
    if (electionList.includes(localPort)) return false;
    return (
      electionList.length === 0 || electionList[0] > localPort
    );
  }

  static shouldRestartElection(localPort, electionList, inElection) {
    if (inElection || electionList.includes(localPort)) return false;
    if (electionList.length === 0) return false;
    return electionList[0] < localPort;
  }

  static isInitiatorComplete(localPort, electionList) {
    return electionList.length > 0 && electionList[0] === localPort;
  }

  static pickCoordinatorPort(electionList) {
    return Math.max(...electionList);
  }
}

module.exports = { ElectionService };
