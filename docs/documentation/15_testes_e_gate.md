# 15 Testes e gate

## Gate

Script: `Workspaces/ring-coordinator-lab/harness/checks/run-gate.sh`

1. `docker compose config`
2. `npm ci` em `src/`
3. `npm test`

## Aceite E2E (checklist por fases)

`harness/checks/run-acceptance.sh` — gate + opcional `./lab start` + `scripts/lab-acceptance-checklist.sh`.

Duas rodadas completas: eleição → TX → kill do líder → ex-líder em `ringJoinDeferred` → novo líder → reingresso como participante → TX → repetir com alternância (ex. 3005 ↔ 3004). Kills via `POST /v1/control/leader-kill` (não depende de tenure).

Variáveis:

| Variável | Default | Uso |
| --- | --- | --- |
| `ACCEPTANCE_MODE` | `checklist` | `watch` = legado 180s (`lab-watch.sh`) |
| `LAB_ACCEPTANCE_START` | `0` | `1` sobe storage + nós antes do checklist |
| `MIN_TX` | `3` | TX Success mínimas por fase de transação |
| `PHASE_TIMEOUT_SEC` | `90` | Timeout por fase |
| `LEADER_COOLDOWN_MS` | `25000` | Espera elegibilidade do ex-líder no ciclo 2 |

Com `LAB_ACCEPTANCE_START=1`: `SIM_LEADER_SELF_TERM=false`, `SIM_TX_ENABLED=true` ao gerar `lab.env` para o `./lab start`.

## Mapa módulo → testes

| Módulo | Arquivo de teste |
| --- | --- |
| Anel / eleição local | `RingTopology.test.js`, `ElectionService.test.js`, `clusterElectionPolicy.test.js` |
| Fila coordenador | `RequestQueue.test.js` |
| Simulação TX | `SimulationRunner.test.js`, `SimulationPolicy.test.js` |
| Mandato do líder | `CoordinatorTenure.test.js` |
| Kill manual / anel | `LeaderKillRequest.test.js` |
| Storage primário LAN | `storage/__tests__/StoragePrimaryResolver.test.js` |
| Ledger SQLite | `LedgerDatabase.test.js` |
| Logs / merge peers | `DiscoveryMerge.test.js`, `LabLogger.test.js` |

## Comandos locais

```bash
cd ~/GitHub/ring-coordinator-lab/src
npm ci
npm test
```
