# 03 Entrypoints e build

## Entrada do processo

[`src/server/bootstrap/main.js`](../../src/server/bootstrap/main.js) carrega `config/env.js` e inicia `NodeApplication`.

[`src/server/main.js`](../../src/server/main.js) reexporta o bootstrap por compatibilidade.

## Dockerfile

[`src/Dockerfile`](../../src/Dockerfile) (contexto de build = raiz do repo):

1. Base `node:20-bookworm-slim` + toolchain para `better-sqlite3`.
2. `npm ci --omit=dev`, copia `schema.sql` e `server/`.
3. `CMD ["node", "server/bootstrap/main.js"]`.

## Ciclo de vida no container

1. Socket.IO na `NODE_PORT`.
2. Nó de **menor porta** inicia eleição quando o sucessor conecta.
3. Handlers: [07_contrato_socket_io.md](07_contrato_socket_io.md).

## Dependências (`src/package.json`)

Runtime: `socket.io`, `better-sqlite3`, `dotenv`. Testes: Jest — [15_testes_e_gate.md](15_testes_e_gate.md).

## Desenvolvimento local

Defina `HOSTNAME`, `IP_LOCAL`, `NODE_PORT`, `IP_LIST`, `DATABASE_PATH` e rode `npm start`. O lab foi desenhado para quatro nós no Compose.
