# 06 Simulação: carga e kill (defaults demo)

## Resumo

Define o comportamento normativo da carga simulada **antes** do frontend controlar parâmetros: **2 escritas a cada 5 segundos por máquina follower**, modo **auto**, queda lógica do líder **a cada 25 segundos**.

## Pré-requisitos

- [simulacao-lan-ledger/11-simulacao-carga-fixa.md](../simulacao-lan-ledger/11-simulacao-carga-fixa.md) (substituído por este capítulo)
- `SimulationRunner.js`, `NodeApplication.sendSimulatedTransaction`

## Perfis de simulação

| Perfil | `SIM_MODE` | Kill | Burst / intervalo |
| --- | --- | --- | --- |
| **LAN / apps reais** | `manual` | desligado | `SIM_TX_BURST=1`, `SIM_TX_INTERVAL_MS≥10000` (ver [lab.env.example](../../../lab.env.example)) |
| **Demo casa / Docker local** | `auto` | 25s | burst 2 / 5s (valores abaixo) |

## Decisões e invariantes

- **Follower only:** líder **NÃO** envia transações simuladas (mantém invariante atual).
- **Burst:** cada ciclo do timer **DEVE** enviar `SIM_TX_BURST` transações (default **2**) com `requestId` distintos.
- **Intervalo:** `SIM_TX_INTERVAL_MS=5000` entre **início de ciclos** consecutivos no mesmo nó (não entre txs do burst — burst é sequencial imediato ou com micro-delay < 50ms documentado na implementação).
- **Kill:** `SIM_MODE=auto` e `SIM_LEADER_KILL_INTERVAL_MS=25000`; protocolo `leader_kill_request` existente.
- **Iniciador único:** regra atual `SIM_LEADER_KILL_INITIATOR` ou nó com `min(port)` no anel.
- Durante `inElection`, **NÃO** disparar kill; runner pausa envio de tx.

## Comportamento esperado

### Env vars demo (lab.env perfil docker-local)

```bash
SIM_MODE=auto
SIM_TX_BURST=2
SIM_TX_INTERVAL_MS=5000
SIM_TX_JITTER_MS=0
SIM_LEADER_KILL_INTERVAL_MS=25000
SIM_DELTA_MIN=-500
SIM_DELTA_MAX=500
```

### Carga agregada (4 followers)

- Teórico máximo: **8 transações / 5 s** (2 × 4 nós), mais jitter futuro via UI.
- Fila do líder serializa; ordem global = ordem de chegada na fila.

### Kill automático

1. Iniciador agenda `setInterval` 25s → `requestLeaderKill`.
2. Líder atual: `simulatedDown`, admin ledger, `coordinator_suspect`, reeleição.
3. `SimulationRunner` no novo líder: `stop()`; followers: `start()`.

### Evolução API (frontend)

Campos de `PATCH /v1/simulation` **DEVEM** espelhar estas env vars (cap. 09); env permanece defaults de boot.

## Arquivos alvo

| Path | Mudança |
| --- | --- |
| `src/server/config/env.js` | `simTxBurst` |
| `src/server/application/SimulationRunner.js` | loop burst |
| `lab.env` / `lab.env.example` | defaults demo |

## Critérios de aceite

- [ ] Com 4 nós em Docker, logs mostram ~2 `TX_SEND` por follower a cada ~5s.
- [ ] A cada ~25s, eventos `KILL_REQUEST` / `LEADER_DOWN` e nova eleição.
- [ ] `SIM_MODE=manual` desliga kill, mantém burst/intervalo.

## Riscos

| Risco | Mitigação |
| --- | --- |
| Fila saturada | `QUEUE_LIMIT` rejeita com log |
| Kill durante tx | Buffer cliente + reprocessamento |

## Fora de escopo

- Distribuição Poisson de carga; API dinâmica na v1 de código (só env até API pronta).
