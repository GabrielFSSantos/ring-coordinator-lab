# Ring Coordinator Lab

Simulação em Docker de **eleição de coordenador em anel** e **exclusão mútua centralizada** sobre um recurso compartilhado (persistência em PostgreSQL).

Trabalho prático de sistemas distribuídos: a rede mantém um líder; se um nó falha, outro é eleito. Nós regulares solicitam acesso ao recurso de forma aleatória; o coordenador serializa as gravações.

## Documentação completa

Índice, fluxos, contratos Socket.IO, referências acadêmicas e guia para desenvolvedores/agentes: **[`docs/README.md`](docs/README.md)**.

Entrada rápida: [`docs/documentation/00_quickstart.md`](docs/documentation/00_quickstart.md) · [`docs/documentation/11_fluxo_ponta_a_ponta.md`](docs/documentation/11_fluxo_ponta_a_ponta.md).

Bibliografia (PDFs locais): [`docs/references/README.md`](docs/references/README.md).

## Requisitos

- Docker e Docker Compose
- Node.js 20+ (apenas para testes locais em `src/`)

## Subir o ambiente

```bash
cd ~/GitHub/ring-coordinator-lab
docker compose up --build
```

Serviços:

| Serviço | Host | Função |
| --- | --- | --- |
| `ubuntu-node-2` … `5` | portas `3002`–`3005` | Nós distribuídos (Socket.IO) |
| `postgres` | `localhost:5432` | Banco `distributed_systems_db` |
| `dbadmin` (pgAdmin) | `localhost:5050` | UI (`admin@admin.com` / `pgadmin4`) |

Schema inicial: [`tabela.sql`](tabela.sql) (`log_entries`: `hostname`, `timestamp`).

## Variáveis por nó (compose)

Cada nó define:

- `HOSTNAME` — nome do container
- `IP_LOCAL` — IP na rede `172.25.0.0/16`
- `NODE_PORT` — porta do servidor (último octeto do IP + 3000)
- `IP_LIST` — lista CSV de IPs de todos os nós

## Código principal

- Entrada: [`src/server/main.js`](src/server/main.js)
- Lógica: [`src/server/DistribuitedNode.js`](src/server/DistribuitedNode.js) (classe `DistributedNode`)

## Testes (local)

```bash
cd src
npm ci
npm test
```

Os testes Jest podem estar desatualizados em relação à implementação atual; o gate mínimo valida `docker compose config` e `npm ci`.
