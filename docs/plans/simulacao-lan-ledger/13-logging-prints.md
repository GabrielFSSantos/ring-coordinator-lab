# 13 Logging / prints

Implementação: [`LabLogger.js`](../../../src/server/infrastructure/logging/LabLogger.js).

Formato (uma linha):

`ISO | LAB_HOST | NODE | ROLE | QUEUE | EVENT | detail`

Flags em `lab.env`: `LOG_ENABLED`, `LOG_WRITES`, `LOG_READS`, `LOG_ELECTION`, `LOG_QUEUE`, `LOG_STORAGE`.

Mutex em `stdout` para reduzir intercalação no mesmo terminal.

## Continuação (normativo)

Trilha por `requestId`, flag `LOG_SIM` e eventos TX_*: [finalizacao-backend-operacao/07-trilha-logs-estruturados.md](../finalizacao-backend-operacao/07-trilha-logs-estruturados.md).

Painel UI: [console-frontend-lab/appendix-mapeamento-log-ui.md](../console-frontend-lab/appendix-mapeamento-log-ui.md).
