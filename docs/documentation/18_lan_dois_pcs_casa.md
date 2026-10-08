# LAN — dois PCs em casa (8 nós)

Roteiro com **um único** [`lab.env`](../../lab.env) (copiado de [`lab.env.example`](../../lab.env.example)) em cada máquina.

## Antes de começar

1. `cp lab.env.example lab.env` em **cada** PC.
2. Quem hospeda o banco informa o IP na rede; **todos** editam a mesma linha:
   `STORAGE_URL=http://<IP-DO-BANCO>:4000`
3. Cada pessoa ajusta: `ADVERTISE_HOST`, `LAB_HOST_NAME`, `ADVERTISE_PORT_BASE`, `NODE_COUNT`.
4. `DISCOVERY_MODE=mdns` (ou `manual` + `CLUSTER_PEERS` — ver abaixo).

## Portas (demo 4+4 nós)

| Host | Socket | HTTP nó | Storage |
| --- | --- | --- | --- |
| PC-A | 3002–3005 | 4002–4005 | 4000 |
| PC-B | 3006–3009 | 4006–4009 | — |

PC-A: `NODE_COUNT=4`, `ADVERTISE_PORT_BASE=3002`  
PC-B: `NODE_COUNT=4`, `ADVERTISE_PORT_BASE=3006`

## Subir serviços

**PC-A (banco)** — pode manter só o ledger rodando:

```bash
docker compose --profile storage --env-file lab.env up --build
# ou: ./scripts/lan-up.sh storage
# ou: cd src && npm run storage
```

**PC-A (banco + nós no mesmo PC):**

```bash
docker compose --profile storage --profile nodes --env-file lab.env up --build
```

**PC-B (só nós):**

```bash
docker compose --profile nodes --env-file lab.env up --build
# ou: cd src && npm run server   (NODE_COUNT=1 e um NODE_PORT, ou supervisor via compose)
```

## Fallback `DISCOVERY_MODE=manual`

```env
DISCOVERY_MODE=manual
CLUSTER_PEERS=IP_A:3002,IP_A:3003,IP_A:3004,IP_A:3005,IP_B:3006,IP_B:3007,IP_B:3008,IP_B:3009
```

`ADVERTISE_HOST` = IP alcançável pelo outro PC (WSL2: IP Wi‑Fi do Windows).

## Logs (vários nós no mesmo terminal)

**Narrativa global dos 8 nós** (timeline no storage; título com PC de origem):

No **PC do banco**, com profile `storage` sobe também o serviço `lan-tail`:

```bash
docker compose --profile storage --env-file lab.env up --build
docker compose --profile storage logs -f lan-tail
```

Cada linha usa `LAB_HOST_NAME` do nó que gravou o evento (ex.: `pc-sala-a · ubuntu-node-3006 · …`). Defina nomes **únicos** por PC no `lab.env` (`LAB_HOST_NAME=pc-sala-a` vs `pc-sala-b`).

Alternativa sem container: no PC do banco, `LOG_STDOUT_MODE=timeline_all` no `lab.env` e `cd src && npm run tail`.

Linhas de containers de nó podem intercalar no `docker compose logs`. Para um processo só:

```bash
docker compose --profile nodes --env-file lab.env logs -f lan-node
```

Com `LOG_FORMAT=human` (padrão), cada evento sai em bloco PT-BR com cabeçalho `LAB_HOST_NAME │ hostname │ :porta`. Ver [19_convencoes_codigo_e_logs.md](19_convencoes_codigo_e_logs.md).

## Verificação

- Logs: bloco `RING_VIEW` com 8 peers, líder e `STORAGE_URL`
- `curl http://<IP-B>:4006/v1/cluster/state`
- `curl http://<IP-BANCO>:4000/v1/ledger?limit=20`

Firewall: TCP 4000, 3002–3009, 4002–4009; UDP 5353 (mDNS).
