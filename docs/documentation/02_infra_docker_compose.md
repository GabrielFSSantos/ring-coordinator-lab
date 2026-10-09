# 02 Infraestrutura Docker Compose

Arquivo: [`docker-compose.yml`](../../docker-compose.yml).

## Serviços (perfis)

| Container | Serviço | Profile | Comando |
| --- | --- | --- | --- |
| `ring-storage` | `storage` | `storage` | `./lab storage` |
| `ubuntu-node-3002`…`3005` | `node-3002`… | `local` | `./lab start` |
| `ring-node-join` | `node-join` | `node` | `./lab node --docker` |

Não há container `tail` — use `./lab logs` no host.

Rede `lab` (DNS `storage` quando o banco sobe via Compose). Nós usam `LAB_DOCKER_STORAGE_URL` (padrão `http://storage:4000`; banco nativo: `http://host.docker.internal:4000`).

## Ordem de subida

Banco e nós são independentes no Compose (sem `depends_on`). O coordenador rejeita TX sem storage; o monitor de storage recupera quando `./lab storage` sobe.
