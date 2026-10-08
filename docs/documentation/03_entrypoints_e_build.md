# 03 Entrypoints e build

## Entrada do processo

[`src/server/main.js`](../../src/server/main.js):

```javascript
require('dotenv').config();
const DistributedNode = require('./DistribuitedNode');

const node = new DistributedNode();
node.initServer();
```

- Em Docker, variáveis vêm do `environment` do Compose (`.env` local é opcional para desenvolvimento).
- Toda a lógica distribuída está em `DistribuitedNode.js` (exporta classe `DistributedNode`).

## Dockerfile

[`src/Dockerfile`](../../src/Dockerfile):

1. Base `ubuntu:latest`, instala utilitários de rede e Node.js 20.
2. `WORKDIR /app`, `npm install` a partir de `package.json` / `package-lock.json`.
3. Copia `server/` para `/app/server`.
4. `CMD ["node", "server/main.js"]`.

Portas expostas na imagem incluem `3000` e `4000` (legado/comentário); em produção no compose cada nó usa `NODE_PORT` 3002–3005.

## Ciclo de vida no container

1. Processo inicia e chama `initServer()`.
2. Cria servidor HTTP e anexa Socket.IO na `NODE_PORT`.
3. Após **5 segundos**, dispara `startElection([])` em todos os nós (eleição inicial paralela).
4. Handlers de conexão registram eventos (`ELEICAO`, `COORDENADOR`, etc.) — ver [07_contrato_socket_io.md](07_contrato_socket_io.md).

## Dependências Node (`src/package.json`)

Principais: `socket.io`, `socket.io-client`, `pg`, `dotenv`. Testes: Jest (estado legado — [15_testes_e_gate.md](15_testes_e_gate.md)).

## Desenvolvimento local (sem Docker)

Possível definir `HOSTNAME`, `IP_LOCAL`, `NODE_PORT`, `IP_LIST` e rodar `node server/main.js`, mas o lab foi desenhado para **quatro nós + Postgres** na rede Docker. Para experimentos locais, prefira Compose.
