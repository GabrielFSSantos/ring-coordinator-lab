# 04 Rede Docker / LAN

## Resumo

Rede local Docker e LAN Wi‑Fi — **compose único** e mDNS no pacote de finalização.

## Referências normativas

- Compose e perfis: [finalizacao-backend-operacao/03-compose-unico-e-flags.md](../finalizacao-backend-operacao/03-compose-unico-e-flags.md)
- `lab.env`: [finalizacao-backend-operacao/04-lab-env-perfis.md](../finalizacao-backend-operacao/04-lab-env-perfis.md)
- Descoberta automática: [finalizacao-backend-operacao/05-descoberta-lan-automatica.md](../finalizacao-backend-operacao/05-descoberta-lan-automatica.md)
- Teste 2 PCs: [finalizacao-backend-operacao/11-testes-e-gate.md](../finalizacao-backend-operacao/11-testes-e-gate.md)
- **LAN multi-host (N participants):** [finalizacao-backend-operacao/14-cenario-lan-multi-host.md](../finalizacao-backend-operacao/14-cenario-lan-multi-host.md)

## Comando atual (baseline)

```bash
docker compose --env-file lab.env up --build --remove-orphans
```

`docker-compose.lan.yml` será removido na execução do plano de finalização.
