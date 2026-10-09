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

## Travessia do anel (`ringRelay`)

Cada nó mantém a lista ordenada de peers (`RingTopology.portsInOrder`, mDNS/`mergeDiscoveredPeers`). Para **enviar** `election_round`, `coordinator_announce` ou `coordinator_suspect`, usa `ringPortsAfterLocal()` e tenta conectar porta a porta até o primeiro peer vivo (`emitAlongRing` / `connectAlongRing`). Se o sucessor lógico não responde, o token **pula** para o próximo da lista sem remover o peer do mapa (ele pode estar em recuperação).

## Ex-líder em recuperação (`ringJoinDeferred`)

Após renúncia/kill simulado, o ex-coordenador **não participa** da eleição nem mantém link de sucessor, mas **repassa** mensagens de controle recebidas (modo relay). Ao aplicar `coordinator_announce` de outro nó (`COORDINATOR_APPLY`), volta ao anel como participante sem nova eleição.

## Mensagem `coordinator_announce`

- **Payload:** `{ coordinatorPort: number, epoch: number, processList?: number[] }`
- Aplicado **imediatamente**; `epoch` ignora mensagens antigas.
- Propagação pelo anel via `emitAlongRing` (cada nó repassa após aplicar).

## Join tardio sem resetar líder

Após `reconnect` ou merge mDNS, o nó consulta `GET /v1/cluster/state` nos peers (`syncClusterStateFromPeers`) e aplica líder com `epoch` maior antes de agendar eleição.

## Boot

Somente o nó com **menor** `NODE_PORT` inicia `startElection([])` após o servidor escutar e o sucessor aceitar conexão.

## Reintegração: reconnect

Nó que voltou emite `reconnect` com `{ port, host }`. Pares atualizam `ipList`. Vizinhos podem propagar `coordinator_announce` conforme o estado local.

## Relação com a teoria

Não é Chang–Roberts literal (**B-CR1**). Ver [references/comparacao_algoritmos.md](../references/comparacao_algoritmos.md).

Eventos: [07_contrato_socket_io.md](07_contrato_socket_io.md).
