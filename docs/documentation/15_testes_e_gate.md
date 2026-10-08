# 15 Testes e gate

## Gate mínimo (meta-workspace)

Script: `harness/checks/run-gate.sh` (fora deste repo, no meta-workspace do Ring Coordinator Lab).

Executa:

1. `docker compose config` (se `docker` no PATH)
2. `npm ci` em `src/`
3. `npm test` — **opcional**; falha documentada não falha o gate

## Estado atual do Jest

Arquivo: [`src/server/DistribuitedNode.test.js`](../../src/server/DistribuitedNode.test.js)

Problemas conhecidos:

| Problema | Detalhe |
| --- | --- |
| Import | `require("./DistributedNode")` — arquivo real é `DistribuitedNode.js` |
| API | Testes esperam `hostId`, `processId`, `listPorts`, `successorIp` no construtor |
| Assertions | Uso incorreto de `expected(node.hostId).toBe(...)` |

**Conclusão:** `npm test` não valida o comportamento distribuído atual. O README e este doc refletem isso.

## Plano de testes sugerido (futuro)

| Camada | Escopo | Ferramenta |
| --- | --- | --- |
| Unit | `ipsToObjectSorted`, `getClientPort`, ramos de `startElection` com mocks | Jest |
| Unit | Fila: ordem FIFO, `queueLimit`, `isProcessing` | Jest |
| Integração | Compose: 4 nós + assert em `log_entries` após N segundos | script shell / testcontainers |
| Contrato | Payloads `log_request` / `log_response` | snapshot ou schema |

Prioridade: corrigir import e um teste mínimo de env (`HOSTNAME`, `port` a partir de `NODE_PORT`).

## Comandos locais

```bash
cd ~/GitHub/ring-coordinator-lab/src
npm ci
npm test
```

## Documentação e gate

Ao adicionar testes, atualizar matriz em [13_guia_dev_e_agente.md](13_guia_dev_e_agente.md) e considerar exigir `npm test` no `run-gate.sh` quando a suíte estiver verde.
