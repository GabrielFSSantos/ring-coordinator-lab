# 06 Testes, smoke e gate

## Unitários (Jest)

- `RingTopology` — sucessor, wrap, min port.
- `ElectionService` — participação e `max` líder.
- `RequestQueue` — ordem, limite, rejeição.

Localização: `src/server/__tests__/`.

## Smoke Docker

```bash
docker compose up --build
# aguardar estabilização; verificar data/log.db
docker stop ubuntu-node-5  # nova eleição em segundos
```

## Gate

`harness/checks/run-gate.sh` — `docker compose config`, `npm ci`, `npm test` obrigatório.
