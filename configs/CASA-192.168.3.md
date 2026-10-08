# Casa — Gabriel (PC1) + gfswo (PC2)

| PC | Wi-Fi | Script |
| --- | --- | --- |
| PC1 | `192.168.3.131` | `./scripts/run-on-pc-a.sh` |
| PC2 | `192.168.3.125` | `./scripts/run-on-pc-b.sh` |

Firewall: PC1 TCP 4000, 3002–3005, 4002–4005 · PC2 TCP 3006–3009, 4006–4009.

## PC1 — copiar no WSL (Afrodite)

```bash
cd ~/GitHub/ring-coordinator-lab
git pull
chmod +x scripts/run-on-pc-a.sh
./scripts/run-on-pc-a.sh
```

Narrativa (outro terminal):

```bash
cd ~/GitHub/ring-coordinator-lab
docker compose --profile storage logs -f lan-tail
```

Teste:

```bash
curl -s http://127.0.0.1:4000/v1/health
curl -s http://192.168.3.131:4000/v1/health
```

## PC2 — copiar no WSL (Vostro15)

Requer Docker Desktop com integração WSL. Depois do PC1 no ar:

```bash
cd ~/GitHub/ring-coordinator-lab
git pull
chmod +x scripts/run-on-pc-b.sh
./scripts/run-on-pc-b.sh
```

Teste:

```bash
curl -s http://192.168.3.131:4000/v1/health
curl -s http://192.168.3.125:4006/v1/cluster/state
```
