const { browseStoragePrimary } = require("../../shared/mdnsStorageBrowse");

/**
 * Decide se este processo deve ser primário writable ou standby.
 */
async function resolveWritablePrimary(config) {
  if (config.storageMode !== "primary") {
    return { mode: config.storageMode, isWritable: false, primaryBaseUrl: null };
  }

  const selfUrl = `http://${config.advertiseHost}:${config.storageHttpPort}`.replace(
    /\/$/,
    ""
  );

  if (config.storageDiscoveryUrl) {
    const remote = await fetchPrimaryMeta(config.storageDiscoveryUrl);
    if (remote?.baseUrl && remote.baseUrl.replace(/\/$/, "") !== selfUrl) {
      return {
        mode: "standby",
        isWritable: false,
        primaryBaseUrl: remote.baseUrl.replace(/\/$/, ""),
      };
    }
  }

  if (config.discoveryMode === "mdns") {
    const remote = await browseStoragePrimary({
      waitMs: config.storagePrimaryBrowseMs || 3500,
      discoveryStorageType: config.discoveryStorageType,
      excludeBaseUrl: selfUrl,
    });
    if (remote?.baseUrl) {
      const remoteMeta = await fetchPrimaryMeta(`${remote.baseUrl}/v1/storage/primary`);
      const canonical = remoteMeta?.baseUrl || remote.baseUrl;
      if (canonical.replace(/\/$/, "") !== selfUrl) {
        return {
          mode: "standby",
          isWritable: false,
          primaryBaseUrl: canonical.replace(/\/$/, ""),
        };
      }
    }
  }

  return { mode: "primary", isWritable: true, primaryBaseUrl: selfUrl };
}

async function fetchPrimaryMeta(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { resolveWritablePrimary, fetchPrimaryMeta };
