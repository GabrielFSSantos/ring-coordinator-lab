# 02 Infraestrutura Docker Compose

Arquivo: [`docker-compose.yml`](../../docker-compose.yml) na raiz do repositório.

## Profiles

| Profile | Uso | Serviços principais |
| --- | --- | --- |
| `local` | 1 PC, bridge `172.25.0.x` | `storage`, 4× `ubuntu-node-*`, `lab-tail` |
| `storage` | LAN — PC do banco | `lan-storage`, `lan-tail` |
| `nodes` | LAN — processos nó (`host`) | `lan-node` (supervisor `NODE_COUNT`) |
| `tail` | LAN — só narrativa global | `lan-tail` (poll em `STORAGE_URL` remoto) |

Combinações comuns: `storage`+`nodes` no PC-A; `nodes` no PC-B; `tail` em qualquer PC observador. Variáveis: [`lab.env.example`](../../lab.env.example). Roteiro 8 nós: [18_lan_dois_pcs_casa.md](18_lan_dois_pcs_casa.md).

## Rede

- Nome: `app_network`, driver `bridge`.
- Sub-rede: `172.25.0.0/16`.
- IPs estáticos por serviço (facilita `IP_LIST`).

| IP | Serviço |
| --- | --- |
| 172.25.0.2 | ubuntu-node-2 |
| 172.25.0.3 | ubuntu-node-3 |
| 172.25.0.4 | ubuntu-node-4 |
| 172.25.0.5 | ubuntu-node-5 |

## Serviços de aplicação (nós)

Quatro serviços com a mesma imagem (`build` com contexto na raiz do repo, `dockerfile: src/Dockerfile`), diferindo por:

- `container_name`
- `environment`: `HOSTNAME`, `IP_LOCAL`, `NODE_PORT`, `IP_LIST`, `DATABASE_PATH`, `SCHEMA_PATH`
- `volumes`: `./data:/data` (arquivo SQLite visível no host)
- `ports`: `"300x:300x"`
- `ipv4_address`

Regra de porta: **último octeto do IP + 3000** (ex.: `.5` → `3005`). Implementação: `RingTopology` — ver [08_utilitarios.md](08_utilitarios.md) e [14_arquitetura_e_manutencao.md](14_arquitetura_e_manutencao.md).

`IP_LIST` é CSV com os quatro IPs dos nós.

## Build da imagem do nó

- Base: `node:20-bookworm-slim`
- `npm ci --omit=dev`, `CMD node server/bootstrap/main.js`
- Ver [03_entrypoints_e_build.md](03_entrypoints_e_build.md).

## Variáveis por nó

Tabela completa: [appendix_variaveis_ambiente.md](appendix_variaveis_ambiente.md).

## Comandos úteis

```bash
docker compose config
docker compose up --build -d
docker compose logs -f ubuntu-node-3
docker compose ps
sqlite3 data/log.db "SELECT COUNT(*) FROM log_entries;"
```

Validação no gate externo: `run-gate.sh` no meta-workspace ( `docker compose config` + `npm ci` + `npm test` ).
