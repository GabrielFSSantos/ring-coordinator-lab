# Apêndice — payloads de eventos

## election_round

```json
[3002, 3003, 3004]
```

Array de números (`NODE_PORT`) na ordem de participação da rodada.

## coordinator_announce

```json
{
  "coordinatorPort": 3005,
  "epoch": 1710000000123,
  "processList": [3002, 3003, 3004, 3005]
}
```

`processList` opcional na propagação a partir do iniciador.

## reconnect

```json
{
  "port": 3003,
  "host": "10.0.0.12"
}
```

## transaction_request

Corpo da transação (simulação / cliente): inclui `requestId`, `delta` ou `deltaCents`, identificação do nó, etc.

## transaction_response-{requestId}

Sucesso:

```json
{
  "status": "Success",
  "data": { }
}
```

Falha:

```json
{
  "status": "Failure",
  "error": "mensagem"
}
```

## log_request

```json
{
  "type": "log_request",
  "hostname": "ubuntu-node-3",
  "timestamp": 1710000000123,
  "requestId": "req-1710000000123-0.123456789"
}
```

## Disconnect

Sem payload (evento vazio).

Contrato completo: [07_contrato_socket_io.md](07_contrato_socket_io.md).
