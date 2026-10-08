# 10 Falhas e recuperação

Timeouts de aplicação e eventos explícitos — sem detector de falha distribuído completo.

## Timeout de resposta ao coordenador

Config: `TIMEOUT_LIMIT` (default 10s) em `config/env.js`.

1. Nó regular emite `log_request` com `requestId`.
2. `once` em `log_response-{requestId}`.
3. Sem resposta no prazo: marca suspeita e, no próximo tick do intervalo de requisições, emite `coordinator_suspect` no socket do coordenador e agenda nova eleição (debounce 500 ms).

## coordinator_suspect no coordenador

Recebido apenas se `isCoordinator`:

1. `removeCoordinator()`
2. `connectToRing()` (anuncia `reconnect`)
3. Debounce → `startElection([])` se necessário

Sem espera de 80 segundos.

## Reconexão de nó ausente

`reconnect({ port })` — reconstrói IP `172.25.0.{port % 3000}` e reinsere na topologia.

## Falha de conexão entre nós

`connectPeer` (Socket.IO) com timeout, `connect_error` e retries limitados — sem recursão infinita em `electSuccessor`.

## Cenários didáticos

| Ação | Resultado esperado (happy path) |
| --- | --- |
| Parar coordenador | `docker stop ubuntu-node-5` → timeouts, nova eleição em segundos |
| Reiniciar nó | `docker start …` → `reconnect` repopula topologia |

## Cenários frágeis

- Partição de rede: possível split-brain.
- Múltiplas eleições no boot mitigadas por iniciador único (menor porta).

Invariantes: [12_invariantes_e_limites.md](12_invariantes_e_limites.md).
