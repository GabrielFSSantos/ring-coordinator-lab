# Plano: simulação LAN + ledger

Índice da implementação **baseline** (backend storage HTTP + ledger). Vários capítulos abaixo eram stubs; o detalhamento normativo continua em:

- **Finalização backend:** [finalizacao-backend-operacao/README.md](../finalizacao-backend-operacao/README.md)
- **Console web:** [console-frontend-lab/README.md](../console-frontend-lab/README.md)

## Continuação (pós-baseline)

| Tema | Pacote novo |
| --- | --- |
| Compose único, mDNS, demo 2/5s, kill 25s, logs, API controle | [finalizacao-backend-operacao/](../finalizacao-backend-operacao/README.md) |
| UI ledger + log + comandos | [console-frontend-lab/](../console-frontend-lab/README.md) |
| LAN multi-host | [finalizacao-backend-operacao/14-cenario-lan-multi-host.md](../finalizacao-backend-operacao/14-cenario-lan-multi-host.md) |

`docker-compose.lan.yml` está **obsoleto** no plano de execução — ver [finalizacao-backend-operacao/03-compose-unico-e-flags.md](../finalizacao-backend-operacao/03-compose-unico-e-flags.md).

## Índice histórico (baseline)

1. [01-visao-escopo-nao-escopo.md](01-visao-escopo-nao-escopo.md)
2. [02-glossario-e-modos.md](02-glossario-e-modos.md)
3. [03-lab-env-flags.md](03-lab-env-flags.md) — parcialmente vivo; ver também [04-lab-env-perfis.md](../finalizacao-backend-operacao/04-lab-env-perfis.md)
4. [04-rede-docker-lan.md](04-rede-docker-lan.md) — ver compose único no pacote novo
5. [05-storage-servico-unico.md](05-storage-servico-unico.md)
6. [06-schema-ledger-sqlite.md](06-schema-ledger-sqlite.md)
7. [07-protocolo-anel-eleicao.md](07-protocolo-anel-eleicao.md)
8. [08-caminho-escrita-fila.md](08-caminho-escrita-fila.md)
9. [09-caminho-leitura.md](09-caminho-leitura.md)
10. [10-falhas-storage-vs-lider.md](10-falhas-storage-vs-lider.md)
11. [11-simulacao-carga-fixa.md](11-simulacao-carga-fixa.md)
12. [12-queda-lider-controlada.md](12-queda-lider-controlada.md)
13. [13-logging-prints.md](13-logging-prints.md) — parcial; ver cap. 07 pacote novo
14. [14-api-http-contrato.md](14-api-http-contrato.md)
15. [15-compose-perfis.md](15-compose-perfis.md)
16. [16-testes-cenarios.md](16-testes-cenarios.md)
17. [17-fases-implementacao.md](17-fases-implementacao.md)
18. [18-checklist-pronto.md](18-checklist-pronto.md) — baseline; aceite final em [13-checklist-aceite-backend.md](../finalizacao-backend-operacao/13-checklist-aceite-backend.md)
19. [appendix-payloads-eventos.md](appendix-payloads-eventos.md)

Código: `src/storage/`, `src/server/application/NodeApplication.js`, `lab.env`, `docker-compose.yml`.
