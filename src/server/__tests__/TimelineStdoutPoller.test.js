const {
  TimelineStdoutPoller,
  matchesIdentity,
  linesForTimelineRow,
} = require("../infrastructure/logging/TimelineStdoutPoller");

describe("matchesIdentity", () => {
  it("matches lab host, node name and port", () => {
    const row = {
      lab_host_name: "docker-lab",
      node_name: "ubuntu-node-2",
      node_port: 3002,
    };
    expect(
      matchesIdentity(row, {
        labHostName: "docker-lab",
        hostname: "ubuntu-node-2",
        port: 3002,
      })
    ).toBe(true);
    expect(
      matchesIdentity(row, {
        labHostName: "docker-lab",
        hostname: "ubuntu-node-3",
        port: 3002,
      })
    ).toBe(false);
  });
});

describe("TimelineStdoutPoller", () => {
  function captureStdout() {
    const chunks = [];
    const orig = process.stdout.write;
    process.stdout.write = (chunk) => {
      chunks.push(String(chunk));
      return true;
    };
    return {
      chunks,
      restore: () => {
        process.stdout.write = orig;
      },
    };
  }

  it("timeline_all prints every event and advances cursor", async () => {
    const cap = captureStdout();
    const events = [
      [
        { id: 1, message: "um", role: "BOOT", node_name: "a", node_port: 3002 },
        { id: 2, message: "dois", role: "BOOT", node_name: "b", node_port: 3003 },
      ],
      [],
    ];
    const client = {
      listTimelineEvents: jest.fn(() => Promise.resolve(events.shift())),
    };
    const poller = new TimelineStdoutPoller({
      storageClient: client,
      mode: "timeline_all",
      labHostName: "h",
      hostname: "n",
      port: 3002,
      logStyle: "plain",
    });
    try {
      await poller.tick();
      expect(client.listTimelineEvents).toHaveBeenCalledWith({
        afterId: 0,
        limit: 50,
      });
      expect(poller.afterId).toBe(2);
      const out = cap.chunks.join("");
      expect(out).toContain("um");
      expect(out).toContain("dois");
      await poller.tick();
      expect(client.listTimelineEvents).toHaveBeenLastCalledWith({
        afterId: 2,
        limit: 50,
      });
    } finally {
      cap.restore();
    }
  });

  it("timeline_self skips foreign rows but advances afterId", async () => {
    const cap = captureStdout();
    const client = {
      listTimelineEvents: jest.fn(() =>
        Promise.resolve([
          {
            id: 10,
            lab_host_name: "lab",
            node_name: "other",
            node_port: 3003,
            message: "estrangeiro",
            role: "FOLLOWER",
          },
          {
            id: 11,
            lab_host_name: "lab",
            node_name: "me",
            node_port: 3002,
            message: "meu evento",
            role: "FOLLOWER",
          },
        ])
      ),
    };
    const poller = new TimelineStdoutPoller({
      storageClient: client,
      mode: "timeline_self",
      labHostName: "lab",
      hostname: "me",
      port: 3002,
      logStyle: "plain",
    });
    try {
      await poller.tick();
      expect(poller.afterId).toBe(11);
      const out = cap.chunks.join("");
      expect(out).not.toContain("estrangeiro");
      expect(out).toContain("meu evento");
    } finally {
      cap.restore();
    }
  });
});

describe("linesForTimelineRow", () => {
  it("wraps message in box for human+box", () => {
    const lines = linesForTimelineRow(
      {
        message: "Olá",
        role: "FOLLOWER",
        node_name: "ubuntu-node-2",
        node_port: 3002,
      },
      { logFormat: "human", logStyle: "box" }
    );
    expect(lines[0]).toContain("┌");
    expect(lines.join("\n")).toContain("Olá");
  });

  it("includes lab host name in box title", () => {
    const lines = linesForTimelineRow(
      {
        message: "Teste",
        role: "FOLLOWER",
        lab_host_name: "pc-sala-a",
        node_name: "ubuntu-node-2",
        node_port: 3002,
      },
      { logFormat: "human", logStyle: "box" }
    );
    expect(lines[0]).toContain("pc-sala-a");
    expect(lines[0]).toContain("ubuntu-node-2");
  });
});
