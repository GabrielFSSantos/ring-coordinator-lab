# Casa — Gabriel (PC1) + gfswo (PC2)

| PC | Wi-Fi IPv4 | Papel |
| --- | --- | --- |
| PC1 Gabriel | `192.168.3.131` | Banco + 4 nós |
| PC2 gfswo | `192.168.3.125` | 4 nós + `lan-tail` |

**Não use** os IPs `172.25.x` / `172.18.x` do Hyper-V/WSL no `CLUSTER_PEERS`.

## PC1 (Gabriel) — WSL, na pasta do repo

**Opção A — só este PC (4 nós, sem PC2):**

```bash
docker compose --profile local --env-file lab.env up --build
docker compose --profile local logs -f lab-tail
```

**Opção B — 8 nós com PC2 (recomendado):**

```bash
cp configs/pc1-gabriel-8nodes.lab.env lab.env
docker compose --profile storage --profile nodes --env-file lab.env up --build
docker compose --profile storage logs -f lan-tail
```

Libere no Firewall do Windows: TCP **4000**, **3002–3005**, **4002–4005**.

## PC2 (gfswo) — WSL, na pasta do repo

Depois do `git pull`:

```bash
./scripts/run-on-pc-b.sh
```

Equivalente manual:

```bash
cp configs/pc2-gfswo.lab.env lab.env
curl http://192.168.3.131:4000/v1/health
docker compose --profile nodes --profile tail --env-file lab.env up --build
```

Só logs do tail (outro terminal):

```bash
docker compose --profile tail --env-file lab.env logs -f lan-tail
```

Firewall PC2: TCP **3006–3009**, **4006–4009**.

## Testes

No PC2:

```bash
curl http://192.168.3.131:4000/v1/balance
curl http://192.168.3.125:4006/v1/cluster/state
```
