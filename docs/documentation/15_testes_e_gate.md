# 15 Testes e gate

## Gate (meta-workspace)

Script: `harness/checks/run-gate.sh`

1. `docker compose config`
2. `npm ci` em `src/`
3. `npm test` (obrigatório)

## Suíte Jest

Pasta: [`src/server/__tests__/`](../../src/server/__tests__/)

| Arquivo | Escopo |
| --- | --- |
| `RingTopology.test.js` | Sucessor, min port, reconexão |
| `ElectionService.test.js` | Regras de participação e `max` líder |
| `RequestQueue.test.js` | FIFO e `queue_full` |
| `SqliteLogRepository.test.js` | INSERT + RETURNING |

## Comandos locais

```bash
cd ~/GitHub/ring-coordinator-lab/src
npm ci
npm test
```

Integração Docker (smoke manual): ver [00_quickstart.md](00_quickstart.md).
