const { LogEventCodes } = require("./logEventCodes");

const DEFAULT_SKIP = new Set([
  LogEventCodes.RING_VIEW,
  LogEventCodes.TX_STORY,
  LogEventCodes.ENV_SUMMARY,
]);

function parseSkipCodes(envValue) {
  const skip = new Set(DEFAULT_SKIP);
  if (!envValue || !String(envValue).trim()) return skip;
  for (const code of String(envValue).split(",")) {
    const c = code.trim();
    if (c) skip.add(c);
  }
  return skip;
}

function shouldPersistTimelineEvent(eventCode, skipSet) {
  if (!eventCode) return false;
  if (skipSet.has(eventCode)) return false;
  return true;
}

module.exports = {
  DEFAULT_SKIP,
  parseSkipCodes,
  shouldPersistTimelineEvent,
};
