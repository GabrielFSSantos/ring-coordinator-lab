# 04 Módulo da aplicação (NodeApplication)

Orquestrador: [`src/server/application/NodeApplication.js`](../../src/server/application/NodeApplication.js).

Domínio e infraestrutura:

| Pasta | Conteúdo |
| --- | --- |
| `domain/ring/RingTopology.js` | Anel, sucessor, `ipList` |
| `domain/election/ElectionService.js` | Regras puras da eleição |
| `domain/coordinator/RequestQueue.js` | Fila do coordenador |
| `infrastructure/socket/SocketPeerClient.js` | Cliente Socket.IO |
| `infrastructure/persistence/SqliteLogRepository.js` | SQLite |
| `config/env.js` | Timeouts e limites |

## Configuração (env)

Ver [appendix_variaveis_ambiente.md](appendix_variaveis_ambiente.md) e `loadConfig()` em `config/env.js`.

Principais: `TIMEOUT_LIMIT`, `MIN_REQUEST_INTERVAL_MS`, `QUEUE_LIMIT`, `DATABASE_PATH`.

## Fluxos

| Fluxo | Onde |
| --- | --- |
| Eleição | `startElection`, `completeElection` |
| Líder | `onCoordinatorMessage`, `setupCoordinator` |
| Cliente regular | `setupRegularNode`, `startRegularClientLoop` |
| Mutex | `addToQueue`, `processRequest` |

Detalhes: [05](05_eleicao_em_anel.md), [06](06_exclusao_mutua_centralizada.md), [10](10_falhas_e_recuperacao.md).
