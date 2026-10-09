const { Bonjour } = require("bonjour-service");

const STORAGE_TYPE = "ring-storage-lab";
const WAIT_MS = 4000;

function serviceHost(service) {
  return (
    service.referer?.address ||
    (service.addresses && service.addresses[0]) ||
    service.host ||
    ""
  );
}

function discoverStorageUrl(timeoutMs = WAIT_MS) {
  return new Promise((resolve) => {
    const bonjour = new Bonjour();
    let url = "";
    const browser = bonjour.find({ type: STORAGE_TYPE });
    browser.on("up", (service) => {
      const h = serviceHost(service);
      const port = service.port || 4000;
      if (h && !url) url = `http://${h}:${port}`.replace(/\/$/, "");
    });
    setTimeout(() => {
      browser.stop();
      bonjour.destroy();
      resolve(url);
    }, timeoutMs);
  });
}

module.exports = { discoverStorageUrl };
