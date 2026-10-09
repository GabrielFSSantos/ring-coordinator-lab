# Casa — Gabriel (PC1) + gfswo (PC2)

Banco: `./lab storage`. Quatro nós: `./lab start`. Um nó: `./lab node`. Logs: `./lab logs` (host).

| PC | Wi-Fi | Comando |
| --- | --- | --- |
| PC1 | `192.168.3.131` (anel) · `STORAGE_URL=http://127.0.0.1:4000` no Docker | `./scripts/run-on-pc-a.sh` |
| PC2 | `192.168.3.125` | `./scripts/run-on-pc-b.sh` |

Narrativa: `docker compose logs -f tail`

Parar no PC1: `./scripts/lab-up.sh down`

Firewall: PC1 TCP 4000, 3002–3005 · PC2 TCP 3006–3009
