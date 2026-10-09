const { Bonjour } = require("bonjour-service");

function serviceHost(service) {
  return (
    service.referer?.address ||
    (service.addresses && service.addresses[0]) ||
    service.host ||
    ""
  );
}

function storageServiceType(raw) {
  const type = raw || "_ring-storage-lab._tcp.local";
  return type.replace("._tcp.local", "").replace(/^\./, "");
}

/**
 * @returns {Promise<{ baseUrl: string, host: string, port: number } | null>}
 */
function browseStoragePrimary({
  waitMs = 3500,
  discoveryStorageType,
  excludeBaseUrl = "",
}) {
  const exclude = (excludeBaseUrl || "").replace(/\/$/, "").toLowerCase();
  return new Promise((resolve) => {
    const bonjour = new Bonjour();
    let found = null;
    const browser = bonjour.find({ type: storageServiceType(discoveryStorageType) });
    browser.on("up", (service) => {
      const h = serviceHost(service);
      const port = service.port || 4000;
      if (!h) return;
      const baseUrl = `http://${h}:${port}`.replace(/\/$/, "");
      if (exclude && baseUrl.toLowerCase() === exclude) return;
      if (!found) found = { baseUrl, host: h, port };
    });
    setTimeout(() => {
      browser.stop();
      bonjour.destroy();
      resolve(found);
    }, waitMs);
  });
}

module.exports = { browseStoragePrimary, serviceHost, storageServiceType };
