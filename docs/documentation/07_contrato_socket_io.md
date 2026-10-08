# 07 Contrato Socket.IO

Servidor: cada nó escuta em `NODE_PORT`. Clientes: `connectPeer` em `infrastructure/socket/SocketPeerClient.js` (resolve em `connect`, `connect_error` ou timeout).

Constantes no código: [`src/server/domain/protocol/socketEvents.js`](../../src/server/domain/protocol/socketEvents.js).

## Eventos no servidor

| Evento | Direção | Payload | Efeito |
| --- | --- | --- | --- |
| `election_round` | peer → nó | `number[]` | `startElection` |
| `coordinator_announce` | peer → nó | `{ coordinatorPort, epoch, processList? }` | Define líder; repassa ao sucessor |
| `reconnect` | peer → nó | `{ port, host? }` | Atualiza topologia |
| `coordinator_suspect` | cliente → coordenador | — | Coordenador abdica e reintegra anel |
| `transaction_request` | cliente → coordenador | ver appendix / simulação | Enfileira transação |
| `log_request` | cliente → coordenador | ver appendix | `addToQueue` |

## Eventos cliente → coordenador

| Evento | Resposta |
| --- | --- |
| `transaction_request` | `transaction_response-{requestId}` |
| `log_request` | `transaction_response-{requestId}` |
| `coordinator_suspect` | (nó regular após timeout) |

## log_request

Registrado em **toda** conexão quando o nó é coordenador (`registerCoordinatorHandlers`), incluindo conexões já abertas ao assumir o papel (`registerCoordinatorHandlersOnAllSockets`).

## Eventos emitidos

| Emissor | Evento | Destino |
| --- | --- | --- |
| Participante | `election_round` | Sucessor |
| Iniciador da rodada | `coordinator_announce` | Sucessor (anel) |
| Retorno ao anel | `reconnect` | Pares em `connectToRing` |

## CORS

`origin: "*"` — apenas para o lab.

Payloads: [appendix_eventos_payloads.md](appendix_eventos_payloads.md).
