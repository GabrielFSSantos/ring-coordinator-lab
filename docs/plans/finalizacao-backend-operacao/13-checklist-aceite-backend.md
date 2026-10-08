# 13 Checklist aceite (backend)

## Resumo

Critérios mensuráveis para considerar a **finalização backend** pronta para integrar o console web e demonstrar em 2 PCs.

## Docker local (1 máquina)

- [ ] `docker compose --env-file lab.env up --build` sobe storage + 4 nós sem crash
- [ ] `GET http://localhost:4000/v1/balance` retorna saldo coerente
- [ ] Modo `auto`: kill lógico ~a cada 25 s; reeleição visível nos logs
- [ ] Cada follower: ~2 `TX_SEND` por janela de 5 s (tolerância ±500 ms)
- [ ] Ledger contém entradas `txn` e `admin` em kills
- [ ] `grep req=<id>` mostra cadeia TX_* documentada em cap. 07
- [ ] `LOG_SIM=false` silencia kills; `LOG_WRITES=false` silencia tx

## API controle

- [ ] `PATCH /v1/simulation` altera intervalo/burst sem restart
- [ ] `POST /v1/control/pause` para envio no nó alvo
- [ ] `POST /v1/transactions` no nó com delta fixo aparece no ledger

## LAN (2 PCs)

- [ ] `DISCOVERY_MODE=mdns`: peers aparecem sem `CLUSTER_PEERS` manual
- [ ] Um único primário storage; segundo host não cria ledger paralelo
- [ ] Transações de PC-B visíveis no ledger consultado em PC-A
- [ ] Fallback `DISCOVERY_MODE=manual` documentado e testado uma vez

## LAN multi-host (1 storage host + ≥2 participants)

Ver [14-cenario-lan-multi-host.md](14-cenario-lan-multi-host.md) e matriz [15-matriz-cenarios-operacao.md](15-matriz-cenarios-operacao.md).

- [ ] Todos usam o mesmo `STORAGE_URL` no `lab.env.example` — sem editar `CLUSTER_PEERS` (mDNS)
- [ ] Fases 1–4: descarte com storage off; ledger atualiza; recuperação sem reenvio de txs perdidas
- [ ] `SIM_MODE=manual` (sem kill) fora de demos automatizadas
- [ ] Líder pode estar em qualquer host; visível via `LAB_HOST_NAME` nos logs/ledger

## Qualidade

- [ ] `npm test` no gate passa
- [ ] `docker compose --env-file lab.env config` passa
- [ ] DR-008 registrado
- [ ] `docker-compose.lan.yml` removido
- [ ] Sem referência a Postgres como persistência principal na doc harness

## Fora de escopo deste checklist

- Aceite visual do frontend (ver [console-frontend-lab/10-checklist-aceite-frontend.md](../console-frontend-lab/10-checklist-aceite-frontend.md)).
