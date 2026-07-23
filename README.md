# LudoCount

Contador e auditoria de pontos para jogos de tabuleiro, client-side. Primeiros
jogos: **Azul** e **Ticket to Ride** (com suas variantes de mapa).

O objetivo é eliminar erros de conta durante a partida — **cada ponto do total é
rastreável até a sua origem** na tela de auditoria.

## Stack

- **Angular 22** — componentes standalone, signals para estado, novo control flow
  (`@if` / `@for` / `@switch`), zoneless.
- **SCSS + Tailwind CSS v4** com tokens de design (temas por jogo, claro/escuro).
- **SVG inline** (não `<img>`) para que preenchimentos respeitem `currentColor` e as
  variáveis de tema.
- **Angular Animations API** para entrada/saída de diálogos e folhas; **view
  transitions** nativas para as trocas de rota; **GSAP** na entrada do hero.
- Sem backend, sem HTTP. A partida ativa é persistida em `localStorage`.

## Rodar

```bash
npm install
npm start          # dev server (ng serve)
npm test           # testes de unidade (vitest) — regras de pontuação
npm run build      # build de produção
```

## Estrutura

```
src/app/
  core/
    models/        # tipos de auditoria/score compartilhados
    services/      # estado da partida (signals), persistência, log de auditoria
  shared/
    ui/            # stepper, diálogo de confirmação, folha de auditoria
    svg/           # componentes SVG inline (azulejo, locomotiva, trilho)
  features/
    landing/
    azul/
      wall/            # parede 5×5 interativa com badge de rodada
      round-history/   # histórico navegável de rodadas
      scoring/         # funções puras + testes (sem dependência de Angular)
    ticket-to-ride/
      variant-select/  # escolha da edição
      counter/         # contador que mostra só os campos da edição escolhida
      scoring/         # funções puras + dados de configuração por edição
```

Toda a matemática de pontuação vive em **funções puras, sem dependência de
framework** (`features/*/scoring`), cobertas por testes de unidade. Os componentes
leem dos services; os services chamam as funções puras.

## Regras

As regras de pontuação vêm dos arquivos em `regras/` (Azul e Ticket to Ride) — a
implementação segue esses documentos, não conhecimento geral dos jogos. As tabelas
de rota e os bônus de fim de jogo do Ticket to Ride são **dados de configuração por
edição** (`features/ticket-to-ride/scoring/ttr-variants.ts`), nunca constantes.
