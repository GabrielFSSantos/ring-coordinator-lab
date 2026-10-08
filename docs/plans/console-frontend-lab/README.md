# Plano: console frontend (lab UI)

Pacote de **contrato de implementação** para a interface web do Ring Coordinator Lab: leitura do ledger no storage, observação do cluster, painel de log em tempo real e controles de simulação/comandos nos nós.

**Dependência:** backend conforme [finalizacao-backend-operacao/09-api-http-controle-v1.md](../finalizacao-backend-operacao/09-api-http-controle-v1.md) (pelo menos leitura storage + state; controles conforme fases).

## Pré-requisitos

1. [finalizacao-backend-operacao/README.md](../finalizacao-backend-operacao/README.md)
2. [documentation/14_arquitetura_e_manutencao.md](../../documentation/14_arquitetura_e_manutencao.md)

## Índice

| # | Capítulo |
| --- | --- |
| 01 | [visao-escopo-nao-escopo.md](01-visao-escopo-nao-escopo.md) |
| 02 | [stack-e-layout.md](02-stack-e-layout.md) |
| 03 | [modelo-dados-e-fontes.md](03-modelo-dados-e-fontes.md) |
| 04 | [telas-e-componentes.md](04-telas-e-componentes.md) |
| 05 | [comandos-e-controles.md](05-comandos-e-controles.md) |
| 06 | [fluxos-usuario.md](06-fluxos-usuario.md) |
| 07 | [estado-front-e-erros.md](07-estado-front-e-erros.md) |
| 08 | [acessibilidade-e-ux-lab.md](08-acessibilidade-e-ux-lab.md) |
| 09 | [fases-implementacao-frontend.md](09-fases-implementacao-frontend.md) |
| 10 | [checklist-aceite-frontend.md](10-checklist-aceite-frontend.md) |
| — | [appendix-mapeamento-log-ui.md](appendix-mapeamento-log-ui.md) |

## LAN multi-host

Roteiro operacional: [finalizacao-backend-operacao/14-cenario-lan-multi-host.md](../finalizacao-backend-operacao/14-cenario-lan-multi-host.md).

## Fora de escopo (pacote)

- Autenticação multi-tenant, HTTPS em produção, app mobile nativo.
- Substituição do protocolo Socket.IO pelo browser (UI usa HTTP + polling no storage/nós).

## Documentação canônica (após implementação UI)

Criar `docs/documentation/18_console_lab.md` e entrada na matriz de [docs/README.md](../../README.md) — tarefa listada em [finalizacao-backend-operacao/11-testes-e-gate.md](../finalizacao-backend-operacao/11-testes-e-gate.md).
