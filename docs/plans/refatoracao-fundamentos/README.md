# Plano: refatoração fundamentos

Pacote de referência para a refatoração SQLite + arquitetura em camadas + protocolo sem sleeps artificiais.

## Ordem de execução

1. [01-escopo-e-nao-escopo.md](01-escopo-e-nao-escopo.md)
2. [02-sqlite-e-compose.md](02-sqlite-e-compose.md)
3. [03-arquitetura-camadas.md](03-arquitetura-camadas.md)
4. [04-protocolo-eleicao-e-eventos.md](04-protocolo-eleicao-e-eventos.md)
5. [05-mutex-persistencia-recuperacao.md](05-mutex-persistencia-recuperacao.md)
6. [06-testes-smoke-gate.md](06-testes-smoke-gate.md)
7. [07-checklist-execucao.md](07-checklist-execucao.md)
8. [backlog-mapeamento.md](backlog-mapeamento.md)

## Backlog canônico

Itens B* em [engineering_backlog.md](../../documentation/engineering_backlog.md).

## Decisões

- **DR-006** — SQLite no coordenador, arquivo em `data/log.db` (ver [decision-register.md](../../decision-register.md)).
