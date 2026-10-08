const http = require("http");
const { handleControl } = require("./controlRoutes");
const { LogEventCodes } = require("../infrastructure/logging/logEventCodes");

class NodeHttpServer {
  constructor(nodeApp, port) {
    this.nodeApp = nodeApp;
    this.port = port;
    this.server = null;
  }

  start() {
    this.server = http.createServer(async (req, res) => {
      const handled = await handleControl(req, res, this.nodeApp);
      if (handled) return;
      const path = req.url?.split("?")[0];
      if (path === "/v1/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      if (path === "/v1/state") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(this.nodeApp.getPublicState()));
        return;
      }
      if (path === "/v1/cluster/state") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(this.nodeApp.getClusterState()));
        return;
      }
      res.writeHead(404);
      res.end();
    });
    this.server.listen(this.port, () => {
      this.nodeApp.logger.boot(
        LogEventCodes.NODE_HTTP_READY,
        `port=${this.port}`
      );
      this.nodeApp.writeDockerOpsReady();
    });
  }
}

module.exports = { NodeHttpServer };
