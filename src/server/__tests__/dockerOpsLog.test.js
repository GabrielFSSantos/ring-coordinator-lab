const { writeOpsLine } = require("../infrastructure/logging/dockerOpsLog");

describe("writeOpsLine", () => {
  it("writes to stderr when enabled", () => {
    const chunks = [];
    const orig = process.stderr.write;
    process.stderr.write = (chunk) => {
      chunks.push(String(chunk));
      return true;
    };
    try {
      writeOpsLine(true, {
        labHostName: "docker-lab",
        service: "ubuntu-node-2",
        message: "ativo (anel=3002)",
      });
      expect(chunks.join("")).toContain("[lab-ops] docker-lab ubuntu-node-2");
    } finally {
      process.stderr.write = orig;
    }
  });

  it("does nothing when disabled", () => {
    const chunks = [];
    const orig = process.stderr.write;
    process.stderr.write = (chunk) => {
      chunks.push(String(chunk));
      return true;
    };
    try {
      writeOpsLine(false, { labHostName: "x", service: "y", message: "z" });
      expect(chunks.length).toBe(0);
    } finally {
      process.stderr.write = orig;
    }
  });
});
