# 05 Eleição em anel

## Sucessor no anel lógico

Classe `RingTopology`: ordem por porta derivada do IP; sucessor = primeira porta maior que a local, com wrap.

| Nó | Porta | Sucessor |
| --- | --- | --- |
| ubuntu-node-2 | 3002 | 3003 |
| ubuntu-node-3 | 3003 | 3004 |
| ubuntu-node-4 | 3004 | 3005 |
| ubuntu-node-5 | 3005 | 3002 |

## Mensagem `election_round`

- **Payload:** array de portas (`electionList`).
- Regras em `ElectionService` + `NodeApplication.startElection` (mesma variante: lista + `max(port)` como líder — ver DR-003).

## Mensagem `coordinator_announce`

- **Payload:** `{ coordinatorPort: number, epoch: number, processList?: number[] }`
- Aplicado **imediatamente**; `epoch` ignora mensagens antigas.
- Propagação pelo anel via sucessor (cada nó repassa após aplicar).

## Boot

Somente o nó com **menor** `NODE_PORT` inicia `startElection([])` após o servidor escutar e o sucessor aceitar conexão.

## Reintegração: reconnect

Nó que voltou emite `reconnect` com `{ port, host }`. Pares atualizam `ipList`. Vizinhos podem propagar `coordinator_announce` conforme o estado local.

## Relação com a teoria

Não é Chang–Roberts literal (**B-CR1**). Ver [references/comparacao_algoritmos.md](../references/comparacao_algoritmos.md).

Eventos: [07_contrato_socket_io.md](07_contrato_socket_io.md).
