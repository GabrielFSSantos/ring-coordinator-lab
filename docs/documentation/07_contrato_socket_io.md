# 07 Contrato Socket.IO

Servidor: cada nó escuta em `NODE_PORT`. Clientes: `socket.io-client` em `connecToNode` (`http://IP:PORT`), com resolução da Promise após **3s** (não exige `connected`).

## Eventos no servidor (`initServer`)

| Evento | Direção | Payload | Efeito |
| --- | --- | --- | --- |
| `ELEICAO` | peer → nó | `number[]` portas | `startElection(data)` |
| `COORDENADOR` | peer → nó | `{ coordinator: string, processList?: number[] }` | Após 15s: define líder, `setupCoordinatorServer` ou `setupRegularNodeServer` |
| `reconnect` | peer → nó | `{ port: number }` | `reconnect(port)` atualiza `ipList` |
| `Disconnect` | peer → nó | (vazio) | `removeCoordinator`, espera 80s, `connectToRing` |
| `log_request` | cliente → coordenador | ver [appendix](appendix_eventos_payloads.md) | `addToQueue` **se** handler registrado |

## Eventos cliente → coordenador (nó regular)

| Evento | Payload | Resposta |
| --- | --- | --- |
| `log_request` | `{ type, hostname, timestamp, requestId }` | `log_response-{requestId}` |
| `Disconnect` | — | Disparado localmente após timeout de resposta |

## Registro de `log_request` (importante)

Dentro de `io.on("connection")`:

```javascript
if (this.isCoordinator && !this.inElection) {
  socket.on("log_request", ...);
}
```

O handler só é ligado para conexões que chegam **quando o nó já é coordenador**. Conexões estabelecidas antes da eleição ou após mudança de papel podem ficar sem handler — lacuna documentada em [engineering_backlog.md](engineering_backlog.md).

## Eventos emitidos pelo nó

| Emissor | Evento | Destino |
| --- | --- | --- |
| Qualquer | `ELEICAO` | Sucessor |
| Iniciador da rodada | `COORDENADOR` | Sucessor + outros IPs (exceto sucessor) |
| Nó retornando | `reconnect` | Todos os outros em `connectToRing` |
| Cliente em timeout | `Disconnect` | Socket do coordenador |

## CORS

Socket.IO configurado com `origin: "*"` (adequado ao lab; não usar em produção).

Payloads exemplificados: [appendix_eventos_payloads.md](appendix_eventos_payloads.md).
