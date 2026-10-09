#!/usr/bin/env node
/**
 * Join: descobre STORAGE_URL e ADVERTISE_PORT_BASE via mDNS (stdout: export VAR=val).
 * Rode de src/: node ../scripts/discover-join-env.js
 */
const path = require("path");
const { Bonjour } = require("bonjour-service");

const NODE_TYPE = "ring-coordinator-lab";
const STORAGE_TYPE = "ring-storage-lab";
const WAIT_MS = 3500;
const HOST_BASE = 3002;
const PORTS_PER_HOST = 4;

function parseTxt(service) {
  const txt = service.txt || {};
  return {
    advertiseHost:
      txt.advertiseHost ||
      service.referer?.address ||
      (service.addresses && service.addresses[0]) ||
      service.host ||
      "",
  };
}

function serviceHost(service) {
  return (
    service.referer?.address ||
    (service.addresses && service.addresses[0]) ||
    service.host ||
    ""
  );
}

function main() {
  const bonjour = new Bonjour();
  const nodeHosts = new Set();
  let storageUrl = "";

  const nodeBrowser = bonjour.find({ type: NODE_TYPE });
  nodeBrowser.on("up", (service) => {
    const h = parseTxt(service).advertiseHost || serviceHost(service);
    if (h) nodeHosts.add(h);
  });

  const storageBrowser = bonjour.find({ type: STORAGE_TYPE });
  storageBrowser.on("up", (service) => {
    const h = serviceHost(service);
    const port = service.port || 4000;
    if (h && !storageUrl) {
      storageUrl = `http://${h}:${port}`;
    }
  });

  setTimeout(() => {
    const slot = nodeHosts.size;
    const portBase = HOST_BASE + slot * PORTS_PER_HOST;
    if (storageUrl) {
      process.stdout.write(`DISCOVERED_STORAGE_URL=${storageUrl}\n`);
    }
    process.stdout.write(`DISCOVERED_PORT_BASE=${portBase}\n`);
    nodeBrowser.stop();
    storageBrowser.stop();
    bonjour.destroy();
    process.exit(0);
  }, WAIT_MS);
}

main();
