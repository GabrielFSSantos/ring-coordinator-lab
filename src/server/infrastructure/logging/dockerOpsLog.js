function writeOpsLine(enabled, { labHostName, service, message }) {
  if (!enabled) return;
  const host = labHostName && labHostName !== "-" ? labHostName : "?";
  const svc = service || "lab";
  const text = message ? ` ${message}` : "";
  process.stderr.write(`[lab-ops] ${host} ${svc}${text}\n`);
}

module.exports = { writeOpsLine };
