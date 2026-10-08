# Apêndice — payloads de eventos

## ELEICAO

```json
[3002, 3003, 3004]
```

Array de números (`NODE_PORT`) na ordem de participação da rodada.

## COORDENADOR

```json
{
  "coordinator": "172.25.0.5",
  "processList": [3002, 3003, 3004, 3005]
}
```

`processList` opcional na propagação a partir do iniciador.

## reconnect

```json
{
  "port": 3003
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

## log_response-{requestId}

Sucesso:

```json
{
  "status": "Success",
  "data": null
}
```

(`data` pode ser `undefined` — `INSERT` sem `RETURNING`.)

Falha:

```json
{
  "status": "Failure",
  "error": "mensagem do PostgreSQL"
}
```

## Disconnect

Sem payload (evento vazio).

Contrato completo: [07_contrato_socket_io.md](07_contrato_socket_io.md).
