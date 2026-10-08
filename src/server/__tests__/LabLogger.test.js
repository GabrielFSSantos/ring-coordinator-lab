const { LabLogger } = require("../infrastructure/logging/LabLogger");

describe("LabLogger", () => {
  function captureStdout() {
    const lines = [];
    const orig = process.stdout.write;
    process.stdout.write = (chunk) => {
      lines.push(String(chunk));
      return true;
    };
    return {
      lines,
      restore: () => {
        process.stdout.write = orig;
      },
    };
  }

  it("LOG_SIM disables sim events", () => {
    const cap = captureStdout();
    try {
      const logger = new LabLogger({
        logEnabled: true,
        logSim: false,
        logWrites: true,
        labHostName: "h",
        hostname: "n",
        port: 3002,
        logFormat: "structured",
      });
      logger.sim("KILL_REQUEST", "x");
      expect(cap.lines.join("")).not.toContain("KILL_REQUEST");
      const logger2 = new LabLogger({
        logEnabled: true,
        logSim: true,
        logWrites: true,
        labHostName: "h",
        hostname: "n",
        port: 3002,
        logFormat: "structured",
      });
      logger2.sim("KILL_REQUEST", "y");
      expect(cap.lines.join("")).toContain("KILL_REQUEST");
    } finally {
      cap.restore();
    }
  });

  it("logStdoutMode off does not write to stdout", () => {
    const cap = captureStdout();
    try {
      const logger = new LabLogger({
        logEnabled: true,
        logElection: true,
        labHostName: "lab",
        hostname: "node",
        port: 3004,
        logFormat: "structured",
        logStdoutMode: "off",
      });
      logger.election("ELECTION_ROUND", "ports=[3002]");
      expect(cap.lines.join("")).toBe("");
    } finally {
      cap.restore();
    }
  });

  it("human box format adds extra blank line after block", () => {
    const cap = captureStdout();
    try {
      const logger = new LabLogger({
        logEnabled: true,
        logElection: true,
        labHostName: "lab",
        hostname: "node",
        port: 3004,
        logFormat: "human",
        logStyle: "box",
        logDetail: false,
      });
      logger.election("ELECTION_ROUND", "ports=[3002,3003]");
      const out = cap.lines.join("");
      expect(out).toContain("┌");
      expect(out.match(/\n/g).length).toBeGreaterThan(3);
    } finally {
      cap.restore();
    }
  });
});
