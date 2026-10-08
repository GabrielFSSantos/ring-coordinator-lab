# 01 Visão, escopo e não escopo (frontend)

## Resumo

Console web didático para observar o lab Ring Coordinator em tempo quase real: saldo, ledger crescente, estado dos nós, painel de eventos estilo terminal e controles de simulação alinhados à API v1 do backend.

## Objetivos didáticos

- Visualizar **mutex centralizado**: fila no líder, uma escrita ativa no storage.
- Correlacionar **eventos** (envio → fila → apply) com linhas do ledger.
- Experimentar **falhas** (pause nó, kill líder, storage down) sem editar `lab.env` e reiniciar.

## Sala de aula

- **Professor** projeta console apontando `VITE_STORAGE_URL` para o próprio IP: saldo + ledger + grid de todos os nós (vários `LAB_HOST_NAME`).
- **Aluno** pode usar UI só no próprio PC (opcional) para ver seu nó e storage global up/down.
- Roteiro alinhado a [finalizacao-backend-operacao/14-cenario-lan-multi-host.md](../finalizacao-backend-operacao/14-cenario-lan-multi-host.md).

## Dentro do escopo

- SPA leve servida do repo (`frontend/` ou `src/web/`).
- Polling configurável ao storage e aos nós configurados.
- Tabela ledger append-only com scroll automático.
- Painel log derivado de ledger + state + linhas sintéticas.
- Formulários de controle mapeados a [05-comandos-e-controles.md](05-comandos-e-controles.md).
- Modo “demo”: espelha defaults 2 tx/5s, kill 25s.

## Fora de escopo

- Login multi-usuário, RBAC, HTTPS obrigatório.
- App mobile nativo.
- Conectar Socket.IO direto no browser ao anel (v1 usa HTTP).
- Edição do código de eleição ou storage pelo UI.

## Pré-requisitos

- [finalizacao-backend-operacao/09-api-http-controle-v1.md](../finalizacao-backend-operacao/09-api-http-controle-v1.md)

## Critérios de aceite (documentação)

- [x] Escopo alinhado ao pedido do operador (tabela, log, comandos).

## Riscos

| Risco | Mitigação |
| --- | --- |
| CORS | Backend habilita GET storage; proxy Vite em dev |
