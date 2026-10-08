# 08 Acessibilidade e UX lab

## Resumo

Diretrizes mínimas para leitura em projetor / tela grande e uso prolongado.

## Visual

- Líder: borda ou ícone além da cor (ex. estrela + texto “Líder”).
- Cores: verde ok, vermelho erro, âmbar eleição — sempre com label textual.
- Contraste mínimo WCAG AA em texto do log.

## Interação

- Foco visível em botões de controle.
- Atalhos opcionais: `L` limpar log, `P` pausar scroll log.

## Tipografia

- Log: `font-family: ui-monospace, monospace;` 13px+.
- Tabela: 14px; números alinhados à direita.

## Performance

- Virtualização da tabela se > 300 linhas (opcional F4).
- Debounce PATCH 300ms em sliders.

## Critérios de aceite

- [ ] Grid identifica líder sem depender só de cor.

## Fora de escopo

- Auditoria WCAG completa certificada.
