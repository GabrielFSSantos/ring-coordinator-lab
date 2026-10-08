# 18 Checklist pronto

- [x] `lab.env.example` + `scripts/load-lab-env.sh`
- [x] Serviço `src/storage/` com primário/standby
- [x] `transaction_request` + fila + HTTP apply
- [x] Leitura `GET /v1/balance` (storage)
- [x] `LabLogger` + flags LOG_*
- [x] `SIM_MODE` manual/auto + `leader_kill_request`
- [x] `PendingTransactionBuffer`
- [x] `docker-compose.yml` com storage
- [x] `docker-compose.lan.yml` v1
- [x] `CLUSTER_PEERS` + reconnect com host
- [x] v2: `NODE_COUNT` 2–4 por host (`main.js` supervisor + `scripts/generate-cluster-peers.sh`)
- [x] Testes Jest + gate
- [x] DR-007 + doc 17

## Continuação

Aceite final backend/UI: [finalizacao-backend-operacao/13-checklist-aceite-backend.md](../finalizacao-backend-operacao/13-checklist-aceite-backend.md) e [console-frontend-lab/10-checklist-aceite-frontend.md](../console-frontend-lab/10-checklist-aceite-frontend.md).
