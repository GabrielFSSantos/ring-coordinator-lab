# Scripts

- `load-lab-env.sh` — exporta `lab.env` (ou `lab.env.example`) no shell.
- `generate-cluster-peers.sh` — monta `CLUSTER_PEERS` para `NODE_COUNT` nós no mesmo `ADVERTISE_HOST`.
- `merge-cluster-peers.sh` — une dois CSVs de peers (anel multi-PC).

Docker: `docker compose --env-file lab.env up --build`.

LAN: edite `CLUSTER_PEERS` e `STORAGE_URL` em cada PC; v2 use `generate-cluster-peers.sh` por host e `merge-cluster-peers.sh` para o anel completo.
