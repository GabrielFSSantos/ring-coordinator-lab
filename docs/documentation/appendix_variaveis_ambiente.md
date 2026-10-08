# Apêndice — variáveis de ambiente

Definidas no [`docker-compose.yml`](../../docker-compose.yml) por serviço de nó.

## Variáveis comuns

| Variável | Descrição | Exemplo |
| --- | --- | --- |
| `HOSTNAME` | Nome do container / identificador em log | `ubuntu-node-3` |
| `IP_LOCAL` | IP fixo na rede Docker | `172.25.0.3` |
| `NODE_PORT` | Porta Socket.IO do processo | `3003` |
| `IP_LIST` | CSV de IPs de **todos** os nós do anel | `172.25.0.2,172.25.0.3,172.25.0.4,172.25.0.5` |

## Por serviço (compose padrão)

| Serviço | HOSTNAME | IP_LOCAL | NODE_PORT |
| --- | --- | --- | --- |
| ubuntu-node-2 | ubuntu-node-2 | 172.25.0.2 | 3002 |
| ubuntu-node-3 | ubuntu-node-3 | 172.25.0.3 | 3003 |
| ubuntu-node-4 | ubuntu-node-4 | 172.25.0.4 | 3004 |
| ubuntu-node-5 | ubuntu-node-5 | 172.25.0.5 | 3005 |

`IP_LIST` é idêntica nos quatro.

## PostgreSQL (serviço postgres)

| Variável | Valor |
| --- | --- |
| `POSTGRES_DB` | distributed_systems_db |
| `POSTGRES_USER` | user |
| `POSTGRES_PASSWORD` | password |

**Nota:** o aplicativo Node não lê essas env vars hoje — credenciais estão hardcoded em `connectToDatabase`.

## Adicionar quinto nó

1. Novo serviço no compose com IP livre (ex. `172.25.0.8`, porta `3008`).
2. Atualizar `IP_LIST` em **todos** os nós.
3. Revisar [08_utilitarios.md](08_utilitarios.md) se o esquema IP↔porta mudar.
