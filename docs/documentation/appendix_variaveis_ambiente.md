# Apêndice — variáveis de ambiente

Definidas no [`docker-compose.yml`](../../docker-compose.yml) por serviço de nó.

## Variáveis comuns

| Variável | Descrição | Exemplo |
| --- | --- | --- |
| `HOSTNAME` | Nome do container / log | `ubuntu-node-3` |
| `IP_LOCAL` | IP na rede Docker | `172.25.0.3` |
| `NODE_PORT` | Porta Socket.IO | `3003` |
| `IP_LIST` | CSV de IPs de todos os nós | `172.25.0.2,…,172.25.0.5` |
| `DATABASE_PATH` | Arquivo SQLite | `/data/log.db` |
| `SCHEMA_PATH` | DDL inicial | `/app/schema.sql` |

## Opcionais (defaults em `config/env.js`)

| Variável | Default |
| --- | --- |
| `TIMEOUT_LIMIT` | 10000 |
| `MIN_REQUEST_INTERVAL_MS` | 15000 |
| `MAX_REQUEST_INTERVAL_MS` | 25000 |
| `QUEUE_LIMIT` | 6 |
| `PEER_CONNECT_TIMEOUT_MS` | 3000 |
| `PEER_CONNECT_RETRIES` | 3 |
| `ELECTION_DEBOUNCE_MS` | 500 |

## Por serviço (compose padrão)

| Serviço | IP_LOCAL | NODE_PORT |
| --- | --- | --- |
| ubuntu-node-2 | 172.25.0.2 | 3002 |
| ubuntu-node-3 | 172.25.0.3 | 3003 |
| ubuntu-node-4 | 172.25.0.4 | 3004 |
| ubuntu-node-5 | 172.25.0.5 | 3005 |

## Adicionar quinto nó

1. Novo serviço com IP livre e porta `3000 + último octeto`.
2. Atualizar `IP_LIST` em todos os nós.
3. Revisar [08_utilitarios.md](08_utilitarios.md).
