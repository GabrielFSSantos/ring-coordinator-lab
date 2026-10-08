# 02 Stack e layout do projeto

## Resumo

Recomenda **Vite + React + TypeScript** no diretório `frontend/` na raiz do repo: ecossistema maduro, proxy de dev simples, componentes para tabela e painel sem peso excessivo para um lab.

## Decisão de stack

| Opção | Prós | Contras | Veredito |
| --- | --- | --- | --- |
| Vite + React + TS | DX, tipos, comunidade | Mais arquivos que HTML puro | **Recomendado** |
| HTML + fetch | Mínimo | Escala mal com muitos controles | Alternativa F0 apenas |

## Estrutura de pastas (alvo)

```
frontend/
  package.json
  vite.config.ts          # proxy /api/storage, /api/nodes
  index.html
  src/
    main.tsx
    app/App.tsx
    components/
      BalanceHeader.tsx
      NodeGrid.tsx
      LedgerTable.tsx
      LogPanel.tsx
      ControlDrawer.tsx
    services/
      storageApi.ts
      nodeApi.ts
    hooks/
      usePolling.ts
    types/
      api.ts
    config/
      targets.ts          # URLs nós + storage from env
```

## Layout global (wireframe ASCII)

```
+----------------------------------------------------------+
|  Saldo: R$ 10.234,56    Storage: OK    Líder: :3005      |
+----------------------------------------------------------+
|  Nós (grid)          |  Controles (drawer / coluna)      |
|  [3002] follower     |  Simulação: burst, intervalo      |
|  [3003] follower     |  Kill auto on/off, intervalo      |
|  ...                 |  Pausar nó / tx manual            |
+----------------------+-----------------------------------+
|  Ledger (tabela scroll)                                   |
+----------------------------------------------------------+
|  Log ao vivo (monoespaçada, últimas N linhas)             |
+----------------------------------------------------------+
```

## Proxy dev (`vite.config.ts`)

| Path browser | Target |
| --- | --- |
| `/api/storage/*` | `VITE_STORAGE_URL` (default `http://localhost:4000`) |
| `/api/nodes/:port/*` | `http://localhost:${4000+port}` ou lista explícita |

Produção lab: servir `frontend/dist` via nginx opcional — fase posterior; v1 `npm run dev` na máquina do operador.

## Scripts npm (raiz ou frontend)

- `npm run dev` — UI
- `npm run build` — estático

Integração gate: opcional `npm run build` no frontend na fase P4 front (não bloquear gate atual).

## Critérios de aceite

- [ ] Stack documentada e justificada.
- [ ] Layout cobre saldo, nós, ledger, log, controles.

## Fora de escopo

- Design system externo pesado (MUI completo); CSS modules ou Tailwind opcional.
