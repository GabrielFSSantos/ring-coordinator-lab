function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error("body_too_large"));
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("invalid_json"));
      }
    });
  });
}

function checkAuth(req, token) {
  if (!token) return true;
  const auth = req.headers.authorization || "";
  return auth === `Bearer ${token}`;
}

async function handleControl(req, res, nodeApp) {
  const token = nodeApp.config.nodeControlToken;
  if (!checkAuth(req, token)) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: "unauthorized" }));
    return true;
  }

  const url = req.url.split("?")[0];

  if (req.method === "PATCH" && url === "/v1/simulation") {
    try {
      const body = await readJsonBody(req);
      const snapshot = nodeApp.simulationPolicy.applyPatch(body);
      nodeApp.onSimulationPolicyChanged();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(snapshot));
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "bad_request" }));
    }
    return true;
  }

  if (req.method === "POST" && url === "/v1/control/pause") {
    nodeApp.simulationPolicy.paused = true;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ paused: true }));
    return true;
  }

  if (req.method === "POST" && url === "/v1/control/resume") {
    nodeApp.simulationPolicy.paused = false;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ paused: false }));
    return true;
  }

  if (req.method === "POST" && url === "/v1/control/leader-kill") {
    if (nodeApp.inElection) {
      res.writeHead(409);
      res.end(JSON.stringify({ error: "election_in_progress" }));
      return true;
    }
    const body = await readJsonBody(req).catch(() => ({}));
    nodeApp.requestLeaderKill(body.reason || "api");
    res.writeHead(202);
    res.end(JSON.stringify({ accepted: true }));
    return true;
  }

  if (req.method === "POST" && url === "/v1/transactions") {
    if (nodeApp.simulationPolicy.paused) {
      res.writeHead(423);
      res.end(JSON.stringify({ error: "node_paused" }));
      return true;
    }
    try {
      const body = await readJsonBody(req);
      const { parseMoneyToCents, centsToMoney } = require("../../shared/money");
      const deltaCents = parseMoneyToCents(body.delta);
      const tx = nodeApp.buildTransaction(deltaCents);
      if (body.requestId) tx.requestId = body.requestId;
      nodeApp.submitTransaction(tx);
      res.writeHead(202);
      res.end(JSON.stringify({ requestId: tx.requestId }));
    } catch {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "bad_request" }));
    }
    return true;
  }

  if (req.method === "GET" && url === "/v1/storage/status") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        up: nodeApp.storageUp,
        url: nodeApp.config.storageUrl,
        lastCheckMs: nodeApp.lastStorageCheckMs || null,
      })
    );
    return true;
  }

  return false;
}

module.exports = { handleControl, readJsonBody };
