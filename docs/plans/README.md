# Planos de implementação — Ring Coordinator Lab

Documentação normativa (**contratos**) para implementar o lab. Não substitui [docs/documentation/](../documentation/README.md) (operação canônica).

## Qual plano ler?

| Objetivo | Começar por |
| --- | --- |
| Entender o baseline ledger + LAN | [simulacao-lan-ledger/README.md](simulacao-lan-ledger/README.md) |
| **LAN multi-host** (storage central + N participantes) | [finalizacao-backend-operacao/14-cenario-lan-multi-host.md](finalizacao-backend-operacao/14-cenario-lan-multi-host.md) |
| **Todas as variáveis `lab.env`** e efeitos | [finalizacao-backend-operacao/16-lab-env-referencia-comportamento.md](finalizacao-backend-operacao/16-lab-env-referencia-comportamento.md) |
| Implementar backend (compose, mDNS, API) | [finalizacao-backend-operacao/README.md](finalizacao-backend-operacao/README.md) |
| Implementar console web | [console-frontend-lab/README.md](console-frontend-lab/README.md) |
| Refatoração SQLite / camadas (histórico) | [refatoracao-fundamentos/README.md](refatoracao-fundamentos/README.md) |

## Pacotes

| Pasta | Conteúdo |
| --- | --- |
| [refatoracao-fundamentos/](refatoracao-fundamentos/README.md) | SQLite local, DDD leve, gate inicial |
| [simulacao-lan-ledger/](simulacao-lan-ledger/README.md) | Storage HTTP, ledger, simulação (baseline) |
| [finalizacao-backend-operacao/](finalizacao-backend-operacao/README.md) | Compose único, mDNS, demo, API controle, LAN |
| [console-frontend-lab/](console-frontend-lab/README.md) | UI ledger, log, comandos |
| [_shared/template-capitulo-plano.md](_shared/template-capitulo-plano.md) | Template de capítulo |

## Arquivos `lab.env` na raiz do repo

| Arquivo | Uso |
| --- | --- |
| [lab.env](../lab.env) | Perfil Docker local (desenvolvimento) |
| [lab.env.example](../lab.env.example) | Template genérico |
| [lab.env.example](../lab.env.example) | Template único (local + LAN + npm) |

## Ordem sugerida de execução (código)

1. Baseline já em `simulacao-lan-ledger`
2. [finalizacao-backend-operacao/12-fases-implementacao-backend.md](finalizacao-backend-operacao/12-fases-implementacao-backend.md) (incl. P9 playbook LAN)
3. [console-frontend-lab/09-fases-implementacao-frontend.md](console-frontend-lab/09-fases-implementacao-frontend.md)
