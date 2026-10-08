# 09 API HTTP controle v1

## Resumo

Contrato REST para o console web e automação: leitura no **storage**, observação e **comando** nos **nós**. Escrita no ledger continua **somente** via líder → storage (não expor POST transaction no storage ao browser sem token).

## Pré-requisitos

- [08-caminho-escrita-leitura-invariantes.md](08-caminho-escrita-leitura-invariantes.md)
- [console-frontend-lab/05-comandos-e-controles.md](../console-frontend-lab/05-comandos-e-controles.md)

## Storage (inalterado + CORS lab)

| Método | Rota | Auth | Uso |
| --- | --- | --- | --- |
| GET | `/v1/balance` | — | Saldo |
| GET | `/v1/ledger?limit&afterId` | — | Histórico paginado (movimentações contábeis) |
| GET | `/v1/timeline-events?limit&afterId` | — | Timeline operacional global (eleição, TX, etc.) |
| GET | `/v1/timeline-events?requestId=` | — | Eventos de uma transação |
| GET | `/v1/storage/primary` | — | Discovery |
| POST | `/v1/transactions` | `x-storage-token` | **Apenas líder** — altera saldo |
| POST | `/v1/timeline-events` | `x-storage-token` | **Qualquer nó** — não altera saldo |
| POST | `/v1/admin` | token | Admin / kill audit |

**CORS:** na implementação, habilitar `Access-Control-Allow-Origin: *` em GET para dev UI (lab only).

## Nó — leitura

| Método | Rota | Resposta |
| --- | --- | --- |
| GET | `/v1/health` | `{ ok: true }` |
| GET | `/v1/state` | papel, líder, storageUp, fila, sim snapshot |
| GET | `/v1/cluster/state` | peers, coordinatorPort, storageUrl, epoch |

### `GET /v1/state` (campos adicionais planejados)

```json
{
  "host": "docker-lab",
  "node": "ubuntu-node-3",
  "port": 3003,
  "isCoordinator": false,
  "coordinatorPort": 3005,
  "storageUp": true,
  "simulation": {
    "mode": "auto",
    "txBurst": 2,
    "txIntervalMs": 5000,
    "killIntervalMs": 25000,
    "txEnabled": true,
    "killEnabled": true,
    "deltaMode": "random",
    "deltaFixed": null
  },
  "paused": false
}
```

## Nó — controle (novo)

Header opcional: `Authorization: Bearer <NODE_CONTROL_TOKEN>`.

| Método | Rota | Body | Efeito |
| --- | --- | --- | --- |
| PATCH | `/v1/simulation` | ver abaixo | Atualiza política em memória + persiste opcional snapshot |
| POST | `/v1/control/pause` | `{ "paused": true }` | Pausa envio simulado e rejeita tx manuais com `node_paused` |
| POST | `/v1/control/resume` | `{ "paused": false }` | Retoma |
| POST | `/v1/control/leader-kill` | `{ "reason": "ui" }` | Dispara `requestLeaderKill` se regras ok |
| POST | `/v1/transactions` | `{ "delta": "-10.00", "requestId": "ui-..." }` | Enfileira como cliente local (via mesmo path que sim) |

### `PATCH /v1/simulation` body

```json
{
  "mode": "manual|auto",
  "txEnabled": true,
  "txBurst": 2,
  "txIntervalMs": 5000,
  "killEnabled": true,
  "killIntervalMs": 25000,
  "deltaMode": "random|fixed",
  "deltaFixed": "25.00",
  "deltaMin": -500,
  "deltaMax": 500
}
```

Resposta: `200` + estado atual; `400` validação; `409` se `inElection` para kill fields.

## Códigos de erro (transação / controle)

| reason | HTTP / body |
| --- | --- |
| `storage_down` | 503 |
| `leader_simulated_down` | 503 |
| `election_in_progress` | 409 |
| `queue_full` | 429 |
| `node_paused` | 423 |
| `duplicate` | 200 idempotente (storage) |

## Decisões e invariantes

- UI **NÃO** chama `POST /v1/transactions` no storage.
- Idempotência: `requestId` obrigatório em tx manual UI.
- PATCH em qualquer nó: apenas afeta **aquele** processo; UI deve iterar nós ou documentar “config cluster-wide” como melhoria futura (v1: por nó).

## Arquivos alvo

| Path |
| --- |
| `src/server/http/NodeHttpServer.js` ou `controlRoutes.js` |
| `src/server/application/SimulationPolicy.js` (novo) |
| `src/storage/StorageServer.js` (CORS GET) |

## Critérios de aceite

- [ ] OpenAPI ou tabela acima implementada.
- [ ] Front pode ligar/desligar tx e kill sem reiniciar container.

## API opcional v1.1 (LAN multi-host + frontend)

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/v1/cluster/peers` | Lista unificada: estático + descoberta mDNS |
| GET | `/v1/storage/status` | `{ up, url, lastCheckMs }` cache no nó |

## Fora de escopo

- WebSocket do browser para Socket.IO.
